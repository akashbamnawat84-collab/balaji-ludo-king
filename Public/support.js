// ======================================
// BALAJI LUDO KING - PROFILE
// ======================================

// ELEMENTS

const profileName =
  document.getElementById("profileName");

const profileMobile =
  document.getElementById("profileMobile");

const nameValue =
  document.getElementById("nameValue");

const mobileValue =
  document.getElementById("mobileValue");

const playerIdElement =
  document.getElementById("playerId");

const walletBtn =
  document.getElementById("walletBtn");

const referBtn =
  document.getElementById("referBtn");

const supportBtn =
  document.getElementById("supportBtn");

const logoutBtn =
  document.getElementById("logoutBtn");


// ======================================
// LOAD PROFILE
// ======================================

function loadProfile() {

  const savedName =
    localStorage.getItem("balajiPlayerName");

  const savedMobile =
    localStorage.getItem("balajiMobile");

  let playerId =
    localStorage.getItem("balajiPlayerId");


  const name =
    savedName || "Player";

  const mobile =
    savedMobile || "Not available";


  // Generate Player ID once

  if (!playerId) {

    playerId =
      "BLK-" +
      Math.floor(
        100000 + Math.random() * 900000
      );

    localStorage.setItem(
      "balajiPlayerId",
      playerId
    );
  }


  // Show profile data

  profileName.textContent = name;
  nameValue.textContent = name;

  profileMobile.textContent = mobile;
  mobileValue.textContent = mobile;

  playerIdElement.textContent = playerId;
}


// ======================================
// WALLET
// ======================================

if (walletBtn) {

  walletBtn.addEventListener("click", () => {

    window.location.href =
      "wallet.html";

  });

}


// ======================================
// REFER & EARN
// ======================================

if (referBtn) {

  referBtn.addEventListener("click", () => {

    window.location.href =
      "refer.html";

  });

}


// ======================================
// SUPPORT
// ======================================

if (supportBtn) {

  supportBtn.addEventListener("click", () => {

    window.location.href =
      "support.html";

  });

}


// ======================================
// LOGOUT
// ======================================

if (logoutBtn) {

  logoutBtn.addEventListener("click", () => {

    const confirmLogout =
      confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem("balajiLogin");

    window.location.href =
      "login.html";

  });

}


// ======================================
// START
// ======================================

loadProfile();
