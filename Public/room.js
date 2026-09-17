/* =====================================
   BALAJI LUDO KING - ROOM JS
   ===================================== */

const API_BASE = "";

const TOKEN_KEYS = [
  "balajiToken",
  "token",
  "authToken"
];

const MOBILE_KEYS = [
  "balajiMobile",
  "mobileNumber",
  "mobile"
];

let battleId = "";
let currentBattle = null;
let refreshTimer = null;


/* =====================================
   STORAGE
   ===================================== */

function getStorage(keys) {

  for (const key of keys) {

    const value =
      localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return "";
}


function getToken() {
  return getStorage(TOKEN_KEYS);
}


function getMobile() {

  const value =
    getStorage(MOBILE_KEYS);

  const digits =
    String(value).replace(/\D/g, "");

  return digits.length >= 10
    ? digits.slice(-10)
    : "";
}


/* =====================================
   BATTLE ID
   ===================================== */

function getBattleId() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const queryId =
    params.get("id") ||
    params.get("battleId");

  if (queryId) {
    return String(queryId);
  }


  const saved =
    localStorage.getItem(
      "balajiBattleId"
    );

  if (saved) {

    try {

      const parsed =
        JSON.parse(saved);

      if (
        parsed &&
        typeof parsed === "object"
      ) {

        return String(
          parsed.id ||
          parsed.battle_id ||
          parsed.battleId ||
          ""
        );
      }

    } catch (_) {

      return String(saved);
    }
  }


  const selected =
    localStorage.getItem(
      "balajiSelectedBattle"
    );

  if (selected) {

    try {

      const parsed =
        JSON.parse(selected);

      if (
        parsed &&
        typeof parsed === "object"
      ) {

        return String(
          parsed.id ||
          parsed.battle_id ||
          parsed.battleId ||
          ""
        );
      }

      return String(parsed);

    } catch (_) {

      return String(selected);
    }
  }


  const current =
    localStorage.getItem(
      "balajiCurrentBattle"
    );

  if (current) {

    try {

      const parsed =
        JSON.parse(current);

      if (
        parsed &&
        typeof parsed === "object"
      ) {

        return String(
          parsed.id ||
          parsed.battle_id ||
          parsed.battleId ||
          ""
        );
      }

      return String(parsed);

    } catch (_) {

      return String(current);
    }
  }


  return "";
}


/* =====================================
   API
   ===================================== */

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };


  const token =
    getToken();

  const mobile =
    getMobile();


  if (token) {

    headers.Authorization =
      `Bearer ${token}`;
  }


  if (mobile) {

    headers["X-Balaji-Mobile"] =
      mobile;
  }


  const response =
    await fetch(
      API_BASE + path,
      {
        ...options,
        headers
      }
    );


  const text =
    await response.text();


  let data = {};


  try {

    data =
      text
        ? JSON.parse(text)
        : {};

  } catch (_) {

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


/* =====================================
   HELPERS
   ===================================== */

function money(value) {

  const number =
    Number(value || 0);

  return `₹${number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  )}`;
}


function getElement(id) {
  return document.getElementById(id);
}


/* =====================================
   GET PLAYER 1
   ===================================== */

function getPlayer1Name(battle) {

  return (
    battle.creator_name ||
    battle.creatorName ||
    battle.player1_name ||
    battle.player1Name ||
    battle.player_one_name ||
    battle.player1 ||
    "Player 1"
  );
}


/* =====================================
   GET PLAYER 2
   ===================================== */

function getPlayer2Name(battle) {

  const names = [

    battle.opponent_name,
    battle.opponentName,

    battle.joiner_name,
    battle.joinerName,

    battle.player2_name,
    battle.player2Name,

    battle.player_two_name,

    battle.player2,

    battle.second_player_name,

    battle.joined_by_name,
    battle.joinedByName
  ];


  for (const name of names) {

    if (
      name !== undefined &&
      name !== null
    ) {

      const value =
        String(name).trim();


      if (
        value &&
        value.toLowerCase() !== "waiting"
      ) {

        return value;
      }
    }
  }


  return "";
}


/* =====================================
   PLAYER 2 DETECTION
   ===================================== */

function player2Joined(battle) {

  const name =
    getPlayer2Name(battle);


  if (name) {
    return true;
  }


  const ids = [

    battle.opponent_id,
    battle.opponentId,

    battle.joiner_id,
    battle.joinerId,

    battle.player2_id,
    battle.player2Id,

    battle.player_two_id,

    battle.second_player_id,

    battle.joined_by
  ];


  return ids.some(
    value =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}


/* =====================================
   ROOM CODE
   ===================================== */

function getRoomCode(battle) {

  const codes = [

    battle.room_code,
    battle.roomCode,

    battle.ludo_room_code,
    battle.ludoRoomCode,

    battle.game_room_code,
    battle.gameRoomCode,

    battle.room,

    battle.code
  ];


  for (const code of codes) {

    if (
      code !== undefined &&
      code !== null
    ) {

      const value =
        String(code).trim();


      if (value) {
        return value;
      }
    }
  }


  return "";
}


/* =====================================
   STATUS
   ===================================== */

function getStatus(battle) {

  return String(
    battle.status ||
    battle.match_status ||
    battle.battle_status ||
    "WAITING"
  )
    .trim()
    .toUpperCase();
}


/* =====================================
   RENDER BATTLE
   ===================================== */

function renderBattle(battle) {

  currentBattle =
    battle;


  /* ---------------------------------
     ENTRY FEE
     --------------------------------- */

  const entry =
    battle.entry_fee ??
    battle.entry_amount ??
    battle.entryAmount ??
    battle.entry ??
    0;


  const entryElement =
    getElement("entryFee");


  if (entryElement) {

    entryElement.textContent =
      money(entry);
  }


  /* ---------------------------------
     WINNING PRIZE
     --------------------------------- */

  const prize =
    battle.winning_prize ??
    battle.prize_amount ??
    battle.winningPrize ??
    battle.prize ??
    0;


  const prizeElement =
    getElement("winningPrize");


  if (prizeElement) {

    prizeElement.textContent =
      money(prize);
  }


  /* ---------------------------------
     PLAYERS
     --------------------------------- */

  const player1 =
    getPlayer1Name(battle);


  const player2 =
    getPlayer2Name(battle);


  const player1Element =
    getElement("player1Name");


  const player2Element =
    getElement("player2Name");


  const player1Status =
    getElement("player1Status");


  const player2Status =
    getElement("player2Status");


  if (player1Element) {

    player1Element.textContent =
      player1;
  }


  if (player1Status) {

    player1Status.textContent =
      "Joined";
  }


  if (player2Element) {

    player2Element.textContent =
      player2 ||
      "Waiting";
  }


  if (player2Status) {

    player2Status.textContent =
      player2
        ? "Joined"
        : "Waiting";
  }


  /* ---------------------------------
     ROOM CODE
     --------------------------------- */

  const roomCode =
    getRoomCode(battle);


  const roomCodeElement =
    getElement(
      "currentRoomCode"
    );


  if (roomCodeElement) {

    roomCodeElement.textContent =
      roomCode ||
      "Waiting for Room Code";
  }


  /* ---------------------------------
     STATUS
     --------------------------------- */

  const status =
    getStatus(battle);


  const joined =
    player2Joined(battle);


  const statusElement =
    getElement(
      "battleStatus"
    );


  /*
    IMPORTANT:
    Player 2 मौजूद है तो
    MATCH READY दिखाएँगे,
    भले API status अभी WAITING हो।
  */

  if (joined) {

    if (statusElement) {

      statusElement.textContent =
        roomCode
          ? "Ready"
          : "Match Ready";
    }


    const waitingCard =
      getElement(
        "waitingCard"
      );


    if (waitingCard) {

      waitingCard.style.display =
        "none";
    }


    if (roomCode) {

      const ludoCard =
        document.querySelector(
          ".ludo-app-card"
        );

      if (ludoCard) {

        ludoCard.style.display =
          "";
      }
    }

    return;
  }


  /* ---------------------------------
     WAITING
     --------------------------------- */

  if (statusElement) {

    statusElement.textContent =
      "Waiting";
  }


  const waitingCard =
    getElement(
      "waitingCard"
    );


  if (waitingCard) {

    waitingCard.style.display =
      "";
  }


  const waitingText =
    getElement(
      "waitingText"
    );


  if (waitingText) {

    waitingText.textContent =
      "Waiting for Player 2";
  }
}


/* =====================================
   LOAD BATTLE
   ===================================== */

async function loadBattle() {

  battleId =
    getBattleId();


  console.log(
    "BALAJI ROOM BATTLE ID:",
    battleId
  );


  if (!battleId) {

    alert(
      "कृपया पहले Battle page से Battle खोलें।"
    );

    return;
  }


  try {

    const data =
      await api(
        `/api/battles/${encodeURIComponent(
          battleId
        )}`
      );


    console.log(
      "BALAJI ROOM DATA:",
      data
    );


    const battle =
      data.battle ||
      data.data ||
      data;


    if (
      !battle ||
      !battle.id
    ) {

      throw new Error(
        "Battle information नहीं मिली।"
      );
    }


    renderBattle(
      battle
    );


  } catch (error) {

    console.error(
      "ROOM ERROR:",
      error
    );


    /*
      Login error को साफ message
      के साथ दिखाएँ।
    */

    if (
      error.message &&
      (
        error.message
          .toLowerCase()
          .includes("login") ||

        error.message
          .toLowerCase()
          .includes("unauthorized") ||

        error.message
          .toLowerCase()
          .includes("token")
      )
    ) {

      alert(
        "कृपया पहले Login करें।"
      );

      return;
    }


    console.error(
      "Battle load failed:",
      error.message
    );
  }
}


/* =====================================
   SET ROOM CODE
   ===================================== */

async function setRoomCode() {

  const input =
    getElement(
      "roomCodeInput"
    );


  const message =
    getElement(
      "roomCodeMessage"
    );


  if (!input) {
    return;
  }


  const code =
    input.value
      .replace(/\D/g, "")
      .slice(0, 8);


  input.value =
    code;


  if (code.length !== 8) {

    if (message) {

      message.textContent =
        "कृपया 8-digit Room Code डालें।";
    }

    return;
  }


  /*
    पहले local UI update।
  */

  const current =
    getElement(
      "currentRoomCode"
    );


  if (current) {

    current.textContent =
      code;
  }


  if (message) {

    message.textContent =
      "✅ Room Code set हो गया।";
  }


  /*
    Backend endpoint उपलब्ध होने पर
    server पर भी save करने की कोशिश।
  */

  try {

    await api(
      `/api/battles/${encodeURIComponent(
        battleId
      )}/room-code`,
      {
        method: "POST",

        body: JSON.stringify({
          battle_id: battleId,
          room_code: code
        })
      }
    );


  } catch (error) {

    /*
      अगर endpoint अभी backend में नहीं है,
      तो UI फिर भी code दिखाएगा।
    */

    console.warn(
      "Room code server save:",
      error.message
    );
  }
}


/* =====================================
   COPY ROOM CODE
   ===================================== */

async function copyRoomCode() {

  const element =
    getElement(
      "currentRoomCode"
    );


  if (!element) {
    return;
  }


  const code =
    element.textContent.trim();


  if (
    !code ||
    code === "Waiting for Room Code"
  ) {

    alert(
      "पहले Room Code set करें।"
    );

    return;
  }


  try {

    await navigator.clipboard.writeText(
      code
    );


    const button =
      getElement(
        "copyRoomCodeBtn"
      );


    if (button) {

      const old =
        button.textContent;


      button.textContent =
        "✅ Copied";


      setTimeout(() => {

        button.textContent =
          old;

      }, 1800);
    }


  } catch (_) {

    alert(
      `Room Code: ${code}`
    );
  }
}


/* =====================================
   OPEN LUDO KING
   ===================================== */

function openLudoKing() {

  const element =
    getElement(
      "currentRoomCode"
    );


  const code =
    element
      ? element.textContent.trim()
      : "";


  if (
    !code ||
    code === "Waiting for Room Code"
  ) {

    alert(
      "पहले Room Code उपलब्ध होना चाहिए।"
    );

    return;
  }


  alert(
    `Ludo King App खोलें और Room Code ${code} enter करें।`
  );
}


/* =====================================
   RESULT
   ===================================== */

function submitResult(result) {

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


  localStorage.setItem(
    "balajiBattleResult",
    result
  );


  window.location.href =
    `result.html?id=${encodeURIComponent(
      battleId
    )}&result=${encodeURIComponent(
      result
    )}`;
}


/* =====================================
   CANCEL
   ===================================== */

function showCancelSection() {

  const section =
    getElement(
      "cancelSection"
    );


  if (section) {

    section.style.display =
      "";
  }
}


function confirmCancel() {

  const reason =
    getElement(
      "cancelReason"
    );


  const text =
    reason
      ? reason.value.trim()
      : "";


  if (!text) {

    alert(
      "Cancel reason डालें।"
    );

    return;
  }


  alert(
    "Cancel request तैयार है।"
  );
}


/* =====================================
   EVENTS
   ===================================== */

const backBtn =
  document.querySelector(
    ".back-btn"
  );


if (backBtn) {

  backBtn.addEventListener(
    "click",
    function(event) {

      /*
        Normal battle.html link
        को काम करने दें।
      */

    }
  );
}


const setRoomCodeBtn =
  getElement(
    "setRoomCodeBtn"
  );


if (setRoomCodeBtn) {

  setRoomCodeBtn.addEventListener(
    "click",
    setRoomCode
  );
}


const copyRoomCodeBtn =
  getElement(
    "copyRoomCodeBtn"
  );


if (copyRoomCodeBtn) {

  copyRoomCodeBtn.addEventListener(
    "click",
    copyRoomCode
  );
}


const openLudoBtn =
  getElement(
    "openLudoBtn"
  );


if (openLudoBtn) {

  openLudoBtn.addEventListener(
    "click",
    openLudoKing
  );
}


const wonBtn =
  getElement(
    "wonBtn"
  );


if (wonBtn) {

  wonBtn.addEventListener(
    "click",
    function() {

      submitResult("WON");
    }
  );
}


const lostBtn =
  getElement(
    "lostBtn"
  );


if (lostBtn) {

  lostBtn.addEventListener(
    "click",
    function() {

      submitResult("LOST");
    }
  );
}


const cancelBtn =
  getElement(
    "cancelBtn"
  );


if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    showCancelSection
  );
}


const confirmCancelBtn =
  getElement(
    "confirmCancelBtn"
  );


if (confirmCancelBtn) {

  confirmCancelBtn.addEventListener(
    "click",
    confirmCancel
  );
}


/* =====================================
   START
   ===================================== */

loadBattle();


/* =====================================
   AUTO REFRESH
   ===================================== */

if (refreshTimer) {

  clearInterval(
    refreshTimer
  );
}


refreshTimer =
  setInterval(
    function() {

      if (
        !document.hidden &&
        battleId
      ) {

        loadBattle();
      }

    },
    5000
  );
