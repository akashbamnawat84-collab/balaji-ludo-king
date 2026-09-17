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

let battleId = null;
let refreshTimer = null;

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

function getCustomerId() {
  return getStorage(CUSTOMER_ID_KEYS);
}

function getMobile() {
  const value = getStorage(MOBILE_KEYS);

  const digits = String(value).replace(/\D/g, "");

  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return "";
}

function getPlayerName() {
  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    localStorage.getItem("customerName") ||
    "Player"
  );
}

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
      data = {
        raw: text
      };
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

function getBattleId() {

  const params = new URLSearchParams(location.search);

  const queryId =
    params.get("id") ||
    params.get("battleId");

  if (queryId) {
    return queryId;
  }

  return (
    localStorage.getItem("balajiBattleId") ||
    localStorage.getItem("balajiSelectedBattle") ||
    ""
  );
}

async function loadBattle() {

  battleId = getBattleId();

  if (!battleId) {
    showError("Battle ID नहीं मिला। कृपया Battle page से दोबारा खोलें।");
    return;
  }

  try {

    const data = await api(
      `/api/battles/${encodeURIComponent(battleId)}`
    );

    const battle = data.battle || data;

    renderBattle(battle);

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "Battle information load नहीं हो सकी।"
    );
  }
}

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
    "";

  document.getElementById("playerOneName").textContent =
    creatorName;

  document.getElementById("playerTwoName").textContent =
    opponentName || "Waiting...";

  document.getElementById("entryAmount").textContent =
    money(
      battle.entry_fee ??
      battle.entry_amount ??
      battle.entryAmount
    );

  document.getElementById("winningAmount").textContent =
    money(
      battle.winning_prize ??
      battle.prize_amount ??
      battle.winningPrize
    );

  const status = String(
    battle.status || "OPEN"
  ).toUpperCase();

  const statusBadge =
    document.getElementById("statusBadge");

  statusBadge.textContent = status;

  hide("waitingSection");
  hide("readySection");
  hide("resultSection");

  /*
    OPEN
    = Player 2 अभी join नहीं हुआ
  */

  if (status === "OPEN") {

    show("waitingSection");

    statusBadge.textContent = "WAITING";

    return;
  }

  /*
    JOINED / ROOM_READY / RUNNING
    = दोनों players मौजूद हैं
  */

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

      document.getElementById("roomCode").textContent =
        roomCode;

      show("readySection");

      statusBadge.textContent =
        status === "RUNNING"
          ? "RUNNING"
          : "READY";

    } else {

      show("waitingSection");

      statusBadge.textContent = "WAITING ROOM";
    }

    return;
  }

  /*
    RESULT_SUBMITTED
  */

  if (status === "RESULT_SUBMITTED") {

    const roomCode =
      battle.room_code ||
      battle.roomCode ||
      "";

    if (roomCode) {
      document.getElementById("roomCode").textContent =
        roomCode;
    }

    show("readySection");
    show("resultSection");

    statusBadge.textContent = "RESULT";

    return;
  }

  /*
    CANCELLED / EXPIRED / OTHER
  */

  showError(
    `यह battle अभी ${status} स्थिति में है।`
  );
}

function showError(message) {

  hide("loadingCard");
  hide("matchCard");

  show("errorCard");

  document.getElementById("errorMessage").textContent =
    message;
}

async function copyRoomCode() {

  const code =
    document.getElementById("roomCode").textContent.trim();

  if (!code || code === "--------") {
    return;
  }

  try {

    await navigator.clipboard.writeText(code);

    const button =
      document.getElementById("copyRoomBtn");

    const oldText = button.textContent;

    button.textContent =
      "✅ Room Code Copied";

    setTimeout(() => {
      button.textContent = oldText;
    }, 1800);

  } catch {

    alert(`Room Code: ${code}`);
  }
}

function openLudoKing() {

  /*
    Ludo King app को सीधे open करने की कोशिश।
    अगर device/app support न करे तो user को manual
    app खोलकर room code डालना होगा।
  */

  const code =
    document.getElementById("roomCode").textContent.trim();

  if (!code || code === "--------") {
    alert("Room Code अभी available नहीं है।");
    return;
  }

  /*
    पहले app खोलने की कोशिश
  */

  window.location.href = "ludoking://";

  /*
    कुछ devices पर custom URL काम नहीं करता।
    इसलिए fallback message.
  */

  setTimeout(() => {

    alert(
      `Ludo King खोलें और Room Code ${code} डालकर match खेलें।`
    );

  }, 1200);
}

function openResultPage() {

  /*
    अभी result.html मौजूद नहीं है।
    इसलिए अगले step के लिए placeholder.
  */

  if (battleId) {

    localStorage.setItem(
      "balajiBattleId",
      battleId
    );

    window.location.href =
      `result.html?id=${encodeURIComponent(battleId)}`;

  } else {

    alert("Battle ID नहीं मिला।");
  }
}

document.getElementById("backBtn")
  ?.addEventListener("click", () => {
    window.location.href = "battle.html";
  });

document.getElementById("copyRoomBtn")
  ?.addEventListener("click", copyRoomCode);

document.getElementById("playLudoBtn")
  ?.addEventListener("click", openLudoKing);

document.getElementById("resultBtn")
  ?.addEventListener("click", openResultPage);

document.getElementById("retryBtn")
  ?.addEventListener("click", () => {
    hide("errorCard");
    show("loadingCard");
    loadBattle();
  });

/*
  First load
*/

loadBattle();

/*
  Auto refresh every 5 seconds
*/

refreshTimer = setInterval(() => {

  if (!document.hidden) {
    loadBattle();
  }

}, 5000);
