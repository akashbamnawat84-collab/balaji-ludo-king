// =====================================
// BALAJI LUDO KING - BATTLE
// Demo Coins • 2 Player Battle
// =====================================

const MIN_BET = 50;
const MAX_BET = 10000;
const BATTLE_TIME_MS = 5 * 60 * 1000;


// =====================================
// ELEMENTS
// =====================================

const amountInput =
  document.getElementById("amountInput");

const setBattleBtn =
  document.getElementById("setBattleBtn");

const amountMessage =
  document.getElementById("amountMessage");

const openBattles =
  document.getElementById("openBattles");

const runningBattles =
  document.getElementById("runningBattles");

const rulesBtn =
  document.getElementById("rulesBtn");

const rulesModal =
  document.getElementById("rulesModal");

const closeRulesBtn =
  document.getElementById("closeRulesBtn");

const understandBtn =
  document.getElementById("understandBtn");


// =====================================
// SAFE STORAGE
// =====================================

function loadData(key, fallback) {

  try {

    const data =
      localStorage.getItem(key);

    if (!data) {
      return fallback;
    }

    const parsed =
      JSON.parse(data);

    return parsed;

  } catch (error) {

    console.log(
      "Storage read error:",
      error
    );

    return fallback;

  }

}


function saveData(key, data) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(data)
    );

    return true;

  } catch (error) {

    console.log(
      "Storage save error:",
      error
    );

    return false;

  }

}


// =====================================
// PLAYER NAME
// =====================================

function getPlayerName() {

  return (
    localStorage.getItem(
      "balajiPlayerName"
    ) ||
    localStorage.getItem(
      "playerName"
    ) ||
    "Customer"
  );

}


// =====================================
// OPEN BATTLES
// =====================================

let openBattleData =
  loadData(
    "balajiOpenBattles",
    []
  );

if (!Array.isArray(openBattleData)) {
  openBattleData = [];
}


// =====================================
// RUNNING BATTLES
// =====================================

let runningBattleData =
  loadData(
    "balajiRunningBattles",
    []
  );

if (!Array.isArray(runningBattleData)) {
  runningBattleData = [];
}


// =====================================
// REMOVE EXPIRED BATTLES
// =====================================

function removeExpiredBattles() {

  const now =
    Date.now();

  const oldLength =
    openBattleData.length;

  openBattleData =
    openBattleData.filter(
      function (battle) {

        if (!battle.createdAt) {
          return false;
        }

        return (
          now -
          Number(battle.createdAt)
          <
          BATTLE_TIME_MS
        );

      }
    );


  if (
    oldLength !==
    openBattleData.length
  ) {

    saveData(
      "balajiOpenBattles",
      openBattleData
    );

  }

}


// =====================================
// TIME LEFT
// =====================================

function getTimeLeft(createdAt) {

  const remaining =
    Math.max(
      0,
      BATTLE_TIME_MS -
      (
        Date.now() -
        Number(createdAt)
      )
    );


  const totalSeconds =
    Math.floor(
      remaining / 1000
    );


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const seconds =
    totalSeconds % 60;


  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );

}


// =====================================
// SET BATTLE
// =====================================

if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    function () {

      const amount =
        Number(
          amountInput
            ? amountInput.value
            : 0
        );


      // Validation

      if (!amount) {

        if (amountMessage) {
          amountMessage.textContent =
            "❌ Please enter battle amount.";
        }

        return;
      }


      if (amount < MIN_BET) {

        if (amountMessage) {
          amountMessage.textContent =
            "❌ Minimum Battle is 50 Demo Coins.";
        }

        return;
      }


      if (amount > MAX_BET) {

        if (amountMessage) {
          amountMessage.textContent =
            "❌ Maximum Battle is 10000 Demo Coins.";
        }

        return;
      }


      if (amount % 50 !== 0) {

        if (amountMessage) {
          amountMessage.textContent =
            "❌ Amount must be in multiples of 50.";
        }

        return;
      }


      // Prize calculation
      // Demo only

      const prize =
        Math.round(
          amount * 1.9
        );


      const battle = {

        id:
          "battle_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2, 8),

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


      openBattleData.unshift(
        battle
      );


      saveData(
        "balajiOpenBattles",
        openBattleData
      );


      if (amountInput) {
        amountInput.value = "";
      }


      if (amountMessage) {

        amountMessage.textContent =
          "✅ Battle created successfully.";

      }


      renderOpenBattles();

    }
  );

}


// =====================================
// PLAY OPEN BATTLE
// =====================================

function playOpenBattle(index) {

  removeExpiredBattles();


  const battle =
    openBattleData[index];


  if (!battle) {

    renderOpenBattles();

    return;

  }


  /*
   * DEMO TEST MODE
   *
   * अपने ही Battle को test करने की
   * अनुमति है ताकि पूरा flow check
   * किया जा सके।
   */

  if (
    battle.playerName ===
    getPlayerName()
  ) {

    localStorage.setItem(
      "balajiSecondPlayer",
      "Test Player 2"
    );

  } else {

    localStorage.setItem(
      "balajiSecondPlayer",
      getPlayerName()
    );

  }


  // Selected Battle save

  localStorage.setItem(
    "balajiSelectedBattle",
    JSON.stringify(battle)
  );


  // Open battle remove
  // क्योंकि अब Room flow शुरू होगा

  openBattleData =
    openBattleData.filter(
      function (item) {

        return (
          item.id !==
          battle.id
        );

      }
    );


  saveData(
    "balajiOpenBattles",
    openBattleData
  );


  // Clear previous room data

  localStorage.removeItem(
    "balajiRoomCode"
  );

  localStorage.removeItem(
    "balajiRoomWaitingStartedAt"
  );

  localStorage.removeItem(
    "balajiRoomCodeCreatedAt"
  );


  // Open Room

  window.location.href =
    "room.html";

}


// =====================================
// RENDER OPEN BATTLES
// =====================================

function renderOpenBattles() {

  if (!openBattles) {
    return;
  }


  removeExpiredBattles();


  if (
    openBattleData.length ===
    0
  ) {

    openBattles.innerHTML = `
      <div class="empty-battle">
        <div class="empty-icon">🎮</div>
        <h3>No Open Battles</h3>
        <p>Create a Battle and wait for another player.</p>
      </div>
    `;

    return;
  }


  let html = "";


  openBattleData.forEach(
    function (battle, index) {

      const playerName =
        battle.playerName ||
        "Customer";


      const entry =
        Number(
          battle.entry || 0
        );


      const prize =
        Number(
          battle.prize || 0
        );


      const timer =
        getTimeLeft(
          battle.createdAt
        );


      html += `

        <div class="battle-card">

          <div class="battle-header">

            <span class="live-badge">
              LIVE
            </span>

            <span class="battle-time">
              ⏱ ${timer}
            </span>

          </div>


          <div class="challenge-title">
            Challenge From
          </div>


          <div class="player-name">
            👤 ${escapeHtml(playerName)}
          </div>


          <div class="battle-details">

            <div>
              <span>Entry</span>
              <strong>
                ${entry} Demo Coins
              </strong>
            </div>

            <div>
              <span>Prize</span>
              <strong>
                ${prize} Demo Coins
              </strong>
            </div>

          </div>


          <button
            type="button"
            class="play-battle-btn"
            onclick="playOpenBattle(${index})"
          >
            ▶ Play
          </button>


          <div class="demo-label">
            Demo Battle
          </div>

        </div>

      `;

    }
  );


  openBattles.innerHTML =
    html;

}


// =====================================
// ESCAPE HTML
// =====================================

function escapeHtml(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =====================================
// RENDER RUNNING BATTLES
// =====================================

function renderRunningBattles() {

  if (!runningBattles) {
    return;
  }


  runningBattleData =
    loadData(
      "balajiRunningBattles",
      []
    );


  if (
    !Array.isArray(
      runningBattleData
    )
  ) {

    runningBattleData = [];

  }


  if (
    runningBattleData.length ===
    0
  ) {

    runningBattles.innerHTML =
      "";

    return;

  }


  let html = "";


  runningBattleData.forEach(
    function (battle) {

      html += `

        <div class="battle-card running-card">

          <div class="battle-header">

            <span class="running-badge">
              RUNNING
            </span>

          </div>


          <div class="challenge-title">
            Match Running
          </div>


          <div class="player-name">
            👤 ${escapeHtml(
              battle.playerName ||
              "Player 1"
            )}
          </div>


          <div class="battle-details">

            <div>
              <span>Entry</span>
              <strong>
                ${Number(
                  battle.entry || 0
                )} Demo Coins
              </strong>
            </div>


            <div>
              <span>Prize</span>
              <strong>
                ${Number(
                  battle.prize || 0
                )} Demo Coins
              </strong>
            </div>

          </div>


          <div class="room-running">

            Room:
            <strong>
              ${escapeHtml(
                battle.roomCode ||
                "Waiting"
              )}
            </strong>

          </div>


          <div class="result-status">

            Status:
            <strong>
              ${escapeHtml(
                battle.resultStatus ||
                "WAITING"
              )}
            </strong>

          </div>

        </div>

      `;

    }
  );


  runningBattles.innerHTML =
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


if (rulesModal) {

  rulesModal.addEventListener(
    "click",
    function (event) {

      if (
        event.target ===
        rulesModal
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

renderOpenBattles();

renderRunningBattles();


// =====================================
// AUTO REFRESH
// =====================================

setInterval(
  function () {

    removeExpiredBattles();

    renderOpenBattles();

    renderRunningBattles();

  },
  1000
);


// =====================================
// GLOBAL FUNCTION
// =====================================

window.playOpenBattle =
  playOpenBattle;
