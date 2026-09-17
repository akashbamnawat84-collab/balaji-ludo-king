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
let battleData = null;
let selectedWinner = null;
let screenshotData = "";


/* =========================
   STORAGE
========================= */

function getStorage(keys) {

  for (const key of keys) {

    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
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


/* =========================
   HELPERS
========================= */

function money(value) {

  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;
}


function show(id) {
  document.getElementById(id)?.classList.remove("hidden");
}


function hide(id) {
  document.getElementById(id)?.classList.add("hidden");
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


/* =========================
   LOAD BATTLE
========================= */

async function loadBattle() {

  battleId = getBattleId();

  if (!battleId) {

    showError(
      "Battle ID नहीं मिला। कृपया My Battles से result page खोलें।"
    );

    return;
  }

  try {

    const data = await api(
      `/api/battles/${encodeURIComponent(battleId)}`
    );

    battleData = data.battle || data;

    renderBattle();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "Match information load नहीं हो सकी।"
    );
  }
}


/* =========================
   RENDER
========================= */

function renderBattle() {

  hide("loadingCard");
  hide("errorCard");
  show("resultCard");

  const creator =
    battleData.creator_name ||
    battleData.creatorName ||
    "Player 1";

  const opponent =
    battleData.opponent_name ||
    battleData.opponentName ||
    battleData.joiner_name ||
    "Player 2";

  document.getElementById("playerOneName").textContent =
    creator;

  document.getElementById("playerTwoName").textContent =
    opponent;

  document.getElementById("playerOneOption").textContent =
    creator;

  document.getElementById("playerTwoOption").textContent =
    opponent;

  document.getElementById("entryAmount").textContent =
    money(
      battleData.entry_fee ??
      battleData.entry_amount
    );

  document.getElementById("winningAmount").textContent =
    money(
      battleData.winning_prize ??
      battleData.prize_amount
    );

  const status =
    String(battleData.status || "").toUpperCase();

  /*
    अगर result पहले से submit है
  */

  if (status === "RESULT_SUBMITTED") {

    hide("resultCard");
    show("submittedCard");

    return;
  }
}


/* =========================
   WINNER SELECT
========================= */

function selectWinner(player) {

  selectedWinner = player;

  const oneBtn =
    document.getElementById("playerOneBtn");

  const twoBtn =
    document.getElementById("playerTwoBtn");

  oneBtn.classList.remove("selected");
  twoBtn.classList.remove("selected");

  if (player === "one") {
    oneBtn.classList.add("selected");
  }

  if (player === "two") {
    twoBtn.classList.add("selected");
  }

  updateSubmitButton();
}


/* =========================
   SCREENSHOT
========================= */

function handleScreenshot(event) {

  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

    showMessage(
      "कृपया JPG, PNG या WEBP image चुनें।",
      "error"
    );

    event.target.value = "";

    return;
  }

  /*
    Screenshot size limit:
    5 MB
  */

  if (file.size > 5 * 1024 * 1024) {

    showMessage(
      "Screenshot 5 MB से छोटा होना चाहिए।",
      "error"
    );

    event.target.value = "";

    return;
  }

  const reader = new FileReader();

  reader.onload = function() {

    screenshotData = reader.result;

    document.getElementById("previewImage").src =
      screenshotData;

    hide("uploadBox");
    show("previewBox");

    showMessage(
      "Screenshot selected.",
      "success"
    );

    updateSubmitButton();
  };

  reader.readAsDataURL(file);
}


/* =========================
   REMOVE SCREENSHOT
========================= */

function removeScreenshot() {

  screenshotData = "";

  document.getElementById("screenshotInput").value = "";

  document.getElementById("previewImage").src = "";

  hide("previewBox");
  show("uploadBox");

  updateSubmitButton();
}


/* =========================
   BUTTON STATE
========================= */

function updateSubmitButton() {

  const button =
    document.getElementById("submitResultBtn");

  const ready =
    Boolean(selectedWinner) &&
    Boolean(screenshotData);

  button.disabled = !ready;

  if (ready) {

    button.classList.add("ready");

  } else {

    button.classList.remove("ready");
  }
}


/* =========================
   SUBMIT RESULT
========================= */

async function submitResult() {

  if (!battleId) {

    showMessage(
      "Battle ID नहीं मिला।",
      "error"
    );

    return;
  }

  if (!selectedWinner) {

    showMessage(
      "पहले winner select करें।",
      "error"
    );

    return;
  }

  if (!screenshotData) {

    showMessage(
      "पहले match screenshot upload करें।",
      "error"
    );

    return;
  }

  const button =
    document.getElementById("submitResultBtn");

  button.disabled = true;

  button.textContent =
    "⏳ Submitting...";


  let winnerId = "";

  if (selectedWinner === "one") {

    winnerId =
      battleData.creator_id ||
      battleData.creatorId ||
      "";

  } else {

    winnerId =
      battleData.opponent_id ||
      battleData.opponentId ||
      battleData.joiner_id ||
      battleData.joinerId ||
      "";
  }


  /*
    Backend में result_player_id
    winner player ID के रूप में भेजा जा रहा है.
  */

  const payload = {

    battle_id: battleId,

    battleId: battleId,

    result_player_id: winnerId,

    winner_id: winnerId,

    player_id: winnerId,

    result_status: "WIN",

    screenshot_url: screenshotData,

    result_screenshot: screenshotData,

    screenshot: screenshotData
  };


  try {

    const response =
      await api("/api/battles/result", {

        method: "POST",

        body: JSON.stringify(payload)

      });


    console.log("Result response:", response);


    hide("resultCard");
    show("submittedCard");

    localStorage.setItem(
      "balajiBattleId",
      battleId
    );

  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Result submit नहीं हो सका।",
      "error"
    );

    button.disabled = false;

    button.textContent =
      "🏆 Submit Match Result";

    updateSubmitButton();
  }
}


/* =========================
   MESSAGE
========================= */

function showMessage(message, type) {

  const box =
    document.getElementById("messageBox");

  box.textContent = message;

  box.className =
    `message-box ${type}`;

  show("messageBox");
}


/* =========================
   ERROR
========================= */

function showError(message) {

  hide("loadingCard");
  hide("resultCard");
  hide("submittedCard");

  show("errorCard");

  document.getElementById("errorMessage").textContent =
    message;
}


/* =========================
   EVENTS
========================= */

document
  .getElementById("backBtn")
  ?.addEventListener("click", () => {

    window.location.href = "room.html";

  });


document
  .getElementById("playerOneBtn")
  ?.addEventListener("click", () => {

    selectWinner("one");

  });


document
  .getElementById("playerTwoBtn")
  ?.addEventListener("click", () => {

    selectWinner("two");

  });


document
  .getElementById("screenshotInput")
  ?.addEventListener("change", handleScreenshot);


document
  .getElementById("removeImageBtn")
  ?.addEventListener("click", removeScreenshot);


document
  .getElementById("submitResultBtn")
  ?.addEventListener("click", submitResult);


document
  .getElementById("retryBtn")
  ?.addEventListener("click", () => {

    hide("errorCard");

    show("loadingCard");

    loadBattle();

  });


document
  .getElementById("backBattleBtn")
  ?.addEventListener("click", () => {

    window.location.href = "battle.html";

  });


/* =========================
   START
========================= */

loadBattle();
