const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const ROOM_WAIT_MS = 5 * 60 * 1000;

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

function clean(value) {
  return String(value ?? "").trim();
}

function validRoomCode(code) {
  return /^\d{8}$/.test(clean(code));
}

function isExpired(createdAt) {
  const time = Number(createdAt);

  if (!Number.isFinite(time)) {
    return true;
  }

  return Date.now() - time >= ROOM_WAIT_MS;
}

async function deleteRoom(env, roomCode) {
  await env.DB.prepare(
    "DELETE FROM rooms WHERE room_code = ?"
  )
    .bind(roomCode)
    .run();
}

async function getRoom(env, roomCode) {
  return await env.DB.prepare(
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

      // =====================================
      // LOGIN
      // =====================================

      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const name = clean(body.name);

        if (!name) {
          return json(
            {
              error: "Name required"
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


      // =====================================
      // CREATE ROOM
      // =====================================

      if (
        path === "/api/rooms/create" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        // Accept frontend snake_case
        // and old camelCase too

        const playerId = clean(
          body.player_id ||
          body.playerId
        );

        const playerName = clean(
          body.player_name ||
          body.playerName
        );

        const roomCode = clean(
          body.room_code ||
          body.roomCode
        );


        if (!playerId) {
          return json(
            {
              error: "Player login required"
            },
            400
          );
        }


        if (!playerName) {
          return json(
            {
              error: "Player name required"
            },
            400
          );
        }


        if (!validRoomCode(roomCode)) {
          return json(
            {
              error:
                "8-digit Room Code required"
            },
            400
          );
        }


        // =================================
        // CHECK EXISTING ROOM
        // =================================

        const existing =
         
