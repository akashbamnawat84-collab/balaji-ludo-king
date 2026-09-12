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

// Initial screen
roomCard.style.display = "none";
ludoCard.style.display = "none";

// Start button
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

// Create Room
createRoomBtn.addEventListener("click", () => {
  if (!playerName) {
    roomInfo.innerHTML = "<p>Please enter your name first.</p>";
    return;
  }

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

// Join Room
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

// Connect WebSocket
function connectToRoom() {
  if (socket) {
    try {
      socket.close();
    } catch (error) {
      console.log("Old socket close failed");
    }
  }

  const protocol =
    window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${window.location.host}/ws` +
    `?room=${encodeURIComponent(roomCode)}` +
    `&name=${encodeURIComponent(playerName)}`;

  socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    roomInfo.innerHTML += `
      <p>Connected to server...</p>
    `;
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    } catch (error) {
      console.log("Invalid server message");
    }
  });

  socket.addEventListener("close", () => {
    if (gameStarted) {
      turnText.textContent = "Connection closed";
    }
  });

  socket.addEventListener("error", () => {
    roomInfo.innerHTML += `
      <p>Connection error</p>
    `;
  });
}

// Server messages
function handleServerMessage(data) {

  // Connected
  if (data.type === "CONNECTED") {
    playerId = data.playerId;
    playerNumber = data.playerNumber;

    updatePlayers(data.players);

    roomInfo.innerHTML = `
      <p><strong>Room Connected</strong></p>
      <p>Room Code: <strong>${roomCode}</strong></p>
      <p>You are Player ${playerNumber}</p>
      <p>Waiting for second player...</p>
    `;

    if (data.players.length === 2) {
      startLudoGame();
    }
  }

  // Players update
  if (data.type === "PLAYERS_UPDATE") {
    updatePlayers(data.players);

    if (data.players.length === 2) {
      startLudoGame();
    }
  }

  // Dice result
  if (data.type === "DICE_RESULT") {
    const roll = Number(data.dice);

    if (roll >= 1 && roll <= 6) {
      dice.textContent = diceFaces[roll - 1];
    } else {
      dice.textContent = "🎲";
    }

    diceResult.textContent =
      `${data.playerName} rolled ${roll}`;

    if (data.playerId === playerId) {
      turnText.textContent = "आपकी चाल";
    } else {
      turnText.textContent = "Opponent की चाल";
    }
  }

  // Room full
  if (data.type === "ROOM_FULL") {
    roomInfo.innerHTML = `
      <p><strong>Room Full</strong></p>
      <p>यह Room पहले से 2 players से भरा हुआ है।</p>
    `;
  }
}

// Update player names
function updatePlayers(players) {
  player1Name.textContent =
    players[0]?.name || "Waiting...";

  player2Name.textContent =
    players[1]?.name || "Waiting...";
}

// Start Ludo
function startLudoGame() {
  if (gameStarted) return;

  gameStarted = true;

  roomCard.style.display = "none";
  ludoCard.style.display = "block";

  dice.textContent = "🎲";
  diceResult.textContent = "Dice: -";

  if (playerNumber === 1) {
    turnText.textContent = "Player 1 की चाल";
  } else {
    turnText.textContent =
      "Player 1 की चाल का इंतज़ार...";
  }
}

// Roll Dice
rollDiceBtn.addEventListener("click", () => {
  if (!gameStarted) {
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    turnText.textContent =
      "Server से connection नहीं है";
    return;
  }

  socket.send(
    JSON.stringify({
      type: "ROLL_DICE"
    })
  );
});
