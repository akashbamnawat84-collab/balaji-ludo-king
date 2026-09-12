// ===============================
// Balaji Ludo King - 2 Player
// Frontend Demo Script
// ===============================

const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomInput = document.getElementById("joinRoomInput");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInfo = document.getElementById("roomInfo");

const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");
const turnText = document.getElementById("turnText");

const dice = document.getElementById("dice");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const diceResult = document.getElementById("diceResult");

let currentPlayer = "";
let currentRoom = "";
let roomCreated = false;

// ===============================
// Initial State
// ===============================

roomCard.classList.add("hidden");
ludoCard.classList.add("hidden");

// ===============================
// Continue / Login
// ===============================

startBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();

    if (!name) {
        message.textContent = "Please enter your name.";
        return;
    }

    if (name.length < 2) {
        message.textContent = "Name must be at least 2 characters.";
        return;
    }

    currentPlayer = name;

    localStorage.setItem("balajiPlayerName", currentPlayer);

    message.textContent = `Welcome, ${currentPlayer}!`;

    welcomeCard.classList.add("hidden");
    roomCard.classList.remove("hidden");
});

// ===============================
// Create Room
// ===============================

createRoomBtn.addEventListener("click", () => {
    if (!currentPlayer) {
        message.textContent = "Please enter your name first.";
        return;
    }

    currentRoom = generateRoomCode();
    roomCreated = true;

    roomInfo.innerHTML = `
        <p>Room Created Successfully</p>
        <div class="room-code">${currentRoom}</div>
        <p>Share this code with Player 2.</p>
        <p>Room expires in 5 minutes.</p>
    `;

    player1Name.textContent = currentPlayer;
    player2Name.textContent = "Waiting...";

    ludoCard.classList.remove("hidden");

    turnText.textContent = "Waiting for Player 2...";
});

// ===============================
// Join Room
// ===============================

joinRoomBtn.addEventListener("click", () => {
    const code = joinRoomInput.value.trim().toUpperCase();

    if (!code) {
        roomInfo.innerHTML = "<p>Please enter a room code.</p>";
        return;
    }

    if (code.length !== 6) {
        roomInfo.innerHTML = "<p>Room code must be 6 characters.</p>";
        return;
    }

    currentRoom = code;

    roomInfo.innerHTML = `
        <p>Room Joined Successfully</p>
       
