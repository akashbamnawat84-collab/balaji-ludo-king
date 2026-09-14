const API = "/api";

const welcomeCard = document.getElementById("welcomeCard");
const otpCard = document.getElementById("otpCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");
const profileSection = document.getElementById("profileSection");

const playerMobileInput = document.getElementById("playerMobile");
const startBtn = document.getElementById("startBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const backLoginBtn = document.getElementById("backLoginBtn");

const otpInput = document.getElementById("otpInput");
const message = document.getElementById("message");
const otpMessage = document.getElementById("otpMessage");

const createRoomCodeInput =
  document.getElementById("createRoomCode");

const joinRoomCodeInput =
  document.getElementById("joinRoomCode");

const createRoomBtn =
  document.getElementById("createRoomBtn");

const joinRoomBtn =
  document.getElementById("joinRoomBtn");

const roomMessage =
  document.getElementById("roomMessage");

const waitingTimer =
  document.getElementById("waitingTimer");

const player1Status =
  document.getElementById("player1Status");

const player2Status =
  document.getElementById("player2Status");

const DEMO_OTP = "123456";
const ROOM_WAIT_MS = 5 * 60 * 1000;

let pendingMobile = "";
let currentRoomCode =
  localStorage.getItem("room_code") || "";

let timerInterval = null;
let roomPollInterval = null;

// =====================================
// HELPERS
// =====================================

function clean(value) {
  return String(value ?? "").trim();
}

function digits(value) {
  return String(value ?? "")
    .replace(/\D/g, "");
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

function hideAll() {
  if (welcomeCard)
    welcomeCard.style.display = "none";

  if (otpCard)
    otpCard.style.display = "none";

  if (roomCard)
    roomCard.style.display = "none";

  if (ludoCard)
    ludoCard.style.display = "none";

  if (profileSection)
    profileSection.style.display = "none";
}

// =====================================
// LOGIN
// =====================================

function sendOTP() {
  const mobile = digits(
    playerMobileInput?.value
  );

  if (!/^\d{10}$/.test(mobile)) {
    showMessage(
      "Valid 10-digit mobile number डालें।",
      "error"
    );
    return;
  }

  pendingMobile = mobile;

  hideAll();

  if (otpCard)
    otpCard.style.display = "block";

  if (otpInput) {
    otpInput.value = "";
    otpInput.focus();
  }

  showOtpMessage(
    "Demo OTP: 123456",
    "success"
  );
}

// =====================================
// VERIFY OTP + LOGIN
// =====================================

async function verifyOTP() {
  const otp = digits(
    otpInput?.value
  );

  if (otp !== DEMO_OTP) {
    showOtpMessage(
      "गलत OTP। Demo OTP 123456 है।",
      "error"
    );
    return;
  }

  if (!pendingMobile) {
    showOtpMessage(
      "Mobile number missing है।",
      "error"
    );
    return;
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Logging in...";
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
          name: "Player",
          mobile: pendingMobile
        })
      }
    );

    const data =
      await response.json();

    console.log(
      "LOGIN RESPONSE:",
      data
    );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        data.error ||
        data.message ||
        "Login failed"
      );
    }

    const customer =
      data.customer;

    if (!customer) {
      throw new Error(
        "Customer data नहीं मिला।"
      );
    }

    saveCustomer(customer);

    showOtpMessage(
      "Login successful ✅",
      "success"
    );

    setTimeout(() => {
      showRoom();
    }, 400);

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    showOtpMessage(
      error.message ||
      "Login failed",
      "error"
    );

  } finally {
    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent =
        "Verify OTP";
    }
  }
}

// =====================================
// SAVE CUSTOMER
// =====================================

function saveCustomer(customer) {
  const id =
    customer.customer_id ||
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

  localStorage.setItem(
    "player_id",
    id
  );

  localStorage.setItem(
    "customer_id",
    id
  );

  localStorage.setItem(
    "player_name",
    name
  );

  localStorage.setItem(
    "phone_number",
    mobile
  );

  localStorage.setItem(
    "email",
    customer.email || ""
  );

  window.currentCustomer =
    customer;
}

// =====================================
// SHOW ROOM
// =====================================

function showRoom() {
  hideAll();

  if (roomCard)
    roomCard.style.display = "block";

  if (currentRoomCode) {
    checkRoom(currentRoomCode);
  }
}

// =====================================
// CREATE ROOM
// =====================================

async function createRoom() {
  const roomCode = digits(
    createRoomCodeInput?.value
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
    createRoomBtn.disabled = true;
    createRoomBtn.textContent =
      "Creating...";

    const response = await fetch(
      `${API}/rooms/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room_code: roomCode,
          player_id: playerId,
          player_name: playerName
        })
      }
    );

    const data =
      await response.json();

    console.log(
      "CREATE ROOM:",
      data
    );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        data.error ||
        data.message ||
        "Room create failed"
      );
    }

    currentRoomCode =
      roomCode;

    localStorage.setItem(
      "room_code",
      roomCode
    );

    showRoomMessage(
      `Room ${roomCode} created successfully ✅`,
      "success"
    );

    startTimer(
      Date.now() + ROOM_WAIT_MS
    );

    startPolling();

    updateRoom(
      data.room
    );

  } catch (error) {
    console.error(error);

    showRoomMessage(
      error.message ||
      "Room create failed",
      "error"
    );

  } finally {
    createRoomBtn.disabled = false;
    createRoomBtn.textContent =
      "Create Room";
  }
}

// =====================================
// JOIN ROOM
// =====================================

async function joinRoom() {
  const roomCode = digits(
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
    joinRoomBtn.textContent =
      "Joining...";

    const response = await fetch(
      `${API}/rooms/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room_code: roomCode,
          player_id: playerId,
          player_name: playerName
        })
      }
    );

    const data =
      await response.json();

    console.log(
      "JOIN ROOM:",
      data
    );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        data.error ||
        data.message ||
        "Join failed"
      );
    }

    currentRoomCode =
      roomCode;

    localStorage.setItem(
      "room_code",
      roomCode
    );

    showRoomMessage(
      "Room joined successfully ✅",
      "success"
    );

    updateRoom(
      data.room
    );

    startPolling();

  } catch (error) {
    console.error(error);

    showRoomMessage(
      error.message ||
      "Join failed",
      "error"
    );

  } finally {
    joinRoomBtn.disabled = false;
    joinRoomBtn.textContent =
      "Join Room";
  }
}

// =====================================
// GET ROOM
// =====================================

async function checkRoom(roomCode) {
  if (!roomCode) return;

  try {
    const response = await fetch(
      `${API}/rooms/${encodeURIComponent(
        roomCode
      )}`
    );

    const data =
      await response.json();

    console.log(
      "ROOM:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Room not found"
      );
    }

    const room =
      data.room || data;

    updateRoom(room);

    if (
      room.status === "READY" ||
      room.player2_id
    ) {
      stopPolling();
      stopTimer();

      showRoomMessage(
        "Both Players Ready! 🎉",
        "success"
      );

      setTimeout(() => {
        showLudo();
      }, 500);

      return;
    }

    if (
      room.created_at
    ) {
      startTimer(
        Number(room.created_at) +
        ROOM_WAIT_MS
      );
    }

  } catch (error) {
    console.error(error);

    showRoomMessage(
      error.message ||
      "Room check failed",
      "error"
    );
  }
}

// =====================================
// UPDATE ROOM UI
// =====================================

function updateRoom(room) {
  if (!room) return;

  if (player1Status) {
    player1Status.textContent =
      room.player1_id
        ? `${room.player1_name || "Player 1"} • Ready`
        : "Waiting...";
  }

  if (player2Status) {
    player2Status.textContent =
      room.player2_id
        ? `${room.player2_name || "Player 2"} • Ready`
        : "Waiting...";
  }

  if (
    room.status === "READY" ||
    room.player2_id
  ) {
    stopPolling();
    stopTimer();

    if (roomCard?.style.display !== "none") {
      showRoomMessage(
        "Both Players Ready! 🎉",
        "success"
      );

      setTimeout(() => {
        showLudo();
      }, 500);
    }
  }
}

// =====================================
// ROOM POLLING
// =====================================

function startPolling() {
  stopPolling();

  roomPollInterval =
    setInterval(() => {
      if (currentRoomCode) {
        checkRoom(
          currentRoomCode
        );
      }
    }, 3000);
}

function stopPolling() {
  if (roomPollInterval) {
    clearInterval(
      roomPollInterval
    );

    roomPollInterval = null;
  }
}

// =====================================
// TIMER
// =====================================

function startTimer(endTime) {
  stopTimer();

  function tick() {
    const remaining =
      Number(endTime) -
      Date.now();

    if (remaining <= 0) {
      if (waitingTimer) {
        waitingTimer.textContent =
          "Room expired ⏰";
      }

      stopTimer();
      stopPolling();

      currentRoomCode = "";

      localStorage.removeItem(
        "room_code"
      );

      return;
    }

    const totalSeconds =
      Math.floor(
        remaining / 1000
      );

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const seconds =
      totalSeconds % 60;

    if (waitingTimer) {
      waitingTimer.textContent =
        `Room expires in ${minutes}:${String(
          seconds
        ).padStart(2, "0")}`;
    }
  }

  tick();

  timerInterval =
    setInterval(
      tick,
      1000
    );
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(
      timerInterval
    );

    timerInterval = null;
  }
}

// =====================================
// LUDO
// =====================================

function showLudo() {
  hideAll();

  if (ludoCard)
    ludoCard.style.display =
      "block";
}

// =====================================
// PROFILE
// =====================================

async function openProfile() {
  const customerId =
    localStorage.getItem(
      "customer_id"
    ) ||
    localStorage.getItem(
      "player_id"
    );

  if (!customerId) {
    showLogin();
    return;
  }

  hideAll();

  if (profileSection)
    profileSection.style.display =
      "block";

  await loadProfile(
    customerId
  );
}

async function loadProfile(customerId) {
  try {
    const response =
      await fetch(
        `${API}/customer/${encodeURIComponent(
          customerId
        )}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        data.error ||
        "Profile load failed"
      );
    }

    const customer =
      data.customer;

    saveCustomer(
      customer
    );

    renderProfile(
      customer
    );

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Profile load failed"
    );
  }
}

// =====================================
// RENDER PROFILE
// =====================================

function renderProfile(customer) {
  setText(
    "profileName",
    customer.name ||
    "Player"
  );

  setText(
    "profileId",
    `Player ID: ${
      customer.id || "---"
    }`
  );

  setText(
    "customerId",
    customer.id || "---"
  );

  setText(
    "profileWallet",
    money(
      customer.wallet_balance
    )
  );

  setText(
    "profileBonus",
    money(
      customer.bonus_balance
    )
  );

  setText(
    "battlePlayed",
    customer.battle_played || 0
  );

  setText(
    "coinWon",
    money(
      customer.coin_won
    )
  );

  setText(
    "referralEarned",
    money(
      customer.referral_earned
    )
  );

  setText(
    "withdrawalAmount",
    money(
      customer.withdrawal_amount
    )
  );

  setText(
    "profilePhone",
    customer.mobile ||
    "Not Added"
  );

  setText(
    "profileEmail",
    customer.email ||
    "Not Added"
  );

  setText(
    "kycStatus",
    customer.kyc_status ||
    "Pending"
  );
}

function setText(id, value) {
  const el =
    document.getElementById(id);

  if (el) {
    el.textContent =
      String(value);
  }
}

function money(value) {
  return `₹${Number(
    value || 0
  ).toFixed(2)}`;
}

// =====================================
// EDIT NAME
// =====================================

async function editProfile() {
  const customerId =
    localStorage.getItem(
      "customer_id"
    );

  if (!customerId) {
    showLogin();
    return;
  }

  const oldName =
    localStorage.getItem(
      "player_name"
    ) || "Player";

  const newName =
    prompt(
      "अपना नाम डालें:",
      oldName
    );

  if (newName === null)
    return;

  const name =
    clean(newName);

  if (name.length < 2) {
    alert(
      "कम से कम 2 अक्षर का नाम डालें।"
    );
    return;
  }

  try {
    const response =
      await fetch(
        `${API}/customer/update`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            customer_id:
              customerId,
            name: name
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        data.error ||
        "Name update failed"
      );
    }

    saveCustomer(
      data.customer
    );

    renderProfile(
      data.customer
    );

    alert(
      "Name updated successfully ✅"
    );

  } catch (error) {
    alert(
      error.message ||
      "Name update failed"
    );
  }
}

// =====================================
// EDIT EMAIL
// =====================================

async function editEmail() {
  const customerId =
    localStorage.getItem(
      "customer_id"
    );

  if (!customerId) {
    showLogin();
    return;
  }

  const oldEmail =
    localStorage.getItem(
      "email"
    ) || "";

  const newEmail =
    prompt(
      "अपना Email डालें:",
      oldEmail
    );

  if (newEmail === null)
    return;

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
    const response =
      await fetch(
        `${API}/customer/update`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            customer_id:
              customerId,
            email: email
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        data.error ||
        "Email update failed"
      );
    }

    saveCustomer(
      data.customer
    );

    renderProfile(
      data.customer
    );

    alert(
      "Email updated successfully ✅"
    );

  } catch (error) {
    alert(
      error.message ||
      "Email update failed"
    );
  }
}

// =====================================
// HOME / NAV
// =====================================

function goHome() {
  const id =
    localStorage.getItem(
      "customer_id"
    );

  if (!id) {
    showLogin();
    return;
  }

  showRoom();
}

function openWallet() {
  alert(
    "Wallet section जल्द उपलब्ध होगा।"
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

// =====================================
// BACK LOGIN
// =====================================

function backToLogin() {
  pendingMobile = "";

  if (otpInput)
    otpInput.value = "";

  showOtpMessage("");

  showLogin();
}

function showLogin() {
  hideAll();

  if (welcomeCard)
    welcomeCard.style.display =
      "block";

  if (playerMobileInput)
    playerMobileInput.focus();
}

// =====================================
// INPUTS
// =====================================

if (playerMobileInput) {
  playerMobileInput.addEventListener(
    "input",
    function () {
      this.value =
        digits(this.value)
          .slice(0, 10);
    }
  );
}

if (otpInput) {
  otpInput.addEventListener(
    "input",
    function () {
      this.value =
        digits(this.value)
          .slice(0, 6);
    }
  );
}

if (createRoomCodeInput) {
  createRoomCodeInput.addEventListener(
    "input",
    function () {
      this.value =
        digits(this.value)
          .slice(0, 8);
    }
  );
}

if (joinRoomCodeInput) {
  joinRoomCodeInput.addEventListener(
    "input",
    function () {
      this.value =
        digits(this.value)
          .slice(0, 8);
    }
  );
}

// =====================================
// BUTTONS
// =====================================

if (startBtn)
  startBtn.addEventListener(
    "click",
    sendOTP
  );

if (verifyOtpBtn)
  verifyOtpBtn.addEventListener(
    "click",
    verifyOTP
  );

if (backLoginBtn)
  backLoginBtn.addEventListener(
    "click",
    backToLogin
  );

if (createRoomBtn)
  createRoomBtn.addEventListener(
    "click",
    createRoom
  );

if (joinRoomBtn)
  joinRoomBtn.addEventListener(
    "click",
    joinRoom
  );

// =====================================
// ENTER KEY
// =====================================

if (playerMobileInput) {
  playerMobileInput.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Enter") {
        sendOTP();
      }
    }
  );
}

if (otpInput) {
  otpInput.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Enter") {
        verifyOTP();
      }
    }
  );
}

// =====================================
// GLOBAL
// =====================================

window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.backToLogin = backToLogin;

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.checkRoom = checkRoom;

window.openProfile = openProfile;
window.editProfile = editProfile;
window.editEmail = editEmail;

window.goHome = goHome;
window.openWallet = openWallet;
window.openRefer = openRefer;
window.openSupport = openSupport;

// =====================================
// START
// =====================================

showLogin();
