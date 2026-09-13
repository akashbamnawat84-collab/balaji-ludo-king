// ==========================================
// BALAJI LUDO KING
// CLASSIC 2 PLAYER ROOM SYSTEM
// ==========================================

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const roomCodeInput = document.getElementById("roomCodeInput");

const createdRoom = document.getElementById("createdRoom");
const joinedRoom = document.getElementById("joinedRoom");

const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const joinedRoomCode = document.getElementById("joinedRoomCode");

const timer = document.getElementById("timer");
const joinTimer = document.getElementById("joinTimer");

const player1Status =
  document.getElementById("player1Status");

const player2Status =
  document.getElementById("player2Status");

const joinedPlayer1Status =
  document.getElementById("joinedPlayer1Status");

const joinedPlayer2Status =
  document.getElementById("joinedPlayer2Status");

const waitingMessage =
  document.getElementById("waitingMessage");

const joinMessage =
  document.getElementById("joinMessage");

const roomMessage =
  document.getElementById("roomMessage");

const leaveRoomBtn =
  document.getElementById("leaveRoomBtn");

const joinedLeaveBtn =
  document.getElementById("joinedLeaveBtn");

const gameLeaveBtn =
  document.getElementById("gameLeaveBtn");

const gameStartBox =
  document.getElementById("gameStartBox");

const startGameBtn =
  document.getElementById("startGameBtn");

const roomCard =
  document.getElementById("roomCard");

const ludoCard =
  document.getElementById("ludoCard");

const gameStatus =
  document.getElementById("gameStatus");

const dice =
  document.getElementById("dice");

const rollDiceBtn =
  document.getElementById("rollDiceBtn");


// ==========================================
// VARIABLES
// ==========================================

let roomCode = null;
let playerName = null;
let playerNumber = null;

let socket = null;

let countdownInterval = null;

let remainingSeconds = 300;

let roomActive = false;


// ==========================================
// 8 DIGIT ROOM CODE
// ==========================================

function generateRoomCode() {

  return Math.floor(
    10000000 + Math.random() * 90000000
  ).toString();

}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(text) {

  if (roomMessage) {
    roomMessage.textContent = text;
  }

}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

  stopTimer();

  remainingSeconds = 300;

  updateTimer();

  countdownInterval = setInterval(() => {

    if (!roomActive) {
      stopTimer();
      return;
    }

    remainingSeconds--;

    updateTimer();

    if (remainingSeconds <= 0) {

      stopTimer();

      expireRoom();

    }

  }, 1000);

}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateTimer() {

  const minutes =
    Math.floor(remainingSeconds / 60);

  const seconds =
    remainingSeconds % 60;

  const formatted =
    minutes +
    ":" +
    seconds.toString().padStart(2, "0");

  if (timer) {
    timer.textContent = formatted;
  }

  if (joinTimer) {
    joinTimer.textContent = formatted;
  }

}


// ==========================================
// STOP TIMER
// ==========================================

function stopTimer() {

  if (countdownInterval) {

    clearInterval(countdownInterval);

    countdownInterval = null;

  }

}


// ==========================================
// EXPIRE ROOM
// ==========================================

function expireRoom() {

  roomActive = false;

  if (socket) {

    try {
      socket.close();
    } catch (error) {}

    socket = null;

  }

  alert(
    "⏰ Room Expired!\n\n" +
    "5 मिनट में दूसरा Player Join नहीं हुआ।"
  );

  resetRoom();

}


// ==========================================
// RESET ROOM
// ==========================================

function resetRoom() {

  stopTimer();

  roomCode = null;
  playerNumber = null;

  roomActive = false;

  createdRoom.style.display = "none";
  joinedRoom.style.display = "none";
  gameStartBox.style.display = "none";

  if (roomCodeInput) {
    roomCodeInput.value = "";
  }

  roomCodeDisplay.textContent = "--------";

  timer.textContent = "5:00";
  joinTimer.textContent = "5:00";

  player1Status.textContent = "Waiting...";
  player2Status.textContent = "Waiting...";

  joinedPlayer1Status.textContent = "Waiting...";
  joinedPlayer2Status.textContent = "You";

  waitingMessage.textContent =
    "Waiting for Player 2...";

  joinMessage.textContent =
    "Connecting to room...";

  roomMessage.textContent =
    "Create a room or join an existing room.";

}


// ==========================================
// CREATE ROOM
// ==========================================

createRoomBtn.addEventListener("click", () => {

  roomCode = generateRoomCode();

  playerNumber = 1;

  roomActive = true;

  roomCodeDisplay.textContent = roomCode;

  createdRoom.style.display = "block";

  gameStartBox.style.display = "none";

  player1Status.textContent = "You";

  player2Status.textContent = "Waiting...";

  waitingMessage.textContent =
    "Waiting for Player 2...";

  showMessage(
    "Room created successfully!"
  );

  startTimer();

  connectToRoom();

});


// ==========================================
// JOIN ROOM
// ==========================================

joinRoomBtn.addEventListener("click", () => {

  const code =
    roomCodeInput.value.trim();

  if (!/^\d{8}$/.test(code)) {

    alert(
      "⚠️ कृपया 8-Digit Room Code डालें।"
    );

    return;

  }

  roomCode = code;

  playerNumber = 2;

  roomActive = true;

  joinedRoomCode.textContent = roomCode;

  joinedRoom.style.display = "block";

  createdRoom.style.display = "none";

  gameStartBox.style.display = "none";

  joinedPlayer1Status.textContent =
    "Connected";

  joinedPlayer2Status.textContent =
    "You";

  joinMessage.textContent =
    "Joining room...";

  startTimer();

  connectToRoom();

});


// ==========================================
// WEBSOCKET CONNECTION
// ==========================================

function connectToRoom() {

  if (!roomCode) {
    return;
  }

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const name =
    playerNumber === 1
      ? "Player 1"
      : "Player 2";

  const wsUrl =
    protocol +
    "//" +
    location.host +
    "/ws?room=" +
    encodeURIComponent(roomCode) +
    "&name=" +
    encodeURIComponent(name);

  try {

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {

      console.log(
        "WebSocket connected"
      );

      if (playerNumber === 1) {

        waitingMessage.textContent =
          "Room created. Waiting for Player 2...";

      } else {

        joinMessage.textContent =
          "Connected. Waiting for game start...";

      }

    };


    socket.onmessage = (event) => {

      handleServerMessage(event.data);

    };


    socket.onerror = (error) => {

      console.log(
        "WebSocket error:",
        error
      );

    };


    socket.onclose = () => {

      console.log(
        "WebSocket disconnected"
      );

    };

  } catch (error) {

    console.log(
      "Connection error:",
      error
    );

  }

}


// ==========================================
// SERVER MESSAGE
// ==========================================

function handleServerMessage(data) {

  console.log(
    "Server:",
    data
  );

  let message = null;

  try {

    message = JSON.parse(data);

  } catch (error) {

    // Plain text message
    message = {
      type: data
    };

  }


  // PLAYER 2 JOINED
  if (
    message.type === "player_joined" ||
    message.type === "PLAYER_JOINED" ||
    message.type === "join"
  ) {

    player2Joined();

    return;

  }


  // GAME START
  if (
    message.type === "game_start" ||
    message.type === "GAME_START" ||
    message.type === "start"
  ) {

    startGame();

    return;

  }


  // ROOM EXPIRED
  if (
    message.type === "room_expired" ||
    message.type === "ROOM_EXPIRED"
  ) {

    expireRoom();

    return;

  }

}


// ==========================================
// PLAYER 2 JOINED
// ==========================================

function player2Joined() {

  player2Status.textContent =
    "Connected";

  joinedPlayer1Status.textContent =
    "Connected";

  joinedPlayer2Status.textContent =
    "You";

  waitingMessage.textContent =
    "🎉 Player 2 Joined!";

  joinMessage.textContent =
    "🎉 Player 1 found. Game is ready!";

  gameStartBox.style.display =
    "block";

}


// ==========================================
// START GAME
// ==========================================

startGameBtn.addEventListener(
  "click",
  () => {

    startGame();

    sendMessage({
      type: "game_start"
    });

  }
);


// ==========================================
// GAME START FUNCTION
// ==========================================

function startGame() {

  stopTimer();

  roomActive = false;

  roomCard.style.display = "none";

  ludoCard.style.display = "block";

  gameStatus.textContent =
    "🎉 Game Started!";

  dice.textContent = "🎲";

}


// ==========================================
// SEND MESSAGE
// ==========================================

function sendMessage(data) {

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify(data)
    );

  }

}


// ==========================================
// LEAVE ROOM
// ==========================================

function leaveRoom() {

  roomActive = false;

  stopTimer();

  if (socket) {

    try {

      socket.send(
        JSON.stringify({
          type: "leave_room"
        })
      );

    } catch (error) {}

    try {

      socket.close();

    } catch (error) {}

    socket = null;

  }

  resetRoom();

}


// ==========================================
// LEAVE BUTTONS
// ==========================================

leaveRoomBtn.addEventListener(
  "click",
  () => {

    const confirmLeave =
      confirm(
        "क्या आप Room छोड़ना चाहते हैं?"
      );

    if (confirmLeave) {
      leaveRoom();
    }

  }
);


joinedLeaveBtn.addEventListener(
  "click",
  () => {

    const confirmLeave =
      confirm(
        "क्या आप Room छोड़ना चाहते हैं?"
      );

    if (confirmLeave) {
      leaveRoom();
    }

  }
);


gameLeaveBtn.addEventListener(
  "click",
  () => {

    const confirmLeave =
      confirm(
        "क्या आप Game छोड़ना चाहते हैं?"
      );

    if (confirmLeave) {

      leaveRoom();

      roomCard.style.display =
        "block";

      ludoCard.style.display =
        "none";

    }

  }
);


// ==========================================
// DEMO DICE
// ==========================================

rollDiceBtn.addEventListener(
  "click",
  () => {

    const number =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const faces = [
      "⚀",
      "⚁",
      "⚂",
      "⚃",
      "⚄",
      "⚅"
    ];

    dice.textContent =
      faces[number - 1];

  }
);


// ==========================================
// INITIAL STATE
// ==========================================

resetRoom();

console.log(
  "🎲 Balaji Ludo King Classic loaded"
);
