const API_BASE = "";

const TOKEN_KEYS = [
  "balajiToken",
  "token",
  "authToken"
];

const CUSTOMER_ID_KEYS = [
  "balajiCustomerId",
  "customerId",
  "userId"
];

const MOBILE_KEYS = [
  "balajiMobile",
  "mobileNumber",
  "mobile"
];

let battleId = "";
let refreshTimer = null;


/* =========================
   STORAGE
========================= */

function getStorage(keys) {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

function getToken() {
  return getStorage(TOKEN_KEYS);
}

function getMobile() {
  const value = getStorage(MOBILE_KEYS);
  const digits = String(value).replace(/\D/g, "");

  return digits.length >= 10 ? digits.slice(-10) : "";
}


/* =========================
   BATTLE ID
========================= */

function getBattleId() {

  const params = new URLSearchParams(location.search);

  const queryId =
    params.get("id") ||
    params.get("battleId");

  if (queryId) {
    return String(queryId);
  }

  const directId =
    localStorage.getItem("balajiBattleId");

  if (directId) {

    try {
      const parsed = JSON.parse(directId);

      if (parsed && typeof parsed === "object") {
        return String(
          parsed.id ||
          parsed.battle_id ||
          parsed.battleId ||
          ""
        );
      }

      return String(parsed);

    } catch {
      return String(directId);
    }
  }

  const selected =
    localStorage.getItem("balajiSelectedBattle");

  if (selected) {

    try {

      const parsed = JSON.parse(selected);

      if (parsed && typeof parsed === "object") {
        return String(
          parsed.id ||
          parsed.battle_id ||
          parsed.battleId ||
          ""
        );
      }

      return String(parsed);

    } catch {
      return String(selected);
    }
  }

  return "";
}


/* =========================
   API
========================= */

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  const mobile = getMobile();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (mobile) {
    headers["X-Balaji-Mobile"] = mobile;
  }

  const response = await fetch(
    API_BASE + path,
    {
      ...options,
      headers
    }
  );

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}


/* =========================
   UI HELPERS
========================= */

function show(id) {
  const element = document.getElementById(id);

  if (element) {
    element.classList.remove("hidden");
  }
}

function hide(id) {
  const element = document.getElementById(id);

  if (element) {
    element.classList.add("hidden");
  }
}

function hideAllStates() {

  hide("loadingCard");
  hide("matchCard");
  hide("errorCard");

  hide("waitingSection");
  hide("readySection");
  hide("resultSection");
}

function money(value) {

  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;
}


/* =========================
   ERROR
========================= */

function showError(message) {

  hideAllStates();

  show("errorCard");

  const messageBox =
    document.getElementById("errorMessage");

  if (messageBox) {
    messageBox.textContent = message;
  }
}


/* =========================
   LOAD BATTLE
========================= */

async function loadBattle() {

  battleId = getBattleId();

  console.log(
    "Balaji Room Battle ID:",
    battleId
  );

  if (!battleId) {

    showError(
      "Battle ID नहीं मिला। Battle page से Battle खोलें।"
    );

    return;
  }

  try {

    const data = await api(
      `/api/battles/${encodeURIComponent(battleId)}`
    );

    const battle =
      data.battle ||
      data.data ||
      data;

    if (!battle || !battle.id) {

      showError(
        "Battle information नहीं मिली।"
      );

      return;
    }

    renderBattle(battle);

  } catch (error) {

    console.error(
      "Room load error:",
      error
    );

    showError(
      error.message ||
      "Battle information load नहीं हो सकी।"
    );
  }
}


/* =========================
   NORMALIZE STATUS
========================= */

function getBattleStatus(battle) {

  const raw = String(
    battle.status ||
    battle.match_status ||
    battle.battle_status ||
    ""
  )
    .trim()
    .toUpperCase();

  return raw;
}


/* =========================
   RENDER BATTLE
========================= */

function renderBattle(battle) {

  /*
    पहले सभी states बंद।
    इससे Waiting + Ready + Error
    एक साथ दिखाई नहीं देंगे।
  */

  hideAllStates();

  show("matchCard");


  /* =========================
     PLAYERS
  ========================= */

  const creatorName =
    battle.creator_name ||
    battle.creatorName ||
    battle.player1 ||
    battle.player_one_name ||
    "Player 1";


  const opponentName =
    battle.opponent_name ||
    battle.opponentName ||
    battle.joiner_name ||
    battle.player2 ||
    battle.player_two_name ||
    "";


  const playerOne =
    document.getElementById(
      "playerOneName"
    );

  if (playerOne) {
    playerOne.textContent = creatorName;
  }


  const playerTwo =
    document.getElementById(
      "playerTwoName"
    );

  if (playerTwo) {

    playerTwo.textContent =
      opponentName || "Waiting...";
  }


  /* =========================
     MONEY
  ========================= */

  const entryAmount =
    document.getElementById(
      "entryAmount"
    );

  if (entryAmount) {

    entryAmount.textContent =
      money(
        battle.entry_fee ??
        battle.entry_amount ??
        battle.entryAmount ??
        battle.entry ??
        0
      );
  }


  const winningAmount =
    document.getElementById(
      "winningAmount"
    );

  if (winningAmount) {

    winningAmount.textContent =
      money(
        battle.winning_prize ??
        battle.prize_amount ??
        battle.winningPrize ??
        battle.prize ??
        0
      );
  }


  /* =========================
     STATUS
  ========================= */

  const status =
    getBattleStatus(battle);

  const statusBadge =
    document.getElementById(
      "statusBadge"
    );


  /*
    अगर backend status खाली है,
    तो players देखकर state समझेंगे.
  */

  const hasOpponent =
    Boolean(
      opponentName &&
      opponentName !== "Waiting..." &&
      opponentName !== "Customer"
    );


  /* =========================
     ROOM CODE
  ========================= */

  const roomCode =
    battle.room_code ||
    battle.roomCode ||
    battle.room ||
    "";


  const roomCodeElement =
    document.getElementById(
      "roomCode"
    );

  if (roomCodeElement) {

    roomCodeElement.textContent =
      roomCode || "--------";
  }


  /* =========================
     RESULT SUBMITTED
  ========================= */

  if (
    status === "RESULT_SUBMITTED" ||
    status === "RESULT" ||
    status === "FINISHED" ||
    status === "COMPLETED"
  ) {

    if (statusBadge) {
      statusBadge.textContent =
        "RESULT";
    }

    if (roomCode) {
      show("readySection");
    }

    show("resultSection");

    return;
  }


  /* =========================
     READY / RUNNING
  ========================= */

  if (
    status === "READY" ||
    status === "ROOM_READY" ||
    status === "MATCH_READY" ||
    status === "RUNNING" ||
    status === "JOINED"
  ) {

    if (roomCode) {

      show("readySection");

      if (statusBadge) {
        statusBadge.textContent =
          status === "RUNNING"
            ? "RUNNING"
            : "READY";
      }

    } else {

      show("waitingSection");

      if (statusBadge) {
        statusBadge.textContent =
          "WAITING";
      }
    }

    return;
  }


  /* =========================
     OPEN / WAITING
  ========================= */

  if (
    status === "" ||
    status === "OPEN" ||
    status === "WAITING" ||
    status === "WAITING_ROOM"
  ) {

    show("waitingSection");

    if (statusBadge) {
      statusBadge.textContent =
        "WAITING";
    }

    return;
  }


  /* =========================
     UNKNOWN
  ========================= */

  /*
    Unknown status को Match Not Found
    नहीं बनाएँगे।
  */

  console.warn(
    "Unknown battle status:",
    status,
    battle
  );

  show("waitingSection");

  if (statusBadge) {
    statusBadge.textContent =
      "WAITING";
  }
}


/* =========================
   COPY ROOM CODE
========================= */

async function copyRoomCode() {

  const element =
    document.getElementById(
      "roomCode"
    );

  if (!element) return;

  const code =
    element.textContent.trim();

  if (
    !code ||
    code === "--------"
  ) {

    alert(
      "Room Code अभी available नहीं है।"
    );

    return;
  }


  try {

    await navigator.clipboard.writeText(
      code
    );

    const button =
      document.getElementById(
        "copyRoomBtn"
      );

    if (!button) return;

    const oldText =
      button.textContent;

    button.textContent =
      "✅ Room Code Copied";

    setTimeout(() => {
      button.textContent = oldText;
    }, 1800);

  } catch {

    alert(
      `Room Code: ${code}`
    );
  }
}


/* =========================
   LUDO KING
========================= */

function openLudoKing() {

  const element =
    document.getElementById(
      "roomCode"
    );

  if (!element) return;

  const code =
    element.textContent.trim();

  if (
    !code ||
    code === "--------"
  ) {

    alert(
      "Room Code अभी available नहीं है।"
    );

    return;
  }


  alert(
    `Ludo King खोलें और Room Code ${code} डालकर match खेलें।`
  );
}


/* =========================
   RESULT
========================= */

function openResultPage() {

  if (!battleId) {

    alert(
      "Battle ID नहीं मिला।"
    );

    return;
  }

  localStorage.setItem(
    "balajiBattleId",
    battleId
  );

  window.location.href =
    `result.html?id=${encodeURIComponent(
      battleId
    )}`;
}


/* =========================
   EVENTS
========================= */

document
  .getElementById("backBtn")
  ?.addEventListener(
    "click",
    () => {
      window.location.href =
        "battle.html";
    }
  );


document
  .getElementById("copyRoomBtn")
  ?.addEventListener(
    "click",
    copyRoomCode
  );


document
  .getElementById("playLudoBtn")
  ?.addEventListener(
    "click",
    openLudoKing
  );


document
  .getElementById("resultBtn")
  ?.addEventListener(
    "click",
    openResultPage
  );


document
  .getElementById("retryBtn")
  ?.addEventListener(
    "click",
    () => {

      hide("errorCard");
      hide("matchCard");

      show("loadingCard");

      loadBattle();
    }
  );


/* =========================
   START
========================= */

hideAllStates();

show("loadingCard");

loadBattle();


/* =========================
   AUTO REFRESH
========================= */

if (refreshTimer) {
  clearInterval(refreshTimer);
}

refreshTimer = setInterval(() => {

  if (!document.hidden) {
    loadBattle();
  }

}, 5000);
