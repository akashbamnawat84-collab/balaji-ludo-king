// =========================================================
// BALAJI LUDO KING - WALLET.JS - BAJIGER THEME
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Balance dikhao
  const walletEl = document.getElementById("walletBalance");
  let bal = localStorage.getItem("balaji_wallet") || "0";
  if (walletEl) walletEl.innerText = bal;

  // 2. Firebase se real balance (agar hai to)
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          const db = firebase.firestore();
          const doc = await db.collection("users").doc(user.uid).get();
          if (doc.exists && walletEl) {
            walletEl.innerText = doc.data().wallet || 0;
          }
        }
      });
    }
  } catch(e) {}
});

// --- ADD MONEY ---
function addMoney() {
  let amt = prompt("Kitna amount add karna hai?\nMin: ₹10");
  if (!amt) return;
  amt = parseInt(amt);

  if (isNaN(amt) || amt < 10) {
    alert("Minimum ₹10 add kar sakte ho");
    return;
  }

  // Demo ke liye direct add - Real me Razorpay / UPI lagega
  if (confirm(`₹${amt} add karna hai?\nUPI: Demo me direct wallet me jayega`)) {
    updateWallet(amt);
    addTxn(`Add Cash`, `+₹${amt}`, "plus");
    alert(`₹${amt} Added Successfully! 💰`);
    setTimeout(() => location.reload(), 500);
  }
}

// --- WITHDRAW MONEY ---
function withdrawMoney() {
  let bal = parseInt(localStorage.getItem("balaji_wallet") || 0);
  if (bal < 100) {
    alert(`Withdraw ke liye min ₹100 hona chahiye\nAapka balance: ₹${bal}`);
    return;
  }

  let amt = prompt(`Withdraw Amount? (Min ₹100)\nAapka Balance: ₹${bal}`);
  if (!amt) return;
  amt = parseInt(amt);

  if (isNaN(amt) || amt < 100) {
    alert("Minimum ₹100 withdraw");
    return;
  }
  if (amt > bal) {
    alert("Balance kam hai!");
    return;
  }

  let upi = prompt("Apna UPI ID daalo (e.g. 8619706213@paytm)");
  if (!upi) return;

  if (confirm(`₹${amt} withdraw karna hai?\nUPI: ${upi}\n30 sec me paisa aayega`)) {
    updateWallet(-amt);
    addTxn(`Withdraw to ${upi}`, `-₹${amt}`, "minus");
    alert(`Withdraw Request Success! ₹${amt}\nSupport: 8619706213 pe contact karo`);
    setTimeout(() => location.reload(), 500);
  }
}

// --- Helper Functions ---
function updateWallet(amount) {
  let current = parseInt(localStorage.getItem("balaji_wallet") || 0);
  let newBal = current + amount;
  localStorage.setItem("balaji_wallet", newBal);
  const el = document.getElementById("walletBalance");
  if (el) el.innerText = newBal;
  
  // Firebase me bhi update karo
  try {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      const uid = firebase.auth().currentUser.uid;
      firebase.firestore().collection("users").doc(uid).update({
        wallet: newBal
      });
    }
  } catch(e) {}
  return newBal;
}

function addTxn(title, amount, type) {
  let txns = JSON.parse(localStorage.getItem("balaji_txns") || "[]");
  txns.unshift({
    title: title,
    amount: amount,
    type: type,
    time: new Date().toLocaleString()
  });
  localStorage.setItem("balaji_txns", JSON.stringify(txns));
}
