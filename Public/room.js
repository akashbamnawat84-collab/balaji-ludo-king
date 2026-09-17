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

  return digits.length >= 10
    ? digits.slice(-10)
    : "";
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
    return queryId;
  }


  const directId =
    localStorage.getItem("balajiBattleId");

  if (directId) {

    try {
      const parsed = JSON.parse(directId);

      if (parsed && typeof parsed === "object") {
        if (parsed.id) return String(parsed.id);
        if (parsed.battle_id) return String(parsed.battle_id);
      }

    } catch (_) {
      return directId;
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

    } catch (_) {

      return selected;
    }
  }

  return "";
}


/* =========================
   API
========================= */

function api(path, options = {}) {

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

  return fetch(API_BASE + path, {
    ...options,
    headers
  }).then(async response => {

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `Request failed (${response.status})`
      );
    }

    return data;
  });
}


/* =========================
   HELPERS
========================= */

function show(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function hide(id) {
  document.getElementById(id)?.classList.add("hidden");
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

  hide("loadingCard");
  hide("matchCard");

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

  console.log("Balaji Room Battle ID:", battleId);

  if (!battleId) {

    showError(
      "Battle ID नहीं मिला। Battle page से Join Battle करके दोबारा खोलें।"
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
   RENDER
========================= */

function renderBattle(battle) {

  hide("loadingCard");
  hide("errorCard");

  show("matchCard");


  const creatorName =
    battle.creator_name ||
    battle.creatorName ||
    "Player 1";

  const opponentName =
    battle.opponent_name ||
    battle.opponentName ||
    battle.joiner_name ||
    "Waiting...";


  document.getElementById(
    "playerOneName"
  ).textContent = creatorName;


  document.getElementById(
    "playerTwoName"
  ).textContent = opponentName;


  document.getElementById(
    "entryAmount"
  ).textContent = money(
    battle.entry_fee ??
    battle.entry_amount ??
    battle.entryAmount
  );


  document.getElementById(
    "winningAmount"
  ).textContent = money(
    battle.winning_prize ??
    battle.prize_amount ??
    battle.winningPrize
  );


  const status =
    String(
      battle.status || "OPEN"
    ).toUpperCase();


  const statusBadge =
    document.getElementById("statusBadge");

  statusBadge.textContent = status;


  hide("waitingSection");
  hide("readySection");
  hide("resultSection");


  /* =========================
     OPEN
  ========================= */

  if (status === "OPEN") {

    show("waitingSection");

    statusBadge.textContent =
      "WAITING";

    return;
  }


  /* =========================
     JOINED / READY / RUNNING
  ========================= */

  if (
    status === "JOINED" ||
    status === "ROOM_READY" ||
    status === "RUNNING"
  ) {

    const roomCode =
      battle.room_code ||
      battle.roomCode ||
      "";


    if (roomCode) {

      document.getElementById(
        "roomCode"
      ).textContent = roomCode;

      show("readySection");

      statusBadge.textContent =
        status === "RUNNING"
          ? "RUNNING"
          : "READY";

    } else {

      show("waitingSection");

      statusBadge.textContent =
        "WAITING ROOM";
    }

    return;
  }


  /* =========================
     RESULT SUBMITTED
  ========================= */

  if (status === "RESULT_SUBMITTED") {

    const roomCode =
      battle.room_code ||
      battle.roomCode ||
      "";


    if (roomCode) {

      document.getElementById(
        "roomCode"
      ).textContent = roomCode;
    }


    show("readySection");
    show("resultSection");

    statusBadge.textContent =
      "RESULT";

    return;
  }


  /* =========================
     OTHER
  ========================= */

  showError(
    `यह battle अभी ${status} स्थिति में है।`
  );
}


/* =========================
   COPY ROOM CODE
========================= */

async function copyRoomCode() {

  const code =
    document.getElementById(
      "roomCode"
    ).textContent.trim();


  if (!code || code === "--------") {
    return;
  }


  try {

    await navigator.clipboard.writeText(code);

    const button =
      document.getElementById(
        "copyRoomBtn"
      );

    const oldText =
      button.textContent;

    button.textContent =
      "✅ Room Code Copied";


    setTimeout(() => {

      button.textContent =
        oldText;

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

  const code =
    document.getElementById(
      "roomCode"
    ).textContent.trim();


  if (!code || code === "--------") {

    alert(
      "Room Code अभी available नहीं है।"
    );

    return;
  }


  alert(
    `Ludo King खोलें और Room Code ${code} डालकर match खेलें।`
  );

  /*
    Mobile पर user manually
    Ludo King app खोल सकता है.
  */
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
    `result.html?id=${encodeURIComponent(battleId)}`;
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
      show("loadingCard");

      loadBattle();
    }
  );


/* =========================
   START
========================= */

loadBattle();


/* =========================
   AUTO REFRESH
========================= */

refreshTimer =
  setInterval(() => {

    if (!document.hidden) {
      loadBattle();
    }

  }, 5000);
