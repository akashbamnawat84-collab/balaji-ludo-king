const balanceElement = document.getElementById("balance");

const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

const depositSection = document.getElementById("depositSection");
const withdrawSection = document.getElementById("withdrawSection");

const depositAmount = document.getElementById("depositAmount");
const withdrawAmount = document.getElementById("withdrawAmount");

const demoUpi = document.getElementById("demoUpi");

const submitDeposit = document.getElementById("submitDeposit");
const submitWithdraw = document.getElementById("submitWithdraw");

const depositMessage = document.getElementById("depositMessage");
const withdrawMessage = document.getElementById("withdrawMessage");

const transactionsElement = document.getElementById("transactions");


/*
  ============================
  DEMO WALLET DATA
  ============================
*/

let balance = Number(
  localStorage.getItem("balajiDemoBalance")
) || 0;

let transactions = JSON.parse(
  localStorage.getItem("balajiDemoTransactions")
) || [];


/*
  ============================
  UPDATE BALANCE
  ============================
*/

function updateBalance() {

  balanceElement.textContent =
    balance.toFixed(2);

  localStorage.setItem(
    "balajiDemoBalance",
    balance.toString()
  );
}


/*
  ============================
  SAVE TRANSACTIONS
  ============================
*/

function saveTransactions() {

  localStorage.setItem(
    "balajiDemoTransactions",
    JSON.stringify(transactions)
  );
}


/*
  ============================
  SHOW TRANSACTIONS
  ============================
*/

function showTransactions() {

  if (transactions.length === 0) {

    transactionsElement.innerHTML =
      '<p class="empty">No transactions yet</p>';

    return;
  }


  transactionsElement.innerHTML = "";


  transactions
    .slice()
    .reverse()
    .forEach(transaction => {

      const div =
        document.createElement("div");

      div.className = "transaction";


      const left =
        document.createElement("div");

      const title =
        document.createElement("div");

      title.className = "transaction-title";

      title.textContent =
        transaction.type === "deposit"
          ? "💰 Demo Deposit"
          : "🏦 Demo Withdrawal";


      const date =
        document.createElement("div");

      date.className = "transaction-date";

      date.textContent =
        transaction.date;


      const status =
        document.createElement("div");

      status.className = "status";

      status.textContent =
        "Status: " + transaction.status;


      left.appendChild(title);
      left.appendChild(date);
      left.appendChild(status);


      const amount =
        document.createElement("div");

      amount.className =
        "transaction-amount " +
        (transaction.type === "deposit"
          ? "deposit-text"
          : "withdraw-text");


      amount.textContent =
        (transaction.type === "deposit"
          ? "+"
          : "-") +
        " ₹" +
        transaction.amount.toFixed(2);


      div.appendChild(left);
      div.appendChild(amount);

      transactionsElement.appendChild(div);

    });

}


/*
  ============================
  DEPOSIT BUTTON
  ============================
*/

depositBtn.addEventListener("click", () => {

  depositSection.classList.remove("hidden");

  withdrawSection.classList.add("hidden");

  depositMessage.textContent = "";

  depositAmount.focus();

});


/*
  ============================
  WITHDRAW BUTTON
  ============================
*/

withdrawBtn.addEventListener("click", () => {

  withdrawSection.classList.remove("hidden");

  depositSection.classList.add("hidden");

  withdrawMessage.textContent = "";

  withdrawAmount.focus();

});


/*
  ============================
  DEMO DEPOSIT
  ============================
*/

submitDeposit.addEventListener("click", () => {

  const amount =
    Number(depositAmount.value);


  if (!amount || amount <= 0) {

    depositMessage.textContent =
      "कृपया सही amount डालें।";

    return;
  }


  if (amount > 100000) {

    depositMessage.textContent =
      "Demo limit: ₹100000";

    return;
  }


  balance += amount;


  transactions.push({

    type: "deposit",

    amount: amount,

    status: "APPROVED - DEMO",

    date: new Date().toLocaleString("en-IN")

  });


  saveTransactions();

  updateBalance();

  showTransactions();


  depositAmount.value = "";


  depositMessage.textContent =
    "✅ Demo balance successfully added.";


});


/*
  ============================
  DEMO WITHDRAWAL
  ============================
*/

submitWithdraw.addEventListener("click", () => {

  const amount =
    Number(withdrawAmount.value);

  const upi =
    demoUpi.value.trim();


  if (!amount || amount <= 0) {

    withdrawMessage.textContent =
      "कृपया सही withdrawal amount डालें।";

    return;
  }


  if (!upi) {

    withdrawMessage.textContent =
      "कृपया Demo UPI ID डालें।";

    return;
  }


  if (!upi.includes("@")) {

    withdrawMessage.textContent =
      "Demo UPI ID का format सही नहीं है।";

    return;
  }


  if (amount > balance) {

    withdrawMessage.textContent =
      "❌ Insufficient demo balance.";

    return;
  }


  balance -= amount;


  transactions.push({

    type: "withdraw",

    amount: amount,

    upi: upi,

    status: "PENDING - DEMO",

    date: new Date().toLocaleString("en-IN")

  });


  saveTransactions();

  updateBalance();

  showTransactions();


  withdrawAmount.value = "";

  demoUpi.value = "";


  withdrawMessage.textContent =
    "✅ Demo withdrawal request created.";

});


/*
  ============================
  START
  ============================
*/

updateBalance();

showTransactions();
