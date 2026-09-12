export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // WebSocket room connection
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const room = url.searchParams.get("room");

      if (!room || !/^\d{6}$/.test(room)) {
        return new Response("Invalid room code", { status: 400 });
      }

      const id = env.LUDO_ROOM.idFromName(room);
      const stub = env.LUDO_ROOM.get(id);

      return stub.fetch(request);
    }

    // Normal website files
    return env.ASSETS.fetch(request);
  },
};

export class LudoRoom {
  constructor(state) {
    this.state = state;
    this.players = new Map();
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

    if (this.players.size >= 2) {
      server.accept();

      server.send(
        JSON.stringify({
          type: "ROOM_FULL",
          message: "Room already has 2 players",
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

    this.players.set(playerId, {
      id: playerId,
      name,
      socket: server,
    });

    server.send(
      JSON.stringify({
        type: "CONNECTED",
        playerId,
        playerNumber: this.players.size,
        players: [...this.players.values()].map((p) => ({
          id: p.id,
          name: p.name,
        })),
      })
    );

    this.broadcastPlayers();

    server.addEventListener("message", (event) => {
      this.handleMessage(playerId, event.data);
    });

    server.addEventListener("close", () => {
      this.players.delete(playerId);
      this.broadcastPlayers();
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleMessage(playerId, data) {
    try {
      const message = JSON.parse(data);

      if (message.type === "ROLL_DICE") {
        const player = this.players.get(playerId);

        if (!player) return;

        const dice = Math.floor(Math.random() * 6) + 1;

        this.broadcast({
          type: "DICE_RESULT",
          playerId,
          playerName: player.name,
          dice,
        });
      }

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

  broadcastPlayers() {
    this.broadcast({
      type: "PLAYERS_UPDATE",
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
      })),
    });
  }

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
