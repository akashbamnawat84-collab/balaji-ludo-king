const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. User Login / Register
      if (path === "/api/users/login" && request.method === "POST") {
        const { phone } = await request.json();
        let user = await env.DB.prepare("SELECT * FROM users WHERE phone = ?").bind(phone).first();
        if (!user) {
          const id = "USR" + Math.floor(100000 + Math.random() * 900000);
          await env.DB.prepare("INSERT INTO users (id, phone, wallet_balance) VALUES (?, ?, 100.0)").bind(id, phone).run();
          user = { id, phone, wallet_balance: 100.0 };
        }
        return new Response(JSON.stringify(user), { headers: corsHeaders });
      }

      // 2. Fetch All Battles
      if (path === "/api/battles" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM battles ORDER BY id DESC").all();
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      // 3. Create Battle
      if (path === "/api/battles/create" && request.method === "POST") {
        const { userId, entryFee } = await request.json();
        const prize = entryFee * 1.8; // 10% Platform fee
        await env.DB.prepare(
          "INSERT INTO battles (creator_id, entry_fee, prize_amount, status, created_at) VALUES (?, ?, ?, 'OPEN', ?)"
        ).bind(userId, entryFee, prize, Date.now()).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 4. Join Battle
      if (path === "/api/battles/join" && request.method === "POST") {
        const { userId, battleId } = await request.json();
        await env.DB.prepare("UPDATE battles SET joiner_id = ?, status = 'WAITING_ROOM' WHERE id = ?").bind(userId, battleId).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 5. Update Room Code
      if (path === "/api/battles/room-code" && request.method === "POST") {
        const { battleId, roomCode } = await request.json();
        await env.DB.prepare("UPDATE battles SET room_code = ?, status = 'RUNNING' WHERE id = ?").bind(battleId, roomCode).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 6. Submit Result (Saved in D1 Base64 Text - No R2 Needed)
      if (path === "/api/battles/submit-result" && request.method === "POST") {
        const { userId, battleId, screenshotBase64 } = await request.json();
        await env.DB.prepare(
          "UPDATE battles SET winner_claimed_by = ?, screenshot_url = ?, status = 'RESULT_SUBMITTED' WHERE id = ?"
        ).bind(userId, screenshotBase64, battleId).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 7. Admin Approve Winner
      if (path === "/api/admin/approve-winner" && request.method === "POST") {
        const adminKey = request.headers.get("Authorization");
        if (adminKey !== env.ADMIN_SECRET) {
          return new Response(JSON.stringify({ error: "Unauthorized Admin Key" }), { status: 401, headers: corsHeaders });
        }
        const { battleId, winnerId } = await request.json();
        const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ?").bind(battleId).first();
        if (!battle) return new Response(JSON.stringify({ error: "Battle not found" }), { status: 404, headers: corsHeaders });

        await env.DB.prepare("UPDATE battles SET final_winner_id = ?, status = 'COMPLETED' WHERE id = ?").bind(winnerId, battleId).run();
        await env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(battle.prize_amount, winnerId).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
