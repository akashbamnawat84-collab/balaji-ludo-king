// ======================================================
// BALAJI LUDO KING
// CLOUDFLARE WORKER
// 2 PLAYER - 4 PIECE LUDO
// ======================================================

const HOME = -1;
const FINISH = 56;

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    try {

      // ================================================
      // WEBSOCKET
      // ================================================

      if (url.pathname === "/ws") {

        if (
          request.headers.get("Upgrade")
            !== "websocket"
        ) {

          return new Response(
            "WebSocket connection required.",
            { status: 426 }
          );
        }

        const room =
          (url.searchParams.get("room") || "")
            .replace(/[^0-9]/g, "")
            .slice(0, 6);

        const name =
          (url.searchParams.get("name") || "Player")
            .trim()
            .slice(0, 20);

        if (room.length !== 6) {

          return new Response(
            "Invalid room code.",
            { status: 400 }
          );
        }

        const id =
          env.LUDO_ROOM.idFromName(room);

        const stub =
          env.LUDO_ROOM.get(id);

        return stub.fetch(
          new Request(
            `${url.origin}/room?room=${room}&name=${encodeURIComponent(name)}`,
            request
          )
        );
      }


      // ================================================
      // STATIC ASSETS
      // ================================================

      if (env.ASSETS) {

        return env.ASSETS.fetch(request);
      }

      return new Response(
        "Balaji Ludo King is running.",
        { status: 200 }
      );

    } catch (error) {

      return new Response(
        JSON.stringify({
          success: false,
          message: "Server error",
          error: String(
            error?.message || error
          )
        }),
        {
          status: 500,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }
  }
};


// ======================================================
// DURABLE OBJECT
// ======================================================

export class LudoRoom {

  constructor(state, env) {

    this.state = state;
    this.env = env;

    this.sessions = new Map();

    this.game = {

      roomCode: "",

      players: [],

      positions: {

        1: [
          HOME,
          HOME,
          HOME,
          HOME
        ],

        2: [
          HOME,
          HOME,
          HOME,
          HOME
        ]
      },

      currentPlayer: 1,

      started: false,

      winner: null,

      lastDice: null
    };
  }


  // ====================================================
  // FETCH
  // ====================================================

  async fetch(request) {

    const url =
      new URL(request.url);

    if (
      request.headers.get("Upgrade")
        !== "websocket"
    ) {

      return new Response(
        "Ludo Room is running."
      );
    }

    const roomCode =
      url.searchParams.get("room") || "";

    const name =
      url.searchParams.get("name") || "Player";


    // ================================================
    // ONLY 2 PLAYERS
    // ================================================

    if (this.sessions.size >= 2) {

      return new Response(
        "Room is full. Only 2 players are allowed.",
        { status: 403 }
      );
    }


    const pair =
      new WebSocketPair();

    const client =
      pair[0];

    const server =
      pair[1];

    server.accept();


    const playerNumber =
      this.sessions.size === 0
        ? 1
        : 2;


    const player = {

      id: crypto.randomUUID(),

      number: playerNumber,

      name: name
        .slice(0, 20)
    };


    this.sessions.set(
      player.id,
      server
    );


    this.game.roomCode =
      roomCode;


    this.game.players.push({

      id: player.id,

      number: player.number,

      name: player.name
    });


    // ================================================
    // CONNECTED
    // ================================================

    this.sendTo(
      server,
      {
        type: "connected",

        player:
          player.number,

        name:
          player.name,

        roomCode
      }
    );


    // ================================================
    // ROOM UPDATE
    // ================================================

    this.broadcast({

      type: "room",

      roomCode,

      players:
        this.game.players
    });


    // ================================================
    // START GAME
    // ================================================

    if (
      this.game.players.length === 2
    ) {

      this.game.started = true;

      this.game.currentPlayer = 1;

      this.broadcast({

        type: "game_start",

        players:
          this.game.players,

        currentPlayer: 1,

        positions:
          this.game.positions
      });
    }


    // ================================================
    // MESSAGE
    // ================================================

    server.addEventListener(
      "message",
      async event => {

        try {

          const data =
            JSON.parse(event.data);

          await this.handleMessage(
            player,
            data
          );

        } catch {

          this.sendTo(
            server,
            {
              type: "error",
              message:
                "Invalid game message."
            }
          );
        }
      }
    );


    // ================================================
    // CLOSE
    // ================================================

    server.addEventListener(
      "close",
      () => {

        this.sessions.delete(
          player.id
        );

        this.game.players =
          this.game.players.filter(
            p =>
              p.id !== player.id
          );

        this.game.started = false;

        this.broadcast({

          type: "player_left",

          players:
            this.game.players
        });
      }
    );


    return new Response(
      null,
      {
        status: 101,
        webSocket: client
      }
    );
  }


  // ====================================================
  // HANDLE MESSAGE
  // ====================================================

  async handleMessage(
    player,
    data
  ) {

    // ================================================
    // PING
    // ================================================

    if (data.type === "ping") {

      const socket =
        this.sessions.get(
          player.id
        );

      if (socket) {

        this.sendTo(
          socket,
          {
            type: "pong"
          }
        );
      }

      return;
    }


    // ================================================
    // ROLL DICE
    // ================================================

    if (data.type === "roll") {

      if (!this.game.started)
        return;

      if (this.game.winner)
        return;

      if (
        player.number !==
        this.game.currentPlayer
      ) {

        const socket =
          this.sessions.get(
            player.id
          );

        if (socket) {

          this.sendTo(
            socket,
            {
              type: "error",
              message:
                "Wait for your turn."
            }
          );
        }

        return;
      }


      const dice =
        Math.floor(
          Math.random() * 6
        ) + 1;


      this.game.lastDice =
        dice;


      const playerPieces =
        this.game.positions[
          player.number
        ];


      // ================================================
      // FIND MOVABLE PIECE
      // ================================================

      let pieceIndex = -1;


      // Prefer HOME piece on 6
      if (dice === 6) {

        pieceIndex =
          playerPieces.findIndex(
            p => p === HOME
          );
      }


      // Otherwise move a piece already outside
      if (pieceIndex === -1) {

        pieceIndex =
          playerPieces.findIndex(
            p =>
              p >= 0 &&
              p < FINISH &&
              p + dice <= FINISH
          );
      }


      // ================================================
      // NO MOVE
      // ================================================

      if (pieceIndex === -1) {

        this.game.currentPlayer =
          player.number === 1
            ? 2
            : 1;

        this.broadcast({

          type: "move",

          player:
            player.number,

          piece:
            null,

          dice,

          positions:
            this.game.positions,

          currentPlayer:
            this.game.currentPlayer
        });

        return;
      }


      // ================================================
      // MOVE HOME PIECE
      // ================================================

      if (
        playerPieces[pieceIndex] === HOME
      ) {

        if (dice === 6) {

          playerPieces[pieceIndex] = 0;

        } else {

          return;
        }

      } else {

        playerPieces[pieceIndex] += dice;
      }


      // ================================================
      // FINISH
      // ================================================

      const allFinished =
        playerPieces.every(
          p => p >= FINISH
        );


      if (allFinished) {

        this.game.winner =
          player.number;

        this.broadcast({

          type: "game_over",

          winner:
            player.number,

          winnerName:
            player.name,

          dice,

          positions:
            this.game.positions
        });

        return;
      }


      // ================================================
      // EXTRA TURN ON 6
      // ================================================

      if (dice !== 6) {

        this.game.currentPlayer =
          player.number === 1
            ? 2
            : 1;
      }


      // ================================================
      // BROADCAST MOVE
      // ================================================

      this.broadcast({

        type: "move",

        player:
          player.number,

        piece:
          pieceIndex,

        dice,

        positions:
          this.game.positions,

        currentPlayer:
          this.game.currentPlayer
      });

      return;
    }


    // ================================================
    // RESET
    // ================================================

    if (data.type === "reset") {

      this.game.positions = {

        1: [
          HOME,
          HOME,
          HOME,
          HOME
        ],

        2: [
          HOME,
          HOME,
          HOME,
          HOME
        ]
      };

      this.game.currentPlayer = 1;

      this.game.winner = null;

      this.game.lastDice = null;

      if (
        this.game.players.length === 2
      ) {

        this.game.started = true;
      }


      this.broadcast({

        type: "reset",

        positions:
          this.game.positions,

        currentPlayer: 1
      });

      return;
    }
  }


  // ====================================================
  // SEND
  // ====================================================

  sendTo(socket, data) {

    try {

      socket.send(
        JSON.stringify(data)
      );

    } catch {}
  }


  // ====================================================
  // BROADCAST
  // ====================================================

  broadcast(data) {

    const message =
      JSON.stringify(data);

    for (
      const socket of
      this.sessions.values()
    ) {

      try {

        socket.send(message);

      } catch {}
    }
  }
}
