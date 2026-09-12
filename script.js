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
let currentPlayer = 1;
let gameStarted = false;

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

  roomCode = Math.floor(100000 + Math.random() * 900000).toString();

  player1Name.textContent = playerName;
  player2Name.textContent = "Waiting...";

  roomInfo.innerHTML = `
    <p><strong>Room Created</strong></p>
    <p>Room Code: <strong>${roomCode}</strong></p>
    <p>Share this code with Player 2</p>
  `;

  setTimeout(() => {
    roomInfo.innerHTML += `
      <p>Waiting for Player 2...</p>
    `;
  }, 500);
});

joinRoomBtn.addEventListener("click", () => {
  const code = joinRoomInput.value.trim();

  if (code.length !== 6) {
    roomInfo.innerHTML = `
      <p>Please enter a valid 6-digit room code.</p>
    `;
    return;
  }

  roomCode = code;

  player2Name.textContent = playerName;

  roomInfo.innerHTML = `
    <p><strong>Joined Room</strong></p>
    <p>Room Code: <strong>${roomCode}</strong></p>
  `;

  startLudoGame();
});

function startLudoGame() {
  roomCard.style.display = "none";
  ludoCard.style.display = "block";

  gameStarted = true;
  currentPlayer = 1;

  turnText.textContent = "Player 1's turn";
  diceResult.textContent = "Dice: -";
}

rollDiceBtn.addEventListener("click", () => {
  if (!gameStarted) return;

  const roll = Math.floor(Math.random() * 6) + 1;

  dice.textContent = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][roll - 1];

  diceResult.textContent = `Dice: ${roll}`;

  if (currentPlayer === 1) {
    turnText.textContent = "Player 2's turn";
    currentPlayer = 2;
  } else {
    turnText.textContent = "Player 1's turn";
    currentPlayer = 1;
  }
});
