const API = "/api";

// =====================================
// ELEMENTS
// =====================================

const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const createRoomCodeInput =
  document.getElementById("createRoomCode");

const joinRoomCodeInput =
  document.getElementById("joinRoomCode");

const roomMessage =
  document.getElementById("roomMessage");

const player1Status =
  document.getElementById("player1Status");

const player2Status =
  document.getElementById("player2Status");

const waitingTimer =
  document.getElementById("waitingTimer");


// =====================================
// CUSTOMER DATA
// =====================================

let playerId =
  localStorage.getItem("player_id") ||
  localStorage.getItem("playerId") ||
  "";

let playerName =
  localStorage.getItem("player_name") ||
  localStorage.getItem("playerName") ||
  "";

let playerMobile =
  localStorage.getItem("phone_number") ||
  localStorage.getItem("mobile") ||
  "";

let currentRoomCode =
  localStorage.getItem("room_code") || "";

let currentRoom = null;

let roomTimer = null;
let roomPoll = null;


// =====================================
// HELPERS
// =====================================

function clean(value) {
  return String(value ?? "").trim();
}

function showMessage(text, type = "") {
  if (message) {
    message.textContent = text;
    message.className = type;
  }
}

function showRoomMessage(text, type = "") {
  if (roomMessage) {
    roomMessage.textContent = text;
    roomMessage.className = type;
  }
}

function saveCustomer(customer) {
  if (!customer) return;

  playerId =
    customer.customer_id ||
    customer.id ||
    "";

  playerName =
    customer.name ||
    "";

  playerMobile =
    customer.mobile ||
    customer.phone ||
    "";

  localStorage.setItem(
    "player_id",
    playerId
  );

  localStorage.setItem(
    "playerId",
    playerId
  );

  localStorage.setItem(
    "player_name",
    playerName
  );

  localStorage.setItem(
    "playerName",
    playerName
  );

  localStorage.setItem(
    "phone_number",
    playerMobile
  );

  localStorage.setItem(
    "mobile",
    playerMobile
  );

  localStorage.setItem(
    "wallet_balance",
    customer.wallet_balance || 0
  );

  localStorage.setItem(
    "bonus_balance",
    customer.bonus_balance || 0
  );

  localStorage.setItem(
    "battle_played",
    customer.battle_played || 0
  );

  localStorage.setItem(
    "coin_won",
    customer.coin_won || 0
  );

  localStorage.setItem(
    "referral_earned",
    customer.referral_earned || 0
  );

  localStorage.setItem(
    "withdrawal_amount",
    customer.withdrawal_amount || 0
  );

  localStorage.setItem(
    "email",
    customer.email || ""
  );
}


// =====================================
// LOGIN
// =====================================

async function loginCustomer() {

  const name = clean(
    playerNameInput?.value
  );

  if (!name) {
    showMessage(
      "अपना नाम डालें।",
      "error"
    );
    return;
  }

  let mobile = playerMobile;

  if (!mobile) {

    mobile = prompt(
      "अपना 10-digit Mobile Number डालें:"
    );

    mobile = clean(mobile);
  }

  if (!/^\d{10}$/.test(mobile)) {
    showMessage(
      "Valid 10-digit mobile number डालें।",
      "error"
    );
    return;
  }

  showMessage("Login हो रहा है...");

  try {

    const response = await fetch(
      API + "/login",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          name: name,
          mobile: mobile
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Login failed"
      );
    }

    if (!data.customer) {
      throw new Error(
        "Customer data नहीं मिला।"
      );
    }

    saveCustomer(
      data.customer
    );

    showMessage(
      data.existing
        ? "Welcome back 👋"
        : "Account created successfully ✅",
      "success"
    );

    setTimeout(() => {
      openRoomSection();
    }, 500);

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ " +
        (error.message ||
          "Login failed"),
      "error"
    );
  }
}


// =====================================
// START BUTTON
// =====================================

if (startBtn) {
  startBtn.addEventListener(
    "click",
    loginCustomer
  );
}


// =====================================
// OPEN ROOM SECTION
// =====================================

function openRoomSection() {

  if (welcomeCard) {
    welcomeCard.style.display =
      "none";
  }

  if (roomCard) {
    roomCard.style.display =
      "block";
  }

  if (ludoCard) {
    ludoCard.style.display =
      "none";
  }

  updateRoomUI();
}


// =====================================
// CREATE ROOM
// =====================================

async function createRoom() {

  if (!playerId) {
    showRoomMessage(
      "पहले login करें।",
      "error"
    );
    return;
  }

  const code = clean(
    createRoomCodeInput?.value
  );

  if (!/^\d{8}$/.test(code)) {

    showRoomMessage(
      "❌ 8-digit Room Code डालें।",
      "error"
    );

    return;
  }

  showRoomMessage(
    "Room create हो रहा है..."
  );

  try {

    const response = await fetch(
      API + "/rooms/create",
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
        "Room create नहीं हुआ"
      );
    }

    currentRoomCode = code;
    currentRoom =
      data.room || null;

    localStorage.setItem(
      "room_code",
      code
    );

    localStorage.setItem(
      "roomCode",
      code
    );

    showRoomMessage(
      "✅ Room Created: " + code,
      "success"
    );

    updateRoomUI();

    startRoomTimer(
      currentRoom?.created_at ||
      Date.now()
    );

    startRoomPolling();

  } catch (error) {

    console.error(error);

    showRoomMessage(
      "❌ " +
        (error.message ||
          "Room create failed"),
      "error"
    );
  }
}


// =====================================
// JOIN ROOM
// =====================================

async function joinRoom() {

  if (!playerId) {
    showRoomMessage(
      "पहले login करें।",
      "error"
    );
    return;
  }

  const code = clean(
    joinRoomCodeInput?.value
  );

  if (!/^\d{8}$/.test(code)) {

    showRoomMessage(
      "❌ 8-digit Room Code डालें।",
      "error"
    );

    return;
  }

  showRoomMessage(
    "Room join हो रहा है..."
  );

  try {

    const response = await fetch(
      API + "/rooms/join",
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
        "Room join नहीं हुआ"
      );
    }

    currentRoomCode = code;
    currentRoom =
      data.room || null;

    localStorage.setItem(
      "room_code",
      code
    );

    localStorage.setItem(
      "roomCode",
      code
    );

    showRoomMessage(
      "✅ Room Joined",
      "success"
    );

    updateRoomUI();

    if (
      currentRoom &&
      currentRoom.status ===
        "WAITING"
    ) {
      startRoomTimer(
        currentRoom.created_at
      );

      startRoomPolling();
    }

    if (
      currentRoom &&
      currentRoom.status ===
        "READY"
    ) {
      showReadyState();
    }

  } catch (error) {

    console.error(error);

    showRoomMessage(
      "❌ " +
        (error.message ||
          "Join failed"),
      "error"
    );
  }
}


// =====================================
// BUTTONS
// =====================================

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


// =====================================
// ROOM UI
// =====================================

function updateRoomUI() {

  if (!currentRoom) return;

  if (player1Status) {

    player1Status.textContent =
      currentRoom.player1_name
        ? currentRoom.player1_name +
          " • Ready"
        : "Player 1 • Waiting...";
  }

  if (player2Status) {

    player2Status.textContent =
      currentRoom.player2_name
        ? currentRoom.player2_name +
          " • Ready"
        : "Player 2 • Waiting...";
  }
}


// =====================================
// READY STATE
// =====================================

function showReadyState() {

  stopRoomTimer();
  stopRoomPolling();

  updateRoomUI();

  showRoomMessage(
    "🎮 Both Players Ready!",
    "success"
  );

  if (ludoCard) {
    ludoCard.style.display =
      "block";
  }
}


// =====================================
// ROOM POLLING
// =====================================

function startRoomPolling() {

  stopRoomPolling();

  roomPoll = setInterval(
    checkRoom,
    3000
  );
}

function stopRoomPolling() {

  if (roomPoll) {
    clearInterval(roomPoll);
    roomPoll = null;
  }
}

async function checkRoom() {

  if (!currentRoomCode) return;

  try {

    const response =
      await fetch(
        API +
          "/rooms/" +
          currentRoomCode
      );

    const data =
      await response.json();

    if (!response.ok) {

      if (response.status === 410) {

        showRoomMessage(
          "⏰ Room expire हो गया।",
          "error"
        );

        stopRoomPolling();
        stopRoomTimer();

        currentRoom = null;

        localStorage.removeItem(
          "room_code"
        );

        return;
      }

      return;
    }

    currentRoom = data;

    updateRoomUI();

    if (
      data.status === "READY" ||
      data.player2_id
    ) {
      showReadyState();
    }

  } catch (error) {

    console.error(
      "Room check error:",
      error
    );
  }
}


// =====================================
// 5 MINUTE TIMER
// =====================================

function startRoomTimer(
  createdAt
) {

  stopRoomTimer();

  const start =
    Number(createdAt);

  if (!Number.isFinite(start)) {
    return;
  }

  function updateTimer() {

    const elapsed =
      Date.now() - start;

    const remaining =
      Math.max(
        0,
        5 * 60 * 1000 -
          elapsed
      );

    const seconds =
      Math.ceil(
        remaining / 1000
      );

    const minutes =
      Math.floor(
        seconds / 60
      );

    const secs =
      seconds % 60;

    if (waitingTimer) {

      waitingTimer.textContent =
        "⏱️ Room expires in " +
        minutes +
        ":" +
        String(secs)
          .padStart(2, "0");
    }

    if (remaining <= 0) {

      stopRoomTimer();

      if (waitingTimer) {
        waitingTimer.textContent =
          "⏰ Room Expired";
      }

      checkRoom();
    }
  }

  updateTimer();

  roomTimer =
    setInterval(
      updateTimer,
      1000
    );
}

function stopRoomTimer() {

  if (roomTimer) {
    clearInterval(roomTimer);
    roomTimer = null;
  }
}


// =====================================
// CANCEL ROOM
// =====================================

async function cancelRoom() {

  if (
    !playerId ||
    !currentRoomCode
  ) {
    return;
  }

  try {

    const response =
      await fetch(
        API + "/rooms/cancel",
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

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Cancel failed"
      );
    }

    stopRoomTimer();
    stopRoomPolling();

    currentRoom = null;

    localStorage.removeItem(
      "room_code"
    );

    localStorage.removeItem(
      "roomCode"
    );

    showRoomMessage(
      "Room cancelled.",
      "success"
    );

  } catch (error) {

    showRoomMessage(
      "❌ " +
        (error.message ||
          "Cancel failed"),
      "error"
    );
  }
}


// =====================================
// SUBMIT RESULT
// =====================================

async function submitResult(
  screenshot
) {

  if (
    !playerId ||
    !currentRoomCode
  ) {

    alert(
      "Player और Room Code required."
    );

    return;
  }

  if (!screenshot) {

    alert(
      "Screenshot select करें।"
    );

    return;
  }

  try {

    const response =
      await fetch(
        API + "/rooms/result",
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
              screenshot
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Result submit failed"
      );
    }

    alert(
      "✅ Screenshot submitted successfully"
    );

  } catch (error) {

    alert(
      "❌ " +
        (error.message ||
          "Result submit failed")
    );
  }
}


// =====================================
// PROFILE
// =====================================

async function loadProfile() {

  const customerId =
    localStorage.getItem(
      "player_id"
    ) ||
    localStorage.getItem(
      "playerId"
    );

  if (!customerId) {
    return;
  }

  try {

    const response =
      await fetch(
        API +
          "/customer/" +
          encodeURIComponent(
            customerId
          )
      );

    const data =
      await response.json();

    if (
      response.ok &&
      data.customer
    ) {

      saveCustomer(
        data.customer
      );

      renderProfile(
        data.customer
      );

    } else {

      renderProfileFromStorage();
    }

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );

    renderProfileFromStorage();
  }
}


// =====================================
// RENDER PROFILE
// =====================================

function renderProfile(
  customer
) {

  const profileName =
    document.getElementById(
      "profileName"
    );

  const profileId =
    document.getElementById(
      "profileId"
    );

  const customerId =
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

  const battlePlayed =
    document.getElementById(
      "battlePlayed"
    );

  const coinWon =
    document.getElementById(
      "coinWon"
    );

  const referralEarned =
    document.getElementById(
      "referralEarned"
    );

  const withdrawalAmount =
    document.getElementById(
      "withdrawalAmount"
    );

  const profilePhone =
    document.getElementById(
      "profilePhone"
    );

  const profileEmail =
    document.getElementById(
      "profileEmail"
    );

  if (profileName)
    profileName.textContent =
      customer.name || "Player";

  if (profileId)
    profileId.textContent =
      "Player ID: " +
      (customer.id || "---");

  if (customerId)
    customerId.textContent =
      customer.customer_id ||
      customer.id ||
      "---";

  if (profileWallet)
    profileWallet.textContent =
      "₹" +
      Number(
        customer.wallet_balance || 0
      ).toFixed(2);

  if (profileBonus)
    profileBonus.textContent =
      "₹" +
      Number(
        customer.bonus_balance || 0
      ).toFixed(2);

  if (battlePlayed)
    battlePlayed.textContent =
      customer.battle_played || 0;

  if (coinWon)
    coinWon.textContent =
      "₹" +
      Number(
        customer.coin_won || 0
      ).toFixed(0);

  if (referralEarned)
    referralEarned.textContent =
      "₹" +
      Number(
        customer.referral_earned || 0
      ).toFixed(0);

  if (withdrawalAmount)
    withdrawalAmount.textContent =
      "₹" +
      Number(
        customer.withdrawal_amount || 0
      ).toFixed(0);

  if (profilePhone)
    profilePhone.textContent =
      customer.mobile ||
      "Not Added";

  if (profileEmail)
    profileEmail.textContent =
      customer.email ||
      "Not Added";
}


// =====================================
// PROFILE STORAGE FALLBACK
// =====================================

function renderProfileFromStorage() {

  renderProfile({
    id:
      localStorage.getItem(
        "player_id"
      ) || "---",

    customer_id:
      localStorage.getItem(
        "player_id"
      ) || "---",

    name:
      localStorage.getItem(
        "player_name"
      ) || "Player",

    mobile:
      localStorage.getItem(
        "phone_number"
      ) || "Not Added",

    wallet_balance:
      localStorage.getItem(
        "wallet_balance"
      ) || 0,

    bonus_balance:
      localStorage.getItem(
        "bonus_balance"
      ) || 0,

    battle_played:
      localStorage.getItem(
        "battle_played"
      ) || 0,

    coin_won:
      localStorage.getItem(
        "coin_won"
      ) || 0,

    referral_earned:
      localStorage.getItem(
        "referral_earned"
      ) || 0,

    withdrawal_amount:
      localStorage.getItem(
        "withdrawal_amount"
      ) || 0,

    email:
      localStorage.getItem(
        "email"
      ) || ""
  });
}


// =====================================
// PROFILE EDIT
// =====================================

async function editProfile() {

  const oldName =
    localStorage.getItem(
      "player_name"
    ) || "Player";

  const newName =
    prompt(
      "अपना नाम डालें:",
      oldName
    );

  if (
    !newName ||
    !newName.trim()
  ) {
    return;
  }

  const customerId =
    localStorage.getItem(
      "player_id"
    );

  const email =
    localStorage.getItem(
      "email"
    ) || "";

  try {

    const response =
      await fetch(
        API + "/customer/update",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            customer_id:
              customerId,
            name:
              newName.trim(),
            email:
              email
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Update failed"
      );
    }

    saveCustomer(
      data.customer
    );

    renderProfile(
      data.customer
    );

  } catch (error) {

    alert(
      "❌ " +
        (error.message ||
          "Profile update failed")
    );
  }
}


// =====================================
// EDIT EMAIL
// =====================================

async function editEmail() {

  const oldEmail =
    localStorage.getItem(
      "email"
    ) || "";

  const newEmail =
    prompt(
      "अपना Email डालें:",
      oldEmail
    );

  if (
    !newEmail ||
    !newEmail.trim()
  ) {
    return;
  }

  const customerId =
    localStorage.getItem(
      "player_id"
    );

  const name =
    localStorage.getItem(
      "player_name"
    ) || "Player";

  try {

    const response =
      await fetch(
        API + "/customer/update",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            customer_id:
              customerId,
            name:
              name,
            email:
              newEmail.trim()
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
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

  } catch (error) {

    alert(
      "❌ " +
        (error.message ||
          "Email update failed")
    );
  }
}


// =====================================
// NAVIGATION
// =====================================

function goHome() {

  const profileSection =
    document.getElementById(
      "profileSection"
    );

  if (profileSection) {
    profileSection.style.display =
      "none";
  }

  if (welcomeCard) {
    welcomeCard.style.display =
      "block";
  }

  if (roomCard) {
    roomCard.style.display =
      "none";
  }

  if (ludoCard) {
    ludoCard.style.display =
      "none";
  }
}

function openProfile() {

  if (welcomeCard) {
    welcomeCard.style.display =
      "none";
  }

  if (roomCard) {
    roomCard.style.display =
      "none";
  }

  if (ludoCard) {
    ludoCard.style.display =
      "none";
  }

  const profileSection =
    document.getElementById(
      "profileSection"
    );

  if (profileSection) {
    profileSection.style.display =
      "block";
  }

  loadProfile();
}

function openWallet() {
  alert(
    "Wallet section जल्द उपलब्ध होगा."
  );
}

function openRefer() {
  alert(
    "Refer & Earn section जल्द उपलब्ध होगा."
  );
}

function openSupport() {
  alert(
    "Support section जल्द उपलब्ध होगा."
  );
}


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (playerNameInput &&
        playerName) {
      playerNameInput.value =
        playerName;
    }

    if (playerId) {
      openRoomSection();
    }

    loadProfile();
  }
);


// =====================================
// GLOBAL FUNCTIONS
// =====================================

window.loginCustomer =
  loginCustomer;

window.createRoom =
  createRoom;

window.joinRoom =
  joinRoom;

window.cancelRoom =
  cancelRoom;

window.submitResult =
  submitResult;

window.loadProfile =
  loadProfile;

window.editProfile =
  editProfile;

window.editEmail =
  editEmail;

window.goHome =
  goHome;

window.openProfile =
  openProfile;

window.openWallet =
  openWallet;

window.openRefer =
  openRefer;

window.openSupport =
  openSupport;
