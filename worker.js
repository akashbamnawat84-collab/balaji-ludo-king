const HTML_CONTENT = `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balaji Ludo King</title>
    <style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
        .card { background: #1e293b; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #334155; }
        input, button { width: 100%; padding: 10px; margin-top: 8px; border-radius: 5px; border: none; box-sizing: border-box; }
        button { background: #22c55e; color: white; font-weight: bold; cursor: pointer; }
        button:hover { background: #16a34a; }
        .battle-box { background: #334155; padding: 10px; border-radius: 8px; margin-top: 10px; }
        .badge { background: #eab308; color: black; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    </style>
</head>
<body>
    <h2 style="text-align: center; color: #f59e0b;">👑 Balaji Ludo King</h2>
    <div class="card" id="loginCard">
        <h3>लॉगिन करें</h3>
        <input type="number" id="phoneInput" placeholder="मोबाइल नंबर डालें">
        <button onclick="login()">Login</button>
    </div>
    <div id="app" style="display: none;">
        <div class="card">
            <p><strong>User ID:</strong> <span id="userIdDisplay"></span></p>
            <p><strong>Wallet:</strong> ₹<span id="walletDisplay">0</span></p>
        </div>
        <div class="card">
            <h3>नया बैटल बनाएं</h3>
            <input type="number" id="entryFee" placeholder="एंट्री फ़ीस दर्ज करें (₹)">
            <button onclick="createBattle()">Create Challenge</button>
        </div>
        <h3>लाइव बैटल्स</h3>
        <div id="battlesList"></div>
    </div>
    <script>
        let CURRENT_USER = null;
        async function login() {
            const phone = document.getElementById("phoneInput").value;
            if(!phone) return alert("नंबर डालें!");
            const res = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });
            CURRENT_USER = await res.json();
            document.getElementById("userIdDisplay").innerText = CURRENT_USER.id;
            document.getElementById("walletDisplay").innerText = CURRENT_USER.wallet_balance;
            document.getElementById("loginCard").style.display = "none";
            document.getElementById("app").style.display = "block";
            fetchBattles();
        }
        async function fetchBattles() {
            const res = await fetch("/api/battles");
            const battles = await res.json();
            const container = document.getElementById("battlesList");
            container.innerHTML = "";
            battles.forEach(b => {
                let actionBtn = "";
                if(b.status === 'OPEN' && b.creator_id !== CURRENT_USER.id) {
                    actionBtn = \`<button onclick="joinBattle(\${b.id})">Join (₹\${b.entry_fee})</button>\`;
                } else if(b.status === 'WAITING_ROOM' && b.creator_id === CURRENT_USER.id) {
                    actionBtn = \`<input type="text" id="rc_\${b.id}" placeholder="लूडो रूम कोड दर्ज करें"><button onclick="setRoomCode(\${b.id})">Save Room Code</button>\`;
                } else if(b.status === 'RUNNING') {
                    actionBtn = \`<p>रूम कोड: <strong>\${b.room_code}</strong></p><input type="file" id="file_\${b.id}"><button onclick="submitResult(\${b.id})">Upload Winner Screenshot</button>\`;
                } else {
                    actionBtn = \`<span class="badge">\${b.status}</span>\`;
                }
                container.innerHTML += \`<div class="battle-box"><p><strong>Battle #\${b.id}</strong> | Prize: ₹\${b.prize_amount}</p>\${actionBtn}</div>\`;
            });
        }
        async function createBattle() {
            const fee = document.getElementById("entryFee").value;
            await fetch("/api/battles/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: CURRENT_USER.id, entryFee: parseFloat(fee) })
            });
            fetchBattles();
        }
        async function joinBattle(battleId) {
            await fetch("/api/battles/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: CURRENT_USER.id, battleId })
            });
            fetchBattles();
        }
        async function setRoomCode(battleId) {
            const roomCode = document.getElementById(\`rc_\${battleId}\`).value;
            await fetch("/api/battles/room-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ battleId, roomCode })
            });
            fetchBattles();
        }
        async function submitResult(battleId) {
            const file = document.getElementById(\`file_\${battleId}\`).files[0];
            if(!file) return alert("स्क्रीनशॉट चुनें!");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function() {
                await fetch("/api/battles/submit-result", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: CURRENT_USER.id, battleId, screenshotBase64: reader.result })
                });
                alert("रिजल्ट सबमिट हो गया है!");
                fetchBattles();
            };
        }
    </script>
</body>
</html>`;

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
      if (path === "/" || path === "/index.html") {
        return new Response(HTML_CONTENT, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

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

      if (path === "/api/battles" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM battles ORDER BY id DESC").all();
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      if (path === "/api/battles/create" && request.method === "POST") {
        const { userId, entryFee } = await request.json();
        const prize = entryFee * 1.8;
        await env.DB.prepare(
          "INSERT INTO battles (creator_id, entry_fee, prize_amount, status, created_at) VALUES (?, ?, ?, 'OPEN', ?)"
        ).bind(userId, entryFee, prize, Date.now()).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (path === "/api/battles/join" && request.method === "POST") {
        const { userId, battleId } = await request.json();
        await env.DB.prepare("UPDATE battles SET joiner_id = ?, status = 'WAITING_ROOM' WHERE id = ?").bind(userId, battleId).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (path === "/api/battles/room-code" && request.method === "POST") {
        const { battleId, roomCode } = await request.json();
        await env.DB.prepare("UPDATE battles SET room_code = ?, status = 'RUNNING' WHERE id = ?").bind(battleId, roomCode).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (path === "/api/battles/submit-result" && request.method === "POST") {
        const { userId, battleId, screenshotBase64 } = await request.json();
        await env.DB.prepare(
          "UPDATE battles SET winner_claimed_by = ?, screenshot_url = ?, status = 'RESULT_SUBMITTED' WHERE id = ?"
        ).bind(userId, screenshotBase64, battleId).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

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

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
