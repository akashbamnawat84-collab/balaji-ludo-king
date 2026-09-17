// =========================================================
// BALAJI LUDO KING
// BATTLE FRONTEND
// Connected with Cloudflare Worker API
// =========================================================

const API_BASE = "";

const MIN_BET = 50;
const MAX_BET = 10000;
const BATTLE_WAIT_MS = 5 * 60 * 1000;

const amountInput = document.getElementById("amountInput");
const setBattleBtn = document.getElementById("setBattleBtn");
const amountMessage = document.getElementById("amountMessage");
const openBattles = document.getElementById("openBattles");
const runningBattles = document.getElementById("runningBattles");

const rulesBtn = document.getElementById("rulesBtn");
const rulesModal = document.getElementById("rulesModal");
const closeRulesBtn = document.getElementById("closeRulesBtn");
const understandBtn = document.getElementById("understandBtn");


// =========================================================
// COMMON HELPERS
// =========================================================

function getToken() {
  return (
    localStorage.getItem("balajiToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function getCustomerId() {
  return (
    localStorage.getItem("balajiCustomerId") ||
    localStorage.getItem("customerId") ||
    localStorage.getItem("userId") ||
    ""
  );
}

function getPlayerName() {
  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    localStorage.getItem("customerName") ||
    "Customer"
  );
}

function money(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showMessage(message, success = false) {
  if (!amountMessage) return;

  amountMessage.textContent = message;
  amountMessage.style.color = success ? "#15803d" : "#dc2626";
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  const response = await fetch(
    API_BASE + path,
    {
      ...options,
      headers
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Something went wrong."
    );
  }

  return data;
}


// =========================================================
// CREATE BATTLE
// =========================================================

if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    async function () {

      const amount = Number(
        amountInput
          ? amountInput.value
          : 0
      );

      if (!amount) {
        showMessage(
          "❌ Please enter battle amount."
        );
        return;
      }

      if (amount < MIN_BET) {
        showMessage(
          "❌ Minimum Battle is 50 BALAJI LUDO Coin."
        );
        return;
      }

      if (amount > MAX_BET) {
        showMessage(
          "❌ Maximum Battle is 10000 BALAJI LUDO Coin."
        );
        return;
      }

      if (amount % 50 !== 0) {
        showMessage(
          "❌ Amount must be in multiples of 50."
        );
        return;
      }

      setBattleBtn.disabled = true;
      setBattleBtn.textContent = "Creating...";

      try {

        const data = await api(
          "/api/battles/create",
          {
            method: "POST",
            body: JSON.stringify({
              amount: amount
            })
          }
        );

        if (amountInput) {
          amountInput.value = "";
        }

        showMessage(
          "✅ Battle created successfully.",
          true
        );

        await loadOpenBattles();

      } catch (error) {

        showMessage(
          "❌ " + error.message
        );

      } finally {

        setBattleBtn.disabled = false;
        setBattleBtn.textContent = "Set Battle";

      }
    }
  );

}


// =========================================================
// LOAD OPEN BATTLES
// =========================================================

async function loadOpenBattles() {

  if (!openBattles) return;

  openBattles.innerHTML = `
    <div class="empty-battle">
      <div class="empty-icon">⏳</div>
      <h3>Loading Battles...</h3>
      <p>Please wait.</p>
    </div>
  `;

  try {

    const data = await api(
      "/api/battles/open"
    );

    const battles =
      Array.isArray(data)
        ? data
        : (
            data.battles ||
            data.data ||
            []
          );

    renderOpenBattles(battles);

  } catch (error) {

    openBattles.innerHTML = `
      <div class="empty-battle">
        <div class="empty-icon">⚠️</div>
        <h3>Unable to Load Battles</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;

  }

}


// =========================================================
// RENDER OPEN BATTLES
// =========================================================

function renderOpenBattles(battles) {

  if (!openBattles) return;

  if (!battles.length) {

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

  battles.forEach(function (battle) {

    const id =
      battle.id ||
      "";

    const playerName =
      battle.creator_name ||
      battle.playerName ||
      "Customer";

    const entry =
      Number(
        battle.entry_amount ||
        battle.entry ||
        0
      );

    const prize =
      Number(
        battle.winning_prize ||
        battle.prize ||
        0
      );

    const createdAt =
      Number(
        battle.created_at ||
        battle.createdAt ||
        Date.now()
      );

    const timeLeft =
      getTimeLeft(createdAt);

    html += `

      <div class="battle-card">

        <div class="battle-header">

          <span class="live-badge">
            ● LIVE
          </span>

          <span class="battle-time">
            ⏱ ${timeLeft}
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
              ${money(entry)} BALAJI LUDO Coin
            </strong>
          </div>

          <div>
            <span>Winning Prize</span>

            <strong>
              ${money(prize)} BALAJI LUDO Coin
            </strong>
          </div>

        </div>

        <button
          type="button"
          class="play-battle-btn"
          onclick="joinBattle('${escapeHtml(id)}')"
        >
          ▶ Play
        </button>

        <div class="demo-label">
          Play in Ludo King App
        </div>

      </div>

    `;
  });

  openBattles.innerHTML = html;
}


// =========================================================
// JOIN BATTLE
// =========================================================

async function joinBattle(battleId) {

  if (!battleId) {
    alert("Battle ID missing.");
    return;
  }

  const confirmed =
    confirm(
      "Do you want to join this Battle?"
    );

  if (!confirmed) {
    return;
  }

  try {

    const data = await api(
      "/api/battles/join",
      {
        method: "POST",
        body: JSON.stringify({
          battleId: battleId
        })
      }
    );

    const battle =
      data.battle ||
      data.data ||
      data;

    if (battle) {

      localStorage.setItem(
        "balajiSelectedBattle",
        JSON.stringify(battle)
      );

      localStorage.setItem(
        "balajiBattleId",
        battle.id || battleId
      );

    }

    window.location.href =
      "room.html";

  } catch (error) {

    alert(
      "❌ " + error.message
    );

    await loadOpenBattles();
  }
}


// =========================================================
// MY / RUNNING BATTLES
// =========================================================

async function loadMyBattles() {

  if (!runningBattles) return;

  try {

    const data = await api(
      "/api/battles/my"
    );

    const battles =
      Array.isArray(data)
        ? data
        : (
            data.battles ||
            data.data ||
            []
          );

    renderRunningBattles(battles);

  } catch (error) {

    console.log(
      "My battles error:",
      error
    );

    runningBattles.innerHTML = "";
  }
}


// =========================================================
// RENDER RUNNING BATTLES
// =========================================================

function renderRunningBattles(battles) {

  if (!runningBattles) return;

  const running =
    battles.filter(function (battle) {

      const status =
        String(
          battle.status ||
          ""
        ).toUpperCase();

      return (
        status === "OPEN" ||
        status === "JOINED" ||
        status === "ROOM_READY" ||
        status === "RUNNING" ||
        status === "RESULT_SUBMITTED"
      );

    });

  if (!running.length) {

    runningBattles.innerHTML = "";
    return;
  }

  let html = "";

  running.forEach(function (battle) {

    const creator =
      battle.creator_name ||
      "Player 1";

    const opponent =
      battle.opponent_name ||
      "Waiting for Player";

    const entry =
      Number(
        battle.entry_amount ||
        0
      );

    const prize =
      Number(
        battle.winning_prize ||
        0
      );

    const status =
      battle.status ||
      "WAITING";

    const roomCode =
      battle.room_code ||
      "Waiting";

    html += `

      <div class="battle-card running-card">

        <div class="battle-header">

          <span class="running-badge">
            ${escapeHtml(status)}
          </span>

        </div>

        <div class="challenge-title">
          Match
        </div>

        <div class="player-name">
          👤 ${escapeHtml(creator)}
        </div>

        <div class="player-name">
          👤 ${escapeHtml(opponent)}
        </div>

        <div class="battle-details">

          <div>
            <span>Entry</span>

            <strong>
              ${money(entry)} BALAJI LUDO Coin
            </strong>
          </div>

          <div>
            <span>Winning Prize</span>

            <strong>
              ${money(prize)} BALAJI LUDO Coin
            </strong>
          </div>

        </div>

        <div class="room-running">

          Room Code:
          <strong>
            ${escapeHtml(roomCode)}
          </strong>

        </div>

        <div class="result-status">

          Status:
          <strong>
            ${escapeHtml(status)}
          </strong>

        </div>

      </div>

    `;
  });

  runningBattles.innerHTML = html;
}


// =========================================================
// 5 MINUTE TIMER
// =========================================================

function getTimeLeft(createdAt) {

  const remaining =
    Math.max(
      0,
      BATTLE_WAIT_MS -
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


// =========================================================
// RULES MODAL
// =========================================================

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


// =========================================================
// AUTO REFRESH
// =========================================================

loadOpenBattles();
loadMyBattles();

setInterval(
  function () {

    loadOpenBattles();
    loadMyBattles();

  },
  5000
);


// =========================================================
// GLOBAL
// =========================================================

window.joinBattle =
  joinBattle;
