// =====================================
// BALAJI LUDO KING - HOME
// =====================================


// =====================================
// WALLET BALANCE
// =====================================

const walletBalance =
  document.getElementById("walletBalance");

if (walletBalance) {

  const balance =
    localStorage.getItem("balajiWalletBalance");

  if (balance) {
    walletBalance.textContent = "₹" + balance;
  } else {
    walletBalance.textContent = "₹0";
  }

}


// =====================================
// PLAY NOW → BATTLE
// =====================================

const playNowBtn =
  document.getElementById("playNowBtn");

if (playNowBtn) {

  playNowBtn.addEventListener(
    "click",
    function () {

      window.location.href =
        "battle.html";

    }
  );

}


// =====================================
// SUPPORT
// =====================================

const supportBtn =
  document.getElementById("supportBtn");

if (supportBtn) {

  supportBtn.addEventListener(
    "click",
    function () {

      window.location.href =
        "support.html";

    }
  );

}
