/* =========================================================
   BALAJI LUDO KING
   ROOM / BATTLE RESULT SYSTEM
========================================================= */

const API_BASE = "";

const battleId =
  localStorage.getItem("balajiBattleId") ||
  localStorage.getItem("balajiSelectedBattle");

const $ = (id) => document.getElementById(id);

let battle = null;
let refreshTimer = null;


/* =========================================================
   COMMON
========================================================= */

function getToken() {
  return (
    localStorage.getItem("balajiToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function showMessage(message, success = false) {
  const box = $("roomCodeMessage");

  if (!box) return;

  box.textContent = message;
  box.style.color = success ? "#86efac" : "#fca5a5";
}

async function api(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE + url, {
    ...options,
    headers
  });

  let data = {};

  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "Something went wrong");
  }

  return data;
}


/* =========================================================
   BATTLE LOAD
========================================================= */

async function loadBattle() {
  if (!battleId) {
    alert("Battle not found.");
    window.location.href = "battle.html";
    return;
  }

  try {
    const data = await api(
      `/api/battles/${encodeURIComponent(battleId)}`
    );

    battle = data.battle || data;

    renderBattle();

  } catch (error) {
    console.error(error);
    showMessage(error.message || "Battle load failed.");
  }
}


/* =========================================================
   RENDER BATTLE
========================================================= */

function renderBattle() {
  if (!battle) return;

  /* ---------- Amount ---------- */

  if ($("entryAmount")) {
    $("entryAmount").textContent =
      `${Number(battle.entry_amount || 0).toFixed(2)} BALAJI LUDO Coin`;
  }

  if ($("winningPrize")) {
    $("winningPrize").textContent =
      `${Number(battle.winning_prize || 0).toFixed(2)} BALAJI LUDO Coin`;
  }

  if ($("roomStatus")) {
    $("roomStatus").textContent =
      formatStatus(battle.status);
  }


  /* ---------- Players ---------- */

  if ($("player1Name")) {
    $("player1Name").textContent =
      battle.creator_name || "Player 1";
  }

  if ($("player2Name")) {
    $("player2Name").textContent =
      battle.opponent_name || "Waiting...";
  }

  if ($("player1Status")) {
    $("player1Status").textContent =
      "Player 1";
  }

  if ($("player2Status")) {
    $("player2Status").textContent =
      battle.opponent_id ? "Joined" : "Waiting";
  }


  /* ---------- Room Code ---------- */

  const code = battle.room_code || "";

  if ($("roomCode")) {
    $("roomCode").textContent =
      code || "WAITING";
  }

  if ($("roomCodeInput")) {
    $("roomCodeInput").value = "";
  }


  /* ---------- UI State ---------- */

  const status = String(battle.status || "").toUpperCase();

  const hasOpponent = !!battle.opponent_id;
  const hasRoomCode = !!battle.room_code;

  const isCancelled =
    status === "CANCELLED" ||
    status === "CANCELED";

  const resultSubmitted =
    !!battle.result_status ||
    !!battle.result_submitted_at;

  /* Waiting card */

  if ($("waitingCard")) {
    $("waitingCard").classList.toggle(
      "hidden",
      hasOpponent && hasRoomCode
    );
  }


  /* App play card */

  if ($("appPlayCard")) {
    $("appPlayCard").classList.toggle(
      "hidden",
      !hasOpponent || !hasRoomCode || isCancelled
    );
  }


  /* Result card */

  if ($("resultCard")) {
    $("resultCard").classList.toggle(
      "hidden",
      !hasOpponent ||
      !hasRoomCode ||
      isCancelled ||
      resultSubmitted
    );
  }


  /* Cancel Match */

  if ($("cancelBtn")) {
    $("cancelBtn").disabled =
      hasRoomCode ||
      isCancelled ||
      resultSubmitted;
  }


  /* Room Code input */

  if ($("roomCodeInput")) {
    $("roomCodeInput").disabled =
      hasRoomCode ||
      !isCreator() ||
      isCancelled ||
      resultSubmitted;
  }

  if ($("setRoomCodeBtn")) {
    $("setRoomCodeBtn").disabled =
      hasRoomCode ||
      !isCreator() ||
      isCancelled ||
      resultSubmitted;
  }


  /* Result buttons */

  setResultButtonsDisabled(
    resultSubmitted || isCancelled
  );
}


/* =========================================================
   STATUS
========================================================= */

function formatStatus(status) {
  const value = String(status || "").toUpperCase();

  const map = {
    OPEN: "Open",
    JOINED: "Opponent Joined",
    WAITING: "Waiting",
    ROOM_READY: "Room Ready",
    PLAYING: "Playing",
    RESULT_PENDING: "Result Pending",
    WON: "Won",
    LOST: "Lost",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    COMPLETED: "Completed"
  };

  return map[value] || status || "Unknown";
}


/* =========================================================
   CURRENT USER
========================================================= */

function getCurrentUserId() {
  return (
    localStorage.getItem("balajiUserId") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("customerId") ||
    ""
  );
}

function isCreator() {
  const currentUserId = getCurrentUserId();

  if (!currentUserId || !battle) {
    return false;
  }

  return String(currentUserId) === String(battle.creator_id);
}


/* =========================================================
   SET ROOM CODE
========================================================= */

async function setRoomCode() {
  if (!battleId) return;

  const input = $("roomCodeInput");

  if (!input) return;

  const code = input.value.trim();

  if (!/^\d{8}$/.test(code)) {
    showMessage(
      "Room Code exactly 8 digits का होना चाहिए।"
    );
    return;
  }

  const button = $("setRoomCodeBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  try {
    await api("/api/battles/room-code", {
      method: "POST",
      body: JSON.stringify({
        battleId,
        roomCode: code
      })
    });

    showMessage(
      "Room Code successfully set.",
      true
    );

    await loadBattle();

  } catch (error) {
    console.error(error);

    showMessage(
      error.message || "Room Code save failed."
    );

  } finally {
    if (button && !battle?.room_code) {
      button.disabled = false;
      button.textContent = "Set";
    }
  }
}


/* =========================================================
   COPY ROOM CODE
========================================================= */

async function copyRoomCode() {
  const code =
    battle?.room_code ||
    ($("roomCode") ? $("roomCode").textContent : "");

  if (!code || code === "WAITING") {
    alert("Room Code अभी available नहीं है.");
    return;
  }

  try {
    await navigator.clipboard.writeText(code);

    if ($("copyCodeBtn")) {
      $("copyCodeBtn").textContent = "Copied ✓";

      setTimeout(() => {
        if ($("copyCodeBtn")) {
          $("copyCodeBtn").textContent = "Copy Code";
        }
      }, 1500);
    }

  } catch (error) {
    alert("Room Code: " + code);
  }
}


/* =========================================================
   RESULT BUTTONS
========================================================= */

function setResultButtonsDisabled(disabled) {
  const buttons = [
    $("wonBtn"),
    $("lostBtn"),
    $("cancelResultBtn")
  ];

  buttons.forEach((button) => {
    if (button) {
      button.disabled = disabled;
    }
  });
}


/* =========================================================
   SUBMIT RESULT
========================================================= */

async function submitResult(result) {
  if (!battleId) return;

  if (!battle?.room_code) {
    alert("पहले Room Code आने के बाद Ludo King App में game खेलें.");
    return;
  }

  if (battle.result_status) {
    alert("Result पहले ही submit हो चुका है.");
    return;
  }

  let screenshot = "";

  if (result === "WON") {
    screenshot = prompt(
      "Win screenshot का link डालें:"
    );

    if (screenshot === null) {
      return;
    }

    screenshot = screenshot.trim();

    if (!screenshot) {
      alert(
        "Win result के लिए screenshot जरूरी है."
      );
      return;
    }
  }

  let confirmText = "";

  if (result === "WON") {
    confirmText =
      "क्या आप I WON result submit करना चाहते हैं?\n\nResult submit होने के बाद इसे बदला नहीं जा सकेगा.";
  }

  if (result === "LOST") {
    confirmText =
      "क्या आप I LOST result submit करना चाहते हैं?\n\nResult submit होने के बाद इसे बदला नहीं जा सकेगा.";
  }

  if (!confirm(confirmText)) {
    return;
  }

  setResultButtonsDisabled(true);

  try {
    await api("/api/battles/result", {
      method: "POST",
      body: JSON.stringify({
        battleId,
        result,
        screenshot
      })
    });

    alert(
      result === "WON"
        ? "I WON result submit हो गया."
        : "I LOST result submit हो गया."
    );

    await loadBattle();

  } catch (error) {
    console.error(error);

    alert(
      error.message || "Result submit failed."
    );

    setResultButtonsDisabled(false);
  }
}


/* =========================================================
   CANCEL RESULT
========================================================= */

async function submitCancelResult() {
  if (!battleId) return;

  const reason = prompt(
    "Cancel का reason लिखें:"
  );

  if (reason === null) {
    return;
  }

  const cleanReason = reason.trim();

  if (!cleanReason) {
    alert("Cancel reason जरूरी है.");
    return;
  }

  const confirmCancel = confirm(
    "क्या आप Battle Cancel करना चाहते हैं?\n\nCancel submit होने के बाद बाद में game शुरू करने पर Admin responsibility नहीं लेगा."
  );

  if (!confirmCancel) {
    return;
  }

  setResultButtonsDisabled(true);

  try {
    await api("/api/battles/cancel", {
      method: "POST",
      body: JSON.stringify({
        battleId,
        reason: cleanReason
      })
    });

    alert(
      "Cancel request submit हो गई."
    );

    await loadBattle();

  } catch (error) {
    console.error(error);

    alert(
      error.message || "Cancel failed."
    );

    setResultButtonsDisabled(false);
  }
}


/* =========================================================
   CANCEL MATCH
========================================================= */

async function cancelMatch() {
  if (!battleId) return;

  const reason = prompt(
    "Cancel Match का reason लिखें:\n\nExample:\nNo player join\nNo room code\nOpponent error"
  );

  if (reason === null) {
    return;
  }

  const cleanReason = reason.trim();

  if (!cleanReason) {
    alert("Cancel reason जरूरी है.");
    return;
  }

  if (!confirm(
    "क्या आप इस Battle को Cancel करना चाहते हैं?"
  )) {
    return;
  }

  const button = $("cancelBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Cancelling...";
  }

  try {
    await api("/api/battles/cancel", {
      method: "POST",
      body: JSON.stringify({
        battleId,
        reason: cleanReason
      })
    });

    alert("Battle Cancel request submit हो गई.");

    await loadBattle();

  } catch (error) {
    console.error(error);

    alert(
      error.message || "Cancel failed."
    );

    if (button) {
      button.disabled = false;
      button.textContent = "Cancel Match";
    }
  }
}


/* =========================================================
   BACK
========================================================= */

function goBack() {
  window.location.href = "battle.html";
}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startAutoRefresh() {
  stopAutoRefresh();

  refreshTimer = setInterval(() => {
    loadBattle();
  }, 5000);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}


/* =========================================================
   EVENTS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  $("backBtn")?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      goBack();
    }
  );

  $("setRoomCodeBtn")?.addEventListener(
    "click",
    setRoomCode
  );

  $("copyCodeBtn")?.addEventListener(
    "click",
    copyRoomCode
  );

  $("wonBtn")?.addEventListener(
    "click",
    () => submitResult("WON")
  );

  $("lostBtn")?.addEventListener(
    "click",
    () => submitResult("LOST")
  );

  $("cancelResultBtn")?.addEventListener(
    "click",
    submitCancelResult
  );

  $("cancelBtn")?.addEventListener(
    "click",
    cancelMatch
  );


  /* Only numbers in Room Code */

  $("roomCodeInput")?.addEventListener(
    "input",
    (event) => {
      event.target.value =
        event.target.value
          .replace(/\D/g, "")
          .slice(0, 8);
    }
  );


  loadBattle();
  startAutoRefresh();
});


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  stopAutoRefresh
);
