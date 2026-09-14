const API = "/api";

// ===============================
// ELEMENTS
// ===============================

const homeSection = document.getElementById("homeSection");
const roomSection = document.getElementById("roomSection");
const resultSection = document.getElementById("resultSection");
const moneySection = document.getElementById("moneySection");
const referSection = document.getElementById("referSection");
const supportSection = document.getElementById("supportSection");
const profileSection = document.getElementById("profileSection");

const openRoomBtn = document.getElementById("openRoomBtn");

const createRoomCard = document.getElementById("createRoomCard");
const createRoomCodeInput = document.getElementById("createRoomCodeInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const createMessage = document.getElementById("createMessage");

const createdRoom = document.getElementById("createdRoom");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const player1Status = document.getElementById("player1Status");
const player2Status = document.getElementById("player2Status");
const waitingMessage = document.getElementById("waitingMessage");
const createTimer = document.getElementById("createTimer");
const copyRoomBtn = document.getElementById("copyRoomBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");

const joinSection = document.getElementById("joinSection");
const roomCodeInput = document.getElementById("roomCodeInput");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const joinMessage = document.getElementById("joinMessage");

const joinedRoom = document.getElementById("joinedRoom");
const joinedRoomCode = document.getElementById("joinedRoomCode");
const joinedPlayer1Status = document.getElementById("joinedPlayer1Status");
const joinedPlayer2Status = document.getElementById("joinedPlayer2Status");
const joinTimer = document.getElementById("joinTimer");
const joinWaitingMessage = document.getElementById("joinWaitingMessage");
const joinedLeaveBtn = document.getElementById("joinedLeaveBtn");

const gameStartBox = document.getElementById("gameStartBox");
const openLudoKingBtn = document.getElementById("openLudoKingBtn");
const playedGameBtn = document.getElementById("playedGameBtn");

const resultRoomCode = document.getElementById("resultRoomCode");
const resultScreenshot = document.getElementById("resultScreenshot");
const fileName = document.getElementById("fileName");
const submitResultBtn = document.getElementById("submitResultBtn");
const resultMessage = document.getElementById("resultMessage");

// ===============================
// USER / ROOM DATA
// ===============================

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

let roomExpiryInProgress = false;

const ROOM_WAIT_SECONDS = 5 * 60;

// ===============================
// BASIC HELPERS
// ===============================

function hideAllSections() {
  const sections = [
    homeSection,
    roomSection,
    resultSection,
    moneySection,
    referSection,
    supportSection,
    profileSection
  ];

  sections.forEach((section) => {
    if (section) {
      section.style.display = "none";
    }
  });
}

function showSection(section) {
  hideAllSections();

  if (section) {
    section.style.display = "block";
  }
}

function setMessage(element, text, type = "") {
  if (!element) return;

  element.textContent = text;

  element.classList.remove(
    "success",
    "error",
    "warning"
  );

  if (type) {
    element.classList.add(type);
  }
}

function saveRoomData(roomCode, number) {
  currentRoomCode = roomCode;

  playerNumber = Number(number);

  localStorage.setItem(
    "balaji_room_code",
    currentRoomCode
  );

  localStorage.setItem(
    "balaji_player_number",
    String(playerNumber)
  );
}

function clearRoomData() {
  currentRoomCode = "";
  playerNumber = 0;

  localStorage.removeItem("balaji_room_code");
  localStorage.removeItem("balaji_player_number");
}

// ===============================
// NAVIGATION
// ===============================

document.querySelectorAll("[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-section");

    if (target) {
      showSection(document.getElementById(target));
    }
  });
});

// Common navigation button IDs
const homeBtn = document.getElementById("homeBtn");
const walletBtn = document.getElementById("walletBtn");
const referBtn = document.getElementById("referBtn");
const supportBtn = document.getElementById("supportBtn");
const profileBtn = document.getElementById("profileBtn");

if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    showSection(homeSection);
  });
}

if (walletBtn) {
  walletBtn.addEventListener("click", () => {
    showSection(moneySection);
  });
}

if (referBtn) {
  referBtn.addEventListener("click", () => {
    showSection(referSection);
  });
}

if (supportBtn) {
  supportBtn.addEventListener("click", () => {
    showSection(supportSection);
  });
}

if (profileBtn) {
  profileBtn.addEventListener("click", () => {
    showSection(profileSection);
  });
}

// ===============================
// LOGIN
// ===============================

async function checkLogin() {
  if (playerId && playerName) {
    return true;
  }

  const name = prompt(
    "Enter your name to continue"
  );

  if (!name || !name.trim()) {
    return false;
  }

  return await loginUser(name.trim());
}

async function loginUser(name) {
  try {
    const response = await fetch(
      `${API}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Login failed"
      );
    }

    playerId = data.id || data.player_id || "";

    playerName = data.name || name;

    wallet = Number(data.wallet || 0);

    if (!playerId) {
      throw new Error("Player ID not received");
    }

    localStorage.setItem(
      "balaji_player_id",
      playerId
    );

    localStorage.setItem(
      "balaji_player_name",
      playerName
    );

    updateProfile();

    return true;

  } catch (error) {
    alert(
      error.message || "Login failed"
    );

    return false;
  }
}

// ===============================
// PROFILE
// ===============================

function updateProfile() {
  const nameElements =
    document.querySelectorAll(
      "[data-player-name]"
    );

  nameElements.forEach((el) => {
    el.textContent = playerName || "Guest";
  });

  const walletElements =
    document.querySelectorAll(
      "[data-wallet]"
    );

  walletElements.forEach((el) => {
    el.textContent =
      `₹${wallet.toFixed(2)}`;
  });
}

// ===============================
// PLAY NOW
// ===============================

if (openRoomBtn) {
  openRoomBtn.addEventListener(
    "click",
    async () => {

      const loggedIn =
        await checkLogin();

      if (!loggedIn) {
        return;
      }

      showSection(roomSection);

      // Existing active room restore
      if (
        currentRoomCode &&
        (playerNumber === 1 ||
          playerNumber === 2)
      ) {
        restoreCurrentRoom();
        return;
      }

      resetRoomScreen();
    }
  );
}

// ===============================
// ROOM SCREEN RESET
// ===============================

function resetRoomScreen() {
  stopRoomPolling();
  stopRoomTimer();

  roomExpiryInProgress = false;

  if (createRoomCard) {
    createRoomCard.style.display = "block";
  }

  if (joinSection) {
    joinSection.style.display = "block";
  }

  if (createdRoom) {
    createdRoom.style.display = "none";
  }

  if (joinedRoom) {
    joinedRoom.style.display = "none";
  }

  if (gameStartBox) {
    gameStartBox.style.display = "none";
  }

  if (createRoomCodeInput) {
    createRoomCodeInput.value = "";
  }

  if (roomCodeInput) {
    roomCodeInput.value = "";
  }

  setMessage(
    createMessage,
    ""
  );

  setMessage(
    joinMessage,
    ""
  );

  if (createTimer) {
    createTimer.textContent =
      "Room waiting...";
  }

  if (joinTimer) {
    joinTimer.textContent =
      "Waiting...";
  }

  clearRoomData();
}

// ===============================
// ROOM CODE VALIDATION
// ===============================

function validRoomCode(code) {
  return /^\d{8}$/.test(
    String(code || "").trim()
  );
}

// Only numbers
function makeNumericOnly(input) {
  if (!input) return;

  input.addEventListener(
    "input",
    () => {
      input.value =
        input.value
          .replace(/\D/g, "")
          .slice(0, 8);
    }
  );
}

makeNumericOnly(createRoomCodeInput);
makeNumericOnly(roomCodeInput);

// ===============================
// CREATE ROOM
// ===============================

if (createRoomBtn) {
  createRoomBtn.addEventListener(
    "click",
    createRoom
  );
}

async function createRoom() {

  const loggedIn =
    await checkLogin();

  if (!loggedIn) return;

  const code =
    createRoomCodeInput?.value.trim() || "";

  if (!validRoomCode(code)) {
    setMessage(
      createMessage,
      "⚠️ 8-digit Room Code डालें।",
      "error"
    );
    return;
  }

  createRoomBtn.disabled = true;

  setMessage(
    createMessage,
    "Creating room..."
  );

  try {

    const response =
      await fetch(
        `${API}/rooms/create`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            room_code: code,
            player_id: playerId,
            player_name: playerName
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to create room"
      );
    }

    saveRoomData(
      code,
      1
    );

    showCreatedRoom(
      data.room || data
    );

    startRoomPolling();

  } catch (error) {

    setMessage(
      createMessage,
      `❌ ${error.message}`,
      "error"
    );

  } finally {

    createRoomBtn.disabled = false;
  }
}

// ===============================
// SHOW CREATED ROOM
// ===============================

function showCreatedRoom(room) {

  if (createRoomCard) {
    createRoomCard.style.display =
      "none";
  }

  if (joinSection) {
    joinSection.style.display =
      "none";
  }

  if (createdRoom) {
    createdRoom.style.display =
      "block";
  }

  if (joinedRoom) {
    joinedRoom.style.display =
      "none";
  }

  if (gameStartBox) {
    gameStartBox.style.display =
      "none";
  }

  if (roomCodeDisplay) {
    roomCodeDisplay.textContent =
      currentRoomCode;
  }

  if (player1Status) {
    player1Status.textContent =
      "Player 1 • Ready";
  }

  if (player2Status) {
    player2Status.textContent =
      "Player 2 • Waiting...";
  }

  if (waitingMessage) {
    waitingMessage.textContent =
      "Waiting for Player 2...";
  }

  if (
    room &&
    room.created_at
  ) {
    startRoomTimer(
      room.created_at
    );
  }
}

// ===============================
// JOIN ROOM
// ===============================

if (joinRoomBtn) {
  joinRoomBtn.addEventListener(
    "click",
    joinRoom
  );
}

async function joinRoom() {

  const loggedIn =
    await checkLogin();

  if (!loggedIn) return;

  const code =
    roomCodeInput?.value.trim() || "";

  if (!validRoomCode(code)) {
    setMessage(
      joinMessage,
      "⚠️ 8-digit Room Code डालें।",
      "error"
    );
    return;
  }

  joinRoomBtn.disabled = true;

  setMessage(
    joinMessage,
    "Joining room..."
  );

  try {

    const response =
      await fetch(
        `${API}/rooms/join`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            room_code: code,
            player_id: playerId,
            player_name: playerName
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to join room"
      );
    }

    saveRoomData(
      code,
      2
    );

    showJoinedRoom(
      data.room || data
    );

    startRoomPolling();

  } catch (error) {

    setMessage(
      joinMessage,
      `❌ ${error.message}`,
      "error"
    );

  } finally {

    joinRoomBtn.disabled = false;
  }
}

// ===============================
// SHOW JOINED ROOM
// ===============================

function showJoinedRoom(room) {

  if (createRoomCard) {
    createRoomCard.style.display =
      "none";
  }

  if (joinSection) {
    joinSection.style.display =
      "none";
  }

  if (createdRoom) {
    createdRoom.style.display =
      "none";
  }

  if (joinedRoom) {
    joinedRoom.style.display =
      "block";
  }

  if (gameStartBox) {
    gameStartBox.style.display =
      "none";
  }

  if (joinedRoomCode) {
    joinedRoomCode.textContent =
      currentRoomCode;
  }

  if (joinedPlayer1Status) {
    joinedPlayer1Status.textContent =
      "Player 1 • Ready";
  }

  if (joinedPlayer
