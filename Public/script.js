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
const createRoomCodeInput = document.getElementById("createRoomCodeInput");
const createMessage = document.getElementById("createMessage");

const joinSection = document.getElementById("joinSection");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const joinMessage = document.getElementById("joinMessage");

const createdRoom = document.getElementById("createdRoom");
const joinedRoom = document.getElementById("joinedRoom");
const gameStartBox = document.getElementById("gameStartBox");

const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const joinedRoomCode = document.getElementById("joinedRoomCode");

const player1Status = document.getElementById("player1Status");
const player2Status = document.getElementById("player2Status");

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
  Number(localStorage.getItem("balaji_player_number") || "0");

let wallet = 0;

let roomPollTimer = null;


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

    loginMessage.textContent =
      "कृपया अपना नाम डालें।";

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
    wallet = Number(
      data.wallet_balance || 0
    );

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
      error.message ||
      "Login failed.";

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
    moneyBalance
