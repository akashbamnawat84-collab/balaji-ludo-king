// ==========================================
// BALAJI LUDO KING - BATTLE SYSTEM
// DEMO MODE
// ==========================================

const MIN_BET = 50;
const MAX_BET = 10000;

// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const amountInput = document.getElementById("amountInput");
const setBattleBtn = document.getElementById("setBattleBtn");
const amountMessage = document.getElementById("amountMessage");

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

const understandBtn =
  document.getElementById("understandBtn");


// ------------------------------------------
// PLAYER NAME
// ------------------------------------------

function getPlayerName() {

  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    "Customer"
  );

}


// ------------------------------------------
// LOAD BATTLES
// ------------------------------------------

let openBattles = JSON.parse(
  localStorage.getItem("balajiOpenBattles") || "[]"
);

let runningBattles = JSON.parse(
  localStorage.getItem("balajiRunningBattles") || "[]"
);


// ------------------------------------------
// SAVE BATTLES
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
// SET BATTLE
// ------------------------------------------

if (setBattleBtn) {

  setBattleBtn.addEventListener("click", function () {

    const amount = Number(
      amountInput.value
    );

    // Clear old message
    amountMessage.textContent = "";

    // Minimum
    if (!amount || amount < MIN_BET) {

      amountMessage.textContent =
        "Minimum 50 Demo Coins की bet लगाएँ।";

      return;
    }

    // Maximum
    if (amount > MAX_BET) {

      amountMessage.textContent =
        "Maximum 10000 Demo Coins तक है।";

      return;
    }

    // 50,100,150,200,250...
    if (amount % 50 !== 0) {

      amountMessage.textContent =
        "Amount 50, 100, 150, 200, 250... में होना चाहिए।";

      return;
    }

    // --------------------------------------
    // DEMO PRIZE
    // --------------------------------------

    const prize = Math.round(amount * 1.9);

    // --------------------------------------
    // CREATE OPEN BATTLE
    // --------------------------------------

    const battle = {

      id:
        "battle_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 1000),

      playerName: getPlayerName(),

      entry: amount,

      prize: prize,

      status: "OPEN",

      createdAt: Date.now()

    };

    // Add newest battle first
    openBattles.unshift(battle);

    saveBattles();

    // Clear input
    amountInput.value = "";

    // Success message
    amountMessage.textContent =
      "✅ Battle successfully Open हो गई।";

    // Refresh list
    renderOpenBattles();

    renderRunningBattles();

  });

}


// ------------------------------------------
// OPEN BATTLES
// ------------------------------------------

function renderOpenBattles() {

  if (!openBattlesContainer) return;

  openBattlesContainer.innerHTML = "";

  if (openBattles.length === 0) {

    openBattlesContainer.innerHTML = `
      <div class="empty-battle">
        अभी कोई Open Battle नहीं है।
      </div>
    `;

    return;
  }

  openBattles.forEach(function (battle, index) {

    const card =
      document.createElement("div");

    card.className = "battle-card";

    card.innerHTML = `

      <div class="battle-title">
        Challenge From
      </div>

      <div class="challenger-name">
        ${escapeHTML(battle.playerName)}
      </div>

      <div class="battle-info">

        <div>
          <span>ENTRY FEE</span>
          <strong>
            ${battle.entry} Demo Coins
          </strong>
        </div>

        <div>
          <span>PRIZE</span>
          <strong>
            ${battle.prize} Demo Coins
          </strong>
        </div>

      </div>

      <button
        type="button"
        class="play-battle-btn"
        onclick="playOpenBattle(${index})"
      >
        Play
      </button>

    `;

    openBattlesContainer.appendChild(card);

  });

}


// ------------------------------------------
// PLAY OPEN BATTLE
// ------------------------------------------

function playOpenBattle(index) {

  const battle = openBattles[index];

  if (!battle) return;

  const secondPlayer =
    getPlayerName();

  // ----------------------------------------
  // DO NOT PLAY YOUR OWN BATTLE
  // ----------------------------------------

  if (
    battle.playerName === secondPlayer
  ) {

    alert(
      "आप अपनी खुद की Battle Play नहीं कर सकते।"
    );

    return;
  }

  // ----------------------------------------
  // SAVE SELECTED BATTLE
  // ----------------------------------------

  localStorage.setItem(
    "balajiSelectedBattle",
    JSON.stringify(battle)
  );

  // ----------------------------------------
  // SAVE SECOND PLAYER
  // ----------------------------------------

  localStorage.setItem(
    "balajiSecondPlayer",
    secondPlayer
  );

  // ----------------------------------------
  // GO TO ROOM
  // ----------------------------------------

  window.location.href =
    "room.html";

}


// ------------------------------------------
// RUNNING BATTLES
// ------------------------------------------

function renderRunningBattles() {

  if (!runningBattlesContainer) return;

  runningBattlesContainer.innerHTML = "";

  if (runningBattles.length === 0) {

    runningBattlesContainer.innerHTML = `
      <div class="empty-battle">
        अभी कोई Running Battle नहीं है।
      </div>
    `;

    return;
  }

  runningBattles.forEach(function (battle) {

    const card =
      document.createElement("div");

    card.className =
      "battle-card running";

    card.innerHTML = `

      <div class="battle-title">
        Running Battle
      </div>

      <div class="players">

        <strong>
          ${escapeHTML(battle.player1)}
        </strong>

        <span>VS</span>

        <strong>
          ${escapeHTML(battle.player2)}
        </strong>

      </div>

      <div class="battle-info">

        <div>
          <span>ENTRY FEE</span>
          <strong>
            ${battle.entry} Demo Coins
          </strong>
        </div>

        <div>
          <span>PRIZE</span>
          <strong>
            ${battle.prize} Demo Coins
          </strong>
        </div>

      </div>

      ${
        battle.roomCode
        ? `
          <div class="room-small">
            Room Code: ${battle.roomCode}
          </div>
        `
        : ""
      }

    `;

    runningBattlesContainer.appendChild(card);

  });

}


// ------------------------------------------
// RULES
// ------------------------------------------

if (rulesBtn && rulesModal) {

  rulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display = "flex";

    }
  );

}


if (closeRulesBtn && rulesModal) {

  closeRulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display = "none";

    }
  );

}


if (understandBtn && rulesModal) {

  understandBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display = "none";

    }
  );

}


if (rulesModal) {

  rulesModal.addEventListener(
    "click",
    function (event) {

      if (event.target === rulesModal) {

        rulesModal.style.display = "none";

      }

    }
  );

}


// ------------------------------------------
// SECURITY
// ------------------------------------------

function escapeHTML(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


// ------------------------------------------
// START
// ------------------------------------------

renderOpenBattles();

renderRunningBattles();
