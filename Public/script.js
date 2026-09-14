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
// DATA
// ===============================

let playerId =
  localStorage.getItem("balaji_player_id") || "";

let playerName =
  localStorage.getItem("balaji_player_name") || "";

let currentRoomCode =
  localStorage.getItem("balaji_room_code") || "";

let playerNumber = Number(
  localStorage.getItem("balaji_player_number") || "0"
);

let wallet = 0;

let roomPollTimer = null;
let roomTimer = null;
let roomExpiryInProgress = false;

const ROOM_WAIT_SECONDS = 5 * 60;

// ===============================
// HELPERS
// ===============================

function hideAllSections() {
  [
    homeSection,
    roomSection,
    resultSection,
    moneySection,
    referSection,
    supportSection,
    profileSection
  ].forEach((section) => {
    if (section) section.style.display = "none";
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

function saveRoomData(code, number) {
  currentRoomCode = code;
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

document
  .querySelectorAll("[data-section]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const target =
        button.getAttribute("data-section");

      if (target) {
        showSection(
          document.getElementById(target)
        );
      }
    });
  });

const homeBtn =
  document.getElementById("homeBtn");

const walletBtn =
  document.getElementById("walletBtn");

const referBtn =
  document.getElementById("referBtn");

const supportBtn =
  document.getElementById("supportBtn");

const profileBtn =
  document.getElementById("profileBtn");

if (homeBtn) {
  homeBtn.onclick = () =>
    showSection(homeSection);
}

if (walletBtn) {
  walletBtn.onclick = () =>
    showSection(moneySection);
}

if (referBtn) {
  referBtn.onclick = () =>
    showSection(referSection);
}

if (supportBtn) {
  supportBtn.onclick = () =>
    showSection(supportSection);
}

if (profileBtn) {
  profileBtn.onclick = () =>
    showSection(profileSection);
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

  return loginUser(name.trim());
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
        body: JSON.stringify({ name })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Login failed"
      );
    }

    playerId =
      data.id ||
      data.player_id ||
      "";

    playerName =
      data.name ||
      name;

    wallet =
      Number(data.wallet || 0);

    if (!playerId) {
      throw new Error(
        "Player ID not received"
      );
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
      error.message ||
      "Login failed"
    );

    return false;
  }
}

// ===============================
// PROFILE
// ===============================

function updateProfile() {
  document
    .querySelectorAll("[data-player-name]")
    .forEach((element) => {
      element.textContent =
        playerName || "Guest";
    });

  document
    .querySelectorAll("[data-wallet]")
    .forEach((element) => {
      element.textContent =
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

      if (!loggedIn) return;

      showSection(roomSection);

      if (
        currentRoomCode &&
        (
          playerNumber === 1 ||
          playerNumber === 2
        )
      ) {
        restoreCurrentRoom();
        return;
      }

      resetRoomScreen();
    }
  );
}

// ===============================
// RESET ROOM
// ===============================

function resetRoomScreen() {
  stopRoomPolling();
  stopRoomTimer();

  roomExpiryInProgress = false;

  if (createRoomCard)
    createRoomCard.style.display = "block";

  if (joinSection)
    joinSection.style.display = "block";

  if (createdRoom)
    createdRoom.style.display = "none";

  if (joinedRoom)
    joinedRoom.style.display = "none";

  if (gameStartBox)
    gameStartBox.style.display = "none";

  if (createRoomCodeInput)
    createRoomCodeInput.value = "";

  if (roomCodeInput)
    roomCodeInput.value = "";

  setMessage(createMessage, "");
  setMessage(joinMessage, "");

  if (createTimer)
    createTimer.textContent =
      "Room waiting...";

  if (joinTimer)
    joinTimer.textContent =
      "Waiting...";

  clearRoomData();
}

// ===============================
// CODE VALIDATION
// ===============================

function validRoomCode(code) {
  return /^\d{8}$/.test(
    String(code || "").trim()
  );
}

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

makeNumericOnly(
  createRoomCodeInput
);

makeNumericOnly(
  roomCodeInput
);

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
    createRoomCodeInput?.value.trim() ||
    "";

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

    saveRoomData(code, 1);

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
// CREATED ROOM
// ===============================

function showCreatedRoom(room) {
  if (createRoomCard)
    createRoomCard.style.display = "none";

  if (joinSection)
    joinSection.style.display = "none";

  if (createdRoom)
    createdRoom.style.display = "block";

  if (joinedRoom)
    joinedRoom.style.display = "none";

  if (gameStartBox)
    gameStartBox.style.display = "none";

  if (roomCodeDisplay)
    roomCodeDisplay.textContent =
      currentRoomCode;

  if (player1Status)
    player1Status.textContent =
      "Player 1 • Ready";

  if (player2Status)
    player2Status.textContent =
      "Player 2 • Waiting...";

  if (waitingMessage)
    waitingMessage.textContent =
      "Waiting for Player 2...";

  if (room?.created_at) {
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
    roomCodeInput?.value.trim() ||
    "";

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

    saveRoomData(code, 2);

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
// JOINED ROOM
// ===============================

function showJoinedRoom(room) {
  if (createRoomCard)
    createRoomCard.style.display = "none";

  if (joinSection)
    joinSection.style.display = "none";

  if (createdRoom)
    createdRoom.style.display = "none";

  if (joinedRoom)
    joinedRoom.style.display = "block";

  if (gameStartBox)
    gameStartBox.style.display = "none";

  if (joinedRoomCode)
    joinedRoomCode.textContent =
      currentRoomCode;

  if (joinedPlayer1Status)
    joinedPlayer1Status.textContent =
      "Player 1 • Ready";

  if (joinedPlayer2Status)
    joinedPlayer2Status.textContent =
      "Player 2 • Ready";

  if (joinWaitingMessage)
    joinWaitingMessage.textContent =
      "Room joined successfully.";

  if (room?.player2_id) {
    showReadyBox(room);
  }
}

// ===============================
// POLLING
// ===============================

function startRoomPolling() {
  stopRoomPolling();

  if (!currentRoomCode) return;

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

// ===============================
// TIMER
// ===============================

function stopRoomTimer() {
  if (roomTimer) {
    clearInterval(roomTimer);
    roomTimer = null;
  }
}

function updateRoomTimer(createdAt) {
  const elapsed =
    Math.floor(
      (
        Date.now() -
        Number(createdAt)
      ) / 1000
    );

  const remaining =
    ROOM_WAIT_SECONDS -
    elapsed;

  if (remaining <= 0) {

    if (createTimer)
      createTimer.textContent =
        "⏰ 5 मिनट पूरे हो गए।";

    if (joinTimer)
      joinTimer.textContent =
        "⏰ 5 मिनट पूरे हो गए।";

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

  if (createTimer)
    createTimer.textContent = text;

  if (joinTimer)
    joinTimer.textContent = text;
}

function startRoomTimer(createdAt) {
  if (!createdAt) return;

  stopRoomTimer();

  updateRoomTimer(createdAt);

  roomTimer =
    setInterval(
      () => {
        updateRoomTimer(
          createdAt
        );
      },
      1000
    );
}

// ===============================
// EXPIRE ROOM
// ===============================

async function expireRoom() {
  if (roomExpiryInProgress)
    return;

  if (!currentRoomCode)
    return;

  roomExpiryInProgress = true;

  const code =
    currentRoomCode;

  try {
    await fetch(
      `${API}/rooms/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          room_code: code,
          player_id: playerId
        })
      }
    );
  } catch (error) {
    console.log(
      "Expire error:",
      error
    );
  }

  stopRoomPolling();
  stopRoomTimer();
  clearRoomData();

  if (createdRoom)
    createdRoom.style.display = "none";

  if (joinedRoom)
    joinedRoom.style.display = "none";

  if (gameStartBox)
    gameStartBox.style.display = "none";

  if (createRoomCard)
    createRoomCard.style.display = "block";

  if (joinSection)
    joinSection.style.display = "block";

  setMessage(
    createMessage,
    "⏰ Room 5 मिनट में expire हो गया।",
    "warning"
  );

  setMessage(
    joinMessage,
    "⏰ Room 5 मिनट में expire हो गया।",
    "warning"
  );

  roomExpiryInProgress = false;
}

// ===============================
// ROOM STATUS
// ===============================

async function checkRoomStatus() {
  if (!currentRoomCode)
    return;

  try {
    const response =
      await fetch(
        `${API}/rooms/${encodeURIComponent(
          currentRoomCode
        )}`,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {

      if (response.status === 404) {
        stopRoomPolling();
        stopRoomTimer();
        clearRoomData();

        showSection(roomSection);

        if (createRoomCard)
          createRoomCard.style.display =
            "block";

        if (joinSection)
          joinSection.style.display =
            "block";

        if (createdRoom)
          createdRoom.style.display =
            "none";

        if (joinedRoom)
          joinedRoom.style.display =
            "none";

        setMessage(
          createMessage,
          "⚠️ Room नहीं मिला या expire हो गया।",
          "error"
        );

        return;
      }

      throw new Error(
        "Room status failed"
      );
    }

    const room =
      await response.json();

    if (
      room.status === "WAITING" &&
      !room.player2_id
    ) {
      if (room.created_at) {
        startRoomTimer(
          room.created_at
        );
      }
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

// ===============================
// UPDATE STATUS
// ===============================

function updateRoomStatus(room) {
  if (!room) return;

  if (playerNumber === 1) {

    if (player1Status)
      player1Status.textContent =
        "Player 1 • Ready";

    if (player2Status)
      player2Status.textContent =
        room.player2_id
          ? "Player 2 • Ready"
          : "Player 2 • Waiting...";

    if (waitingMessage)
      waitingMessage.textContent =
        room.player2_id
          ? "Both players are ready!"
          : "Waiting for Player 2...";
  }

  if (playerNumber === 2) {

    if (joinedPlayer1Status)
      joinedPlayer1Status.textContent =
        room.player1_id
          ? "Player 1 • Ready"
          : "Player 1 • Waiting...";

    if (joinedPlayer2Status)
      joinedPlayer2Status.textContent =
        "Player 2 • Ready";

    if (joinWaitingMessage)
      joinWaitingMessage.textContent =
        "Both players are ready!";
  }

  if (
    room.player2_id ||
    room.status === "READY"
  ) {
    showReadyBox(room);
  }

  if (
    room.status === "RESULT_SUBMITTED"
  ) {
    stopRoomPolling();
    stopRoomTimer();
  }
}

// ===============================
// READY BOX
// ===============================

function showReadyBox(room) {
  stopRoomTimer();
  stopRoomPolling();

  if (createdRoom)
    createdRoom.style.display = "none";

  if (joinedRoom)
    joinedRoom.style.display = "none";

  if (gameStartBox)
    gameStartBox.style.display = "block";

  if (resultRoomCode)
    resultRoomCode.textContent =
      currentRoomCode;
}

// ===============================
// COPY ROOM
// ===============================

if (copyRoomBtn) {
  copyRoomBtn.addEventListener(
    "click",
    async () => {

      if (!currentRoomCode)
        return;

      try {
        await navigator.clipboard.writeText(
          currentRoomCode
        );

        copyRoomBtn.textContent =
          "✅ Copied";

        setTimeout(() => {
          copyRoomBtn.textContent =
            "Copy Room Code";
        }, 1500);

      } catch (error) {
        alert(
          `Room Code: ${currentRoomCode}`
        );
      }
    }
  );
}

// ===============================
// OPEN LUDO KING
// ===============================

if (openLudoKingBtn) {
  openLudoKingBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "ludoking://";

      setTimeout(() => {
        window.open(
          "https://www.ludoking.com/",
          "_blank"
        );
      }, 1200);
    }
  );
}

// ===============================
// PLAYED GAME
// ===============================

if (playedGameBtn) {
  playedGameBtn.addEventListener(
    "click",
    () => {

      showSection(
        resultSection
      );

      if (resultRoomCode)
        resultRoomCode.textContent =
          currentRoomCode;
    }
  );
}

// ===============================
// FILE TO BASE64
// ===============================

function fileToBase64(file) {
  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = () =>
        reject(
          new Error(
            "File read failed"
          )
        );

      reader.readAsDataURL(file);
    }
  );
}

// ===============================
// SCREENSHOT AUTO UPLOAD
// ===============================

if (resultScreenshot) {
  resultScreenshot.addEventListener(
    "change",
    async () => {

      const file =
        resultScreenshot.files?.[0];

      if (!file)
        return;

      if (
        !file.type.startsWith("image/")
      ) {
        setMessage(
          resultMessage,
          "❌ केवल image screenshot चुनें।",
          "error"
        );

        resultScreenshot.value = "";
        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setMessage(
          resultMessage,
          "❌ Screenshot 5 MB से छोटा होना चाहिए।",
          "error"
        );

        resultScreenshot.value = "";
        return;
      }

      if (fileName)
        fileName.textContent =
          file.name;

      setMessage(
        resultMessage,
        "📤 Screenshot upload हो रहा है..."
      );

      await submitResult(file);
    }
  );
}

// ===============================
// MANUAL RETRY
// ===============================

if (submitResultBtn) {
  submitResultBtn.addEventListener(
    "click",
    async () => {

      const file =
        resultScreenshot?.files?.[0];

      if (!file) {
        setMessage(
          resultMessage,
          "⚠️ पहले screenshot चुनें।",
          "warning"
        );
        return;
      }

      await submitResult(file);
    }
  );
}

// ===============================
// SUBMIT RESULT
// ===============================

async function submitResult(file) {

  if (!playerId) {
    setMessage(
      resultMessage,
      "❌ Player login नहीं है।",
      "error"
    );
    return;
  }

  if (!currentRoomCode) {
    setMessage(
      resultMessage,
      "❌ कोई active room नहीं है।",
      "error"
    );
    return;
  }

  if (!file) {
    setMessage(
      resultMessage,
      "⚠️ Screenshot चुनें।",
      "warning"
    );
    return;
  }

  if (
    !file.type.startsWith("image/")
  ) {
    setMessage(
      resultMessage,
      "❌ केवल image screenshot allowed है।",
      "error"
    );
    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    setMessage(
      resultMessage,
      "❌ Screenshot 5 MB से बड़ा है।",
      "error"
    );
    return;
  }

  if (submitResultBtn) {
    submitResultBtn.disabled = true;
    submitResultBtn.textContent =
      "Uploading...";
  }

  try {

    const base64 =
      await fileToBase64(file);

    const response =
      await fetch(
        `${API}/rooms/result`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            room_code:
              currentRoomCode,
            player_id:
              playerId,
            screenshot:
              base64
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Upload failed"
      );
    }

    setMessage(
      resultMessage,
      "✅ Screenshot successfully uploaded!",
      "success"
    );

    if (submitResultBtn) {
      submitResultBtn.textContent =
        "✅ Uploaded";
    }

    stopRoomPolling();
    stopRoomTimer();

  } catch (error) {

    setMessage(
      resultMessage,
      `❌ ${error.message}`,
      "error"
    );

    if (submitResultBtn) {
      submitResultBtn.disabled = false;
      submitResultBtn.textContent =
        "Upload Result";
    }
  }
}

// ===============================
// LEAVE ROOM
// ===============================

if (leaveRoomBtn) {
  leaveRoomBtn.addEventListener(
    "click",
    leaveRoom
  );
}

if (joinedLeaveBtn) {
  joinedLeaveBtn.addEventListener(
    "click",
    leaveRoom
  );
}

async function leaveRoom() {

  if (!currentRoomCode) {
    resetRoomScreen();
    return;
  }

  const confirmed =
    confirm(
      "क्या आप Room छोड़ना चाहते हैं?"
    );

  if (!confirmed)
    return;

  try {

    await fetch(
      `${API}/rooms/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          room_code:
            currentRoomCode,
          player_id:
            playerId
        })
      }
    );

  } catch (error) {
    console.log(
      "Leave room error:",
      error
    );
  }

  resetRoomScreen();

  showSection(roomSection);

  setMessage(
    createMessage,
    "🚪 Room छोड़ दिया गया।",
    "success"
  );
}

// ===============================
// RESTORE ROOM
// ===============================

function restoreCurrentRoom() {

  if (!currentRoomCode) {
    resetRoomScreen();
    return;
  }

  if (playerNumber === 1) {

    if (createRoomCard)
      createRoomCard.style.display =
        "none";

    if (joinSection)
      joinSection.style.display =
        "none";

    if (createdRoom)
      createdRoom.style.display =
        "block";

    if (roomCodeDisplay)
      roomCodeDisplay.textContent =
        currentRoomCode;
  }

  if (playerNumber === 2) {

    if (createRoomCard)
      createRoomCard.style.display =
        "none";

    if (joinSection)
      joinSection.style.display =
        "none";

    if (joinedRoom)
      joinedRoom.style.display =
        "block";

    if (joinedRoomCode)
      joinedRoomCode.textContent =
        currentRoomCode;
  }

  startRoomPolling();
}

// ===============================
// HOME
// ===============================

function goHome() {
  showSection(homeSection);
}

document
  .querySelectorAll(".goHomeBtn")
  .forEach((button) => {
    button.addEventListener(
      "click",
      goHome
    );
  });

// ===============================
// START
// ===============================

updateProfile();

if (
  currentRoomCode &&
  (
    playerNumber === 1 ||
    playerNumber === 2
  )
) {
  showSection(roomSection);
  restoreCurrentRoom();
} else {
  showSection(homeSection);
}

console.log(
  "✅ Balaji Ludo King script loaded"
);
