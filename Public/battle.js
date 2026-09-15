// ==========================================
// BALAJI LUDO KING - BATTLE SYSTEM
// DEMO MODE
// ==========================================

const MIN_BET = 50;
const MAX_BET = 10000;


// ==========================================
// SAFE LOCAL STORAGE
// ==========================================

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

  localStorage.setItem(
    key,
    JSON.stringify(data)
  );

}


// ==========================================
// ELEMENTS
// ==========================================

const amountInput =
  document.getElementById("amountInput");

const setBattleBtn =
  document.getElementById("setBattleBtn");

const amountMessage =
  document.getElementById("amountMessage");

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


// ==========================================
// LOAD DATA
// ==========================================

let openBattles =
  loadData("balajiOpenBattles");

let runningBattles =
  loadData("balajiRunningBattles");


// ==========================================
// PLAYER NAME
// ==========================================

function getPlayerName() {

  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    "Customer"
  );

}


// ==========================================
// SAVE BATTLES
// ==========================================

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


// ==========================================
// SET BATTLE
// ==========================================

if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    function () {

      const amount =
        Number(amountInput.value);

      // Clear previous message
      if (amountMessage) {
        amountMessage.textContent = "";
      }


      // -------------------------------
      // MINIMUM
      // -------------------------------

      if (!amount || amount < MIN_BET) {

        if (amountMessage) {
          amountMessage.textContent =
            "Minimum 50 Demo Coins की bet लगाएँ।";
        }

        return;
      }


      // -------------------------------
      // MAXIMUM
      // -------------------------------

      if (amount > MAX_BET) {

        if (amountMessage) {
          amountMessage.textContent =
            "Maximum 10000 Demo Coins तक है।";
        }

        return;
      }


      // -------------------------------
      // 50 MULTIPLE
      // -------------------------------

      if (amount % 50 !== 0) {

        if (amountMessage) {
          amountMessage.textContent =
            "Amount 50, 100, 150, 200, 250... में होना चाहिए।";
        }

        return;
      }


      // -------------------------------
      // DEMO PRIZE
      // -------------------------------

      const prize =
        Math.round(amount * 1.9);


      // -------------------------------
      // CREATE BATTLE
      // -------------------------------

      const battle = {

        id:
          "battle_" +
          Date.now() +
          "_" +
          Math.floor(
            Math.random() * 1000
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


      // -------------------------------
      // ADD TO OPEN BATTLES
      // -------------------------------

      openBattles.unshift(battle);


      // -------------------------------
      // SAVE
      // -------------------------------

      saveBattles();


      // -------------------------------
      // CLEAR INPUT
      // -------------------------------

      amountInput.value = "";


      // -------------------------------
      // SUCCESS MESSAGE
      // -------------------------------

      if (amountMessage) {

        amountMessage.textContent =
          "✅ Battle successfully Open हो गई।";

      }


      // -------------------------------
      // REFRESH
      // -------------------------------

      renderOpenBattles();

      renderRunningBattles();

    }
  );

}


// ==========================================
// OPEN BATTLES
// ==========================================

function renderOpenBattles() {

  if (!openBattlesContainer) {
    return;
  }


  openBattlesContainer.innerHTML = "";


  if (openBattles.length === 0) {

    openBattlesContainer.innerHTML = `
      <div class="empty-battle">
        अभी कोई Open Battle नहीं है।
      </div>
    `;

    return;
  }


  openBattles.forEach(
    function (battle, index) {

      const card =
        document.createElement("div");

      card.className =
        "battle-card";


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


      openBattlesContainer.appendChild(
        card
      );

    }
  );

}


// ==========================================
// PLAY OPEN BATTLE
// ==========================================

function playOpenBattle(index) {

  const battle =
    openBattles[index];


  if (!battle) {
    return;
  }


  const secondPlayer =
    getPlayerName();


  // ----------------------------------------
  // OWN BATTLE CHECK
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
  // ROOM
  // ----------------------------------------

  window.location.href =
    "room.html";

}


// ==========================================
// RUNNING BATTLES
// ==========================================

function renderRunningBattles() {

  if (!runningBattlesContainer) {
    return;
  }


  runningBattlesContainer.innerHTML = "";


  if (runningBattles.length === 0) {

    runningBattlesContainer.innerHTML = `
      <div class="empty-battle">
        अभी कोई Running Battle नहीं है।
      </div>
    `;

    return;
  }


  runningBattles.forEach(
    function (battle) {

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

          <span>
            VS
          </span>

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


      runningBattlesContainer.appendChild(
        card
      );

    }
  );

}


// ==========================================
// RULES
// ==========================================

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
        event.target === rulesModal
      ) {

        rulesModal.style.display =
          "none";

      }

    }
  );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

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


// ==========================================
// START
// ==========================================

renderOpenBattles();

renderRunningBattles();
