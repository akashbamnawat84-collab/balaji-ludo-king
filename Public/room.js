// =========================================================
// BALAJI LUDO KING
// ROOM FRONTEND
// =========================================================

const API_BASE = "";

const backBtn = document.getElementById("backBtn");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const cancelBtn = document.getElementById("cancelBtn");
const startGameBtn = document.getElementById("startGameBtn");

const roomCodeElement = document.getElementById("roomCode");
const roomStatus = document.getElementById("roomStatus");

const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");

const player1Status = document.getElementById("player1Status");
const player2Status = document.getElementById("player2Status");

const waitingCard = document.getElementById("waitingCard");


// =========================================================
// HELPERS
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization =
      "Bearer " + token;
  }

  const response =
    await fetch(
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
// SELECTED BATTLE
// =========================================================

function getSelectedBattle() {

  try {

    const saved =
      localStorage.getItem(
        "balajiSelectedBattle"
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);

  } catch (error) {

    console.log(
      "Battle storage error:",
      error
    );

    return null;
  }
}

const selectedBattle =
  getSelectedBattle();

let battleId =
  localStorage.getItem(
    "balajiBattleId"
  );

if (
  !battleId &&
  selectedBattle &&
  selectedBattle.id
) {

  battleId =
    selectedBattle.id;

}


// =========================================================
// LOAD BATTLE
// =========================================================

async function loadBattle() {

  if (!battleId) {

    showError(
      "Battle information not found."
    );

    return;
  }

  try {

    const data =
      await api(
        "/api/battles/" +
        encodeURIComponent(
          battleId
        )
      );

    const battle =
      data.battle ||
      data.data ||
      data;

    if (!battle) {

      showError(
        "Battle not found."
      );

      return;
    }

    localStorage.setItem(
      "balajiSelectedBattle",
      JSON.stringify(battle)
    );

    renderBattle(battle);

  } catch (error) {

    console.log(
      "Battle load error:",
      error
    );

    showError(
      error.message
    );

  }
}


// =========================================================
// RENDER BATTLE
// =========================================================

function renderBattle(battle) {

  const creator =
    battle.creator_name ||
    battle.playerName ||
    "Player 1";

  const opponent =
    battle.opponent_name ||
    "";

  const status =
    String(
      battle.status ||
      "OPEN"
    ).toUpperCase();

  const code =
    battle.room_code ||
    "";

  if (player1Name) {
    player1Name.textContent =
      creator;
  }

  if (player2Name) {

    player2Name.textContent =
      opponent ||
      "Waiting for Player 2";

  }

  if (roomStatus) {

    roomStatus.textContent =
      formatStatus(status);

  }

  if (roomCodeElement) {

    roomCodeElement.textContent =
      code ||
      "Waiting for Room Code";

  }

  if (player1Status) {
    player1Status.textContent =
      "Ready";
  }

  if (player2Status) {

    player2Status.textContent =
      opponent
        ? "Joined"
        : "Waiting...";

  }


  // -------------------------------------------------------
  // OPEN
  // -------------------------------------------------------

  if (status === "OPEN") {

    if (waitingCard) {

      waitingCard.style.display =
        "block";

      waitingCard.innerHTML = `
        <div class="loading-circle"></div>
        <h3>Waiting for Player 2</h3>
        <p>Another player can join this Battle.</p>
      `;

    }

    if (startGameBtn) {

      startGameBtn.disabled =
        true;

      startGameBtn.textContent =
        "🎮 Waiting for Player 2";

    }

    return;
  }


  // -------------------------------------------------------
  // JOINED
  // -------------------------------------------------------

  if (
    status === "JOINED" ||
    status === "RUNNING"
  ) {

    if (waitingCard) {

      waitingCard.style.display =
        "block";

      waitingCard.innerHTML = `
        <div class="loading-circle"></div>
        <h3>Waiting for Room Code</h3>
        <p>Play ludo in the Ludo King App after the room code is ready.</p>
      `;

    }

    if (startGameBtn) {

      startGameBtn.disabled =
        true;

      startGameBtn.textContent =
        "⏳ Waiting for Room Code";

    }

    return;
  }


  // -------------------------------------------------------
  // ROOM READY
  // -------------------------------------------------------

  if (
    status === "ROOM_READY"
  ) {

    if (waitingCard) {

      waitingCard.style.display =
        "block";

      waitingCard.innerHTML = `
        <div class="loading-circle"></div>
        <h3>Room Code Ready</h3>
        <p>Copy the room code and play in the Ludo King App.</p>
      `;

    }

    if (copyCodeBtn) {

      copyCodeBtn.style.display =
        "block";

      copyCodeBtn.textContent =
        "📋 Copy Room Code";

    }

    if (startGameBtn) {

      startGameBtn.disabled =
        false;

      startGameBtn.textContent =
        "🎮 Open Battle Result";

    }

    return;
  }


  // -------------------------------------------------------
  // RESULT SUBMITTED
  // -------------------------------------------------------

  if (
    status ===
    "RESULT_SUBMITTED"
  ) {

    if (waitingCard) {

      waitingCard.innerHTML = `
        <div class="loading-circle"></div>
        <h3>Result Submitted</h3>
        <p>Your result has been sent to Admin.</p>
      `;

    }

    if (startGameBtn) {

      startGameBtn.disabled =
        true;

      startGameBtn.textContent =
        "✅ Result Submitted";

    }

    return;
  }


  // -------------------------------------------------------
  // FINAL / CANCELLED
  // -------------------------------------------------------

  if (
    status === "FINAL_WIN" ||
    status === "FINAL_LOSS" ||
    status === "CANCELLED"
  ) {

    if (waitingCard) {

      waitingCard.innerHTML = `
        <h3>Battle Closed</h3>
        <p>Status: ${escapeHtml(
          formatStatus(status)
        )}</p>
      `;

    }

    if (startGameBtn) {

      startGameBtn.disabled =
        true;

    }

  }

}


// =========================================================
// STATUS TEXT
// =========================================================

function formatStatus(status) {

  const map = {

    OPEN:
      "Waiting for Player",

    JOINED:
      "Players Joined",

    RUNNING:
      "Battle Running",

    ROOM_READY:
      "Room Code Ready",

    RESULT_SUBMITTED:
      "Result Submitted",

    FINAL_WIN:
      "Final Win",

    FINAL_LOSS:
      "Final Loss",

    CANCELLED:
      "Cancelled"

  };

  return (
    map[status] ||
    status
  );
}


// =========================================================
// ERROR
// =========================================================

function showError(message) {

  if (waitingCard) {

    waitingCard.style.display =
      "block";

    waitingCard.innerHTML = `
      <div class="empty-icon">⚠️</div>
      <h3>Battle Error</h3>
      <p>${escapeHtml(message)}</p>
    `;

  }

  if (startGameBtn) {

    startGameBtn.disabled =
      true;

  }

}


// =========================================================
// COPY ROOM CODE
// =========================================================

if (copyCodeBtn) {

  copyCodeBtn.addEventListener(
    "click",
    async function () {

      const code =
        roomCodeElement
          ? roomCodeElement.textContent.trim()
          : "";

      if (
        !code ||
        code === "Waiting for Room Code" ||
        code === "00000000"
      ) {

        alert(
          "Room Code is not ready yet."
        );

        return;
      }

      try {

        await navigator.clipboard.writeText(
          code
        );

        copyCodeBtn.textContent =
          "✅ Room Code Copied";

        setTimeout(
          function () {

            copyCodeBtn.textContent =
              "📋 Copy Room Code";

          },
          1500
        );

      } catch (error) {

        alert(
          "Room Code: " +
          code
        );

      }

    }
  );

}


// =========================================================
// OPEN RESULT PAGE
// =========================================================

if (startGameBtn) {

  startGameBtn.addEventListener(
    "click",
    function () {

      const status =
        roomStatus
          ? String(
              roomStatus.textContent
            ).toUpperCase()
          : "";

      if (
        status !==
        "ROOM CODE READY"
      ) {

        alert(
          "Room Code is not ready yet."
        );

        return;
      }

      /*
       * Actual Ludo gameplay is NOT inside
       * this website.
       *
       * Players play in Ludo King App.
       *
       * Result page will be connected
       * in the next step.
       */

      alert(
        "🎮 Play the game in Ludo King App.\n\n" +
        "After the game, return here and submit your result."
      );

    }
  );

}


// =========================================================
// CANCEL BATTLE
// =========================================================

if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    async function () {

      if (!battleId) {

        alert(
          "Battle information not found."
        );

        return;
      }

      const reason =
        prompt(
          "Enter cancellation reason:\n\n" +
          "1. No Room Code\n" +
          "2. Not Game Start\n" +
          "3. Not Player Join\n" +
          "4. Opposite Error"
        );

      if (!reason) {
        return;
      }

      let cancelReason =
        reason.trim();

      if (
        cancelReason === "1"
      ) {
        cancelReason =
          "No Room Code";
      }

      if (
        cancelReason === "2"
      ) {
        cancelReason =
          "Not Game Start";
      }

      if (
        cancelReason === "3"
      ) {
        cancelReason =
          "Not Player Join";
      }

      if (
        cancelReason === "4"
      ) {
        cancelReason =
          "Opposite Error";
      }

      const confirmed =
        confirm(
          "Cancel this Battle?\n\nReason: " +
          cancelReason
        );

      if (!confirmed) {
        return;
      }

      cancelBtn.disabled =
        true;

      cancelBtn.textContent =
        "Cancelling...";

      try {

        await api(
          "/api/battles/cancel",
          {
            method: "POST",
            body: JSON.stringify({
              battleId:
                battleId,
              reason:
                cancelReason
            })
          }
        );

        alert(
          "✅ Battle cancellation submitted."
        );

        await loadBattle();

      } catch (error) {

        alert(
          "❌ " +
          error.message
        );

      } finally {

        cancelBtn.disabled =
          false;

        cancelBtn.textContent =
          "Cancel Match";

      }

    }
  );

}


// =========================================================
// BACK BUTTON
// =========================================================

if (backBtn) {

  backBtn.addEventListener(
    "click",
    function () {

      window.location.href =
        "battle.html";

    }
  );

}


// =========================================================
// AUTO REFRESH
// =========================================================

loadBattle();

setInterval(
  function () {

    loadBattle();

  },
  5000
);
