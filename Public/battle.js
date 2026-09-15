// =====================================
// BALAJI LUDO KING - BATTLE
// DEMO / FREE PLAY
// =====================================


// ================================
// OPEN BATTLES
// ================================

const openBattles = [
  {
    name: "Challenge From Player",
    entry: 100,
    prize: 190
  },

  {
    name: "Challenge From Player",
    entry: 200,
    prize: 380
  },

  {
    name: "Challenge From Player",
    entry: 300,
    prize: 570
  }
];


// ================================
// RUNNING BATTLES
// ================================

const runningBattles = [
  {
    player1: "Player 1",
    player2: "Player 2",
    entry: 100,
    prize: 190
  },

  {
    player1: "Lucky Player",
    player2: "Ludo King",
    entry: 200,
    prize: 380
  },

  {
    player1: "Player A",
    player2: "Player B",
    entry: 300,
    prize: 570
  },

  {
    player1: "Champion",
    player2: "Winner",
    entry: 150,
    prize: 285
  }
];


// ================================
// DISPLAY OPEN BATTLES
// ================================

const openBattlesBox =
  document.getElementById("openBattles");

if (openBattlesBox) {

  openBattlesBox.innerHTML =
    openBattles.map(function (battle, index) {

      return `
        <div class="battle-card">

          <div class="challenge">
            ${battle.name}
          </div>

          <div class="battle-details">

            <div class="detail-box">
              <small>ENTRY FEE</small>
              <strong>${battle.entry} Demo Coins</strong>
            </div>

            <button
              type="button"
              class="play-btn"
              onclick="joinBattle(${index})"
            >
              Play
            </button>

            <div class="detail-box prize">
              <small>PRIZE</small>
              <strong>${battle.prize} Demo Coins</strong>
            </div>

          </div>

        </div>
      `;

    }).join("");

}


// ================================
// DISPLAY RUNNING BATTLES
// ================================

const runningBattlesBox =
  document.getElementById("runningBattles");

if (runningBattlesBox) {

  runningBattlesBox.innerHTML =
    runningBattles.map(function (battle) {

      return `
        <div class="running-card">

          <div class="running-title">
            🎮 Game Play between
            ${battle.player1}
            & ${battle.player2}
          </div>

          <div class="running-players">

            <span class="running-player">
              ${battle.player1}
            </span>

            <span class="running-vs">
              VS
            </span>

            <span class="running-player">
              ${battle.player2}
            </span>

          </div>

          <div class="running-info">

            <div>
              Entry Fee
              <strong>
                ${battle.entry} Demo Coins
              </strong>
            </div>

            <div>
              Winning Prize
              <strong>
                ${battle.prize} Demo Coins
              </strong>
            </div>

          </div>

        </div>
      `;

    }).join("");

}


// ================================
// JOIN BATTLE
// ================================

function joinBattle(index) {

  const selectedBattle =
    openBattles[index];

  if (!selectedBattle) {
    return;
  }


  localStorage.setItem(
    "balajiSelectedBattle",
    JSON.stringify(selectedBattle)
  );


  /*
    अगले step में यही button
    Room screen खोलेगा।
  */

  alert(
    "Battle selected: " +
    selectedBattle.entry +
    " Demo Coins"
  );

}


// ================================
// CREATE BATTLE
// ================================

const setBattleBtn =
  document.getElementById("setBattleBtn");

const amountInput =
  document.getElementById("amountInput");

const amountMessage =
  document.getElementById("amountMessage");


if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    function () {

      const amount =
        Number(amountInput.value);


      if (!amount || amount < 10) {

        amountMessage.textContent =
          "Please enter at least 10 demo coins.";

        return;
      }


      if (amount > 10000) {

        amountMessage.textContent =
          "Maximum demo amount is 10000.";

        return;
      }


      const demoPrize =
        amount * 1.9;


      amountMessage.textContent =
        "Battle created: " +
        amount +
        " Demo Coins • Prize: " +
        demoPrize +
        " Demo Coins";


      localStorage.setItem(
        "balajiCreatedBattle",
        JSON.stringify({
          entry: amount,
          prize: demoPrize
        })
      );

    }
  );

}


// ================================
// RULES MODAL
// ================================

const rulesBtn =
  document.getElementById("rulesBtn");

const rulesModal =
  document.getElementById("rulesModal");

const closeRulesBtn =
  document.getElementById("closeRulesBtn");

const understandBtn =
  document.getElementById("understandBtn");


if (rulesBtn) {

  rulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.classList.add("show");

    }
  );

}


function closeRules() {

  rulesModal.classList.remove("show");

}


if (closeRulesBtn) {

  closeRulesBtn.addEventListener(
    "click",
    closeRules
  );

}


if (understandBtn) {

  understandBtn.addEventListener(
    "click",
    closeRules
  );

}
