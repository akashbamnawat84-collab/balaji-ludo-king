const SESSION_COOKIE = "balaji_admin_session";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // ADMIN CONFIG CHECK
    // =========================
    // यह सिर्फ यह बताएगा कि variables मौजूद हैं या नहीं।
    // इनके actual values कभी दिखाई नहीं जाएंगी।
    if (url.pathname === "/api/admin/status") {
      return json({
        adminIdConfigured: !!env.BALAJI_ADMIN_ID,
        passwordConfigured: !!env.BALAJI_ADMIN_PASSWORD,
      });
    }

    // =========================
    // ADMIN LOGIN API
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

        // Check Admin ID and Password
        if (
          adminId !== String(env.BALAJI_ADMIN_ID || "").trim() ||
          password !== String(env.BALAJI_ADMIN_PASSWORD || "")
        ) {
          return json(
            {
              success: false,
              message: "Invalid Admin ID or Password.",
            },
            401
          );
        }

        // Create session token
        const sessionToken = crypto.randomUUID();

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
                `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
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

// =========================
// JSON RESPONSE HELPER
// =========================
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
    const name = url.searchParams.get("name") || "Player";

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
    return [...this.players.values()].map((player) => ({
      id: player.id,
      name: player.name,
    }));
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
        const player = this.players.get(playerId);

        if (!player) {
          return;
        }

        // Only current player can roll
        if (this.turnPlayerId !== playerId) {
          player.socket.send(
            JSON.stringify({
              type: "NOT_YOUR_TURN",
            })
          );

          return;
        }

        // Server-authoritative dice
        const dice = Math.floor(Math.random() * 6) + 1;

        this.broadcast({
          type: "DICE_RESULT",
          playerId: playerId,
          playerName: player.name,
          dice: dice,
        });

        // If dice is not 6, change turn
        if (dice !== 6) {
          this.changeTurn(playerId);
        }
      }

      // =========================
      // PING
      // =========================
      if (message.type === "PING") {
        const player = this.players.get(playerId);

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
    const playerIds = [...this.players.keys()];

    if (playerIds.length < 2) {
      return;
    }

    const currentIndex =
      playerIds.indexOf(currentPlayerId);

    const nextIndex =
      (currentIndex + 1) % playerIds.length;

    this.turnPlayerId = playerIds[nextIndex];

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
  // BROADCAST MESSAGE
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
