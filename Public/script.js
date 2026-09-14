const API = "/api";

// ================================
// ELEMENTS
// ================================

const homeSection = document.getElementById("homeSection");
const roomSection = document.getElementById("roomSection");
const moneySection = document.getElementById("moneySection");
const supportSection = document.getElementById("supportSection");
const profileSection = document.getElementById("profileSection");
const referSection = document.getElementById("referSection");
const resultSection = document.getElementById("resultSection");

const openRoomBtn = document.getElementById("openRoomBtn");

const createRoomCard = document.getElementById("createRoomCard");
const createRoomBtn = document.getElementById("createRoomBtn");
const createRoomCodeInput =
  document.getElementById("createRoomCodeInput");
const createMessage = document.getElementById("createMessage");

const joinSection = document.getElementById("joinSection");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const joinMessage = document.getElementById("joinMessage");

const createdRoom = document.getElementById("createdRoom");
const joinedRoom = document.getElementById("joinedRoom");
const gameStartBox = document.getElementById("gameStartBox");

const roomCodeDisplay =
  document.getElementById("roomCodeDisplay");
const joinedRoomCode =
  document.getElementById("joinedRoomCode");

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
const joinWaitingMessage =
  document.getElementById("joinWaitingMessage");

const leaveRoomBtn =
  document.getElementById("leaveRoomBtn");
const joinedLeaveBtn =
  document.getElementById("joinedLeaveBtn");

const copyRoomBtn =
  document.getElementById("copyRoomBtn");

const openLudoKingBtn =
  document.getElementById("openLudoKingBtn");

const playedGameBtn =
  document.getElementById("playedGameBtn");

const resultRoomCode =
  document.getElementById("resultRoomCode");

const resultScreenshot =
  document.getElementById("resultScreenshot");

const fileName =
  document.getElementById("fileName");

const submitResultBtn =
  document.getElementById("submitResultBtn");

const resultMessage =
  document.getElementById("resultMessage");

const createTimer =
  document.getElementById("createTimer");

const joinTimer =
  document.getElementById("joinTimer");

const walletBalance =
  document.getElementById("walletBalance");

const moneyBalance =
  document.getElementById("moneyBalance");

const profileName =
  document.getElementById("profileName");

const profileId =
  document.getElementById("profileId");

const profileWallet =
  document.getElementById("profileWallet");

const loginModal =
  document.getElementById("loginModal");

const playerNameInput =
  document.getElementById("playerNameInput");

const loginBtn =
  document.getElementById("loginBtn");

const loginMessage =
  document.getElementById("loginMessage");

const supportBtn =
  document.getElementById("supportBtn");


// ================================
// USER DATA
// ================================

let playerId =
  localStorage.getItem("balaji_player_id") || "";

let playerName =
  localStorage.getItem("balaji_player_name") || "";

let currentRoomCode =
  localStorage.getItem("balaji_room_code") || "";

let playerNumber =
  Number(
    localStorage.getItem("balaji_player_number") || "0"
  );

let wallet = 0;

let roomPollTimer = null;
let roomTimer = null;

const ROOM_WAIT_SECONDS = 5 * 60;


// ================================
// SECTION NAVIGATION
// ================================

function hideAllSections() {

  const sections = [
    homeSection,
    roomSection,
    moneySection,
    supportSection,
    profileSection,
    referSection,
    resultSection
  ];

  sections.forEach(section => {

    if (section) {
      section.classList.remove("active");
    }

  });

}


function showSection(sectionId) {

  hideAllSections();

  const section =
    document.getElementById(sectionId);

  if (section) {
    section.classList.add("active");
  }

  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.classList.remove("active");

      if (button.dataset.section === sectionId) {
        button.classList.add("active");
      }

    });

}


// ================================
// BOTTOM NAVIGATION
// ================================

document
  .querySelectorAll(".nav-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      showSection(button.dataset.section);

    });

  });


// ================================
// LOGIN
// ================================

function checkLogin() {

  if (!playerId || !playerName) {

    if (loginModal) {
      loginModal.style.display = "flex";
    }

    return false;
  }

  updateProfile();

  return true;
}


async function loginUser() {

  const name =
    playerNameInput.value.trim();

  if (!name) {

    if (loginMessage) {
      loginMessage.textContent =
        "कृपया अपना नाम डालें।";
    }

    return;
  }

  loginMessage.textContent =
    "Connecting...";

  loginBtn.disabled = true;

  try {

    const response =
      await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Login failed"
      );
    }

    playerId = data.id;
    playerName = data.name;

    wallet =
      Number(data.wallet_balance || 0);

    localStorage.setItem(
      "balaji_player_id",
      playerId
    );

    localStorage.setItem(
      "balaji_player_name",
      playerName
    );

    loginModal.style.display = "none";

    updateProfile();
    updateWallet();

  } catch (error) {

    loginMessage.textContent =
      error.message || "Login failed.";

  } finally {

    loginBtn.disabled = false;

  }

}


if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    loginUser
  );

}


if (playerNameInput) {

  playerNameInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        loginUser();
      }

    }
  );

}


// ================================
// PROFILE
// ================================

function updateProfile() {

  if (profileName) {
    profileName.textContent =
      playerName || "Player";
  }

  if (profileId) {
    profileId.textContent =
      playerId || "---";
  }

  if (profileWallet) {
    profileWallet.textContent =
      Number(wallet).toFixed(2);
  }

}


function updateWallet() {

  if (walletBalance) {
    walletBalance.textContent =
      Number(wallet).toFixed(2);
  }

  if (moneyBalance) {
    moneyBalance.textContent =
      Number(wallet).toFixed(2);
  }

  if (profileWallet) {
    profileWallet.textContent =
      Number(wallet).toFixed(2);
  }

}


// ================================
// OPEN ROOM
// ================================

if (openRoomBtn) {

  openRoomBtn.addEventListener(
    "click",
    () => {

      if (!checkLogin()) {
        return;
      }

      showSection("roomSection");

      resetRoomScreen();

    }
  );

}


// ================================
// RESET ROOM
// ================================

function resetRoomScreen() {

  stopRoomPolling();
  stopRoomTimer();

  if (createRoomCard) {
    createRoomCard.classList.remove("hidden");
  }

  if (joinSection) {
    joinSection.classList.remove("hidden");
  }

  if (createdRoom) {
    createdRoom.classList.add("hidden");
  }

  if (joinedRoom) {
    joinedRoom.classList.add("hidden");
  }

  if (gameStartBox) {
    gameStartBox.classList.add("hidden");
  }

  if (createRoomCodeInput) {
    createRoomCodeInput.value = "";
  }

  if (roomCodeInput) {
    roomCodeInput.value = "";
  }

  if (createTimer) {
    createTimer.textContent =
      "Room waiting...";
  }

  if (joinTimer) {
    joinTimer.textContent =
      "Waiting...";
  }

  currentRoomCode = "";
  playerNumber = 0;

  localStorage.removeItem(
    "balaji_room_code"
  );

  localStorage.removeItem(
    "balaji_player_number"
  );

}


// ================================
// ROOM CODE
// ================================

function validRoomCode(code) {
  return /^\d{8}$/.test(code);
}


// ================================
// CREATE ROOM
// ================================

if (createRoomBtn) {

  createRoomBtn.addEventListener(
    "click",
    createRoom
  );

}


async function createRoom() {

  if (!checkLogin()) {
    return;
  }

  const code =
    createRoomCodeInput.value.trim();

  if (!validRoomCode(code)) {

    createMessage.textContent =
      "कृपया पूरा 8-digit Room Code डालें।";

    return;
  }

  createRoomBtn.disabled = true;

  createMessage.textContent =
    "Room create हो रहा है...";

  try {

    const response =
      await fetch(`${API}/rooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerId,
          playerName,
          roomCode: code
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Room create नहीं हुआ।"
      );
    }

    currentRoomCode = code;
    playerNumber = 1;

    localStorage.setItem(
      "balaji_room_code",
      currentRoomCode
    );

    localStorage.setItem(
      "balaji_player_number",
      "1"
    );

    roomCodeDisplay.textContent =
      currentRoomCode;

    player1Status.textContent =
      playerName;

    player2Status.textContent =
      "Waiting...";

    waitingMessage.textContent =
      "Waiting for Player 2...";

    createRoomCard.classList.add(
      "hidden"
    );

    joinSection.classList.add(
      "hidden"
    );

    createdRoom.classList.remove(
      "hidden"
    );

    createMessage.textContent = "";

    startRoomPolling();

  } catch (error) {

    createMessage.textContent =
      error.message ||
      "Room create failed.";

  } finally {

    createRoomBtn.disabled = false;

  }

}


// ================================
// JOIN ROOM
// ================================

if (joinRoomBtn) {

  joinRoomBtn.addEventListener(
    "click",
    joinRoom
  );

}


async function joinRoom() {

  if (!checkLogin()) {
    return;
  }

  const code =
    roomCodeInput.value.trim();

  if (!validRoomCode(code)) {

    joinMessage.textContent =
      "कृपया 8-digit Room Code डालें।";

    return;
  }

  joinRoomBtn.disabled = true;

  joinMessage.textContent =
    "Room check हो रहा है...";

  try {

    const response =
      await fetch(`${API}/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerId,
          playerName,
          roomCode: code
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Room join नहीं हुआ।"
      );
    }

    currentRoomCode = code;
    playerNumber = 2;

    localStorage.setItem(
      "balaji_room_code",
      currentRoomCode
    );

    localStorage.setItem(
      "balaji_player_number",
      "2"
    );

    joinedRoomCode.textContent =
      currentRoomCode;

    joinedPlayer1Status.textContent =
      "Connected";

    joinedPlayer2Status.textContent =
      playerName;

    joinWaitingMessage.textContent =
      "Room joined successfully.";

    createRoomCard.classList.add(
      "hidden"
    );

    joinSection.classList.add(
      "hidden"
    );

    joinedRoom.classList.remove(
      "hidden"
    );

    joinMessage.textContent = "";

    startRoomPolling();

  } catch (error) {

    joinMessage.textContent =
      error.message ||
      "Room join failed.";

  } finally {

    joinRoomBtn.disabled = false;

  }

}


// ================================
// ROOM POLLING
// ================================

function startRoomPolling() {

  stopRoomPolling();

  checkRoomStatus();

  roomPollTimer =
    setInterval(
      checkRoomStatus,
      3000
    );

}


function stopRoomPolling() {

  if (roomPollTimer) {

    clearInterval(roomPollTimer);

    roomPollTimer = null;

  }

}


// ================================
// 5 MINUTE ROOM TIMER
// ================================

function stopRoomTimer() {

  if (roomTimer) {

    clearInterval(roomTimer);

    roomTimer = null;

  }

}


function startRoomTimer(createdAt) {

  stopRoomTimer();

  updateRoomTimer(createdAt);

  roomTimer =
    setInterval(() => {

      updateRoomTimer(createdAt);

    }, 1000);

}


function updateRoomTimer(createdAt) {

  const elapsed =
    Math.floor(
      (Date.now() -
        Number(createdAt)) /
      1000
    );

  const remaining =
    ROOM_WAIT_SECONDS -
    elapsed;

  if (remaining <= 0) {

    if (createTimer) {
      createTimer.textContent =
        "⏰ 5 मिनट पूरे हो गए।";
    }

    if (joinTimer) {
      joinTimer.textContent =
        "⏰ 5 मिनट पूरे हो गए।";
    }

    stopRoomTimer();

    expireRoom();

    return;
  }

  const minutes =
    Math.floor(
      remaining / 60
    );

  const seconds =
    remaining % 60;

  const text =
    `⏳ Room Time Left: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (createTimer) {
    createTimer.textContent =
      text;
  }

  if (joinTimer) {
    joinTimer.textContent =
      text;
  }

}


// ================================
// EXPIRE ROOM
// ================================

async function expireRoom() {

  stopRoomTimer();
  stopRoomPolling();

  if (!currentRoomCode || !playerId) {

    resetRoomScreen();
    showSection("roomSection");

    return;
  }

  try {

    await fetch(
      `${API}/rooms/cancel`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          playerId,
          roomCode: currentRoomCode
        })
      }
    );

  } catch (error) {

    console.log(
      "Room expiry error:",
      error
    );

  }

  resetRoomScreen();

  showSection(
    "roomSection"
  );

  if (createMessage) {

    createMessage.textContent =
      "⏰ 5 मिनट पूरे हो गए। Room बंद हो गया।";

  }

  if (joinMessage) {

    joinMessage.textContent =
      "⏰ 5 मिनट पूरे हो गए। Room बंद हो गया।";

  }

}


// ================================
// CHECK ROOM STATUS
// ================================

async function checkRoomStatus() {

  if (!currentRoomCode) {
    return;
  }

  try {

    const response =
      await fetch(
        `${API}/rooms/${currentRoomCode}`
      );

    const room =
      await response.json();

    if (!response.ok) {
      return;
    }

    // 5 minute timer
    if (
      room.status === "WAITING" &&
      !room.player2_id
    ) {

      startRoomTimer(
        room.created_at
      );

    } else {

      stopRoomTimer();

    }

    updateRoomStatus(room);

  } catch (error) {

    console.log(
      "Room status error:",
      error
    );

  }

}


// ================================
// UPDATE ROOM STATUS
// ================================

function updateRoomStatus(room) {

  if (!room) {
    return;
  }

  if (room.player2_id) {

    stopRoomTimer();

    if (playerNumber === 1) {

      player2Status.textContent =
        room.player2_name ||
        "Player 2 Connected";

      waitingMessage.textContent =
        "🎉 Player 2 joined!";

    }

    if (playerNumber === 2) {

      joinedPlayer1Status.textContent =
        room.player1_name ||
        "Player 1";

      joinedPlayer2Status.textContent =
        playerName;

      joinWaitingMessage.textContent =
        "🎉 Both Players Ready!";

    }

    showReadyBox();

  }

  if (
    room.status ===
    "RESULT_SUBMITTED"
  ) {

    stopRoomPolling();
    stopRoomTimer();

  }

}


// ================================
// READY BOX
// ================================

function showReadyBox() {

  stopRoomTimer();
  stopRoomPolling();

  if (createdRoom) {
    createdRoom.classList.add("hidden");
  }

  if (joinedRoom) {
    joinedRoom.classList.add("hidden");
  }

  if (gameStartBox) {
    gameStartBox.classList.remove("hidden");
  }

  if (resultRoomCode) {
    resultRoomCode.textContent =
      currentRoomCode;
  }

}


// ================================
// COPY ROOM CODE
// ================================

if (copyRoomBtn) {

  copyRoomBtn.addEventListener(
    "click",
    async () => {

      if (!currentRoomCode) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          currentRoomCode
        );

        copyRoomBtn.textContent =
          "✅ Copied";

        setTimeout(() => {

          copyRoomBtn.textContent =
            "📋 Copy Room Code";

        }, 1500);

      } catch (error) {

        alert(
          "Room Code: " +
          currentRoomCode
        );

      }

    }
  );

}


// ================================
// OPEN LUDO KING
// ================================

if (openLudoKingBtn) {

  openLudoKingBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "ludoking://";

      setTimeout(() => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          window.open(
            "https://www.ludoking.com/",
            "_blank"
          );

        }

      }, 1200);

    }
  );

}


// ================================
// PLAYED GAME
// ================================

if (playedGameBtn) {

  playedGameBtn.addEventListener(
    "click",
    () => {

      if (!currentRoomCode) {

        alert(
          "पहले Room Join/Create करें।"
        );

        return;

      }

      if (resultRoomCode) {

        resultRoomCode.textContent =
          currentRoomCode;

      }

      showSection(
        "resultSection"
      );

    }
  );

}


// ================================
// FILE TO BASE64
// ================================

function fileToBase64(file) {

  return new Promise
