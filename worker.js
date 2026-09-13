// ======================================================
// BALAJI LUDO KING
// CLOUDFLARE WORKER
// 2 PLAYER - 4 PIECE LUDO
// WEBSOCKET STABLE VERSION
// ======================================================

const HOME = -1;
const FINISH = 56;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // -------------------------------
      // WEBSOCKET
      // -------------------------------
      if (url.pathname === "/ws") {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response(
            "WebSocket connection required.",
            { status: 426 }
          );
        }

        const room =
          (url.searchParams.get("room") || "")
            .replace(/\D/g, "")
            .slice(0, 6);

        const name =
          (url.searchParams.get("name") || "Player")
            .trim()
            .slice(0, 20);

        if (!/^\d{6}$/.test(room)) {
          return new Response(
            "Invalid room code.",
            { status: 400 }
          );
        }

        if (!env.LUDO_ROOM) {
          return new Response(
            "LUDO_ROOM binding missing.",
            { status: 500 }
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

      // -------------------------------
      // STATIC FILES
      // -------------------------------
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


// ======================================================
// LUDO ROOM DURABLE OBJECT
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
        1: [HOME, HOME, HOME, HOME],
        2: [HOME, HOME, HOME, HOME]
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
      (
        url.searchParams.get("name") ||
        "Player"
      )
        .trim()
        .slice(0, 20);


    // -----------------------------------------------
    // ROOM FULL CHECK
    // -----------------------------------------------

    if (this.sessions.size >= 2) {
      return new Response(
        "Room is full. Only 2 players are allowed.",
        { status: 403 }
      );
    }


    // -----------------------------------------------
    // WEBSOCKET PAIR
    // -----------------------------------------------

    const pair =
      new WebSocketPair();

    const client =
      pair[0];

    const server =
      pair[1];

    server.accept();


    // -----------------------------------------------
    // PLAYER NUMBER
    // -----------------------------------------------

    const playerNumber =
      this.sessions.size === 0
        ? 1
        : 2;


    const player = {
      id: crypto.randomUUID(),

      number: playerNumber,

      name:
        name || `Player ${playerNumber}`
    };


    // -----------------------------------------------
    // SAVE SESSION
    // -----------------------------------------------

    this.sessions.set(
      player.id,
      server
    );


    this.game.roomCode =
      roomCode;


    // -----------------------------------------------
    // ADD PLAYER
    // -----------------------------------------------

    this.game.players.push({
      id: player.id,
      number: player.number,
      name: player.name
    });


    // -----------------------------------------------
    // CONNECTED MESSAGE
    // -----------------------------------------------

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


    // -----------------------------------------------
    // ROOM UPDATE
    // -----------------------------------------------

    this.broadcast({
      type: "room",

      roomCode,

      players:
        this.game.players
    });


    // -----------------------------------------------
    // START GAME WHEN 2 PLAYERS
    // -----------------------------------------------

    if (
      this.game.players.length === 2
    ) {

      this.game.started = true;

      this.game.currentPlayer = 1;

      this.game.winner = null;

      this.game.lastDice = null;


      // Send separately after both connections
      // have been accepted.

      this.broadcast({
        type: "game_start",

        roomCode,

        players:
          this.game.players,

        currentPlayer: 1,

        positions:
          this.game.positions
      });
    }


    // -----------------------------------------------
    // MESSAGE HANDLER
    // -----------------------------------------------

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

        } catch (error) {

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


    // -----------------------------------------------
    // CLOSE HANDLER
    // -----------------------------------------------

    server.addEventListener(
      "close",
      () => {

        this.removePlayer(
          player.id
        );
      }
    );


    // -----------------------------------------------
    // ERROR HANDLER
    // -----------------------------------------------

    server.addEventListener(
      "error",
      () => {

        this.removePlayer(
          player.id
        );
      }
    );


    // -----------------------------------------------
    // KEEP CONNECTION ALIVE
    // -----------------------------------------------

    server.addEventListener(
      "message",
      event => {

        try {

          const data =
            JSON.parse(event.data);

          if (data.type === "ping") {

            this.sendTo(
              server,
              {
                type: "pong"
              }
            );
          }

        } catch {}
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
  // REMOVE PLAYER
  // ====================================================

  removePlayer(playerId) {

    const existed =
      this.sessions.has(playerId);

    if (!existed) {
      return;
    }

    this.sessions.delete(
      playerId
    );


    this.game.players =
      this.game.players.filter(
        player =>
          player.id !== playerId
      );


    // Game stops if someone leaves
    this.game.started = false;


    // Send update to remaining player
    this.broadcast({
      type: "player_left",

      players:
        this.game.players,

      message:
        "Opponent disconnected."
    });
  }


  // ====================================================
  // HANDLE MESSAGE
  // ====================================================

  async handleMessage(
    player,
    data
  ) {

    // -----------------------------------------------
    // PING
    // -----------------------------------------------

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


    // -----------------------------------------------
    // ROLL DICE
    // -----------------------------------------------

    if (data.type === "roll") {

      if (!this.game.started) {
        return;
      }

      if (this.game.winner) {
        return;
      }


      // Wrong player
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


      // ---------------------------------------------
      // DICE
      // ---------------------------------------------

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


      let pieceIndex = -1;


      // ---------------------------------------------
      // SIX = BRING HOME PIECE OUT
      // ---------------------------------------------

      if (dice === 6) {

        pieceIndex =
          playerPieces.findIndex(
            position =>
              position === HOME
          );
      }


      // ---------------------------------------------
      // NORMAL MOVE
      // ---------------------------------------------

      if (pieceIndex === -1) {

        pieceIndex =
          playerPieces.findIndex(
            position =>
              position >= 0 &&
              position < FINISH &&
              position + dice <= FINISH
          );
      }


      // ---------------------------------------------
      // NO VALID MOVE
      // ---------------------------------------------

      if (pieceIndex === -1) {

        // Six gives another turn only if
        // a valid move was possible.

        if (dice !== 6) {

          this.game.currentPlayer =
            player.number === 1
              ? 2
              : 1;
        }


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


      // ---------------------------------------------
      // MOVE HOME PIECE
      // ---------------------------------------------

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


      // ---------------------------------------------
      // WIN CHECK
      // ---------------------------------------------

      const allFinished =
        playerPieces.every(
          position =>
            position >= FINISH
        );


      if (allFinished) {

        this.game.winner =
          player.number;


        this.game.started =
          false;


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


      // ---------------------------------------------
      // CHANGE TURN
      // ---------------------------------------------

      if (dice !== 6) {

        this.game.currentPlayer =
          player.number === 1
            ? 2
            : 1;
      }


      // ---------------------------------------------
      // BROADCAST MOVE
      // ---------------------------------------------

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


    // =================================================
    // RESET
    // =================================================

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

      } else {

        this.game.started = false;
      }


      this.broadcast({

        type: "reset",

        positions:
          this.game.positions,

        currentPlayer:
          1
      });

      return;
    }


    // -----------------------------------------------
    // UNKNOWN MESSAGE
    // -----------------------------------------------

    this.sendTo(
      this.sessions.get(player.id),
      {
        type: "error",

        message:
          "Unknown game command."
      }
    );
  }


  // ====================================================
  // SEND
  // ====================================================

  sendTo(socket, data) {

    if (!socket) {
      return;
    }

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
      const [
        playerId,
        socket
      ]
      of this.sessions.entries()
    ) {

      try {

        socket.send(
          message
        );

      } catch {

        this.sessions.delete(
          playerId
        );
      }
    }
  }
}
