const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const roomCodeInput = document.getElementById("roomCode");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomMessage = document.getElementById("roomMessage");

const player1El = document.getElementById("player1");
const player2El = document.getElementById("player2");

const displayRoomCode = document.getElementById("displayRoomCode");
const gameMessage = document.getElementById("gameMessage");

const gamePlayer1 = document.getElementById("gamePlayer1");
const gamePlayer2 = document.getElementById("gamePlayer2");

const dice = document.getElementById("dice");
const diceBtn = document.getElementById("diceBtn");
const diceNumber = document.getElementById("diceNumber");
const resetGameBtn = document.getElementById("resetGameBtn");

let playerName = "";
let roomCode = "";
let socket = null;
let playerNumber = 0;
let gameStarted = false;


// -----------------------------
// CONTINUE
// -----------------------------

startBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();

  if (!name) {
    message.textContent = "Please enter your name.";
    return;
  }

  playerName = name;

  localStorage.setItem("balajiPlayerName", playerName);

  welcomeCard.classList.add("hidden");
  roomCard.classList.remove("hidden");

  roomMessage.textContent = "8-Digit Room Code डालें।";
});


// -----------------------------
// RESTORE NAME
// -----------------------------

const savedName = localStorage.getItem("balajiPlayerName");

if (savedName) {
  playerNameInput.value = savedName;
}


// -----------------------------
// JOIN ROOM
// -----------------------------

joinRoomBtn.addEventListener("click", () => {

  const code = roomCodeInput.value.trim();

  if (!/^\d{8}$/.test(code)) {
    roomMessage.textContent =
      "कृपया सही 8-Digit Room Code डालें।";
    return;
  }

  if (!playerName) {
    playerName = playerNameInput.value.trim();
  }

  if (!playerName) {
    roomMessage.textContent =
      "पहले अपना नाम डालें।";
    return;
  }

  roomCode = code;

  roomMessage.textContent =
    "Room से connect हो रहा है...";

  connectToRoom();
});


// -----------------------------
// WEBSOCKET
// -----------------------------

function connectToRoom() {

  if (socket) {
    try {
      socket.close();
    } catch (e) {}
  }

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${location.host}/ws?room=${encodeURIComponent(roomCode)}&name=${encodeURIComponent(playerName)}`;

  socket = new WebSocket(wsUrl);


  socket.onopen = () => {

    roomMessage.textContent =
      "Room connected. Waiting for Player 2...";

  };


  socket.onmessage = (event) => {

    let data;

    try {
      data = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    handleServerMessage(data);
  };


  socket.onerror = () => {

    roomMessage.textContent =
      "Room connection error.";

  };


  socket.onclose = () => {

    if (!gameStarted) {

      roomMessage.textContent =
        "Connection closed. Please try again.";

    } else {

      gameMessage.textContent =
        "Connection closed.";

    }
  };
}


// -----------------------------
// SERVER MESSAGES
// -----------------------------

function handleServerMessage(data) {

  switch (data.type) {

    case "connected":

      playerNumber =
        Number(data.playerNumber || data.player || 0);

      roomMessage.textContent =
        "Room connected.";

      updatePlayerNumber();

      break;


    case "room":

      updateRoomPlayers(data);

      break;


    case "game_start":

      gameStarted = true;

      roomCard.classList.add("hidden");
      ludoCard.classList.remove("hidden");

      displayRoomCode.textContent = roomCode;

      if (data.players) {
        updateGamePlayers(data.players);
      }

      gameMessage.textContent =
        "Game started!";

      break;


    case "move":

      if (data.positions) {
        // Positions will be used by the board movement system.
      }

      if (data.dice !== undefined) {
        showDice(data.dice);
      }

      break;


    case "dice":

      if (data.value !== undefined) {
        showDice(data.value);
      }

      break;


    case "reset":

      resetDice();

      gameMessage.textContent =
        "Game reset.";

      break;


    case "player_left":

      gameMessage.textContent =
        "Player 2 left the room.";

      break;


    case "error":

      roomMessage.textContent =
        data.message || "Room error.";

      break;


    default:

      console.log("Server message:", data);
  }
}


// -----------------------------
// PLAYER NUMBER
// -----------------------------

function updatePlayerNumber() {

  if (playerNumber === 1) {

    roomMessage.textContent =
      "You are Player 1. Waiting for Player 2...";

  }

  if (playerNumber === 2) {

    roomMessage.textContent =
      "You are Player 2. Waiting for game...";

  }
}


// -----------------------------
// ROOM PLAYERS
// -----------------------------

function updateRoomPlayers(data) {

  const players = data.players || [];

  player1El.textContent =
    players[0]?.name || "Waiting...";

  player2El.textContent =
    players[1]?.name || "Waiting...";

  if (players.length >= 2) {

    roomMessage.textContent =
      "Both players joined. Starting game...";

  }
}


// -----------------------------
// GAME PLAYERS
// -----------------------------

function updateGamePlayers(players) {

  gamePlayer1.textContent =
    players[0]?.name || "Player 1";

  gamePlayer2.textContent =
    players[1]?.name || "Player 2";
}


// -----------------------------
// DICE
// -----------------------------

diceBtn.addEventListener("click", () => {

  if (!socket ||
      socket.readyState !== WebSocket.OPEN) {

    gameMessage.textContent =
      "Room connection is not active.";

    return;
  }

  diceBtn.disabled = true;

  socket.send(JSON.stringify({
    type: "roll"
  }));

  setTimeout(() => {
    diceBtn.disabled = false;
  }, 800);
});


function showDice(value) {

  const number = Number(value);

  if (number < 1 || number > 6) {
    return;
  }

  diceNumber.textContent = number;

  const faces = [
    "",
    "⚀",
    "⚁",
    "⚂",
    "⚃",
    "⚄",
    "⚅"
  ];

  dice.textContent = faces[number];

  gameMessage.textContent =
    `Dice rolled: ${number}`;
}


function resetDice() {

  dice.textContent = "🎲";
  diceNumber.textContent = "-";
}


// -----------------------------
// RESET GAME
// -----------------------------

resetGameBtn.addEventListener("click", () => {

  if (!socket ||
      socket.readyState !== WebSocket.OPEN) {

    gameMessage.textContent =
      "Room connection is not active.";

    return;
  }

  socket.send(JSON.stringify({
    type: "reset"
  }));
});


// -----------------------------
// ONLY 8 DIGITS
// -----------------------------

roomCodeInput.addEventListener("input", () => {

  roomCodeInput.value =
    roomCodeInput.value
      .replace(/\D/g, "")
      .slice(0, 8);
});


// -----------------------------
// ENTER KEY
// -----------------------------

roomCodeInput.addEventListener("keydown", (event) => {

  if (event.key === "Enter") {
    joinRoomBtn.click();
  }

});


// -----------------------------
// INITIAL STATE
// -----------------------------

roomCard.classList.add("hidden");
ludoCard.classList.add("hidden");

console.log("Balaji Ludo King loaded.");
