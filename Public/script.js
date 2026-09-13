// ==========================================
// BALAJI LUDO KING
// 2 PLAYER CLASSIC LUDO
// ==========================================

const homeSection = document.getElementById("homeSection");
const roomSection = document.getElementById("roomSection");
const moneySection = document.getElementById("moneySection");
const supportSection = document.getElementById("supportSection");
const profileSection = document.getElementById("profileSection");
const referSection = document.getElementById("referSection");

const openRoomBtn = document.getElementById("openRoomBtn");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const roomCodeInput = document.getElementById("roomCodeInput");

const createdRoom = document.getElementById("createdRoom");
const joinedRoom = document.getElementById("joinedRoom");
const gameStartBox = document.getElementById("gameStartBox");

const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const joinedRoomCode = document.getElementById("joinedRoomCode");

const timer = document.getElementById("timer");
const joinTimer = document.getElementById("joinTimer");

const player1Status = document.getElementById("player1Status");
const player2Status = document.getElementById("player2Status");

const joinedPlayer1Status =
  document.getElementById("joinedPlayer1Status");

const joinedPlayer2Status =
  document.getElementById("joinedPlayer2Status");

const waitingMessage =
  document.getElementById("waitingMessage");

const joinMessage =
  document.getElementById("joinMessage");

const leaveRoomBtn =
  document.getElementById("leaveRoomBtn");

const joinedLeaveBtn =
  document.getElementById("joinedLeaveBtn");

const startGameBtn =
  document.getElementById("startGameBtn");

const createBattleBtn =
  document.getElementById("createBattleBtn");

const battleAmount =
  document.getElementById("battleAmount");

const walletBalanceElement =
  document.getElementById("walletBalance");

const moneyBalanceElement =
  document.getElementById("moneyBalance");

const balancePopup =
  document.getElementById("balancePopup");

const balanceOkBtn =
  document.getElementById("balanceOkBtn");


// ==========================================
// GAME VARIABLES
// ==========================================

let socket = null;

let currentRoomCode = null;

let playerName = "Player";

let playerNumber = null;

let timerInterval = null;

let secondsLeft = 300;

let gameStarted = false;

let walletBalance = 0;

let incomeBalance = 50;


// ==========================================
// SECTION NAVIGATION
// ==========================================

function hideAllSections() {

  const sections = [
    homeSection,
    roomSection,
    moneySection,
    supportSection,
    profileSection,
    referSection
  ];

  sections.forEach(section => {

    if (section) {
      section.style.display = "none";
    }

  });

}


function showSection(sectionId) {

  hideAllSections();

  const section =
    document.getElementById(sectionId);

  if (section) {
    section.style.display = "block";
  }


  document.querySelectorAll(".nav-btn")
    .forEach(btn => {

      btn.classList.remove("active");

      if (btn.dataset.section === sectionId) {
        btn.classList.add("active");
      }

    });

}


// ==========================================
// BOTTOM NAVIGATION
// ==========================================

document.querySelectorAll(".nav-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const section =
        button.dataset.section;

      showSection(section);

    });

  });


// ==========================================
// OPEN ROOM FROM PLAY BUTTON
// ==========================================

function openRoom() {

  showSection("roomSection");

  resetRoomUI();

}


if (openRoomBtn) {

  openRoomBtn.addEventListener(
    "click",
    openRoom
  );

}


document.querySelectorAll(
  '[data-open-room="true"]'
).forEach(button => {

  button.addEventListener(
    "click",
    openRoom
  );

});


// ==========================================
// WALLET
// ==========================================

function updateWallet() {

  if (walletBalanceElement) {

    walletBalanceElement.textContent =
      walletBalance.toFixed(2);

  }


  if (moneyBalanceElement) {

    moneyBalanceElement.textContent =
      walletBalance.toFixed(2);

  }

}


updateWallet();


// ==========================================
// BALANCE POPUP
// ==========================================

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


if (balancePopup) {

  balancePopup.addEventListener(
    "click",
    event => {

      if (event.target === balancePopup) {
        hideBalancePopup();
      }

    }
  );

}


// ==========================================
// CREATE BATTLE
// ==========================================

if (createBattleBtn) {

  createBattleBtn.addEventListener(
    "click",
    () => {

      const amount =
        Number(battleAmount.value);

      if (!amount || amount < 50) {

        alert(
          "Minimum play amount ₹50 है।"
        );

        return;

      }


      if (walletBalance < amount) {

        showBalancePopup();

        return;

      }


      alert(
        "Demo Mode: Battle system अभी तैयार किया जा रहा है।"
      );

    }
  );

}


// ==========================================
// OPEN BATTLE PLAY BUTTONS
// ==========================================

document.querySelectorAll(
  ".play-battle"
).forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const amount =
        Number(button.dataset.amount);

      if (walletBalance < amount) {

        showBalancePopup();

        return;

      }


      alert(
        "Demo Mode: Battle join system अभी तैयार किया जा रहा है।"
      );

    }
  );

});


// ==========================================
// ROOM CODE GENERATOR
// ==========================================

function generateRoomCode() {

  return Math.floor(
    10000000 +
    Math.random() * 90000000
  ).toString();

}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

  clearInterval(timerInterval);

  secondsLeft = 300;

  updateTimer();

  timerInterval =
    setInterval(() => {

      secondsLeft--;

      updateTimer();


      if (secondsLeft <= 0) {

        clearInterval(timerInterval);

        expireRoom();

      }

    }, 1000);

}


function updateTimer() {

  const minutes =
    Math.floor(secondsLeft / 60);

  const seconds =
    secondsLeft % 60;

  const text =
    `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;


  if (timer) {
    timer.textContent = text;
  }


  if (joinTimer) {
    joinTimer.textContent = text;
  }

}


// ==========================================
// ROOM EXPIRE
// ==========================================

function expireRoom() {

  clearInterval(timerInterval);

  if (socket) {

    try {
      socket.close();
    } catch (error) {}

    socket = null;

  }


  alert(
    "⚠️ Room Expired!\n5 मिनट में दूसरा Player Join नहीं हुआ।"
  );

  resetRoomUI();

  showSection("roomSection");

}


// ==========================================
// RESET ROOM UI
// ==========================================

function resetRoomUI() {

  clearInterval(timerInterval);

  secondsLeft = 300;

  updateTimer();


  if (createdRoom) {
    createdRoom.style.display = "none";
  }


  if (joinedRoom) {
    joinedRoom.style.display = "none";
  }


  if (gameStartBox) {
    gameStartBox.style.display = "none";
  }


  if (createRoomBtn) {
    createRoomBtn.style.display = "block";
  }


  const joinSection =
    document.getElementById("joinSection");

  if (joinSection) {
    joinSection.style.display = "block";
  }


  if (roomCodeInput) {
    roomCodeInput.value = "";
  }


  currentRoomCode = null;

  playerNumber = null;

  gameStarted = false;

}


// ==========================================
// CREATE ROOM
// ==========================================

if (createRoomBtn) {

  createRoomBtn.addEventListener(
    "click",
    createRoom
  );

}


function createRoom() {

  if (currentRoomCode) {
    return;
  }


  currentRoomCode =
    generateRoomCode();

  playerNumber = 1;


  roomCodeDisplay.textContent =
    currentRoomCode;


  if (createdRoom) {
    createdRoom.style.display =
      "block";
  }


  if (createRoomBtn) {
    createRoomBtn.style.display =
      "none";
  }


  if (player1Status) {
    player1Status.textContent =
      "You";
  }


  if (player2Status) {
    player2Status.textContent =
      "Waiting...";
  }


  if (waitingMessage) {
    waitingMessage.textContent =
      "Waiting for Player 2...";
  }


  const joinSection =
    document.getElementById("joinSection");

  if (joinSection) {
    joinSection.style.display =
      "none";
  }


  startTimer();


  connectToRoom(
    currentRoomCode,
    playerName,
    1
  );

}


// ==========================================
// JOIN ROOM
// ==========================================

if (joinRoomBtn) {

  joinRoomBtn.addEventListener(
    "click",
    joinRoom
  );

}


function joinRoom() {

  const code =
    roomCodeInput.value.trim();


  if (!/^\d{8}$/.test(code)) {

    alert(
      "कृपया 8-Digit Room Code डालें।"
    );

    return;

  }


  currentRoomCode = code;

  playerNumber = 2;


  joinedRoomCode.textContent =
    code;


  if (joinedRoom) {
    joinedRoom.style.display =
      "block";
  }


  const joinSection =
    document.getElementById("joinSection");

  if (joinSection) {
    joinSection.style.display =
      "none";
  }


  if (createRoomBtn) {
    createRoomBtn.style.display =
      "none";
  }


  if (joinedMessageSafe()) {

    joinedPlayer1Status.textContent =
      "Connected";

    joinedPlayer2Status.textContent =
      "You";

  }


  if (joinMessage) {

    joinMessage.textContent =
      "Connecting to Player 1...";

  }


  startTimer();


  connectToRoom(
    currentRoomCode,
    playerName,
    2
  );

}


function joinedMessageSafe() {

  return (
    joinedPlayer1Status &&
    joinedPlayer2Status
  );

}


// ==========================================
// WEBSOCKET
// ==========================================

function connectToRoom(
  room,
  name,
  number
) {

  if (socket) {

    try {
      socket.close();
    } catch (error) {}

  }


  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";


  const wsUrl =
    `${protocol}//${location.host}/ws` +
    `?room=${encodeURIComponent(room)}` +
    `&name=${encodeURIComponent(name)}` +
    `&player=${number}`;


  try {

    socket =
      new WebSocket(wsUrl);


    socket.onopen = () => {

      console.log(
        "Connected to room:",
        room
      );


      if (playerNumber === 1) {

        if (waitingMessage) {

          waitingMessage.textContent =
            "Room ready. Waiting for Player 2...";

        }

      } else {

        if (joinMessage) {

          joinMessage.textContent =
            "Connected. Waiting for game start...";

        }

      }

    };


    socket.onmessage = event => {

      try {

        const data =
          JSON.parse(event.data);

        handleServerMessage(data);

      } catch (error) {

        console.log(
          "Server message:",
          event.data
        );

      }

    };


    socket.onerror = error => {

      console.log(
        "WebSocket error:",
        error
      );

    };


    socket.onclose = () => {

      console.log(
        "Room connection closed"
      );

    };

  } catch (error) {

    console.log(
      "WebSocket unavailable:",
      error
    );

  }

}


// ==========================================
// SERVER MESSAGES
// ==========================================

function handleServerMessage(data) {

  if (!data) {
    return;
  }


  switch (data.type) {


    case "player_joined":

      player2Joined(
        data.name || "Player 2"
      );

      break;


    case "game_start":

      showGameReady();

      break;


    case "room_expired":

      expireRoom();

      break;


    default:

      console.log(
        "Unknown server message:",
        data
      );

  }

}


// ==========================================
// PLAYER 2 JOINED
// ==========================================

function player2Joined(name) {

  if (playerNumber === 1) {

    if (player2Status) {

      player2Status.textContent =
        name + " Connected";

    }


    if (waitingMessage) {

      waitingMessage.textContent =
        "🎉 Player 2 joined!";

    }

  }


  if (playerNumber === 2) {

    if (joinedPlayer1Status) {

      joinedPlayer1Status.textContent =
        "Connected";

    }


    if (joinMessage) {

      joinMessage.textContent =
        "🎉 Player 1 is connected!";

    }

  }


  showGameReady();

}


// ==========================================
// GAME READY
// ==========================================

function showGameReady() {

  clearInterval(timerInterval);


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
      "block";

  }

}


// ==========================================
// START GAME
// ==========================================

if (startGameBtn) {

  startGameBtn.addEventListener(
    "click",
    startGame
  );

}


function startGame() {

  if (gameStarted) {
    return;
  }


  gameStarted = true;

  clearInterval(timerInterval);


  if (socket &&
      socket.readyState === WebSocket.OPEN) {

    socket.send(
      JSON.stringify({
        type: "start_game",
        room: currentRoomCode
      })
    );

  }


  openLudoGame();

}


// ==========================================
// LUDO GAME SCREEN
// ==========================================

function openLudoGame() {

  hideAllSections();


  let oldGame =
    document.getElementById(
      "ludoGameSection"
    );


  if (oldGame) {
    oldGame.remove();
  }


  const game =
    document.createElement("section");

  game.id =
    "ludoGameSection";

  game.className =
    "section ludo-game";


  game.innerHTML = `

    <div class="card">

      <h2>🎲 Balaji Ludo King</h2>

      <p class="game-status">
        Classic 2 Player Game
      </p>


      <div class="game-players">

        <div class="game-player player-one">
          🔴 Player 1
          <span>Ready</span>
        </div>

        <div class="game-player player-two">
          🟢 Player 2
          <span>Ready</span>
        </div>

      </div>


      <!-- LUDO BOARD -->
