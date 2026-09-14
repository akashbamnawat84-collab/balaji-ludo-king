const API = "/api";

// ===============================
// ELEMENTS
// ===============================

const welcomeCard = document.getElementById("welcomeCard");
const otpCard = document.getElementById("otpCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");
const profileSection = document.getElementById("profileSection");

const playerMobileInput = document.getElementById("playerMobile");
const playerNameInput = document.getElementById("playerName");

const startBtn = document.getElementById("startBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const backLoginBtn = document.getElementById("backLoginBtn");

const otpInput = document.getElementById("otpInput");
const message = document.getElementById("message");
const otpMessage = document.getElementById("otpMessage");

const createRoomCodeInput = document.getElementById("createRoomCode");
const joinRoomCodeInput = document.getElementById("joinRoomCode");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const roomMessage = document.getElementById("roomMessage");
const waitingTimer = document.getElementById("waitingTimer");

const player1Status = document.getElementById("player1Status");
const player2Status = document.getElementById("player2Status");

// ===============================
// SETTINGS
// ===============================

const DEMO_OTP = "123456";
const ROOM_WAIT_MS = 5 * 60 * 1000;

let pendingMobile = "";
let currentRoomCode = localStorage.getItem("room_code") || "";
let timerInterval = null;

// ===============================
// HELPERS
// ===============================

function clean(value) {
  return String(value || "").trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function showMessage(text, type = "") {
  if (!message) return;

  message.textContent = text;
  message.style.color =
    type === "error"
      ? "red"
      : type === "success"
      ? "green"
      : "#555";
}

function showRoomMessage(text, type = "") {
  if (!roomMessage) return;

  roomMessage.textContent = text;
  roomMessage.style.color =
    type === "error"
      ? "red"
      : type === "success"
      ? "green"
      : "#555";
}

function showOtpMessage(text, type = "") {
  if (!otpMessage) return;

  otpMessage.textContent = text;
  otpMessage.style.color =
    type === "error"
      ? "red"
      : type === "success"
      ? "green"
      : "#555";
}

function hideAllSections() {
  if (welcomeCard) welcomeCard.style.display = "none";
  if (otpCard) otpCard.style.display = "none";
  if (roomCard) roomCard.style.display = "none";
  if (ludoCard) ludoCard.style.display = "none";
  if (profileSection) profileSection.style.display = "none";
}

function showLogin() {
  hideAllSections();

  if (welcomeCard) {
    welcomeCard.style.display = "block";
  }

  if (playerMobileInput) {
    playerMobileInput.focus();
  }
}

function showRoom() {
  hideAllSections();

  if (roomCard) {
    roomCard.style.display = "block";
  }

  if (currentRoomCode) {
    checkRoom(currentRoomCode);
  }
}

function showLudo() {
  hideAllSections();

  if (ludoCard) {
    ludoCard.style.display = "block";
  }
}

// ===============================
// LOGIN
// ===============================

async function sendOTP() {
  let mobile = onlyDigits(playerMobileInput?.value);

  if (!/^\d{10}$/.test(mobile)) {
    showMessage("Valid 10-digit mobile number डालें।", "error");
    return;
  }

  pendingMobile = mobile;

  if (playerMobileInput) {
    playerMobileInput.value = mobile;
  }

  if (otpInput) {
    otpInput.value = "";
  }

  showMessage("");

  hideAllSections();

  if (otpCard) {
    otpCard.style.display = "block";
  }

  showOtpMessage(
    "Demo OTP: 123456",
    "success"
  );
}

async function verifyOTP() {
  const otp = onlyDigits(otpInput?.value);

  if (!pendingMobile) {
    showOtpMessage("Mobile number missing है।", "error");
    showLogin();
    return;
  }

  if (otp !== DEMO_OTP) {
    showOtpMessage("गलत OTP। Demo OTP 123456 है।", "error");
    return;
  }

  showOtpMessage("OTP verified. Login हो रहा है...", "success");

  try {
    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Player",
        mobile: pendingMobile
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Login failed"
      );
    }

    const customer = data.customer || data;

    saveCustomer(customer);

    showOtpMessage("Login successful ✅", "success");

    setTimeout(() => {
      showRoom();
    }, 500);

  } catch (error) {
    console.error(error);

    showOtpMessage(
      error.message || "Server error",
      "error"
    );
  }
}

function saveCustomer(customer) {
  if (!customer) return;

  const id =
    customer.customer_id ||
    customer.customerId ||
    customer.id ||
    "";

  const mobile =
    customer.mobile ||
    customer.phone ||
    pendingMobile ||
    "";

  const name =
    customer.name ||
    "Player";

  localStorage.setItem("player_id", id);
  localStorage.setItem("customer_id", id);
  localStorage.setItem("player_name", name);
  localStorage.setItem("phone_number", mobile);

  if (customer.email !== undefined) {
    localStorage.setItem(
      "email",
      customer.email || ""
    );
  }

  window.currentCustomer = customer;
}

// ===============================
// ROOM CREATE
// ===============================

async function createRoom() {
  const roomCode = onlyDigits(
    createRoomCodeInput?.value
  );

  const playerId =
    localStorage.getItem("player_id");

  const playerName =
    localStorage.getItem("player_name") ||
    "Player";

  if (!playerId) {
    showRoomMessage(
      "पहले mobile number से login करें।",
      "error"
    );
    showLogin();
    return;
  }

  if (!/^\d{8}$/.test(roomCode)) {
    showRoomMessage(
      "8-digit Room Code डालें।",
      "error"
    );
    return;
  }

  try {
    createRoomBtn.disabled = true;
    createRoomBtn.textContent = "Creating...";

    const response = await fetch(`${API}/room/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room_code: roomCode,
        roomCode: roomCode,

        player_id: playerId,
        playerId: playerId,

        player_name: playerName,
        playerName: playerName
      })
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Room create failed"
      );
    }

    currentRoomCode = roomCode;

    localStorage.setItem(
      "room_code",
      roomCode
    );

    showRoomMessage(
      `Room ${roomCode} created successfully ✅`,
      "success"
    );

    startRoomTimer(
      Date.now() + ROOM_WAIT_MS
    );

    await checkRoom(roomCode);

  } catch (error) {
    console.error(error);

    showRoomMessage(
      error.message ||
      "Room create failed",
      "error"
    );

  } finally {
    createRoomBtn.disabled = false;
    createRoomBtn.textContent = "Create Room";
  }
}

// ===============================
// ROOM JOIN
// ===============================

async function joinRoom() {
  const roomCode = onlyDigits(
    joinRoomCodeInput?.value
  );

  const playerId =
    localStorage.getItem("player_id");

  const playerName =
    localStorage.getItem("player_name") ||
    "Player";

  if (!playerId) {
    showRoomMessage(
      "पहले login करें।",
      "error"
    );
    showLogin();
    return;
  }

  if (!/^\d{8}$/.test(roomCode)) {
    showRoomMessage(
      "8-digit Room Code डालें।",
      "error"
    );
    return;
  }

  try {
    joinRoomBtn.disabled = true;
    joinRoomBtn.textContent = "Joining...";

    const response = await fetch(`${API}/room/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room_code: roomCode,
        roomCode: roomCode,

        player_id: playerId,
        playerId: playerId,

        player_name: playerName,
        playerName: playerName
      })
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Join failed"
      );
    }

    currentRoomCode = roomCode;

    localStorage.setItem(
      "room_code",
      roomCode
    );

    showRoomMessage(
      `Room ${roomCode} joined successfully ✅`,
      "success"
    );

    await checkRoom(roomCode);

  } catch (error) {
    console.error(error);

    showRoomMessage(
      error.message ||
      "Room join failed",
      "error"
    );

  } finally {
    joinRoomBtn.disabled = false;
    joinRoomBtn.textContent = "Join Room";
  }
}

// ===============================
// CHECK ROOM
// ===============================

async function checkRoom(roomCode) {
  if (!roomCode) return;

  try {
    const response = await fetch(
      `${API}/room/${encodeURIComponent(roomCode)}`
    );

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Room not found"
      );
    }

    const room = data.room || data;

    updatePlayers(room);

    const players =
      room.players ||
      room.players_count ||
      room.playerCount ||
      1;

    if (
      players >= 2 ||
      room.status === "ready" ||
      room.status === "started"
    ) {
      stopRoomTimer();

      updatePlayers(room);

      showRoomMessage(
        "Both Players Ready! 🎉",
        "success"
      );

      setTimeout(() => {
        showLudo();
      }, 500);

      return;
    }

    let expiresAt =
      room.expires_at ||
      room.expiresAt ||
      room.expiry ||
      null;

    if (expiresAt) {
      startRoomTimer(
        Number(expiresAt)
      );
    } else {
      startRoomTimer(
        Date.now() + ROOM_WAIT_MS
      );
    }

    showRoomMessage(
      "Waiting for Player 2..."
    );

  } catch (error) {
    console.error(error);

    showRoomMessage(
      error.message ||
      "Room check failed",
      "error"
    );
  }
}

// ===============================
// UPDATE PLAYER STATUS
// ===============================

function updatePlayers(room) {
  let players = room.players;

  if (!Array.isArray(players)) {
    players = [];
  }

  if (player1Status) {
    player1Status.textContent =
      players.length >= 1
        ? "Ready ✅"
        : "Waiting...";
  }

  if (player2Status) {
    player2Status.textContent =
      players.length >= 2
        ? "Ready ✅"
        : "Waiting...";
  }

  if (
    room.player1 ||
    room.player2
  ) {
    if (player1Status) {
      player1Status.textContent =
        room.player1
          ? "Ready ✅"
          : "Waiting...";
    }

    if (player2Status) {
      player2Status.textContent =
        room.player2
          ? "Ready ✅"
          : "Waiting...";
    }
  }
}

// ===============================
// ROOM TIMER
// ===============================

function startRoomTimer(endTime) {
  stopRoomTimer();

  function updateTimer() {
    const remaining =
      Number(endTime) - Date.now();

    if (remaining <= 0) {
      if (waitingTimer) {
        waitingTimer.textContent =
          "Room expired ⏰";
      }

      stopRoomTimer();

      if (currentRoomCode) {
        cancelRoom(currentRoomCode, true);
      }

      return;
    }

    const totalSeconds =
      Math.floor(remaining / 1000);

    const minutes =
      Math.floor(totalSeconds / 60);

    const seconds =
      totalSeconds % 60;

    if (waitingTimer) {
      waitingTimer.textContent =
        `Room expires in ${minutes}:${String(
          seconds
        ).padStart(2, "0")}`;
    }
  }

  updateTimer();

  timerInterval = setInterval(
    updateTimer,
    1000
  );
}

function stopRoomTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ===============================
// CANCEL ROOM
// ===============================

async function cancelRoom(
  roomCode = currentRoomCode,
  silent = false
) {
  if (!roomCode) return;

  const playerId =
    localStorage.getItem("player_id");

  try {
    await fetch(`${API}/room/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room_code: roomCode,
        roomCode: roomCode,

        player_id: playerId,
        playerId: playerId
      })
    });
  } catch (error) {
    console.error(error);
  }

  if (!silent) {
    showRoomMessage(
      "Room cancelled."
    );
  }

  currentRoomCode = "";

  localStorage.removeItem(
    "room_code"
  );

  stopRoomTimer();

  if (waitingTimer) {
    waitingTimer.textContent = "";
  }
}

// ===============================
// RESULT SUBMIT
// ===============================

async function submitResult(
  screenshot
) {
  const roomCode =
    currentRoomCode ||
    localStorage.getItem("room_code");

  const playerId =
    localStorage.getItem("player_id");

  if (!roomCode || !playerId) {
    alert(
      "Room और Player information missing है।"
    );
    return;
  }

  let screenshotData = "";

  if (screenshot) {
    try {
      screenshotData =
        await fileToBase64(screenshot);
    } catch (error) {
      console.error(error);
    }
  }

  try {
    const response = await fetch(
      `${API}/room/result`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room_code: roomCode,
          roomCode: roomCode,

          player_id: playerId,
          playerId: playerId,

          screenshot: screenshotData
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Result submit failed"
      );
    }

    alert(
      "Match Result Submitted Successfully ✅"
    );

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Result submit failed"
    );
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

// ===============================
// PROFILE
// ===============================

async function openProfile() {
  const customerId =
    localStorage.getItem("customer_id") ||
    localStorage.getItem("player_id");

  if (!customerId) {
    showLogin();
    return;
  }

  hideAllSections();

  if (profileSection) {
    profileSection.style.display =
      "block";
  }

  await loadProfile(customerId);
}

async function loadProfile(customerId) {
  try {
    const response = await fetch(
      `${API}/customer/${encodeURIComponent(
        customerId
      )}`
    );

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Profile load failed"
      );
    }

    const customer =
      data.customer || data;

    saveCustomer(customer);

    renderProfile(customer);

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Profile load failed"
    );
  }
}

function renderProfile(customer) {
  const id =
    customer.customer_id ||
    customer.id ||
    "---";

  const name =
    customer.name ||
    "Player";

  const mobile =
    customer.mobile ||
    customer.phone ||
    "Not Added";

  const email =
    customer.email ||
    "Not Added";

  const wallet =
    Number(
      customer.wallet_balance ??
      customer.wallet ??
      0
    );

  const bonus =
    Number(
      customer.bonus_balance ??
      customer.bonus ??
      0
    );

  const battles =
    Number(
      customer.battle_played ??
      customer.battles ??
      0
    );

  const coins =
    Number(
      customer.coin_won ??
      customer.coins_won ??
      0
    );

  const referral =
    Number(
      customer.referral_earned ??
      customer.referral ??
      0
    );

  const withdrawal =
    Number(
      customer.withdrawal_amount ??
      customer.withdrawal ??
      0
    );

  const kyc =
    customer.kyc_status ||
    "Pending";

  setText(
    "profileName",
    name
  );

  setText(
    "profileId",
    `Player ID: ${id}`
  );

  setText(
    "customerId",
    id
  );

  setText(
    "profileWallet",
    formatMoney(wallet)
  );

  setText(
    "profileBonus",
    formatMoney(bonus)
  );

  setText(
    "battlePlayed",
    battles
  );

  setText(
    "coinWon",
    formatMoney(coins)
  );

  setText(
    "referralEarned",
    formatMoney(referral)
  );

  setText(
    "withdrawalAmount",
    formatMoney(withdrawal)
  );

  setText(
    "profilePhone",
    mobile
  );

  setText(
    "profileEmail",
    email
  );

  setText(
    "kycStatus",
    kyc
  );
}

function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      String(value);
  }
}

function formatMoney(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

// ===============================
// EDIT PROFILE NAME
// ===============================

async function editProfile() {
  const customerId =
    localStorage.getItem("customer_id") ||
    localStorage.getItem("player_id");

  if (!customerId) {
    showLogin();
    return;
  }

  const oldName =
    localStorage.getItem("player_name") ||
    "Player";

  const newName =
    prompt(
      "अपना नाम डालें:",
      oldName
    );

  if (!newName) return;

  const name =
    clean(newName);

  if (name.length < 2) {
    alert(
      "कम से कम 2 अक्षर का नाम डालें।"
    );
    return;
  }

  try {
    const response = await fetch(
      `${API}/customer/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id: customerId,
          id: customerId,
          name: name
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Name update failed"
      );
    }

    localStorage.setItem(
      "player_name",
      name
    );

    await loadProfile(
      customerId
    );

    alert(
      "Name updated successfully ✅"
    );

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Name update failed"
    );
  }
}

// ===============================
// EDIT EMAIL
// ===============================

async function editEmail() {
  const customerId =
    localStorage.getItem("customer_id") ||
    localStorage.getItem("player_id");

  if (!customerId) {
    showLogin();
    return;
  }

  const oldEmail =
    localStorage.getItem("email") ||
    "";

  const newEmail =
    prompt(
      "अपना Email डालें:",
      oldEmail
    );

  if (newEmail === null) {
    return;
  }

  const email =
    clean(newEmail);

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    alert(
      "Valid Email डालें।"
    );
    return;
  }

  try {
    const response = await fetch(
      `${API}/customer/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id: customerId,
          id: customerId,
          email: email
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        data.message ||
        "Email update failed"
      );
    }

    localStorage.setItem(
      "email",
      email
    );

    await loadProfile(
      customerId
    );

    alert(
      "Email updated successfully ✅"
    );

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Email update failed"
    );
  }
}

// ===============================
// BOTTOM NAV
// ===============================

function goHome() {
  const customerId =
    localStorage.getItem("customer_id") ||
    localStorage.getItem("player_id");

  if (!customerId) {
    showLogin();
    return;
  }

  showRoom();
}

function openWallet() {
  alert(
    "Wallet section जल्द उपलब्ध होगा।\nDemo Mode में real money transaction नहीं है।"
  );
}

function openRefer() {
  alert(
    "Refer & Earn section जल्द उपलब्ध होगा।"
  );
}

function openSupport() {
  alert(
    "Support section जल्द उपलब्ध होगा।"
  );
}

// ===============================
// BACK LOGIN
// ===============================

function backToLogin() {
  pendingMobile = "";

  if (otpInput) {
    otpInput.value = "";
  }

  showOtpMessage("");

  showLogin();
}

// ===============================
// INPUT FORMATTING
// ===============================

if (playerMobileInput) {
  playerMobileInput.addEventListener(
    "input",
    function () {
      this.value =
        onlyDigits(this.value)
          .slice(0, 10);
    }
  );
}

if (otpInput) {
  otpInput.addEventListener(
    "input",
    function () {
      this.value =
        onlyDigits(this.value)
          .slice(0, 6);
    }
  );
}

if (createRoomCodeInput) {
  createRoomCodeInput.addEventListener(
    "input",
    function () {
      this.value =
        onlyDigits(this.value)
          .slice(0, 8);
    }
  );
}

if (joinRoomCodeInput) {
  joinRoomCodeInput.addEventListener(
    "input",
    function () {
      this.value =
        onlyDigits(this.value)
          .slice(0, 8);
    }
  );
}

// ===============================
// BUTTON EVENTS
// ===============================

if (startBtn) {
  startBtn.addEventListener(
    "click",
    sendOTP
  );
}

if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener(
    "click",
    verifyOTP
  );
}

if (backLoginBtn) {
  backLoginBtn.addEventListener(
    "click",
    backToLogin
  );
}

if (createRoomBtn) {
  createRoomBtn.addEventListener(
    "click",
    createRoom
  );
}

if (joinRoomBtn) {
  joinRoomBtn.addEventListener(
    "click",
    joinRoom
  );
}

// ===============================
// ENTER KEY
// ===============================

if (playerMobileInput) {
  playerMobileInput.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Enter") {
        sendOTP();
      }
    }
  );
}

if (otpInput) {
  otpInput.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Enter") {
        verifyOTP();
      }
    }
  );
}

// ===============================
// START
// ===============================

showLogin();

// ===============================
// GLOBAL FUNCTIONS
// ===============================

window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.backToLogin = backToLogin;

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.checkRoom = checkRoom;
window.cancelRoom = cancelRoom;

window.openProfile = openProfile;
window.editProfile = editProfile;
window.editEmail = editEmail;

window.goHome = goHome;
window.openWallet = openWallet;
window.openRefer = openRefer;
window.openSupport = openSupport;

window.submitResult = submitResult;
