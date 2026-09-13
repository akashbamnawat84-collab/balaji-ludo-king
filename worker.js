// ==========================================
// BALAJI LUDO KING - COMPLETE WORKER ENGINE
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers (फ्रंटएंड से कनेक्ट करने के लिए)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. GET ALL BATTLES (ओपन और रनिंग बैटल देखें)
      if (url.pathname === "/api/battles" && method === "GET") {
        const openBattles = await env.DB.prepare(
          "SELECT * FROM battles WHERE status = 'OPEN' ORDER BY created_at DESC"
        ).all();

        const runningBattles = await env.DB.prepare(
          "SELECT * FROM battles WHERE status = 'RUNNING' ORDER BY created_at DESC"
        ).all();

        return jsonResponse(
          {
            openBattles: openBattles.results,
            runningBattles: runningBattles.results
          },
          200,
          corsHeaders
        );
      }

      // 2. CREATE BATTLE (चैलेंज बनाएं)
      if (url.pathname === "/api/battles/create" && method === "POST") {
        const { userId, entryFee } = await request.json();

        if (!userId || !entryFee || entryFee < 10) {
          return jsonResponse(
            { error: "कम से कम ₹10 का बैटल बना सकते हैं।" },
            400,
            corsHeaders
          );
        }

        // यूजर का वॉलेट बैलेंस चेक करें
        const user = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?")
          .bind(userId)
          .first();

        if (!user || user.wallet_balance < entryFee) {
          return jsonResponse(
            { error: "आपके वॉलेट में पर्याप्त बैलेंस नहीं है।" },
            400,
            corsHeaders
          );
        }

        // विनर प्राइस (उदाहरण: ₹100 पर ₹190 - 5% प्लेटफॉर्म चार्ज काटकर)
        const prizeAmount = Math.floor(entryFee * 1.9);

        // बैलेंस काटें और बैटल टेबल में दर्ज करें
        await env.DB.batch([
          env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?")
            .bind(entryFee, userId),
          env.DB.prepare(
            "INSERT INTO battles (creator_id, entry_fee, prize_amount, status, created_at) VALUES (?, ?, ?, 'OPEN', ?)"
          ).bind(userId, entryFee, prizeAmount, Date.now())
        ]);

        return jsonResponse(
          { success: true, message: "बैटल सफलतापूर्वक बन गया है।" },
          200,
          corsHeaders
        );
      }

      // 3. JOIN BATTLE (चैलेंज जॉइन करें)
      if (url.pathname === "/api/battles/join" && method === "POST") {
        const { userId, battleId } = await request.json();

        const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ? AND status = 'OPEN'")
          .bind(battleId)
          .first();

        if (!battle) {
          return jsonResponse(
            { error: "यह बैटल उपलब्ध नहीं है या पहले ही फुल हो चुका है।" },
            404,
            corsHeaders
          );
        }

        if (battle.creator_id === userId) {
          return jsonResponse(
            { error: "आप अपने खुद के बैटल को जॉइन नहीं कर सकते।" },
            400,
            corsHeaders
          );
        }

        const user = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?")
          .bind(userId)
          .first();

        if (!user || user.wallet_balance < battle.entry_fee) {
          return jsonResponse(
            { error: "जॉइन करने के लिए पर्याप्त बैलेंस नहीं है।" },
            400,
            corsHeaders
          );
        }

        // दूसरे खिलाड़ी का बैलेंस काटें और स्टेटस RUNNING करें
        await env.DB.batch([
          env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?")
            .bind(battle.entry_fee, userId),
          env.DB.prepare("UPDATE battles SET joiner_id = ?, status = 'RUNNING' WHERE id = ?")
            .bind(userId, battleId)
        ]);

        return jsonResponse(
          { success: true, message: "बैटल जॉइन हो गया है।" },
          200,
          corsHeaders
        );
      }

      // 4. SET ROOM CODE (Ludo King का रूम कोड डालें)
      if (url.pathname === "/api/battles/set-room-code" && method === "POST") {
        const { userId, battleId, roomCode } = await request.json();

        if (!/^\d{8}$/.test(roomCode)) {
          return jsonResponse(
            { error: "रूम कोड 8 अंकों का होना चाहिए।" },
            400,
            corsHeaders
          );
        }

        const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ? AND status = 'RUNNING'")
          .bind(battleId)
          .first();

        if (!battle || (battle.creator_id !== userId && battle.joiner_id !== userId)) {
          return jsonResponse(
            { error: "अमान्य बैटल या अनुमति नहीं है।" },
            403,
            corsHeaders
          );
        }

        await env.DB.prepare("UPDATE battles SET room_code = ? WHERE id = ?")
          .bind(roomCode, battleId)
          .run();

        return jsonResponse(
          { success: true, message: "रूम कोड अपडेट हो गया है।", roomCode },
          200,
          corsHeaders
        );
      }

      // 5. SUBMIT RESULT (जीत का स्क्रीनशॉट सबमिट करें)
      if (url.pathname === "/api/battles/submit-result" && method === "POST") {
        const formData = await request.formData();
        const userId = formData.get("userId");
        const battleId = formData.get("battleId");
        const screenshot = formData.get("screenshot");

        if (!screenshot || !battleId || !userId) {
          return jsonResponse(
            { error: "सभी जानकारी और स्क्रीनशॉट भेजना अनिवार्य है।" },
            400,
            corsHeaders
          );
        }

        // Cloudflare R2 Bucket में इमेज सेव करें
        const imageKey = `results/${battleId}_${userId}_${Date.now()}.jpg`;
        await env.MY_BUCKET.put(imageKey, screenshot.stream());

        await env.DB.prepare(
          "UPDATE battles SET winner_claimed_by = ?, screenshot_url = ?, status = 'PENDING_APPROVAL' WHERE id = ?"
        )
          .bind(userId, imageKey, battleId)
          .run();

        return jsonResponse(
          { success: true, message: "रिजल्ट एडमिन चेकिंग के लिए भेज दिया गया है।" },
          200,
          corsHeaders
        );
      }

      // 6. ADMIN: APPROVE WINNER & REFERRAL BONUS (एडमिन विजेता घोषित करे)
      if (url.pathname === "/api/admin/approve-winner" && method === "POST") {
        const { adminKey, battleId, winnerId } = await request.json();

        if (adminKey !== env.ADMIN_SECRET) {
          return jsonResponse({ error: "गलत एडमिन की (Unauthorized)" }, 403, corsHeaders);
        }

        const battle = await env.DB.prepare(
          "SELECT * FROM battles WHERE id = ? AND status = 'PENDING_APPROVAL'"
        )
          .bind(battleId)
          .first();

        if (!battle) {
          return jsonResponse({ error: "बैटल नहीं मिला या प्रोसेस हो चुका है।" }, 404, corsHeaders);
        }

        const winner = await env.DB.prepare("SELECT referred_by FROM users WHERE id = ?")
          .bind(winnerId)
          .first();

        let batchQueries = [
          // विजेता को पैसे भेजें
          env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?")
            .bind(battle.prize_amount, winnerId),
          // स्टेटस COMPLETED करें
          env.DB.prepare(
            "UPDATE battles SET status = 'COMPLETED', final_winner_id = ? WHERE id = ?"
          ).bind(winnerId, battleId)
        ];

        // अगर विजेता किसी के रेफ़रल से जुड़ा है, तो 3% कमीशन भेजें
        if (winner && winner.referred_by) {
          const referralCommission = Math.floor(battle.prize_amount * 0.03);
          batchQueries.push(
            env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?")
              .bind(referralCommission, winner.referred_by)
          );
        }

        await env.DB.batch(batchQueries);

        return jsonResponse(
          { success: true, message: "विजेता अप्रूव हो गया और बैलेंस ट्रांसफर कर दिया गया है।" },
          200,
          corsHeaders
        );
      }

      // STATIC ASSETS FALLBACK
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return jsonResponse(
        { message: "Balaji Ludo King Worker API Running Successfully." },
        200,
        corsHeaders
      );

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
