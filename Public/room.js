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
let refreshTimer = null;


/* =====================================
   STORAGE
   ===================================== */

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


function getMobile() {
  const value = getStorage(MOBILE_KEYS);

  const digits = String(value).replace(/\D/g, "");

  return digits.length >= 10
    ? digits.slice(-10)
    : "";
}


/* =====================================
   BATTLE ID
   ===================================== */

function getBattleId() {

  const params = new URLSearchParams(
    window.location.search
  );

  const queryId =
    params.get("id") ||
    params.get("battleId");

  if (queryId) {
    return String(queryId);
  }


  const savedId =
    localStorage.getItem("balajiBattleId");

  if (savedId) {

    try {

      const parsed =
        JSON.parse(savedId);

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

      return String(savedId);
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


  const token = getToken();
  const mobile = getMobile();


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
   UI HELPERS
   ===================================== */

function show(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.classList.remove(
      "hidden"
    );
  }
}


function hide(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.classList.add(
      "hidden"
    );
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

  const number =
    Number(value || 0);

  return `₹${number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  )}`;
}


/* =====================================
   ERROR
   ===================================== */

function showError(message) {

  hideAllStates();

  show("errorCard");


  const box =
    document.getElementById(
      "errorMessage"
    );


  if (box) {

    box.textContent =
      message;
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

    showError(
      "Battle ID नहीं मिला। Battle page से Battle खोलें।"
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
      "BALAJI BATTLE DATA:",
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

      showError(
        "Battle information नहीं मिली।"
      );

      return;
    }


    renderBattle(
      battle
    );

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


/* =====================================
   STATUS
   ===================================== */

function getStatus(battle) {

  return String(
    battle.status ||
    battle.match_status ||
    battle.battle_status ||
    ""
  )
    .trim()
    .toUpperCase();
}


/* =====================================
   PLAYER 2 DETECTION
   ===================================== */

function getPlayer2Name(battle) {

  const possibleNames = [

    battle.opponent_name,

    battle.opponentName,

    battle.joiner_name,

    battle.joinerName,

    battle.player2,

    battle.player_2,

    battle.player_two_name,

    battle.playerTwoName,

    battle.player2_name,

    battle.second_player_name,

    battle.joined_by_name,

    battle.joinedByName

  ];


  for (
    const name of possibleNames
  ) {

    if (
      name !== undefined &&
      name !== null &&
      String(name).trim() !== ""
    ) {

      const value =
        String(name).trim();


      if (
        value.toLowerCase() !==
        "waiting"
      ) {

        return value;
      }
    }
  }


  return "";
}


/* =====================================
   PLAYER 2 ID DETECTION
   ===================================== */

function hasPlayer2(battle) {

  const player2Name =
    getPlayer2Name(
      battle
    );


  if (player2Name) {
    return true;
  }


  const possibleIds = [

    battle.opponent_id,

    battle.opponentId,

    battle.joiner_id,

    battle.joinerId,

    battle.player2_id,

    battle.player_2_id,

    battle.player_two_id,

    battle.second_player_id,

    battle.joined_by

  ];


  for (
    const id of possibleIds
  ) {

    if (
      id !== undefined &&
      id !== null &&
      String(id).trim() !== ""
    ) {

      return true;
    }
  }


  return false;
}


/* =====================================
   ROOM CODE
   ===================================== */

function getRoomCode(battle) {

  const possibleCodes = [

    battle.room_code,

    battle.roomCode,

    battle.room,

    battle.ludo_room_code,

    battle.ludoRoomCode,

    battle.game_room_code,

    battle.gameRoomCode,

    battle.code

  ];


  for (
    const code of possibleCodes
  ) {

    if (
      code !== undefined &&
      code !== null &&
      String(code).trim() !== ""
    ) {

      return String(code).trim();
    }
  }


  return "";
}


/* =====================================
   RENDER
   ===================================== */

function renderBattle(battle) {

  hideAllStates();

  show("matchCard");


  /* ---------------------------------
     PLAYER 1
     --------------------------------- */

  const playerOneName =
    battle.creator_name ||
    battle.creatorName ||
    battle.player1 ||
    battle.player_one_name ||
    "Player 1";


  const playerOne =
    document.getElementById(
      "playerOneName"
    );


  if (playerOne) {

    playerOne.textContent =
      playerOneName;
  }


  /* ---------------------------------
     PLAYER 2
     --------------------------------- */

  const player2Name =
    getPlayer2Name(
      battle
    );


  const playerTwo =
    document.getElementById(
      "playerTwoName"
    );


  if (playerTwo) {

    playerTwo.textContent =
      player2Name ||
      "Waiting...";
  }


  /* ---------------------------------
     ENTRY FEE
     --------------------------------- */

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


  /* ---------------------------------
     WINNING PRIZE
     --------------------------------- */

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


  /* ---------------------------------
     STATUS
     --------------------------------- */

  const status =
    getStatus(
      battle
    );


  const statusBadge =
    document.getElementById(
      "statusBadge"
    );


  /* ---------------------------------
     ROOM CODE
     --------------------------------- */

  const roomCode =
    getRoomCode(
      battle
    );


  const roomCodeElement =
    document.getElementById(
      "roomCode"
    );


  if (roomCodeElement) {

    roomCodeElement.textContent =
      roomCode ||
      "--------";
  }


  /* ---------------------------------
     PLAYER 2 FOUND?
     --------------------------------- */

  const player2Joined =
    hasPlayer2(
      battle
    );


  /*
    IMPORTANT:

    अगर Player 2 मौजूद है तो
    backend status WAITING/OPEN होने
    के बावजूद MATCH READY दिखाएँगे।
  */

  if (player2Joined) {

    /* MATCH READY */

    if (statusBadge) {

      statusBadge.textContent =
        roomCode
          ? "READY"
          : "MATCH READY";
    }


    /*
      Room Code available है
      तो Ready section दिखाएँ।
    */

    if (roomCode) {

      show("readySection");

      hide("waitingSection");

    } else {

      /*
        Player 2 आ गया है लेकिन
        अभी Room Code नहीं आया।
      */

      hide("readySection");

      show("waitingSection");


      const waitingTitle =
        document.querySelector(
          "#waitingSection h2"
        );


      if (waitingTitle) {

        waitingTitle.textContent =
          "Match Ready";
      }


      const waitingText =
        document.querySelector(
          "#waitingSection .waiting-text"
        );


      if (waitingText) {

        waitingText.textContent =
          "Player 2 joined. Room Code का इंतज़ार करें।";
      }
    }


    return;
  }


  /* ---------------------------------
     NO PLAYER 2
     --------------------------------- */

  hide("readySection");
  hide("resultSection");

  show("waitingSection");


  if (statusBadge) {

    statusBadge.textContent =
      "WAITING";
  }


  const waitingTitle =
    document.querySelector(
      "#waitingSection h2"
    );


  if (waitingTitle) {

    waitingTitle.textContent =
      "Waiting for Player 2";
  }


  const waitingText =
    document.querySelector(
      "#waitingSection .waiting-text"
    );


  if (waitingText) {

    waitingText.textContent =
      "Another player can join this Battle.";
  }
}


/* =====================================
   COPY ROOM CODE
   ===================================== */

async function copyRoomCode() {

  const element =
    document.getElementById(
      "roomCode"
    );


  if (!element) {
    return;
  }


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


    if (button) {

      const oldText =
        button.textContent;


      button.textContent =
        "✅ Room Code Copied";


      setTimeout(() => {

        button.textContent =
          oldText;

      }, 1800);
    }


  } catch (_) {

    alert(
      `Room Code: ${code}`
    );
  }
}


/* =====================================
   PLAY LUDO KING
   ===================================== */

function openLudoKing() {

  const element =
    document.getElementById(
      "roomCode"
    );


  if (!element) {
    return;
  }


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


  /*
    Ludo King app को automatic
    control नहीं किया जा सकता।
    User manually app खोलकर
    Room Code enter करेगा।
  */

  alert(
    `Ludo King खोलें और Room Code ${code} enter करके match खेलें।`
  );
}


/* =====================================
   RESULT PAGE
   ===================================== */

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


/* =====================================
   BACK BUTTON
   ===================================== */

document
  .getElementById(
    "backBtn"
  )
  ?.addEventListener(
    "click",
    () => {

      window.location.href =
        "battle.html";
    }
  );


/* =====================================
   COPY BUTTON
   ===================================== */

document
  .getElementById(
    "copyRoomBtn"
  )
  ?.addEventListener(
    "click",
    copyRoomCode
  );


/* =====================================
   PLAY BUTTON
   ===================================== */

document
  .getElementById(
    "playLudoBtn"
  )
  ?.addEventListener(
    "click",
    openLudoKing
  );


/* =====================================
   RESULT BUTTON
   ===================================== */

document
  .getElementById(
    "resultBtn"
  )
  ?.addEventListener(
    "click",
    openResultPage
  );


/* =====================================
   RETRY
   ===================================== */

document
  .getElementById(
    "retryBtn"
  )
  ?.addEventListener(
    "click",
    () => {

      hide("errorCard");

      hide("matchCard");

      show("loadingCard");

      loadBattle();
    }
  );


/* =====================================
   START
   ===================================== */

hideAllStates();

show("loadingCard");

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
    () => {

      if (!document.hidden) {

        loadBattle();
      }

    },
    5000
  );
