// ==========================================
// BALAJI LUDO KING - BATTLE & WALLET ENGINE
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers (Front-end से कनेक्ट करने के लिए)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. CREATE BATTLE (चैलेंज बनाएं)
      if (url.pathname === "/api/battles/create" && method === "POST") {
        const { userId, entryFee } = await request.json();

        if (!userId || !entryFee || entryFee < 10) {
          return jsonResponse({ error: "Invalid parameters or minimum fee is ₹10." }, 400, corsHeaders);
        }

        // चेक करें कि यूज़र के पास पर्याप्त बैलेंस है या नहीं
        const user = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(userId).first();
        if (!user || user.wallet_balance < entryFee) {
          return jsonResponse({ error: "Insufficient wallet balance." }, 400, corsHeaders);
        }

        const prizeAmount = Math.floor(entryFee * 1.9); // 5% प्लेटफ़ॉर्म कट (जैसे ₹100 पर ₹190 जीत)

        // यूज़र के वॉलेट से बैलेंस काटें और बैटल बनाएँ
        await env.DB.batch([
          env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").bind(entryFee, userId),
          env.DB.prepare("INSERT INTO battles (creator_id, entry_fee, prize_amount, status, created_at) VALUES (?, ?, ?, 'OPEN', ?)").bind(userId, entryFee, prizeAmount, Date.now())
        ]);

        return jsonResponse({ success: true, message: "Battle created successfully." }, 200, corsHeaders);
      }

      // 2. JOIN BATTLE (चैलेंज स्वीकार करें)
      if (url.pathname === "/api/battles/join" && method === "POST") {
        const { userId, battleId } = await request.json();

        const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ? AND status = 'OPEN'").bind(battleId).first();
        if (!battle) {
          return jsonResponse({ error: "Battle not available or already joined." }, 404, corsHeaders);
        }

        if (battle.creator_id === userId) {
          return jsonResponse({ error: "You cannot join your own battle." }, 400, corsHeaders);
        }

        const user = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(userId).first();
        if (!user || user.wallet_balance < battle.entry_fee) {
          return jsonResponse({ error: "Insufficient wallet balance to join." }, 400, corsHeaders);
        }

        // दूसरे खिलाड़ी का बैलेंस काटें और स्टेटस RUNNING करें
        await env.DB.batch([
          env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").bind(battle.entry_fee, userId),
          env.DB.prepare("UPDATE battles SET joiner_id = ?, status = 'RUNNING' WHERE id = ?").bind(userId, battleId)
        ]);

        return jsonResponse({ success: true, message: "Joined battle successfully." }, 200, corsHeaders);
      }

      // 3. SET LUDO KING ROOM CODE (रूम कोड अपडेट करें)
      if (url.pathname === "/api/battles/set-room-code" && method === "POST") {
        const { userId, battleId, roomCode } = await request.json();

        if (!/^\d{8}$/.test(roomCode)) {
          return jsonResponse({ error: "Room code must be an 8-digit number." }, 400, corsHeaders);
        }

        const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ? AND status = 'RUNNING'").bind(battleId).first();
        if (!battle || (battle.creator_id !== userId && battle.joiner_id !== userId)) {
          return jsonResponse({ error: "Unauthorized or battle is not running." }, 403, corsHeaders);
        }

        await env.DB.prepare("UPDATE battles SET room_code = ? WHERE id = ?").bind(roomCode, battleId).run();

        return jsonResponse({ success: true, message: "Room code updated.", roomCode }, 200, corsHeaders);
      }

      // 4. SUBMIT WINNER SCREENSHOT (रिजल्ट सबमिट करें)
      if (url.pathname === "/api/battles/submit-result" && method === "POST") {
        const formData = await request.formData();
        const userId = formData.get("userId");
        const battleId = formData.get("battleId");
        const screenshot = formData.get("screenshot"); // File Input

        if (!screenshot || !battleId || !userId) {
          return jsonResponse({ error: "Missing required details." }, 400, corsHeaders);
        }

        // R2 Bucket में इमेज सेव करें
        const imageKey = `results/${battleId}_${userId}_${Date.now()}.jpg`;
        await env.MY_BUCKET.put(imageKey, screenshot.stream());

        // बैटल स्टेटस बदलें ताकि एडमिन इसे वेरीफाई कर सके
        await env.DB.prepare("UPDATE battles SET winner_claimed_by = ?, screenshot_url = ?, status = 'PENDING_APPROVAL' WHERE id = ?").bind(userId, imageKey, battleId).run();

        return jsonResponse({ success: true, message: "Result submitted for admin verification." }, 200, corsHeaders);
      }

      // 5. ADMIN: APPROVE WINNER & DISTRIBUTE REWARDS (विजेता घोषित करें)
      if (url.pathname === "/api/admin/approve-winner" && method === "POST") {
        const { adminKey, battleId, winnerId } = await request.json();

        if (adminKey !== env.ADMIN_SECRET) {
          return jsonResponse({ error: "Unauthorized Admin access." }, 403, corsHeaders);
        }

        const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ? AND status = 'PENDING_APPROVAL'").bind(battleId).first();
        if (!battle) {
          return jsonResponse({ error: "Battle not found or already processed." }, 404, corsHeaders);
        }

        // रेफ़रल कमीशन गणना (3%)
        const winner = await env.DB.prepare("SELECT referred_by FROM users WHERE id = ?").bind(winnerId).first();
        
        let batchQueries = [
          // विजेता को विनर अमाउंट ट्रांसफर करें
          env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(battle.prize_amount, winnerId),
          // बैटल का स्टेटस COMPLETED करें
          env.DB.prepare("UPDATE battles SET status = 'COMPLETED', final_winner_id = ? WHERE id = ?").bind(winnerId, battleId)
        ];

        // अगर विजेता किसी के रेफ़रल से आया था, तो 3% कमीशन भेजें
        if (winner && winner.referred_by) {
          const referralCommission = Math.floor(battle.prize_amount * 0.03);
          batchQueries.push(
            env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(referralCommission, winner.referred_by)
          );
        }

        await env.DB.batch(batchQueries);

        return jsonResponse({ success: true, message: "Winner approved and payout processed." }, 200, corsHeaders);
      }

      // STATIC FILES FALLBACK
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return jsonResponse({ message: "Bajiger Ludo API Engine Running." }, 200, corsHeaders);

    } catch (err) {
      return jsonResponse({ error: err.message }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}
