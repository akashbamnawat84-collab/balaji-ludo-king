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
    // --------------------------------------

    const prize = Math.round(amount * 1.9);

    const newBattle = {

      id:
        "B" +
        Date.now() +
        Math.floor(Math.random() * 1000),

      name: getPlayerName(),

      entry: amount,

      prize: prize,

      status: "OPEN",

      roomCode: null,

      createdAt: Date.now()

    };

    openBattles.unshift(newBattle);

    saveBattles();

    amountInput.value = "";

    renderOpenBattles();

    alert(
      amount +
      " Demo Coins की Battle Open Bets में लगा दी गई है।"
    );

  });

}


// ------------------------------------------
// RENDER OPEN BATTLES
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

    const card = document.createElement("div");

    card.className = "battle-card";

    card.innerHTML = `

      <div class="battle-title">
        Challenge From
      </div>

      <div class="challenger-name">
        ${escapeHTML(battle.name)}
      </div>

      <div class="battle-info">

        <div>
          <span>ENTRY FEE</span>
          <strong>${battle.entry} Demo Coins</strong>
        </div>

        <div>
          <span>PRIZE</span>
          <strong>${battle.prize} Demo Coins</strong>
        </div>

      </div>

      <button
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

  // ----------------------------------------
  // PLAYER WHO CREATED THE BET
  // ----------------------------------------

  const firstPlayer = battle.name;

  // ----------------------------------------
  // SECOND PLAYER
  // ----------------------------------------

  const secondPlayer = getPlayerName();

  // Same player cannot join own battle
  // ----------------------------------------

  if (firstPlayer === secondPlayer) {

    alert(
      "आप अपनी खुद की Battle Play नहीं कर सकते।"
    );

    return;
  }

  // ----------------------------------------
  // GENERATE 8 DIGIT ROOM CODE
  // ----------------------------------------

  const roomCode =
    String(
      Math.floor(
        10000000 +
        Math.random() * 90000000
      )
    );

  // ----------------------------------------
  // MOVE OPEN BATTLE TO RUNNING
  // ----------------------------------------

  const runningBattle = {

    id: battle.id,

    player1: firstPlayer,

    player2: secondPlayer,

    entry: battle.entry,

    prize: battle.prize,

    roomCode: roomCode,

    status: "RUNNING",

    createdAt: Date.now()

  };

  runningBattles.unshift(runningBattle);

  // Remove from Open Bets
  openBattles.splice(index, 1);

  saveBattles();

  // ----------------------------------------
  // SAVE CURRENT MATCH
  // ----------------------------------------

  localStorage.setItem(
    "balajiCurrentBattle",
    JSON.stringify(runningBattle)
  );

  localStorage.setItem(
    "balajiRoomCode",
    roomCode
  );

  // ----------------------------------------
  // OPEN ROOM SCREEN
  // ----------------------------------------

  window.location.href = "room.html";

}


// ------------------------------------------
// RENDER RUNNING BATTLES
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

    const card = document.createElement("div");

    card.className = "battle-card running";

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
          <strong>${battle.entry} Demo Coins</strong>
        </div>

        <div>
          <span>PRIZE</span>
          <strong>${battle.prize} Demo Coins</strong>
        </div>

      </div>

      <div class="room-small">
        Room Code: ${battle.roomCode}
      </div>

    `;

    runningBattlesContainer.appendChild(card);

  });

}


// ------------------------------------------
// RULES MODAL
// ------------------------------------------

if (rulesBtn && rulesModal) {

  rulesBtn.addEventListener("click", function () {

    rulesModal.style.display = "flex";

  });

}


if (closeRulesBtn && rulesModal) {

  closeRulesBtn.addEventListener("click", function () {

    rulesModal.style.display = "none";

  });

}


if (rulesModal) {

  rulesModal.addEventListener("click", function (event) {

    if (event.target === rulesModal) {

      rulesModal.style.display = "none";

    }

  });

}


// ------------------------------------------
// ESCAPE HTML
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
