// ======================================================
// BALAJI LUDO KING
// CLASSIC ROOM CODE - 2 PLAYER
// ======================================================

const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCode");

const player1Element = document.getElementById("player1");
const player2Element = document.getElementById("player2");

const roomMessage = document.getElementById("roomMessage");

const displayRoomCode =
  document.getElementById("displayRoomCode");

const gamePlayer1 =
  document.getElementById("gamePlayer1");

const gamePlayer2 =
  document.getElementById("gamePlayer2");

const gameMessage =
  document.getElementById("gameMessage");

const diceBtn =
  document.getElementById("diceBtn");

const diceElement =
  document.getElementById("dice");

const diceNumber =
  document.getElementById("diceNumber");

const resetGameBtn =
  document.getElementById("resetGameBtn");

const track =
  document.getElementById("track");

let playerName = "";
let roomCode = "";
let playerNumber = 0;
let socket = null;

let gameStarted = false;
let currentPlayer = 1;

const HOME = -1;
const FINISH = 56;

const diceFaces = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅"
};


// ======================================================
// BOARD
// ======================================================

function createBoard() {

  if (!track) return;

  track.innerHTML = "";

  for (let i = 0; i < 52; i++) {

    const cell =
      document.createElement("div");

    cell.className =
      "track-cell";

    const angle =
      (i / 52) *
      Math.PI *
      2;

    const x =
      50 +
      Math.cos(angle) *
      42;

    const y =
      50 +
      Math.sin(angle) *
      42;

    cell.style.left =
      `${x - 4}%`;

    cell.style.top =
      `${y - 4}%`;

    track.appendChild(cell);
  }

  createPieces();
}


function createPieces() {

  document
    .querySelectorAll(".piece")
    .forEach(
      piece => piece.remove()
    );

  const board =
    document.querySelector(".ludo-board");

  if (!board) return;

  for (
    let player = 1;
    player <= 2;
    player++
  ) {

    for (
      let piece = 0;
      piece < 4;
     
