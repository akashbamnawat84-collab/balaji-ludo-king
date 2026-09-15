/* =========================
   BALAJI LUDO KING
   HOME JAVASCRIPT
========================= */


/* =========================
   PLAY NOW
========================= */

const playNowBtn = document.getElementById("playNowBtn");

if (playNowBtn) {

  playNowBtn.addEventListener("click", function () {

    window.location.href = "index.html";

  });

}


/* =========================
   WALLET
========================= */

const walletBtn = document.getElementById("walletBtn");
const walletNavBtn = document.getElementById("walletNavBtn");

function openWallet() {

  window.location.href = "wallet.html";

}


if (walletBtn) {

  walletBtn.addEventListener("click", openWallet);

}


if (walletNavBtn) {

  walletNavBtn.addEventListener("click", openWallet);

}


/* =========================
   PROFILE
========================= */

const profileNavBtn = document.getElementById("profileNavBtn");

if (profileNavBtn) {

  profileNavBtn.addEventListener("click", function () {

    window.location.href = "profile.html";

  });

}
