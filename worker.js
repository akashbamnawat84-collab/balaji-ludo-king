const MAX_PLAYERS = 2;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // =========================
      // WEBSOCKET ROOM
      // =========================
      if (url.pathname === "/ws") {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response(
            "WebSocket connection required.",
            { status: 426 }
          );
        }

        const roomCode = (url.searchParams.get("room") || "")
          .replace(/\D/g, "")
          .slice(0, 8);

        const name = (url.searchParams.get("name") || "Player")
          .trim()
          .slice(0, 20);

        if (!/^\d{8}$/.test(roomCode)) {
          return new Response(
            "Invalid 8-digit Room Code.",
            { status: 400 }
          );
        }

        if (!env.LUDO_ROOM) {
          return new Response(
            "LUDO_ROOM binding missing.",
            { status: 500 }
          );
        }

        const id = env.LUDO_ROOM.idFromName(roomCode);
        const stub = env.LUDO_ROOM.get(id);

        return stub.fetch(
          new Request(
            `${url.origin}/room?room=${roomCode}&name=${encodeURIComponent(name)}`,
            request
          )
        );
      }

      // =========================
      // STATIC WEBSITE
      // =========================
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response(
        "Balaji Ludo King is running."
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: String(error?.message || error)
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};


// ==========================================
// LUDO ROOM DURABLE OBJECT
// ==========================================

export class LudoRoom {

  constructor(state, env) {
    this.state = state;
    this.env = env;

    this.sessions = new Map();
    this.players = [];

    this.game = {
      currentPlayer: 1,
      dice: null,
      positions: {
        1: [-1, -1, -1, -1],
        2: [-1, -1, -1, -1]
      }
    };
  }


  async fetch(request) {

    const url = new URL(request.url);

    if (
      request.headers.get("Upgrade") !== "websocket"
    ) {
      return new Response(
        "Ludo Room is running."
      );
    }

    const roomCode =
      url.searchParams.get("room") || "";

    const name =
      (url.searchParams.get("name") || "Player")
        .trim()
        .slice(0, 20);


    // =========================
    // MAX 2 PLAYERS
    // =========================

    if (this.players.length >= MAX_PLAYERS) {
      return new Response(
        "Room is full. Only 2 players are allowed.",
        { status: 403 }
      );
    }


    const pair = new WebSocketPair();

    const client = pair[0];
    const server = pair[1];

    server.accept();


    const playerNumber =
      this.players.length === 0
        ? 1
        : 2;


    const player = {

      id: crypto.randomUUID(),

      number: playerNumber,

      name:
        name || `Player ${playerNumber}`

    };


    this.sessions.set(
      player.id,
      server
    );

    this.players.push(player);


    // =========================
    // PLAYER CONNECTED
    // =========================

    this.send(server, {

      type: "connected",

      player: playerNumber,

      name: player.name,

      roomCode

    });


    this.broadcast({

      type: "room",

      roomCode,

      players: this.players

    });


    // =========================
    // PLAYER 2 JOINED
    // =========================

    if (this.players.length === 2) {

      this.game = {

        currentPlayer: 1,

        dice: null,

        positions: {

          1: [-1, -1, -1, -1],

          2: [-1, -1, -1, -1]

        }

      };


      this.broadcast({

        type: "game_start",

        roomCode,

        players: this.players,

        currentPlayer:
          this.game.currentPlayer,

        positions:
          this.game.positions

      });

    }


    // =========================
    // MESSAGES
    // =========================

    server.addEventListener(
      "message",
      event => {

        try {

          const data =
            JSON.parse(event.data);

          this.handleMessage(
            player,
            data
          );

        } catch {

          this.send(server, {

            type: "error",

            message:
              "Invalid game message."

          });

        }

      }
    );


    // =========================
    // PLAYER LEFT
    // =========================

    server.addEventListener(
      "close",
      () => {

        this.removePlayer(
          player.id
        );

      }
    );


    server.addEventListener(
      "error",
      () => {

        this.removePlayer(
          player.id
        );

      }
    );


    return new Response(null, {

      status: 101,

      webSocket: client

    });

  }


  // ==========================================
  // GAME MESSAGES
  // ==========================================

  handleMessage(player, data) {


    // PING
    if (data.type === "ping") {

      this.send(
        this.sessions.get(player.id),
        {
          type: "pong"
        }
      );

      return;

    }


    // =========================
    // ROLL DICE
    // =========================

    if (data.type === "roll") {

      if (
        this.players.length !== 2
      ) {
        return;
      }


      if (
        this.game.currentPlayer !==
        player.number
      ) {

        this.send(
          this.sessions.get(player.id),
          {
            type: "error",
            message:
              "Not your turn."
          }
        );

        return;
      }


      const dice =
        Math.floor(
          Math.random() * 6
        ) + 1;


      this.game.dice = dice;


      const positions =
        this.game.positions;


      this.broadcast({

        type: "move",

        player:
          player.number,

        dice,

        positions,

        currentPlayer:
          player.number === 1
            ? 2
            : 1

      });


      this.game.currentPlayer =
        player.number === 1
          ? 2
          : 1;


      return;

    }


    // =========================
    // RESET GAME
    // =========================

    if (data.type === "reset") {

      this.game = {

        currentPlayer: 1,

        dice: null,

        positions: {

          1: [-1, -1, -1, -1],

          2: [-1, -1, -1, -1]

        }

      };


      this.broadcast({

        type: "reset",

        positions:
          this.game.positions,

        currentPlayer:
          this.game.currentPlayer

      });


      return;

    }

  }


  // ==========================================
  // REMOVE PLAYER
  // ==========================================

  removePlayer(playerId) {

    if (
      !this.sessions.has(playerId)
    ) {
      return;
    }


    this.sessions.delete(
      playerId
    );


    this.players =
      this.players.filter(
        player =>
          player.id !== playerId
      );


    this.broadcast({

      type: "player_left",

      players:
        this.players,

      message:
        "Opponent disconnected."

    });

  }


  // ==========================================
  // SEND
  // ==========================================

  send(socket, data) {

    if (!socket) return;

    try {

      socket.send(
        JSON.stringify(data)
      );

    } catch {}

  }


  // ==========================================
  // BROADCAST
  // ==========================================

  broadcast(data) {

    const message =
      JSON.stringify(data);


    for (
      const [id, socket]
      of this.sessions.entries()
    ) {

      try {

        socket.send(message);

      } catch {

        this.sessions.delete(id);

      }

    }

  }

}
