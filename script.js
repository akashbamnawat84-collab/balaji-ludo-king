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

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "
