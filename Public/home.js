// =========================================================
// BALAJI LUDO KING - HOME.JS - BAJIGER THEME
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Wallet Balance Show Karna
  const walletEl = document.getElementById("walletBalance");
  let balance = localStorage.getItem("balaji_wallet") || 0;
  
  if (walletEl) {
    walletEl.innerText = balance;
    // Animation ke liye
    walletEl.style.color = "#ffcc00";
  }

  // 2. Agar Login nahi hai to Login pe bhejo
  const user = localStorage.getItem("balaji_user");
  // Agar user chahe to isko comment kar sakta hai
  // if (!user) {
  //   window.location.href = "login.html";
  // }

  // 3. Play Buttons par Click Effect
  const playBtns = document.querySelectorAll(".game-card .right, .btn-gold, .btn-outline");
  playBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Click animation
      btn.style.transform = "scale(0.95)";
      setTimeout(() => btn.style.transform = "scale(1)", 150);
      
      // Battle page pe jao
      // e.preventDefault(); // agar direct jana hai to hata do
      console.log("Going to battle...");
    });
  });

  // 4. Stats ko live jaisa dikhana (Bajiger jaisa)
  function animateStats() {
    const stats = document.querySelectorAll(".stat-box b");
    if (stats.length >= 2) {
      // Players count ko har 3 sec me badhao
      setInterval(() => {
        let players = document.querySelector(".quick-stats .stat-box:first-child b");
        if (players) {
          let count = Math.floor(Math.random() * 500) + 100000;
          players.innerText = (count / 1000).toFixed(1) + "K+";
        }
      }, 3000);
    }
  }
  animateStats();

  // 5. WhatsApp Support Click
  const supportBtn = document.querySelector('a[href*="wa.me"]');
  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      console.log("Support opened: 8619706213");
    });
  }

  console.log("✅ Balaji Ludo King Home Loaded - Bajiger Theme Active");
});

// 6. Global Function - Wallet Update ke liye
function updateWallet(amount) {
  let current = parseInt(localStorage.getItem("balaji_wallet") || 0);
  let newBal = current + amount;
  localStorage.setItem("balaji_wallet", newBal);
  document.getElementById("walletBalance").innerText = newBal;
}
