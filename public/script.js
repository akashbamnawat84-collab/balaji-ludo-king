const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");

const roomCodeInput = document.getElementById("roomCode");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const message = document.getElementById("message");
const roomMessage = document.getElementById("roomMessage");

const player1 = document.getElementById("player1");
const player2 = document.getElementById("player2");

const displayRoomCode = document.getElementById("displayRoomCode");

const gamePlayer1 = document.getElementById("gamePlayer1");
const gamePlayer2 = document.getElementById("gamePlayer2");

const gameMessage = document.getElementById("gameMessage");

const dice = document.getElementById("dice");
const diceBtn = document.getElementById("diceBtn");
const diceNumber = document.getElementById("diceNumber");

const resetGameBtn = document.getElementById("resetGameBtn");
const track = document.getElementById("track");

let socket = null;
let myPlayerNumber = null;
let myName = "";
let currentPlayer = 1;
let gameStarted = false;

const HOME = -1;
const FINISH = 56;

let positions = {
  1: [HOME, HOME, HOME, HOME],
  2: [HOME, HOME, HOME, HOME]
};


// PLAYER NAME
const savedName = localStorage.getItem("balajiPlayerName");

if (savedName) {
  playerNameInput.value = savedName;
}


// CONTINUE
startBtn.addEventListener("click", () => {

  const name = playerNameInput.value.trim();

  if (!name) {
    message.textContent = "Please enter your name.";
    return;
  }

  myName = name;

  localStorage.setItem("balajiPlayerName", name);

  welcomeCard.classList.add("hidden");
  roomCard.classList.remove("hidden");

  roomCodeInput.focus();
});


// ONLY 8 DIGITS ACCEPT
roomCodeInput.addEventListener("input", () => {

  roomCodeInput.value =
    roomCodeInput.value
      .replace(/\D/g, "")
      .slice(0, 8);

});


// JOIN ROOM
joinRoomBtn.addEventListener("click", () => {

  const roomCode = roomCodeInput.value.trim();

  if (!/^\d{8}$/.test(roomCode)) {

    roomMessage.textContent =
      "❌ केवल 8-digit Room Code डालें।";

    return;
  }

  connectRoom(roomCode);
});


// CONNECT
function connectRoom(roomCode) {

  if (socket) {
    try {
      socket.close();
    } catch {}
  }

  roomMessage.textContent =
    "🔄 Room से connect हो रहा है...";

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${location.host}/ws` +
    `?room=${encodeURIComponent(roomCode)}` +
    `&name=${encodeURIComponent(myName)}`;

  socket = new WebSocket(wsUrl);


  socket.onopen = () => {

    roomMessage.textContent =
      "✅ Room connected.";

  };


  socket.onmessage = (event) => {

    let data;

    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    handleServerMessage(data);
  };


  socket.onerror = () => {

    roomMessage.textContent =
      "❌ Connection error.";

  };


  socket.onclose = () => {

    if (!gameStarted) {

      roomMessage.textContent =
        "Connection closed.";

    }

  };
}


// SERVER MESSAGE
function handleServerMessage(data) {

  if (data.type === "connected") {

    myPlayerNumber = data.player;

    displayRoomCode.textContent =
      data.roomCode;

    roomMessage.textContent =
      `✅ आप Player ${myPlayerNumber} हैं।`;

    return;
  }


  if (data.type === "room") {

    updatePlayers(data.players);

    return;
  }


  if (data.type === "game_start") {

    gameStarted = true;

    positions = data.positions;

    currentPlayer =
      data.currentPlayer;

    updatePlayers(data.players);

    showGame();

    updateTurn();

    renderBoard();

    return;
  }


  if (data.type === "move") {

    positions = data.positions;

    currentPlayer =
      data.currentPlayer;

    diceNumber.textContent =
      data.dice;

    dice.textContent =
      `🎲 ${data.dice}`;

    renderBoard();

    updateTurn();

    return;
  }


  if (data.type === "game_over") {

    positions = data.positions;

    diceNumber.textContent =
      data.dice;

    dice.textContent =
      `🎲 ${data.dice}`;

    renderBoard();

    gameMessage.textContent =
      `🏆 ${data.winnerName} Winner!`;

    diceBtn.disabled = true;

    return;
  }


  if (data.type === "reset") {

    positions = data.positions;

    currentPlayer =
      data.currentPlayer;

    gameStarted = true;

    diceNumber.textContent = "-";
    dice.textContent = "🎲";

    diceBtn.disabled = false;

    renderBoard();

    updateTurn();

    return;
  }


  if (data.type === "player_left") {

    gameStarted = false;

    roomMessage.textContent =
      "⚠️ दूसरा Player disconnect हो गया।";

    gameMessage.textContent =
      "Waiting for Player 2...";

    return;
  }


  if (data.type === "error") {

    roomMessage.textContent =
      `❌ ${data.message}`;

  }
}


// UPDATE PLAYERS
function updatePlayers(players) {

  player1.textContent = "Waiting...";
  player2.textContent = "Waiting...";

  gamePlayer1.textContent = "Player 1";
  gamePlayer2.textContent = "Player 2";

  players.forEach(player => {

    if (player.number === 1) {

      player1.textContent = player.name;
      gamePlayer1.textContent = player.name;

    }

    if (player.number === 2) {

      player2.textContent = player.name;
      gamePlayer2.textContent = player.name;

    }

  });
}


// SHOW GAME
function showGame() {

  roomCard.classList.add("hidden");
  ludoCard.classList.remove("hidden");

}


// TURN
function updateTurn() {

  if (!gameStarted) {
    gameMessage.textContent =
      "Waiting...";
    return;
  }

  if (currentPlayer === myPlayerNumber) {

    gameMessage.textContent =
      "🎯 Your Turn";

    diceBtn.disabled = false;

  } else {

    gameMessage.textContent =
      "⏳ Opponent's Turn";

    diceBtn.disabled = true;

  }

}


// DICE
diceBtn.addEventListener("click", () => {

  if (!socket) return;

  if (socket.readyState !== WebSocket.OPEN) return;

  if (!gameStarted) return;

  if (currentPlayer !== myPlayerNumber) return;

  socket.send(JSON.stringify({
    type: "roll"
  }));

});


// RESET
resetGameBtn.addEventListener("click", () => {

  if (!socket) return;

  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    type: "reset"
  }));

});


// BOARD
function renderBoard() {

  track.innerHTML = "";

  for (let i = 0; i < 52; i++) {

    const cell =
      document.createElement("div");

    cell.className = "track-cell";

    cell.textContent = i + 1;

    track.appendChild(cell);
  }

}


// INITIAL BOARD
renderBoard();
