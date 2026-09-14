const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// ===============================
// ROOM SETTINGS
// ===============================

const ROOM_WAIT_SECONDS = 5 * 60;
const ROOM_WAIT_MS = ROOM_WAIT_SECONDS * 1000;


// ===============================
// JSON RESPONSE
// ===============================

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


// ===============================
// ROOM CODE VALIDATION
// ===============================

function validRoomCode(code) {
  return /^\d{8}$/.test(
    String(code || "").trim()
  );
}


// ===============================
// CHECK ROOM EXPIRY
// ===============================

function isRoomExpired(room) {
  if (!room || !room.created_at) {
    return false;
  }

  const createdAt = Number(room.created_at);

  if (!Number.isFinite(createdAt)) {
    return false;
  }

  return (
    Date.now() - createdAt >= ROOM_WAIT_MS
  );
}


// ===============================
// DELETE EXPIRED ROOM
// ===============================

async function deleteExpiredRoom(env, roomCode) {
  try {
    await env.DB.prepare(
      "DELETE FROM rooms WHERE room_code = ?"
    )
      .bind(roomCode)
      .run();

    return true;

  } catch (error) {

    console.log(
      "Delete expired room error:",
      error
    );

    return false;
  }
}


// ===============================
// WORKER
// ===============================

export default {

  async fetch(request, env) {

    // ===============================
    // CORS
    // ===============================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }


    const url = new URL(request.url);
    const path = url.pathname;


    try {

      // ===============================
      // LOGIN
      // ===============================

      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();

        const name =
          String(
            body.name || ""
          ).trim();


        if (!name) {
          return json(
            {
              error:
                "Name required"
            },
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
          wallet: 0,
          wallet_balance: 0
        });
      }


      // ===============================
      // CREATE ROOM
      // ===============================

      if (
        path === "/api/rooms/create" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        // IMPORTANT:
        // script.js sends snake_case fields

        const playerId =
          String(
            body.player_id || ""
          ).trim();


        const playerName =
          String(
            body.player_name || ""
          ).trim();


        const roomCode =
          String(
            body.room_code || ""
          ).trim();


        // Validate player

        if (!playerId) {

          return json(
            {
              error:
                "Valid player required"
            },
            400
          );
        }


        // Validate player name

        if (!playerName) {

          return json(
            {
              error:
                "Player name required"
            },
            400
          );
        }


        // Validate exactly 8 digits

        if (!validRoomCode(roomCode)) {

          return json(
            {
              error:
                "Valid 8-digit room code required"
            },
            400
          );
        }


        // ===============================
        // CHECK EXISTING ROOM
        // ===============================

        const existing =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
            .bind(roomCode)
            .first();


        if (existing) {

          // If existing room is expired,
          // delete it and allow same code again.

          if (
            existing.status === "WAITING" &&
            isRoomExpired(existing)
          ) {

            await deleteExpiredRoom(
              env,
              roomCode
            );

          } else {

            return json(
              {
                error:
                  "यह Room Code पहले से मौजूद है। दूसरा code डालें।"
              },
              409
            );
          }
        }


        // ===============================
        // CREATE NEW ROOM
        // ===============================

        const createdAt =
          Date.now();


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
            createdAt
          )
          .run();


        return json({
          success: true,

          room: {
            room_code: roomCode,
            player1_id: playerId,
            player1_name: playerName,
            player2_id: null,
            player2_name: null,
            status: "WAITING",
            created_at: createdAt
          },

          room_code: roomCode
        });
      }


      // ===============================
      // JOIN ROOM
      // ===============================
  if (
        path === "/api/rooms/join" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          String(
            body.player_id || ""
          ).trim();


        const playerName =
          String(
            body.player_name || ""
          ).trim();


        const roomCode =
          String(
            body.room_code || ""
          ).trim();


        if (!playerId) {

          return json(
            {
              error:
                "Valid player required"
            },
            400
          );
        }


        if (!playerName) {

          return json(
            {
              error:
                "Player name required"
            },
            400
          );
        }


        if (!validRoomCode(roomCode)) {

          return json(
            {
              error:
                "Valid 8-digit room code required"
            },
            400
          );
        }


        // ===============================
        // FIND ROOM
        // ===============================

        const room =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
            .bind(roomCode)
            .first();


        if (!room) {

          return json(
            {
              error:
                "Room Code नहीं मिला।"
            },
            404
          );
        }


        // ===============================
        // BACKEND 5-MINUTE EXPIRY
        // ===============================

        if (
          room.status === "WAITING" &&
          isRoomExpired(room)
        ) {

          await deleteExpiredRoom(
            env,
            roomCode
          );


          return json(
            {
              error:
                "⏰ यह Room 5 मिनट बाद expire हो गया।"
            },
            410
          );
        }


        // ===============================
        // SAME PLAYER
        // ===============================

        if (
          room.player1_id === playerId
        ) {

          return json({
            success: true,
            room
          });
        }


        // ===============================
        // ROOM FULL
        // ===============================

        if (room.player2_id) {

          return json(
            {
              error:
                "यह Room पहले से full है।"
            },
            409
          );
        }


        // ===============================
        // JOIN AS PLAYER 2
        // ===============================

        await env.DB.prepare(
          `UPDATE rooms
           SET
             player2_id = ?,
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


        const updatedRoom =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
            .bind(roomCode)
            .first();


        return json({
          success: true,
          room: updatedRoom,
          room_code: roomCode
        });
      }


      // ===============================
      // GET ROOM STATUS
      // ===============================

      if (
        path.startsWith("/api/rooms/") &&
        request.method === "GET"
      ) {

        const roomCode =
          path
            .replace(
              "/api/rooms/",
              ""
            )
            .trim();


        if (!validRoomCode(roomCode)) {

          return json(
            {
              error:
                "Invalid room code"
            },
            400
          );
        }


        const room =
          await env.DB.prepare(
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
            {
              error:
                "Room not found"
            },
            404
          );
        }


        // ===============================
        // BACKEND EXPIRY CHECK
        // ===============================

        if (
          room.status === "WAITING" &&
          isRoomExpired(room)
        ) {

          await deleteExpiredRoom(
            env,
            roomCode
          );


          return json(
            {
              error:
                "⏰ Room 5 मिनट में expire हो गया।"
            },
            404
          );
        }


        return json(room);
      }


      // ===============================
      // CANCEL / LEAVE ROOM
      // ===============================

      if (
        path === "/api/rooms/cancel" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          String(
            body.player_id || ""
          ).trim();


        const roomCode =
          String(
            body.room_code || ""
          ).trim();


        if (
          !playerId ||
          !validRoomCode(roomCode)
        ) {

          return json(
            {
              error:
                "Valid player and room code required"
            },
            400
          );
        }


        const room =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
            .bind(roomCode)
            .first();


        if (!room) {

          return json(
            {
              success: true,
              message:
                "Room already removed"
            }
          );
        }


        // ===============================
        // CHECK PLAYER
        // ===============================
        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {

          return json(
            {
              error:
                "Not your room"
            },
            403
          );
        }


        await env.DB.prepare(
          "DELETE FROM rooms WHERE room_code = ?"
        )
          .bind(roomCode)
          .run();


        return json({
          success: true,
          message:
            "Room cancelled"
        });
      }


      // ===============================
      // SUBMIT RESULT
      // ===============================

      if (
        path === "/api/rooms/result" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          String(
            body.player_id || ""
          ).trim();


        const roomCode =
          String(
            body.room_code || ""
          ).trim();


        const screenshot =
          String(
            body.screenshot || ""
          );


        if (
          !playerId ||
          !validRoomCode(roomCode) ||
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


        if (
          screenshot.length >
          7 * 1024 * 1024
        ) {

          return json(
            {
              error:
                "Screenshot बहुत बड़ा है।"
            },
            400
          );
        }


        const room =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
            .bind(roomCode)
            .first();


        if (!room) {

          return json(
            {
              error:
                "Room not found"
            },
            404
          );
        }


        // ===============================
        // PLAYER CHECK
        // ===============================

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
           SET
             result_screenshot = ?,
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


      // ===============================
      // NOT FOUND
      // ===============================

      return new Response(
        "Not Found",
        {
          status: 404,
          headers: corsHeaders
        }
      );


    } catch (error) {

      console.log(
        "Worker error:",
        error
      );


      return json(
        {
          error:
            error &&
            error.message
              ? error.message
              : "Server Error"
        },
        500
      );
    }
  }
};
