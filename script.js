const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const joinRoomInput = document.getElementById("joinRoomInput");
const roomInfo = document.getElementById("roomInfo");

const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");
const turnText = document.getElementById("turnText");

const dice = document.getElementById("dice");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const diceResult = document.getElementById("diceResult");

let playerName = "";
let roomCode = "";
let playerId = "";
let playerNumber = 0;
let gameStarted = false;
let socket = null;

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

roomCard.style.display = "none";
ludoCard.style.display = "none";

startBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();

  if (!name) {
    message.textContent = "Please enter your name.";
    return;
  }

  playerName = name;

  welcomeCard.style.display = "none";
  roomCard.style.display = "block";
  message.textContent = "";
});

createRoomBtn.addEventListener("click", () => {
  if (!playerName) return;

  roomCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  roomInfo.innerHTML = `
    <p><strong>Room Created</strong></p>
    <p>Room Code: <strong>${roomCode}</strong></p>
    <p>Player 2 को यह code भेजें।</p>
    <p>Waiting for Player 2...</p>
  `;

  connectToRoom();
});

joinRoomBtn.addEventListener("click", () => {
  const code = joinRoomInput.value.trim();

  if (!/^\d{6}$/.test(code)) {
    roomInfo.innerHTML = `
      <p>6 digit Room Code डालें।</p>
    `;
    return;
  }

  roomCode = code;

  roomInfo.innerHTML = `
    <p><strong>Joining Room...</strong></p>
    <p>Room Code: <strong>${roomCode}</strong></p>
  `;

  connectToRoom();
});

function connectToRoom() {
  if (socket) {
    socket.close();
  }

  const protocol =
    window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${window.location.host}/ws` +
    `?room=${encodeURIComponent(roomCode)}` +
    `&name=${encodeURIComponent(playerName)}`;

  socket = new WebSocket
