// ======================================
// BALAJI LUDO KING - WALLET
// ======================================

const balanceElement = document.getElementById("balance");
const transactionsElement = document.getElementById("transactions");

const addMoneyBtn = document.getElementById("addMoneyBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

const addMoneyAction = document.getElementById("addMoneyAction");
const withdrawAction = document.getElementById("withdrawAction");


// ======================================
// LOAD WALLET
// ======================================

function loadWallet() {

  const savedBalance =
    localStorage.getItem("balajiWalletBalance");

  const balance = savedBalance
    ? Number(savedBalance)
    : 0;

  balanceElement.textContent =
    `₹${balance.toFixed(2)}`;
}


// ======================================
// ADD MONEY
// ======================================

function addMoney() {

  alert(
    "Add Money section is ready.\nPayment integration will be connected later."
  );
}


// ======================================
// WITHDRAW
// ======================================

function withdrawMoney() {

  const savedBalance =
    localStorage.getItem("balajiWalletBalance");

  const balance = savedBalance
    ? Number(savedBalance)
    : 0;

  if (balance <= 0) {
    alert("Your wallet balance is ₹0.00");
    return;
  }

  alert(
    "Withdraw section is ready.\nWithdrawal system will be connected later."
  );
}


// ======================================
// EVENTS
// ======================================

addMoneyBtn.addEventListener("click", addMoney);
addMoneyAction.addEventListener("click", addMoney);

withdrawBtn.addEventListener("click", withdrawMoney);
withdrawAction.addEventListener("click", withdrawMoney);


// ======================================
// START
// ======================================

loadWallet();
