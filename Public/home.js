// =========================================================
// BALAJI LUDO KING - HOME.JS - FINAL BAJIGER THEME
// FULL CODE IN ONE FILE
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
  
  const walletEl = document.getElementById("walletBalance");
  const battleListEl = document.getElementById("battleList");

  // --- 1. WALLET BALANCE ---
  let localBal = localStorage.getItem("balaji_wallet") || "0";
  if (walletEl) walletEl.innerText = localBal;

  // Firebase se Real Balance (Agar Firebase hai to)
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          localStorage.setItem("balaji_user", user.uid);
          const db = firebase.firestore();
          const doc = await db.collection("users").doc(user.uid).get();
          if (doc.exists) {
            let realBal = doc.data().wallet || 0;
            if (walletEl) walletEl.innerText = realBal;
            localStorage.setItem("balaji_wallet", realBal);
          }
        } else {
          // Login nahi hai to login page pe bhejo
          // window.location.href = "login.html";
        }
      });
    }
  } catch (e) {
    console.log("Firebase not connected, using local wallet");
  }

  // --- 2. LIVE BATTLES LOAD (Demo Data) ---
  // Aap isko Firebase se bhi load kara sakte ho
  const demoBattles = [
    { amount: 10, win: 18, players: 2 },
    { amount: 25, win: 45, players: 5 },
    { amount: 50, win: 90, players: 12 },
    { amount: 100, win: 180, players: 8 },
    { amount: 500, win: 900, players: 3 },
  ];

  function renderBattles() {
    if (!battleListEl) return;
    battleListEl.innerHTML = "";
    demoBattles.forEach(b => {
      battleListEl.innerHTML += `
        <div class="game-card">
          <div class="left">
            <h3>₹${b.amount} Battle</h3>
            <p>Win ₹${b.win} • ${b.players} Playing</p>
          </div>
          <a href="battle.html?amount=${b.amount}" class="right">PLAY</a>
        </div>
      `;
    });
  }
  renderBattles();

  // --- 3. BUTTON CLICK ANIMATION ---
  document.addEventListener("click", (e) => {
    if (e.target.closest(".right") || e.target.closest(".btn-gold")) {
      let btn = e.target.closest(".right") || e.target.closest(".btn-gold");
      btn.style.transform = "scale(0.92)";
      setTimeout(() => btn.style.transform = "scale(1)", 150);
    }
  });

  // --- 4. LIVE PLAYER COUNT (Bajiger Style) ---
  setInterval(() => {
    const players = document.querySelector(".quick-stats .stat-box:first-child b");
    if (players) {
      let count = Math.floor(Math.random() * 900) + 100200;
      players.innerText = (count / 1000).toFixed(1) + "K+";
    }
  }, 3500);

  // --- 5. SUPPORT BUTTON ---
  const waBtn = document.querySelector('a[href*="wa.me"]');
  if (waBtn) {
    waBtn.addEventListener("click", () => {
      console.log("Support: 8619706213");
    });
  }

  console.log("✅ BALAJI LUDO KING - Home.js Loaded");
});

// --- 6. GLOBAL FUNCTIONS ---
function updateWallet(amount) {
  let current = parseInt(localStorage.getItem("balaji_wallet") || 0);
  let newBal = current + amount;
  localStorage.setItem("balaji_wallet", newBal);
  const el = document.getElementById("walletBalance");
  if (el) el.innerText = newBal;
  return newBal;
}

function goToBattle(amount) {
  window.location.href = `battle.html?amount=${amount}`;
}
