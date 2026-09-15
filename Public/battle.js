// =====================================
// BALAJI LUDO KING - BATTLE
// Demo Coins • 5 Minute Battle Expiry
// =====================================

const MIN_BET = 50;
const MAX_BET = 10000;

// Battle open रहने का समय
const BATTLE_TIME_MS = 5 * 60 * 1000;

// =====================================
// SAFE LOCAL STORAGE
// =====================================

function loadData(key) {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.log("Storage reset:", key);

    localStorage.removeItem(key);

    return [];
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// =====================================
// ELEMENTS
// =====================================

const amountInput = document.getElementById("amountInput");
const setBattleBtn = document.getElementById("setBattleBtn");
const amountMessage = document.getElementById("amountMessage");

const openBattlesBox = document.getElementById("openBattles");
const runningBattlesBox = document.getElementById("runningBattles");

const rulesBtn = document.getElementById("rulesBtn");
const rulesModal = document.getElementById("rulesModal");
const closeRulesBtn = document.getElementById("closeRulesBtn");
const understandBtn = document.getElementById("understandBtn");

// =====================================
// LOAD BATTLES
// =====================================

let openBattles = loadData("balajiOpenBattles");

let runningBattles = loadData("balajiRunningBattles");

// =====================================
// PLAYER NAME
// =====================================

function getPlayerName() {

  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    "Customer"
  );

}

// =====================================
// SAVE BATTLES
// =====================================

function saveBattles() {

  saveData(
    "balajiOpenBattles",
    openBattles
  );

  saveData(
    "balajiRunningBattles",
    runningBattles
  );

}

// =====================================
// REMOVE EXPIRED OPEN BATTLES
// =====================================

function removeExpiredBattles() {

  const now = Date.now();

  const beforeCount = openBattles.length;

  openBattles = openBattles.filter(function (battle) {

    if (!battle.createdAt) {
      return false;
    }

    const age = now - Number(battle.createdAt);

    return age < BATTLE_TIME_MS;

  });

  if (openBattles.length !== beforeCount) {

    saveBattles();

  }

}

// =====================================
// TIME LEFT
// =====================================

function getTimeLeft(createdAt) {

  const now = Date.now();

  const endTime =
    Number(createdAt) + BATTLE_TIME_MS;

  const remaining =
    Math.max(0, endTime - now);

  const totalSeconds =
    Math.floor(remaining / 1000);

  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );

}

// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

// =====================================
// SET BATTLE
// =====================================

if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    function () {

      const amount =
        Number(amountInput.value);

      if (amountMessage) {
        amountMessage.textContent = "";
      }

      // Minimum
      if (!amount || amount < MIN_BET) {

        if (amountMessage) {

          amountMessage.textContent =
            "❌ Minimum Battle amount is 50 Demo Coins.";

        }

        return;
      }

      // Maximum
      if (amount > MAX_BET) {

        if (amountMessage) {

          amountMessage.textContent =
            "❌ Maximum Battle amount is 10000 Demo Coins.";

        }

        return;
      }

      // 50 step
      if (amount % 50 !== 0) {

        if (amountMessage) {

          amountMessage.textContent =
            "❌ Amount 50 के multiples में होना चाहिए.";

        }

        return;
      }

      // Prize
      const prize =
        Math.round(amount * 1.9);

      // New Battle
      const battle = {

        id:
          "battle_" +
          Date.now() +
          "_" +
          Math.floor(
            Math.random() * 10000
          ),

        playerName:
          getPlayerName(),

        entry:
          amount,

        prize:
          prize,

        status:
          "OPEN",

        createdAt:
          Date.now()

      };

      // सबसे ऊपर नई Battle
      openBattles.unshift(battle);

      saveBattles();

      // Clear input
      amountInput.value = "";

      if (amountMessage) {

        amountMessage.textContent =
          "✅ Battle successfully Open हो गई।";

      }

      renderOpenBattles();

      renderRunningBattles();

    }
  );

}

// =====================================
// PLAY OPEN BATTLE
// =====================================

function playOpenBattle(index) {

  removeExpiredBattles();

  const battle =
    openBattles[index];

  if (!battle) {

    renderOpenBattles();

    return;

  }

  const currentPlayer =
    getPlayerName();

  // अपने ही Battle पर Play नहीं
  if (
    battle.playerName === currentPlayer
  ) {

    alert(
      "❌ आप अपनी खुद की Battle join नहीं कर सकते।"
    );

    return;

  }

  // Selected Battle save
  localStorage.setItem(
    "balajiSelectedBattle",
    JSON.stringify(battle)
  );

  // दूसरा player
  localStorage.setItem(
    "balajiSecondPlayer",
    currentPlayer
  );

  // Room waiting screen
  window.location.href =
    "room.html";

}

// =====================================
// OPEN BATTLES
// =====================================

function renderOpenBattles() {

  removeExpiredBattles();

  if (!openBattlesBox) {
    return;
  }

  if (openBattles.length === 0) {

    openBattlesBox.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎮</div>
        <div>No Open Battles</div>
        <small>Create a Battle to appear here.</small>
      </div>
    `;

    return;
  }

  let html = "";

  openBattles.forEach(
    function (battle, index) {

      const timeLeft =
        getTimeLeft(
          battle.createdAt
        );

      html += `

        <div class="battle-card">

          <div class="battle-top">

            <div class="challenge-title">
              ⚔️ Challenge From
            </div>

            <div class="battle-timer">
              ⏱️ ${timeLeft}
            </div>

          </div>

          <div class="player-name">
            ${escapeHTML(
              battle.playerName
            )}
          </div>

          <div class="battle-info">

            <div class="info-box">

              <span>Entry</span>

              <strong>
                ${battle.entry}
              </strong>

              <small>
                Demo Coins
              </small>

            </div>

            <div class="info-box">

              <span>Winning Prize</span>

              <strong>
                ${battle.prize}
              </strong>

              <small>
                Demo Coins
              </small>

            </div>

          </div>

          <button
            type="button"
            class="play-battle-btn"
            onclick="playOpenBattle(${index})"
          >
            ▶ Play
          </button>

        </div>

      `;

    }
  );

  openBattlesBox.innerHTML =
    html;

}

// =====================================
// RUNNING BATTLES
// =====================================

function renderRunningBattles() {

  if (!runningBattlesBox) {
    return;
  }

  if (runningBattles.length === 0) {

    runningBattlesBox.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <div>No Running Battles</div>
        <small>Joined battles will appear here.</small>
      </div>
    `;

    return;
  }

  let html = "";

  runningBattles.forEach(
    function (battle) {

      html += `

        <div class="battle-card running-card">

          <div class="battle-top">

            <div class="challenge-title">
              🔥 Running Battle
            </div>

            <div class="running-status">
              RUNNING
            </div>

          </div>

          <div class="player-name">

            ${escapeHTML(
              battle.playerName ||
              "Player"
            )}

          </div>

          <div class="battle-info">

            <div class="info-box">

              <span>Entry</span>

              <strong>
                ${battle.entry}
              </strong>

              <small>
                Demo Coins
              </small>

            </div>

            <div class="info-box">

              <span>Winning Prize</span>

              <strong>
                ${battle.prize}
              </strong>

              <small>
                Demo Coins
              </small>

            </div>

          </div>

          <div class="match-status">
            Room Code Accepted
          </div>

        </div>

      `;

    }
  );

  runningBattlesBox.innerHTML =
    html;

}

// =====================================
// RULES MODAL
// =====================================

if (rulesBtn && rulesModal) {

  rulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display =
        "flex";

    }
  );

}

if (closeRulesBtn && rulesModal) {

  closeRulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display =
        "none";

    }
  );

}

if (understandBtn && rulesModal) {

  understandBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display =
        "none";

    }
  );

}

// =====================================
// CLOSE MODAL OUTSIDE
// =====================================

if (rulesModal) {

  rulesModal.addEventListener(
    "click",
    function (event) {

      if (
        event.target === rulesModal
      ) {

        rulesModal.style.display =
          "none";

      }

    }
  );

}

// =====================================
// INITIAL RENDER
// =====================================

removeExpiredBattles();

renderOpenBattles();

renderRunningBattles();

// =====================================
// LIVE 5-MINUTE TIMER
// =====================================

setInterval(
  function () {

    removeExpiredBattles();

    renderOpenBattles();

  },
  1000
);

// =====================================
// MAKE PLAY FUNCTION AVAILABLE
// =====================================

window.playOpenBattle =
  playOpenBattle;
