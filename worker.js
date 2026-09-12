export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // WebSocket room
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

    // Website files
    if (!env.ASSETS) {
      return new Response("ASSETS binding is missing", {
        status: 500,
      });
    }

    return env.ASSETS.fetch(request);
  },
};

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
        const remainingPlayer = this.players.values().next().value;

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

  getPlayers() {
    return [...this.players.values()].map((player) => ({
      id: player.id,
      name: player.name,
    }));
  }

  handleMessage(playerId, data) {
    try {
      const message = JSON.parse(data);

      // Roll dice
      if (message.type === "ROLL_DICE") {
        const player = this.players.get(playerId);

        if (!player) return;

        if (this.turnPlayerId !== playerId) {
          player.socket.send(
            JSON.stringify({
              type: "NOT_YOUR_TURN",
            })
          );

          return;
        }

        const dice = Math.floor(Math.random() * 6) + 1;

        this.broadcast({
          type: "DICE_RESULT",
          playerId: playerId,
          playerName: player.name,
          dice: dice,
        });

        // 6 means same player gets another turn
        if (dice !== 6) {
          this.changeTurn(playerId);
        }
      }

      // Ping
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

  changeTurn(currentPlayerId) {
    const playerIds = [...this.players.keys()];

    if (playerIds.length < 2) {
      return;
    }

    const currentIndex = playerIds.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;

    this.turnPlayerId = playerIds[nextIndex];

    this.broadcast({
      type: "TURN_UPDATE",
      playerId: this.turnPlayerId,
    });
  }

  broadcastPlayers() {
    this.broadcast({
      type: "PLAYERS_UPDATE",
      players: this.getPlayers(),
      turnPlayerId: this.turnPlayerId,
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
