// ==========================================
// BALAJI LUDO KING - BATTLE SYSTEM
// DEMO COINS ONLY
// ==========================================

const MIN_BET = 50;

// ------------------------------------------
// OPEN BATTLES
// ------------------------------------------

let openBattles = JSON.parse(
  localStorage.getItem("balajiOpenBattles") || "[]"
);

// ------------------------------------------
// RUNNING BATTLES
// ------------------------------------------

let runningBattles = JSON.parse(
  localStorage.getItem("balajiRunningBattles") || "[]"
);


// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const amountInput =
  document.getElementById("amountInput");

const setBetBtn =
  document.getElementById("setBetBtn");

const openBattlesContainer =
  document.getElementById("openBattles");

const runningBattlesContainer =
  document.getElementById("runningBattles");

const rulesBtn =
  document.getElementById("rulesBtn");

const rulesModal =
  document.getElementById("rulesModal");

const closeRulesBtn =
  document.getElementById("closeRulesBtn");


// ------------------------------------------
// PLAYER NAME
// ------------------------------------------

function getPlayerName() {

  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    "Player"
  );

}


// ------------------------------------------
// SAVE DATA
// ------------------------------------------

function saveBattles() {

  localStorage.setItem(
    "balajiOpenBattles",
    JSON.stringify(openBattles)
  );

  localStorage.setItem(
    "balajiRunningBattles",
    JSON.stringify(runningBattles)
  );

}


// ------------------------------------------
// CREATE BET
// ------------------------------------------

if (setBetBtn) {

  setBetBtn.addEventListener("click", function () {

    const amount = Number(
      amountInput ? amountInput.value : 0
    );

    if (!amount || amount < MIN_BET) {

      alert(
        "Minimum 50 Demo Coins की bet लगानी है।"
      );

      return;
    }

    // --------------------------------------
    // केवल 50 के multiples
    // 50, 100, 150, 200, 250, 300...
    // --------------------------------------

    if (amount % 50 !== 0) {

      alert(
        "Bet amount 50, 100, 150, 200, 250, 300... में होना चाहिए।"
      );

      return;
    }

    // --------------------------------------
    // DEMO PRIZE
    //
