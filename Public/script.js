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

let positions = {
  1: [-1, -1, -1, -1],
  2: [-1, -1, -1, -1]
};


// SAVED NAME
const savedName =
  localStorage.getItem("balajiPlayerName");

if (savedName) {
  playerNameInput.value = savedName;
}


// CONTINUE
startBtn.addEventListener("click", () => {

  const name =
    playerNameInput.value.trim();

  if (!name) {
    message.textContent =
      "Please enter your
