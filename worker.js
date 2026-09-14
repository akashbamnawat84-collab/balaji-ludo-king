const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {

      // Login
      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {

        const body = await request.json();
        const name = String(body.name || "").trim();

        if (!name) {
          return json(
            { error: "Name required" },
            400
          );
        }

        const id =
          "USR" +
          crypto.randomUUID()
            .replace(/-/g, "")
            .slice(0, 10)
            .toUpperCase();

        return json({
          id,
          name,
          wallet_balance: 0
        });
      }

      // Create Room
      if (
        path === "/api/rooms/create" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const playerId = String(body.playerId || "");
        const playerName = String(body.playerName || "");
        const roomCode = String(body.roomCode || "");

        if (
          !playerId ||
          !playerName ||
          !/^\d{8}$/.test(roomCode)
        ) {
          return json(
            {
              error:
                "Valid player and 8-digit room code required"
            },
            400
          );
        }

        const existing = await env.DB.prepare(
          "SELECT * FROM rooms WHERE room_code = ?"
        )
          .bind(roomCode)
          .first();

        if (existing) {
          return json(
            {
              error:
                "यह Room Code पहले से मौजूद है। दूसरा code डालें।"
            },
            409
          );
        }

        await env.DB.prepare(
          `INSERT INTO rooms
          (
            room_code,
            player1_id,
            player1_name,
            status,
            created_at
          )
          VALUES (?, ?, ?, 'WAITING', ?)`
        )
          .bind(
            roomCode,
            playerId,
            playerName,
            Date.now()
          )
          .run();

        return json({
          success: true,
          roomCode
        });
      }

      // Join Room
      if (
        path === "/api/rooms/join" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const playerId = String(body.playerId || "");
        const playerName = String(body.playerName || "");
        const roomCode = String(body.roomCode || "");

        if (
          !playerId ||
          !playerName ||
          !/^\d{8}$/.test(roomCode)
        ) {
          return json(
            {
              error:
                "Valid player and 8-digit room code required"
            },
            400
          );
        }

        const room = await env.DB.prepare(
          "SELECT * FROM rooms WHERE room_code = ?"
        )
          .bind(roomCode)
          .first();

        if (!room) {
          return json(
            {
              error: "Room Code नहीं मिला।"
            },
            404
          );
        }

        if (room.player1_id === playerId) {
          return json({
            success: true,
            roomCode
          });
        }

        if (room.player2_id) {
          return json(
            {
              error: "यह Room पहले से full है।"
            },
            409
          );
        }

        await env.DB.prepare(
          `UPDATE rooms
           SET player2_id = ?,
               player2_name = ?,
               status = 'READY'
           WHERE room_code = ?`
        )
          .bind(
            playerId,
            playerName,
            roomCode
          )
          .run();

        return json({
          success: true,
          roomCode
        });
      }

      // Get Room
      if (
        path.startsWith("/api/rooms/") &&
        request.method === "GET"
      ) {

        const roomCode =
          path.replace("/api/rooms/", "");

        if (!/^\d{8}$/.test(roomCode)) {
          return json(
            { error: "Invalid room code" },
            400
          );
        }

        const room = await env.DB.prepare(
          `SELECT
            room_code,
            player1_id,
            player1_name,
            player2_id,
            player2_name,
            status,
            result_screenshot,
            result_player_id,
            created_at
           FROM rooms
           WHERE room_code = ?`
        )
          .bind(roomCode)
          .first();

        if (!room) {
          return json(
            { error: "Room not found" },
            404
          );
        }

        return json(room);
      }

      // Cancel Room
      if (
        path === "/api/rooms/cancel" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const playerId = String(body.playerId || "");
        const roomCode = String(body.roomCode || "");

        const room = await env.DB.prepare(
          "SELECT * FROM rooms WHERE room_code = ?"
        )
          .bind(roomCode)
          .first();

        if (!room) {
          return json(
            { error: "Room not found" },
            404
          );
        }

        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {
          return json(
            { error: "Not your room" },
            403
          );
        }

        await env.DB.prepare(
          "DELETE FROM rooms WHERE room_code = ?"
        )
          .bind(roomCode)
          .run();

        return json({
          success: true
        });
      }

      // Submit Result Screenshot
      if (
        path === "/api/rooms/result" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const playerId = String(body.playerId || "");
        const roomCode = String(body.roomCode || "");
        const screenshot = String(body.screenshot || "");

        if (
          !playerId ||
          !roomCode ||
          !screenshot
        ) {
          return json(
            {
              error:
                "Player, room and screenshot required"
            },
            400
          );
        }

        if (screenshot.length > 7 * 1024 * 1024) {
          return json(
            {
              error:
                "Screenshot बहुत बड़ा है।"
            },
            400
          );
        }

        const room = await env.DB.prepare(
          "SELECT * FROM rooms WHERE room_code = ?"
        )
          .bind(roomCode)
          .first();

        if (!room) {
          return json(
            { error: "Room not found" },
            404
          );
        }

        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {
          return json(
            {
              error:
                "Player is not part of this room"
            },
            403
          );
        }

        await env.DB.prepare(
          `UPDATE rooms
           SET result_screenshot = ?,
               result_player_id = ?,
               status = 'RESULT_SUBMITTED'
           WHERE room_code = ?`
        )
          .bind(
            screenshot,
            playerId,
            roomCode
          )
          .run();

        return json({
          success: true,
          message:
            "Screenshot submitted successfully"
        });
      }

      return new Response(
        "Not Found",
        {
          status: 404,
          headers: corsHeaders
        }
      );

    } catch (error) {

      return json(
        {
          error:
            error && error.message
              ? error.message
              : "Server Error"
        },
        500
      );
    }
  }
};
