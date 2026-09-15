// =====================================
// BALAJI LUDO KING - HOME
// =====================================


// Wallet balance
const walletBalance = document.getElementById("walletBalance");

if (walletBalance) {
  const balance = localStorage.getItem("balajiWalletBalance");

  if (balance) {
    walletBalance.textContent = "₹" + balance;
  } else {
    walletBalance.textContent = "₹0";
  }
}


// =====================================
// PLAY NOW
// =====================================

const playNowBtn = document.getElementById("playNowBtn");

if (playNowBtn) {
  playNowBtn.addEventListener("click", function () {

    // Room/Match page
    window.location.href = "room.html";

  });
}


// =====================================
// SUPPORT
// =====================================

const supportBtn = document.getElementById("supportBtn");

if (supportBtn) {
  supportBtn.addEventListener("click", function () {

    window.location.href = "support.html";

  });
}
