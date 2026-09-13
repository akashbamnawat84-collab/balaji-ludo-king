// ==========================================
// BALAJI LUDO KING
// DASHBOARD + BATTLE + CLASSIC ROOM
// DEMO MODE
// ==========================================


// ==========================================
// DASHBOARD SECTIONS
// ==========================================

const sections = [
  "homeSection",
  "roomSection",
  "moneySection",
  "supportSection",
  "profileSection",
  "referSection"
];

const navButtons =
  document.querySelectorAll(".nav-btn");


// ==========================================
// NAVIGATION
// ==========================================

function showSection(sectionId) {

  sections.forEach((id) => {

    const section =
      document.getElementById(id);

    if (section) {
      section.style.display =
        id === sectionId ? "block" : "none";
    }

  });


  navButtons.forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );

  });

}


navButtons.forEach((button) => {

  button.addEventListener("click", () => {

    showSection(button.dataset.section);

  });

});


// ==========================================
// WALLET
// ==========================================

let walletBalance = 0;

let incomeBalance = 50;


const walletBalanceEl =
  document.getElementById("walletBalance");

const incomeBalanceEl =
  document.getElementById("incomeBalance");

const moneyBalanceEl =
  document.getElementById("moneyBalance");


function updateWallet() {

  if (walletBalanceEl) {

    walletBalanceEl.textContent =
      walletBalance.toFixed(2);

  }

  if (moneyBalanceEl) {

    moneyBalanceEl.textContent =
      walletBalance.toFixed(2);

  }

  if (incomeBalanceEl) {

    incomeBalanceEl.textContent =
      incomeBalance.toFixed(2);

  }

}


updateWallet();


// ==========================================
// CREATE BATTLE
// ==========================================

const createBattleBtn =
  document.getElementById("createBattleBtn");

const battleAmountInput =
  document.getElementById("battleAmount");


if (createBattleBtn) {

  createBattleBtn.addEventListener(
    "click",
    () => {

      const amount =
        Number(battleAmountInput.value);

      if (!amount || amount < 50) {

        alert(
          "⚠️ Minimum play amount is ₹50."
        );

        return;

      }


      if (walletBalance < amount) {

        showBalancePopup();

        return;

      }


      alert(
        "🎮 Demo Battle Created!\n\n" +
        "Entry Fee: ₹" +
        amount
      );

    }
  );

}


// ==========================================
// OPEN BATTLE PLAY BUTTONS
// ==========================================

const playBattleButtons =
  document.querySelectorAll(".play-battle");


playBattleButtons.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      const amount =
        Number(button.dataset.amount || 0);


      if (walletBalance < amount) {

        showBalancePopup();

        return;

      }


      alert(
        "🎮 Joining Battle...\n\n" +
        "Entry Fee: ₹" +
        amount
      );

    }
  );

});


// ==========================================
// BALANCE POPUP
// ==========================================

const balancePopup =
  document.getElementById("balancePopup");

const balanceOkBtn =
  document.getElementById("balanceOkBtn");


function showBalancePopup() {

  if (balancePopup) {

    balancePopup.style.display =
      "flex";

  }

}


function hideBalancePopup() {

  if (balancePopup) {

    balancePopup.style.display =
      "none";

  }

}


if (balanceOkBtn) {

  balanceOkBtn.addEventListener(
    "click",
    hideBalancePopup
  );

}


// Close popup when clicking outside

if (balancePopup) {

  balancePopup.addEventListener(
    "click",
    (event) => {

      if (event.target === balancePopup) {

        hideBalancePopup();

      }

    }
  );

}


// ==========================================
// ROOM SYSTEM
// ==========================================

const createRoomBtn =
  document.getElementById("createRoomBtn");

const joinRoomBtn =
  document.getElementById("joinRoomBtn");

const roomCodeInput =
  document.getElementById("roomCodeInput");

const createdRoom =
  document.getElementById("createdRoom");

const joinedRoom =
  document.getElementById("joinedRoom");

const roomCodeDisplay =
  document.getElementById("roomCodeDisplay");

const joinedRoomCode =
  document.getElementById("joinedRoomCode");

const timer =
  document.getElementById("timer");

const joinTimer =
  document.getElementById("joinTimer");

const player1Status =
  document.getElementById("player1Status");

const player2Status =
  document.getElementById("player2Status");

const joinedPlayer1Status =
  document.getElementById(
    "joinedPlayer1Status"
  );

const joinedPlayer2Status =
  document.getElementById(
    "joinedPlayer2Status"
  );

const waitingMessage =
  document.getElementById(
    "waitingMessage"
  );

const joinMessage =
  document.getElementById(
    "joinMessage"
  );

const roomMessage =
  document.getElementById(
    "roomMessage"
  );

const leaveRoomBtn =
  document.getElementById(
    "leaveRoomBtn"
  );

const joinedLeaveBtn =
  document.getElementById(
    "joinedLeaveBtn"
  );

const gameStartBox =
  document.getElementById(
    "gameStartBox"
  );

const startGameBtn =
  document.getElementById(
    "startGameBtn"
  );


// ==========================================
// ROOM VARIABLES
// ==========================================

let roomCode = null;

let playerNumber = null;

let socket = null;

let countdownInterval = null;

let remainingSeconds = 300;

let roomActive = false;


// ==========================================
// GENERATE 8 DIGIT ROOM CODE
// ==========================================

function generateRoomCode() {

  return Math.floor(
    10000000 +
    Math.random() * 90000000
  ).toString();

}


// ==========================================
// ROOM TIMER
// ==========================================

function startTimer() {

  stopTimer();

  remainingSeconds = 300;

  updateTimer();

  countdownInterval =
    setInterval(() => {

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
    Math.floor(
      remainingSeconds / 60
    );

  const seconds =
    remainingSeconds % 60;

  const formatted =
    minutes +
    ":" +
    seconds
      .toString()
      .padStart(2, "0");


  if (timer) {

    timer.textContent =
      formatted;

  }


  if (joinTimer) {

    joinTimer.textContent =
      formatted;

  }

}


// ==========================================
// STOP TIMER
// ==========================================

function stopTimer() {

  if (countdownInterval) {

    clearInterval(
      countdownInterval
    );

    countdownInterval = null;

  }

}


// ==========================================
// CREATE ROOM
// ==========================================

if (createRoomBtn) {

  createRoomBtn.addEventListener(
    "click",
    () => {

      roomCode =
        generateRoomCode();

      playerNumber = 1;

      roomActive = true;


      roomCodeDisplay.textContent =
        roomCode;


      createdRoom.style.display =
        "block";


      gameStartBox.style.display =
        "none";


      player1Status.textContent =
        "You";


      player2Status.textContent =
        "Waiting...";


      waitingMessage.textContent =
        "Waiting for Player 2...";


      if (roomMessage) {

        roomMessage.textContent =
          "Room created successfully!";

      }


      startTimer();

      connectToRoom();

    }
  );

}


// ==========================================
// JOIN ROOM
// ==========================================

if (joinRoomBtn) {

  joinRoomBtn.addEventListener(
    "click",
    () => {

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


      joinedRoomCode.textContent =
        roomCode;


      joinedRoom.style.display =
        "block";


      createdRoom.style.display =
        "none";


      gameStartBox.style.display =
        "none";


      joinedPlayer1Status.textContent =
        "Connecting...";


      joinedPlayer2Status.textContent =
        "You";


      joinMessage.textContent =
        "Joining room...";


      startTimer();

      connectToRoom();

    }
  );

}


// ==========================================
// WEBSOCKET
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

    socket =
      new WebSocket(wsUrl);


    socket.onopen = () => {

      console.log(
        "Room WebSocket connected"
      );


      if (playerNumber === 1) {

        waitingMessage.textContent =
          "Room created. Waiting for Player 2...";

      } else {

        joinMessage.textContent =
          "Connected. Waiting for Player 1...";

      }

    };


    socket.onmessage = (event) => {

      handleServerMessage(
        event.data
      );

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


  let message;


  try {

    message =
      JSON.parse(data);

  } catch (error) {

    message = {
      type: data
    };

  }


  if (
    message.type ===
      "player_joined" ||
    message.type ===
      "PLAYER_JOINED" ||
    message.type ===
      "join"
  ) {

    player2Joined();

    return;

  }


  if (
    message.type ===
      "game_start" ||
    message.type ===
      "GAME_START" ||
    message.type ===
      "start"
  ) {

    startGame();

    return;

  }


  if (
    message.type ===
      "room_expired" ||
    message.type ===
      "ROOM_EXPIRED"
  ) {

    expireRoom();

    return;

  }

}


// ==========================================
// PLAYER 2 JOINED
// ==========================================

function player2Joined() {

  if (player2Status) {

    player2Status.textContent =
      "Connected";

  }


  if (joinedPlayer1Status) {

    joinedPlayer1Status.textContent =
      "Connected";

  }


  if (joinedPlayer2Status) {

    joinedPlayer2Status.textContent =
      "You";

  }


  if (waitingMessage) {

    waitingMessage.textContent =
      "🎉 Player 2 Joined!";

  }


  if (joinMessage) {

    joinMessage.textContent =
      "🎉 Player 1 found. Game is ready!";

  }


  if (gameStartBox) {

    gameStartBox.style.display =
      "block";

  }

}


// ==========================================
// START GAME BUTTON
// ==========================================

if (startGameBtn) {

  startGameBtn.addEventListener(
    "click",
    () => {

      sendMessage({
        type: "game_start"
      });

      startGame();

    }
  );

}


// ==========================================
// GAME START
// ==========================================

function startGame() {

  stopTimer();

  roomActive = false;


  // Dashboard दिखाएँ
  showSection("homeSection");


  // Room section hide
  if (createdRoom) {

    createdRoom.style.display =
      "none";

  }


  if (joinedRoom) {

    joinedRoom.style.display =
      "none";

  }


  if (gameStartBox) {

    gameStartBox.style.display =
      "none";

  }


  alert(
    "🎉 Game Started!\n\n" +
    "दोनों Players Room में Connected हैं।"
  );

}


// ==========================================
// SEND WEBSOCKET MESSAGE
// ==========================================

function sendMessage(data) {

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify(data)
    );

  }

}


// ==========================================
// EXPIRE ROOM
// ==========================================

function expireRoom() {

  roomActive = false;

  stopTimer();


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


  if (createdRoom) {

    createdRoom.style.display =
      "none";

  }


  if (joinedRoom) {

    joinedRoom.style.display =
      "none";

  }


  if (gameStartBox) {

    gameStartBox.style.display =
      "none";

  }


  if (roomCodeInput) {

    roomCodeInput.value = "";

  }


  if (roomCodeDisplay) {

    roomCodeDisplay.textContent =
      "--------";

  }


  if (timer) {

    timer.textContent =
      "5:00";

  }


  if (joinTimer) {

    joinTimer.textContent =
      "5:00";

  }


  if (player1Status) {

    player1Status.textContent =
      "Waiting...";

  }


  if (player2Status) {

    player2Status.textContent =
      "Waiting...";

  }


  if (joinedPlayer1Status) {

    joinedPlayer1Status.textContent =
      "Waiting...";

  }


  if (joinedPlayer2Status) {

    joinedPlayer2Status.textContent =
      "You";

  }


  if (waitingMessage) {

    waitingMessage.textContent =
      "Waiting for Player 2...";

  }


  if (joinMessage) {

    joinMessage.textContent =
      "Connecting to room...";

  }


  if (roomMessage) {

    roomMessage.textContent =
      "Create a room or join an existing room.";

  }


  showSection("homeSection");

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

if (leaveRoomBtn) {

  leaveRoomBtn.addEventListener(
    "click",
    () => {

      if (
        confirm(
          "क्या आप Room छोड़ना चाहते हैं?"
        )
      ) {

        leaveRoom();

      }

    }
  );

}


if (joinedLeaveBtn) {

  joinedLeaveBtn.addEventListener(
    "click",
    () => {

      if (
        confirm(
          "क्या आप Room छोड़ना चाहते हैं?"
        )
      ) {

        leaveRoom();

      }

    }
  );

}


// ==========================================
// OPEN ROOM FROM PLAY
// ==========================================

function openRoom() {

  showSection(
    "roomSection"
  );

}


// ==========================================
// ADD PLAY NOW BUTTON BEHAVIOUR
// ==========================================

document
  .querySelectorAll(
    '[data-open-room="true"]'
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      openRoom
    );

  });


// ==========================================
// DEMO ADD MONEY
// ==========================================

const addMoneyBtn =
  document.getElementById(
    "addMoneyBtn"
  );


if (addMoneyBtn) {

  addMoneyBtn.addEventListener(
    "click",
    () => {

      alert(
        "💳 Demo Mode\n\n" +
        "Real-money payment अभी disabled है."
      );

    }
  );

}


// ==========================================
// DEMO WITHDRAW
// ==========================================

const withdrawBtn =
  document.getElementById(
    "withdrawBtn"
  );


if (withdrawBtn) {

  withdrawBtn.addEventListener(
    "click",
    () => {

      alert(
        "💸 Demo Mode\n\n" +
        "Real-money withdrawal अभी disabled है."
      );

    }
  );

}


// ==========================================
// PROFILE
// ==========================================

const profileName =
  document.getElementById(
    "profileName"
  );


if (profileName) {

  profileName.textContent =
    "Player";

}


// ==========================================
// INITIAL PAGE
// ==========================================

showSection("homeSection");

updateWallet();


console.log(
  "🎲 Balaji Ludo King Dashboard loaded"
);
