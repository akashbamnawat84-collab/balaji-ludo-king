const SESSION_COOKIE = "balaji_admin_session";
const SESSION_MAX_AGE = 86400; // 24 hours

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // ADMIN LOGIN
    // =========================
    if (url.pathname === "/api/admin/login") {
      if (request.method !== "POST") {
        return json(
          {
            success: false,
            message: "Method not allowed",
          },
          405
        );
      }

      try {
        const body = await request.json();

        const adminId = String(body.adminId || "").trim();
        const password = String(body.password || "");

        const correctAdminId =
          String(env.BALAJI_ADMIN_ID || "").trim();

        const correctPassword =
          String(env.BALAJI_ADMIN_PASSWORD || "");

        if (
          !correctAdminId ||
          !correctPassword ||
          adminId !== correctAdminId ||
          password !== correctPassword
        ) {
          return json(
            {
              success: false,
              message: "Invalid Admin ID or Password.",
            },
            401
          );
        }

        // Create signed session token
        const sessionToken = await createSessionToken(
          env,
          adminId
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "Login successful.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie":
                `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`,
            },
          }
        );
      } catch (error) {
        return json(
          {
            success: false,
            message: "Invalid request.",
          },
          400
        );
      }
    }

    // =========================
    // CHECK ADMIN SESSION
    // =========================
    if (url.pathname === "/api/admin/session") {
      const valid = await verifySession(request, env);

      if (!valid) {
        return json(
          {
            success: false,
            authenticated: false,
          },
          401
        );
      }

      return json({
        success: true,
        authenticated: true,
      });
    }

    // =========================
    // ADMIN LOGOUT
    // =========================
    if (url.pathname === "/api/admin/logout") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Logged out.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie":
              `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          },
        }
      );
    }

    // =========================
    // PROTECT ADMIN DASHBOARD
    // =========================
    if (url.pathname === "/admin.html") {
      const valid = await verifySession(request, env);

      if (!valid) {
        return Response.redirect(
          `${url.origin}/admin-login.html`,
          302
        );
      }
    }

    // =========================
    // WEBSOCKET LUDO ROOM
    // =========================
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", {
          status: 426,
        });
      }

      const room = url.searchParams.get("room");

      if (!room || !/^\d{6}$/.test(room)) {
        return new Response("Invalid room code", {
          status: 400,
        });
      }

      const id = env.LUDO_ROOM.idFromName(room);
      const stub = env.LUDO_ROOM.get(id);

      return stub.fetch(request);
    }

    // =========================
    // WEBSITE FILES
    // =========================
    if (!env.ASSETS) {
      return new Response("ASSETS binding is missing", {
        status: 500,
      });
    }

    return env.ASSETS.fetch(request);
  },
};

// ======================================================
// SESSION TOKEN
// ======================================================

async function createSessionToken(env, adminId) {
  const timestamp = Date.now();

  const payload = `${adminId}:${timestamp}`;

  const signature = await signData(
    payload,
    env.BALAJI_ADMIN_PASSWORD
  );

  return `${timestamp}.${signature}`;
}

// ======================================================
// VERIFY SESSION
// ======================================================

async function verifySession(request, env) {
  try {
    const cookies = request.headers.get("Cookie") || "";

    const match = cookies.match(
      new RegExp(`${SESSION_COOKIE}=([^;]+)`)
    );

    if (!match) {
      return false;
    }

    const token = match[1];

    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const timestamp = Number(parts[0]);
    const signature = parts[1];

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    // Session expires after 24 hours
    if (Date.now() - timestamp > SESSION_MAX_AGE * 1000) {
      return false;
    }

    const adminId =
      String(env.BALAJI_ADMIN_ID || "").trim();

    const payload = `${adminId}:${timestamp}`;

    const expectedSignature = await signData(
      payload,
      env.BALAJI_ADMIN_PASSWORD
    );

    return timingSafeEqual(
      signature,
      expectedSignature
    );
  } catch (error) {
    return false;
  }
}

// ======================================================
// SIGN DATA
// ======================================================

async function signData(data, secret) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  return arrayBufferToHex(signature);
}

// ======================================================
// TIMING SAFE COMPARISON
// ======================================================

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ======================================================
// ARRAY BUFFER → HEX
// ======================================================

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

// ======================================================
// JSON RESPONSE
// ======================================================

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// ======================================================
// LUDO DURABLE OBJECT
// ======================================================

export class LudoRoom {
  constructor(state) {
    this.state = state;
    this.players = new Map();
    this.turnPlayerId = null;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Ludo Room Server");
    }

    const pair = new WebSocketPair();

    const client = pair[0];
    const server = pair[1];

    const url = new URL(request.url);

    const name =
      url.searchParams.get("name") || "Player";

    // Maximum 2 players
    if (this.players.size >= 2) {
      server.accept();

      server.send(
        JSON.stringify({
          type: "ROOM_FULL",
          message: "Room already has 2 players.",
        })
      );

      server.close();

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    server.accept();

    const playerId = crypto.randomUUID();

    const player = {
      id: playerId,
      name: name.substring(0, 20),
      socket: server,
    };

    this.players.set(playerId, player);

    // First player gets first turn
    if (!this.turnPlayerId) {
      this.turnPlayerId = playerId;
    }

    server.send(
      JSON.stringify({
        type: "CONNECTED",
        playerId: playerId,
        playerNumber: this.players.size,
        players: this.getPlayers(),
      })
    );

    this.broadcastPlayers();

    server.addEventListener("message", (event) => {
      this.handleMessage(playerId, event.data);
    });

    server.addEventListener("close", () => {
      this.players.delete(playerId);

      if (this.turnPlayerId === playerId) {
        const remainingPlayer =
          this.players.values().next().value;

        this.turnPlayerId = remainingPlayer
          ? remainingPlayer.id
          : null;
      }

      this.broadcastPlayers();
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // =========================
  // GET PLAYERS
  // =========================

  getPlayers() {
    return [...this.players.values()].map(
      (player) => ({
        id: player.id,
        name: player.name,
      })
    );
  }

  // =========================
  // HANDLE MESSAGE
  // =========================

  handleMessage(playerId, data) {
    try {
      const message = JSON.parse(data);

      // =========================
      // ROLL DICE
      // =========================

      if (message.type === "ROLL_DICE") {
        const player =
          this.players.get(playerId);

        if (!player) {
          return;
        }

        if (this.turnPlayerId !== playerId) {
          player.socket.send(
            JSON.stringify({
              type: "NOT_YOUR_TURN",
            })
          );

          return;
        }

        // Server-authoritative dice
        const dice =
          Math.floor(Math.random() * 6) + 1;

        this.broadcast({
          type: "DICE_RESULT",
          playerId: playerId,
          playerName: player.name,
          dice: dice,
        });

        // 6 = same player gets another turn
        if (dice !== 6) {
          this.changeTurn(playerId);
        }
      }

      // =========================
      // PING
      // =========================

      if (message.type === "PING") {
        const player =
          this.players.get(playerId);

        if (player) {
          player.socket.send(
            JSON.stringify({
              type: "PONG",
            })
          );
        }
      }
    } catch (error) {
      console.log("Invalid message");
    }
  }

  // =========================
  // CHANGE TURN
  // =========================

  changeTurn(currentPlayerId) {
    const playerIds =
      [...this.players.keys()];

    if (playerIds.length < 2) {
      return;
    }

    const currentIndex =
      playerIds.indexOf(currentPlayerId);

    const nextIndex =
      (currentIndex + 1) % playerIds.length;

    this.turnPlayerId =
      playerIds[nextIndex];

    this.broadcast({
      type: "TURN_UPDATE",
      playerId: this.turnPlayerId,
    });
  }

  // =========================
  // BROADCAST PLAYERS
  // =========================

  broadcastPlayers() {
    this.broadcast({
      type: "PLAYERS_UPDATE",
      players: this.getPlayers(),
      turnPlayerId: this.turnPlayerId,
    });
  }

  // =========================
  // BROADCAST
  // =========================

  broadcast(message) {
    const text = JSON.stringify(message);

    for (const player of this.players.values()) {
      try {
        player.socket.send(text);
      } catch (error) {
        console.log("Send failed");
      }
    }
  }
}
