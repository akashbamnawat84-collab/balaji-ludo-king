/* =========================================
   BALAJI LUDO KING
   LOGIN → OTP → ROOM → MATCH
========================================= */

const API = "/api";

/* =========================================
   ELEMENTS
========================================= */

const welcomeCard = document.getElementById("welcomeCard");
const otpCard = document.getElementById("otpCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");
const profileSection = document.getElementById("profileSection");

const playerMobile = document.getElementById("playerMobile");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const otpInput = document.getElementById("otpInput");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const backLoginBtn = document.getElementById("backLoginBtn");
const otpMessage = document.getElementById("otpMessage");

const createRoomCode = document.getElementById("createRoomCode");
const joinRoomCode = document.getElementById("joinRoomCode");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomMessage = document.getElementById("roomMessage");

const waitingTimer = document.getElementById("waitingTimer");
const player1Status = document.getElementById("player1Status");
const player2Status = document.getElementById("player2Status");

const matchPlayer1Name =
  document.getElementById("matchPlayer1Name");

const matchPlayer2Name =
  document.getElementById("matchPlayer2Name");

const matchRoomCode =
  document.getElementById("matchRoomCode");

const copyRoomBtn =
  document.getElementById("copyRoomBtn");

const resultArea =
  document.getElementById("resultArea");

const resultScreenshot =
  document.getElementById("resultScreenshot");

const gameMessage =
  document.getElementById("gameMessage");

/* =========================================
   STATE
========================================= */

let currentPlayer = null;
let currentRoom = null;
let pendingMobile = "";
let roomPollTimer = null;
let roomTimer = null;

/* =========================================
   START
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  showOnly(welcomeCard);

  if (playerMobile) {
    playerMobile.value = "";
  }

  if (otpInput) {
    otpInput.value = "";
  }

  clearMessages();
});

/* =========================================
   SCREEN CONTROL
========================================= */

function showOnly(section) {
  const sections = [
    welcomeCard,
    otpCard,
    roomCard,
    ludoCard,
    profileSection
  ];

  sections.forEach((item) => {
    if (item) {
      item.style.display =
        item === section ? "block" : "none";
    }
  });
}

function clearMessages() {
  if (message) message.textContent = "";
  if (otpMessage) otpMessage.textContent = "";
  if (roomMessage) roomMessage.textContent = "";
  if (gameMessage) gameMessage.textContent = "";
}

function goHome() {
  stopRoomPolling();
  currentRoom = null;
  showOnly(roomCard);

  if (roomMessage) {
    roomMessage.textContent =
      "Create or join a 2 player room";
  }
}

/* =========================================
   LOGIN
   SAME LOGIN CODE
========================================= */

async function sendOTP() {
  const mobile = String(
    playerMobile?.value || ""
  ).replace(/\D/g, "");

  if (mobile.length !== 10) {
    if (message) {
      message.textContent =
        "Please enter a valid 10-digit mobile number.";
    }
    return;
  }

  pendingMobile = mobile;

  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = "Sending...";
  }

  if (message) {
    message.textContent = "";
  }

  try {
    const response = await fetch(
      `${API}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Unable to send OTP."
      );
    }

    showOnly(otpCard);

    if (otpMessage) {
      otpMessage.textContent =
        "OTP sent to your mobile number.";
    }

    if (otpInput) {
      otpInput.value = "";

      setTimeout(() => {
        otpInput.focus();
      }, 100);
    }

  } catch (error) {
    if (message) {
      message.textContent =
        error.message || "Unable to send OTP.";
    }

  } finally {
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "Send OTP";
    }
  }
}

/* =========================================
   VERIFY OTP
   SAME OTP CODE
========================================= */

async function verifyOTP() {
  const otp = String(
    otpInput?.value || ""
  ).replace(/\D/g, "");

  if (otp.length !== 6) {
    if (otpMessage) {
      otpMessage.textContent =
        "Please enter the 6-digit OTP.";
    }
    return;
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Verifying...";
  }

  if (otpMessage) {
    otpMessage.textContent = "";
  }

  try {
    const response = await fetch(
      `${API}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile: pendingMobile,
          otp
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Invalid OTP."
      );
    }

    currentPlayer = {
      ...(data.customer || {}),
      mobile: pendingMobile
    };

    showOnly(roomCard);

    if (roomMessage) {
      roomMessage.textContent =
        "Create or join a 2 player room";
    }

  } catch (error) {
    if (otpMessage) {
      otpMessage.textContent =
        error.message ||
        "OTP verification failed.";
    }

  } finally {
    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent =
        "Verify & Continue";
    }
  }
}

/* =========================================
   BACK TO LOGIN
========================================= */

function backToLogin() {
  pendingMobile = "";

  if (otpInput) {
    otpInput.value = "";
  }

  if (otpMessage) {
    otpMessage.textContent = "";
  }

  showOnly(welcomeCard);
}

/* =========================================
   CREATE ROOM
========================================= */

async function createRoom() {
  const code = String(
    createRoomCode?.value || ""
  ).replace(/\D/g, "");

  if (code.length !== 8) {
    if (roomMessage) {
      roomMessage.textContent =
        "8-Digit Room Code डालें।";
    }
    return;
  }

  if (!currentPlayer) {
    if (roomMessage) {
      roomMessage.textContent =
        "Please login first.";
    }

    showOnly(welcomeCard);
    return;
  }

  if (createRoomBtn) {
    createRoomBtn.disabled = true;
    createRoomBtn.textContent = "Creating...";
  }

  try {
    const response = await fetch(
      `${API}/rooms/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room_code: code,
          player_id: getPlayerId(),
          player_name: getPlayerName()
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Room creation failed."
      );
    }

    currentRoom = data.room || {
      room_code: code,
      player1_id: getPlayerId(),
      player1_name: getPlayerName(),
      status: "WAITING"
    };

    showRoomWaiting();
    startRoomPolling(code);

  } catch (error) {
    if (roomMessage) {
      roomMessage.textContent =
        error.message ||
        "Room creation failed.";
    }

  } finally {
    if (createRoomBtn) {
      createRoomBtn.disabled = false;
      createRoomBtn.textContent = "Create Room";
    }
  }
}

/* =========================================
   JOIN ROOM
========================================= */

async function joinRoom() {
  const code = String(
    joinRoomCode?.value || ""
  ).replace(/\D/g, "");

  if (code.length !== 8) {
    if (roomMessage) {
      roomMessage.textContent =
        "8-Digit Room Code डालें।";
    }
    return;
  }

  if (!currentPlayer) {
    if (roomMessage) {
      roomMessage.textContent =
        "Please login first.";
    }

    showOnly(welcomeCard);
    return;
  }

  if (joinRoomBtn) {
    joinRoomBtn.disabled = true;
    joinRoomBtn.textContent = "Joining...";
  }

  try {
    const response = await fetch(
      `${API}/rooms/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room_code: code,
          player_id: getPlayerId(),
          player_name: getPlayerName()
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Unable to join room."
      );
    }

    currentRoom = data.room || null;

    if (currentRoom) {
      handleRoomState(currentRoom);
    } else {
      startRoomPolling(code);
    }

  } catch (error) {
    if (roomMessage) {
      roomMessage.textContent =
        error.message ||
        "Unable to join room.";
    }

  } finally {
    if (joinRoomBtn) {
      joinRoomBtn.disabled = false;
      joinRoomBtn.textContent = "Join Room";
    }
  }
}

/* =========================================
   ROOM WAITING
========================================= */

function showRoomWaiting() {
  showOnly(roomCard);

  if (roomMessage) {
    roomMessage.textContent =
      "Room created. Waiting for Player 2...";
  }

  if (player1Status) {
    player1Status.textContent =
      "Player 1 • Ready";
  }

  if (player2Status) {
    player2Status.textContent =
      "Player 2 • Waiting...";
  }
}

/* =========================================
   POLL ROOM
========================================= */

function startRoomPolling(code) {
  stopRoomPolling();

  fetchRoom(code);

  roomPollTimer = setInterval(() => {
    fetchRoom(code);
  }, 2000);
}

function stopRoomPolling() {
  if (roomPollTimer) {
    clearInterval(roomPollTimer);
    roomPollTimer = null;
  }

  if (roomTimer) {
    clearInterval(roomTimer);
    roomTimer = null;
  }
}

async function fetchRoom(code) {
  try {
    const response = await fetch(
      `${API}/rooms/${encodeURIComponent(code)}`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return;
    }

    if (!data.room) {
      return;
    }

    currentRoom = data.room;

    handleRoomState(currentRoom);

  } catch (error) {
    console.log(
      "Room polling error:",
      error
    );
  }
}

/* =========================================
   ROOM STATE
========================================= */

function handleRoomState(room) {
  if (!room) return;

  if (player1Status) {
    player1Status.textContent =
      room.player1_id
        ? "Player 1 • Ready"
        : "Player 1 • Waiting...";
  }

  if (player2Status) {
    player2Status.textContent =
      room.player2_id
        ? "Player 2 • Ready"
        : "Player 2 • Waiting...";
  }

  if (roomMessage) {
    if (
      room.player1_id &&
      room.player2_id
    ) {
      roomMessage.textContent =
        "Both Players Ready! 🎉";
    } else {
      roomMessage.textContent =
        "Waiting for Player 2...";
    }
  }

  startRoomCountdown(room);

  if (
    room.player1_id &&
    room.player2_id
  ) {
    stopRoomPolling();
    openMatchScreen(room);
  }
}

/* =========================================
   ROOM TIMER
========================================= */

function startRoomCountdown(room) {
  if (!waitingTimer) return;

  let createdAt =
    room.created_at ||
    room.createdAt;

  let startTime =
    createdAt
      ? new Date(createdAt).getTime()
      : Date.now();

  if (!Number.isFinite(startTime)) {
    startTime = Date.now();
  }

  if (roomTimer) {
    clearInterval(roomTimer);
  }

  const updateTimer = () => {
    const elapsed =
      Date.now() - startTime;

    const remaining =
      Math.max(
        0,
        5 * 60 * 1000 - elapsed
      );

    const seconds =
      Math.ceil(remaining / 1000);

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    waitingTimer.textContent =
      `Room expires in ${minutes}:${String(
        secs
      ).padStart(2, "0")}`;

    if (remaining <= 0) {
      clearInterval(roomTimer);

      waitingTimer.textContent =
        "Room expired.";

      stopRoomPolling();
    }
  };

  updateTimer();

  roomTimer = setInterval(
    updateTimer,
    1000
  );
}

/* =========================================
   MATCH SCREEN
========================================= */

function openMatchScreen(room) {
  stopRoomPolling();

  showOnly(ludoCard);

  if (matchPlayer1Name) {
    matchPlayer1Name.textContent =
      room.player1_name ||
      "Player 1";
  }

  if (matchPlayer2Name) {
    matchPlayer2Name.textContent =
      room.player2_name ||
      "Player 2";
  }

  if (matchRoomCode) {
    matchRoomCode.textContent =
      room.room_code ||
      "00000000";
  }

  if (resultArea) {
    resultArea.style.display =
      "none";
  }

  if (gameMessage) {
    gameMessage.textContent =
      "Both Players Ready! 🎉";
  }
}

/* =========================================
   COPY ROOM CODE
========================================= */

async function copyRoomCode() {
  const code =
    matchRoomCode?.textContent || "";

  if (!code) return;

  try {
    await navigator.clipboard.writeText(code);

    if (gameMessage) {
      gameMessage.textContent =
        "Room Code copied successfully!";
    }

    if (copyRoomBtn) {
      const oldText =
        copyRoomBtn.textContent;

      copyRoomBtn.textContent =
        "Copied ✓";

      setTimeout(() => {
        copyRoomBtn.textContent =
          oldText;
      }, 1500);
    }

  } catch (error) {
    if (gameMessage) {
      gameMessage.textContent =
        `Room Code: ${code}`;
    }
  }
}

/* =========================================
   I WON
========================================= */

function submitWin() {
  if (!resultArea) return;

  resultArea.style.display =
    "block";

  if (gameMessage) {
    gameMessage.textContent =
      "अपनी जीत का screenshot upload करें।";
  }

  resultArea.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

/* =========================================
   UPLOAD RESULT
========================================= */

async function uploadResult() {
  const file =
    resultScreenshot?.files?.[0];

  if (!file) {
    if (gameMessage) {
      gameMessage.textContent =
        "पहले winning screenshot select करें।";
    }
    return;
  }

  if (!currentRoom) {
    if (gameMessage) {
      gameMessage.textContent =
        "Room information not found.";
    }
    return;
  }

  try {
    const base64 =
      await fileToBase64(file);

    const response = await fetch(
      `${API}/rooms/result`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          player_id: getPlayerId(),
          room_code:
            currentRoom.room_code,
          screenshot: base64
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
        "Result submission failed."
      );
    }

    if (gameMessage) {
      gameMessage.textContent =
        "Winning screenshot submitted successfully! ✅";
    }

    if (resultArea) {
      resultArea.style.display =
        "none";
    }

  } catch (error) {
    if (gameMessage) {
      gameMessage.textContent =
        error.message ||
        "Result submission failed.";
    }
  }
}

function fileToBase64(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = reject;

      reader.readAsDataURL(file);
    }
  );
}

/* =========================================
   I LOST
========================================= */

function submitLost() {
  if (gameMessage) {
    gameMessage.textContent =
      "You selected I Lost.";
  }

  if (resultArea) {
    resultArea.style.display =
      "none";
  }
}

/* =========================================
   CANCEL ROOM
========================================= */

async function cancelRoom() {
  if (!currentRoom) {
    goHome();
    return;
  }

  const code =
    currentRoom.room_code;

  try {
    const response = await fetch(
      `${API}/rooms/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room_code: code,
          player_id: getPlayerId()
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
        "Unable to cancel room."
      );
    }

  } catch (error) {
    console.log(
      "Cancel room:",
      error.message
    );
  }

  currentRoom = null;

  stopRoomPolling();

  if (createRoomCode) {
    createRoomCode.value = "";
  }

  if (joinRoomCode) {
    joinRoomCode.value = "";
  }

  showOnly(roomCard);

  if (roomMessage) {
    roomMessage.textContent =
      "Room cancelled.";
  }
}

/* =========================================
   PLAYER HELPERS
========================================= */

function getPlayerId() {
  if (currentPlayer) {
    return (
      currentPlayer.player_id ||
      currentPlayer.playerId ||
      currentPlayer.customer_id ||
      currentPlayer.customerId ||
      currentPlayer.id ||
      pendingMobile
    );
  }

  return pendingMobile;
}

function getPlayerName() {
  if (currentPlayer) {
    return (
      currentPlayer.name ||
      currentPlayer.player_name ||
      currentPlayer.playerName ||
      "Player"
    );
  }

  return "Player";
}

/* =========================================
   PROFILE
========================================= */

function openProfile() {
  showOnly(profileSection);

  if (!currentPlayer) return;

  const name =
    currentPlayer.name ||
    currentPlayer.player_name ||
    "Player";

  const id =
    getPlayerId();

  const customerId =
    currentPlayer.customer_id ||
    currentPlayer.customerId ||
    "---";

  const wallet =
    currentPlayer.wallet ??
    currentPlayer.wallet_balance ??
    0;

  const bonus =
    currentPlayer.bonus ??
    currentPlayer.bonus_balance ??
    0;

  const profileName =
    document.getElementById(
      "profileName"
    );

  const profileId =
    document.getElementById(
      "profileId"
    );

  const customerIdEl =
    document.getElementById(
      "customerId"
    );

  const profileWallet =
    document.getElementById(
      "profileWallet"
    );

  const profileBonus =
    document.getElementById(
      "profileBonus"
    );

  const profilePhone =
    document.getElementById(
      "profilePhone"
    );

  if (profileName)
    profileName.textContent =
      name;

  if (profileId)
    profileId.textContent =
      `Player ID: ${id}`;

  if (customerIdEl)
    customerIdEl.textContent =
      customerId;

  if (profileWallet)
    profileWallet.textContent =
      `₹${Number(wallet).toFixed(2)}`;

  if (profileBonus)
    profileBonus.textContent =
      `₹${Number(bonus).toFixed(2)}`;

  if (profilePhone)
    profilePhone.textContent =
      currentPlayer.mobile ||
      pendingMobile ||
      "Not Added";
}

/* =========================================
   WALLET
========================================= */

function openWallet() {
  if (!currentPlayer) {
    showOnly(welcomeCard);
    return;
  }

  alert("Wallet section coming soon.");
}

/* =========================================
   REFER
========================================= */

function openRefer() {
  if (!currentPlayer) {
    showOnly(welcomeCard);
    return;
  }

  alert("Refer & Earn section coming soon.");
}

/* =========================================
   CUSTOMER SUPPORT
   WHATSAPP LINK
========================================= */

function openSupport() {
  const whatsappLink =
    "https://wa.me/qr/M4VB226B2BWQB1";

  window.open(
    whatsappLink,
    "_blank",
    "noopener,noreferrer"
  );
}

/* =========================================
   HOME
========================================= */

function openHome() {
  goHome();
}

/* =========================================
   EDIT PROFILE
========================================= */

function editProfile() {
  if (!currentPlayer) {
    showOnly(welcomeCard);
    return;
  }

  const oldName =
    currentPlayer.name ||
    "Player";

  const newName =
    prompt(
      "Enter your name:",
      oldName
    );

  if (
    newName === null ||
    !newName.trim()
  ) {
    return;
  }

  currentPlayer.name =
    newName.trim();

  const profileName =
    document.getElementById(
      "profileName"
    );

  if (profileName) {
    profileName.textContent =
      currentPlayer.name;
  }
}

/* =========================================
   EDIT EMAIL
========================================= */

function editEmail() {
  if (!currentPlayer) {
    showOnly(welcomeCard);
    return;
  }

  const oldEmail =
    currentPlayer.email || "";

  const newEmail =
    prompt(
      "Enter your email:",
      oldEmail
    );

  if (newEmail === null) {
    return;
  }

  currentPlayer.email =
    newEmail.trim();

  const profileEmail =
    document.getElementById(
      "profileEmail"
    );

  if (profileEmail) {
    profileEmail.textContent =
      currentPlayer.email ||
      "Not Added";
  }
}
