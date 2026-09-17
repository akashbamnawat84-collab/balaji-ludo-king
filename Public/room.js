/* =========================================================
   BALAJI LUDO KING
   ROOM / BATTLE PAGE
   FINAL VERSION
========================================================= */

const API_BASE = "";
const REFRESH_TIME = 5000;


/* =========================================================
   ELEMENTS
========================================================= */

const entryFee =
  document.getElementById("entryFee");

const winningPrize =
  document.getElementById("winningPrize");

const battleStatus =
  document.getElementById("battleStatus");

const player1Name =
  document.getElementById("player1Name");

const player1Status =
  document.getElementById("player1Status");

const player2Name =
  document.getElementById("player2Name");

const player2Status =
  document.getElementById("player2Status");

const roomCodeInput =
  document.getElementById("roomCodeInput");

const setRoomCodeBtn =
  document.getElementById("setRoomCodeBtn");

const roomCodeMessage =
  document.getElementById("roomCodeMessage");

const currentRoomCode =
  document.getElementById("currentRoomCode");

const copyRoomCodeBtn =
  document.getElementById("copyRoomCodeBtn");

const waitingCard =
  document.getElementById("waitingCard");

const waitingText =
  document.getElementById("waitingText");

const openLudoBtn =
  document.getElementById("openLudoBtn");

const wonBtn =
  document.getElementById("wonBtn");

const lostBtn =
  document.getElementById("lostBtn");

const cancelBtn =
  document.getElementById("cancelBtn");

const cancelSection =
  document.getElementById("cancelSection");

const cancelReason =
  document.getElementById("cancelReason");

const confirmCancelBtn =
  document.getElementById("confirmCancelBtn");


/* =========================================================
   USER / LOGIN
========================================================= */

function getMobile() {

  const keys = [
    "balajiMobile",
    "customerMobile",
    "mobile"
  ];


  for (const key of keys) {

    const value =
      localStorage.getItem(key);


    if (value) {

      const mobile =
        String(value)
          .replace(/\D/g, "")
          .slice(-10);


      if (mobile.length === 10) {

        return mobile;

      }

    }

  }


  return "";

}


function getCustomerId() {

  const keys = [
    "balajiCustomerId",
    "customerId",
    "balaji_customer_id"
  ];


  for (const key of keys) {

    const value =
      localStorage.getItem(key);


    if (value) {

      return String(value);

    }

  }


  const mobile =
    getMobile();


  if (mobile) {

    return mobile;

  }


  return "";

}


/* =========================================================
   LOGIN CHECK
========================================================= */

function checkLogin() {

  const mobile =
    getMobile();


  /*
    Login.js अब ये दोनों values save करता है:
    balajiLogin = true
    balajiMobile = 10 digit mobile
  */

  const loggedIn =
    localStorage.getItem(
      "balajiLogin"
    );


  if (
    loggedIn === "true" &&
    mobile.length === 10
  ) {

    return true;

  }


  /*
    अगर mobile मौजूद है लेकिन login flag
    किसी वजह से missing है तो session recover करें.
  */

  if (mobile.length === 10) {

    localStorage.setItem(
      "balajiLogin",
      "true"
    );


    localStorage.setItem(
      "balajiCustomerId",
      mobile
    );


    localStorage.setItem(
      "customerId",
      mobile
    );


    return true;

  }


  alert(
    "Please login first."
  );


  window.location.href =
    "/login/";


  return false;

}


/* =========================================================
   BATTLE ID
========================================================= */

function getBattleId() {

  const savedId =
    localStorage.getItem(
      "balajiBattleId"
    );


  if (savedId) {

    return String(savedId);

  }


  /* Current battle */

  try {

    const current =
      JSON.parse(
        localStorage.getItem(
          "balajiCurrentBattle"
        ) || "null"
      );


    if (current) {

      const id =
        current.id ||
        current.battle_id ||
        current.battleId;


      if (id) {

        localStorage.setItem(
          "balajiBattleId",
          String(id)
        );


        return String(id);

      }

    }

  } catch (error) {

    console.log(
      "Current battle error:",
      error
    );

  }


  /* Selected battle */

  try {

    const selected =
      JSON.parse(
        localStorage.getItem(
          "balajiSelectedBattle"
        ) || "null"
      );


    if (selected) {

      const id =
        selected.id ||
        selected.battle_id ||
        selected.battleId;


      if (id) {

        localStorage.setItem(
          "balajiBattleId",
          String(id)
        );


        return String(id);

      }

    }

  } catch (error) {

    console.log(
      "Selected battle error:",
      error
    );

  }


  return "";

}


/* =========================================================
   API
========================================================= */

async function api(
  path,
  options = {}
) {

  const mobile =
    getMobile();


  const customerId =
    getCustomerId();


  const headers = {

    "Content-Type":
      "application/json",

    "X-Balaji-Mobile":
      mobile

  };


  if (options.headers) {

    Object.assign(
      headers,
      options.headers
    );

  }


  const response =
    await fetch(
      API_BASE + path,
      {
        ...options,
        headers
      }
    );


  let data;


  try {

    data =
      await response.json();

  } catch {

    data = {

      success: false,

      message:
        "Invalid server response."

    };

  }


  if (!response.ok) {

    throw new Error(

      data.message ||
      data.error ||
      "Request failed."

    );

  }


  return data;

}


/* =========================================================
   HELPERS
========================================================= */

function money(value) {

  const number =
    Number(value || 0);


  return number
    .toFixed(2)
    .replace(
      /\.00$/,
      ""
    );

}


function formatStatus(status) {

  if (!status) {

    return "Waiting";

  }


  const value =
    String(status)
      .replace(
        /_/g,
        " "
      )
      .toLowerCase();


  return value.replace(
    /\b\w/g,
    char =>
      char.toUpperCase()
  );

}


function show(element) {

  if (element) {

    element.classList.remove(
      "hidden"
    );

  }

}


function hide(element) {

  if (element) {

    element.classList.add(
      "hidden"
    );

  }

}


function message(
  text,
  success = false
) {

  if (!roomCodeMessage) {

    return;

  }


  roomCodeMessage.textContent =
    text;


  roomCodeMessage.style.color =
    success
      ? "#22c55e"
      : "#ef4444";

}


/* =========================================================
   BATTLE FIELD HELPERS
========================================================= */

function getEntry(battle) {

  return (

    battle.entry_amount ??
    battle.entry_fee ??
    battle.entry ??
    battle.amount ??
    battle.entryAmount ??
    0

  );

}


function getPrize(battle) {

  return (

    battle.winning_prize ??
    battle.prize_amount ??
    battle.prize ??
    battle.winningPrize ??
    0

  );

}


function getPlayer1(battle) {

  return (

    battle.creator_name ??
    battle.player1_name ??
    battle.player1Name ??
    battle.creatorName ??
    battle.player1?.name ??
    battle.player_1?.name ??
    "Player 1"

  );

}


function getPlayer2(battle) {

  return (

    battle.opponent_name ??
    battle.player2_name ??
    battle.player2Name ??
    battle.joiner_name ??
    battle.player2?.name ??
    battle.player_2?.name ??
    "Player 2"

  );

}


function player2Joined(battle) {

  return Boolean(

    battle.opponent_id ||
    battle.joiner_id ||
    battle.opponent_name ||
    battle.joiner_name ||
    battle.player2 ||
    battle.player_2 ||
    battle.player2_name ||
    battle.player2Name

  );

}


/* =========================================================
   SAVE BATTLE
========================================================= */

function saveBattle(battle) {

  if (!battle) {

    return;

  }


  const id =
    battle.id ||
    battle.battle_id ||
    battle.battleId;


  if (id) {

    localStorage.setItem(
      "balajiBattleId",
      String(id)
    );

  }


  try {

    localStorage.setItem(
      "balajiCurrentBattle",
      JSON.stringify(battle)
    );

  } catch (error) {

    console.log(
      "Battle save error:",
      error
    );

  }

}


/* =========================================================
   ROOM CODE
========================================================= */

function displayRoomCode(code) {

  const clean =
    String(code || "")
      .replace(
        /\D/g,
        ""
      )
      .slice(0, 8);


  if (currentRoomCode) {

    currentRoomCode.textContent =
      clean ||
      "Waiting for Room Code";

  }


  if (roomCodeInput) {

    roomCodeInput.value =
      clean;

  }

}


/* =========================================================
   RENDER BATTLE
========================================================= */

function renderBattle(data) {

  if (!data) {

    return;

  }


  const battle =
    data.battle ||
    data.data ||
    data;


  if (!battle) {

    return;

  }


  saveBattle(battle);


  /* Entry */

  if (entryFee) {

    entryFee.textContent =
      money(
        getEntry(battle)
      );

  }


  /* Prize */

  if (winningPrize) {

    winningPrize.textContent =
      money(
        getPrize(battle)
      );

  }


  /* Status */

  const status =
    String(
      battle.status || ""
    ).toUpperCase();


  if (battleStatus) {

    battleStatus.textContent =
      formatStatus(status);

  }


  /* Player 1 */

  if (player1Name) {

    player1Name.textContent =
      getPlayer1(battle);

  }


  if (player1Status) {

    player1Status.textContent =
      "Joined";

  }


  /* Player 2 */

  const joined =
    player2Joined(battle);


  if (joined) {

    if (player2Name) {

      player2Name.textContent =
        getPlayer2(battle);

    }


    if (player2Status) {

      player2Status.textContent =
        "Joined";

    }

  } else {

    if (player2Name) {

      player2Name.textContent =
        "Waiting for Player 2";

    }


    if (player2Status) {

      player2Status.textContent =
        "Waiting";

    }

  }


  /* Room Code */

  const code =
    battle.room_code ??
    battle.roomCode ??
    "";


  if (code) {

    displayRoomCode(code);

    hide(waitingCard);


    if (waitingText) {

      waitingText.textContent =
        "Room code is ready.";

    }

  } else {

    displayRoomCode("");


    show(waitingCard);


    if (waitingText) {

      waitingText.textContent =
        joined
          ? "Both players have joined. Enter the 8-digit Room Code."
          : "Waiting for Player 2.";

    }

  }


  /* Cancel section */

  const finalStatus =
    status.toLowerCase();


  if (
    finalStatus === "cancelled" ||
    finalStatus === "canceled" ||
    finalStatus === "completed"
  ) {

    hide(cancelSection);

  } else {

    show(cancelSection);

  }


  /* Ludo button */

  if (
    joined &&
    code
  ) {

    if (openLudoBtn) {

      openLudoBtn.disabled =
        false;

    }

  } else {

    if (openLudoBtn) {

      openLudoBtn.disabled =
        true;

    }

  }

}


/* =========================================================
   LOAD BATTLE
========================================================= */

async function loadBattle() {

  if (!checkLogin()) {

    return;

  }


  const battleId =
    getBattleId();


  if (!battleId) {

    if (battleStatus) {

      battleStatus.textContent =
        "Battle Not Found";

    }

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


    renderBattle(data);

  } catch (error) {

    console.log(
      "Battle load error:",
      error
    );


    if (battleStatus) {

      battleStatus.textContent =
        "Unable to Load";

    }

  }

}


/* =========================================================
   SET ROOM CODE
========================================================= */

async function setRoomCode() {

  if (!checkLogin()) {

    return;

  }


  const battleId =
    getBattleId();


  if (!battleId) {

    message(
      "Battle ID not found."
    );

    return;

  }


  const code =
    roomCodeInput
      ? roomCodeInput.value
          .replace(
            /\D/g,
            ""
          )
          .slice(0, 8)
      : "";


  if (code.length !== 8) {

    message(
      "Please enter exactly 8 digit room code."
    );

    return;

  }


  if (setRoomCodeBtn) {

    setRoomCodeBtn.disabled =
      true;

    setRoomCodeBtn.textContent =
      "Saving...";

  }


  try {

    const body = {

      battle_id:
        battleId,

      battleId:
        battleId,

      room_code:
        code,

      roomCode:
        code,

      customer_id:
        getCustomerId(),

      mobile:
        getMobile()

    };


    const data =
      await api(
        "/api/battles/room-code",
        {
          method: "POST",

          body:
            JSON.stringify(body)

        }
      );


    const returnedCode =
      data.room_code ||
      data.roomCode ||
      data.battle?.room_code ||
      code;


    displayRoomCode(
      returnedCode
    );


    message(
      "Room code saved successfully.",
      true
    );


    hide(waitingCard);


    await loadBattle();

  } catch (error) {

    message(
      error.message ||
      "Unable to save room code."
    );

  } finally {

    if (setRoomCodeBtn) {

      setRoomCodeBtn.disabled =
        false;

      setRoomCodeBtn.textContent =
        "🔐 Set Room Code";

    }

  }

}


/* =========================================================
   COPY ROOM CODE
========================================================= */

async function copyRoomCode() {

  const code =
    currentRoomCode
      ? currentRoomCode.textContent.trim()
      : "";


  if (
    !code ||
    code === "Waiting for Room Code"
  ) {

    message(
      "Room code is not available."
    );

    return;

  }


  try {

    await navigator.clipboard
      .writeText(code);


    message(
      "Room code copied successfully.",
      true
    );

  } catch {

    message(
      "Copy failed. Please copy manually."
    );

  }

}


/* =========================================================
   OPEN LUDO KING
========================================================= */

function openLudoKing() {

  const code =
    currentRoomCode
      ? currentRoomCode.textContent.trim()
      : "";


  if (
    !code ||
    code === "Waiting for Room Code"
  ) {

    alert(
      "पहले 8-digit Room Code डालें।"
    );

    return;

  }


  try {

    navigator.clipboard
      .writeText(code);

  } catch {}


  alert(

    "Room Code " +
    code +
    " copy हो गया है.\n\n" +
    "अब Ludo King App खोलकर इसी Room Code से game खेलें."

  );

}


/* =========================================================
   RESULT
========================================================= */

async function submitResult(result) {

  if (!checkLogin()) {

    return;

  }


  const battleId =
    getBattleId();


  if (!battleId) {

    alert(
      "Battle ID not found."
    );

    return;

  }


  const confirmed =
    confirm(

      result === "won"
        ? "क्या आप confirm करते हैं कि आप WIN हुए हैं?"
        : "क्या आप confirm करते हैं कि आप LOSE हुए हैं?"

    );


  if (!confirmed) {

    return;

  }


  try {

    const body = {

      battle_id:
        battleId,

      battleId:
        battleId,

      customer_id:
        getCustomerId(),

      mobile:
        getMobile(),

      result:
        result,

      result_status:
        result

    };


    await api(
      "/api/battles/result",
      {
        method: "POST",

        body:
          JSON.stringify(body)

      }
    );


    alert(
      "Result submitted successfully."
    );


    await loadBattle();

  } catch (error) {

    alert(
      error.message ||
      "Unable to submit result."
    );

  }

}


/* =========================================================
   CANCEL
========================================================= */

async function cancelMatch() {

  if (!checkLogin()) {

    return;

  }


  const battleId =
    getBattleId();


  if (!battleId) {

    alert(
      "Battle ID not found."
    );

    return;

  }


  const reason =
    cancelReason
      ? cancelReason.value.trim()
      : "";


  if (!reason) {

    alert(
      "Please enter cancel reason."
    );

    if (cancelReason) {

      cancelReason.focus();

    }

    return;

  }


  const confirmed =
    confirm(
      "क्या आप यह Battle cancel करना चाहते हैं?"
    );


  if (!confirmed) {

    return;

  }


  if (confirmCancelBtn) {

    confirmCancelBtn.disabled =
      true;

    confirmCancelBtn.textContent =
      "Cancelling...";

  }


  try {

    const body = {

      battle_id:
        battleId,

      battleId:
        battleId,

      customer_id:
        getCustomerId(),

      mobile:
        getMobile(),

      reason:
        reason,

      cancel_reason:
        reason

    };


    await api(
      "/api/battles/cancel",
      {
        method: "POST",

        body:
          JSON.stringify(body)

      }
    );


    alert(
      "Battle cancellation submitted."
    );


    await loadBattle();

  } catch (error) {

    alert(
      error.message ||
      "Unable to cancel battle."
    );

  } finally {

    if (confirmCancelBtn) {

      confirmCancelBtn.disabled =
        false;

      confirmCancelBtn.textContent =
        "Confirm Cancel";

    }

  }

}


/* =========================================================
   INPUT
========================================================= */

if (roomCodeInput) {

  roomCodeInput.addEventListener(
    "input",
    function () {

      this.value =
        this.value
          .replace(
            /\D/g,
            ""
          )
          .slice(0, 8);

    }
  );

}


/* =========================================================
   BUTTONS
========================================================= */

if (setRoomCodeBtn) {

  setRoomCodeBtn.addEventListener(
    "click",
    setRoomCode
  );

}


if (copyRoomCodeBtn) {

  copyRoomCodeBtn.addEventListener(
    "click",
    copyRoomCode
  );

}


if (openLudoBtn) {

  openLudoBtn.addEventListener(
    "click",
    openLudoKing
  );

}


if (wonBtn) {

  wonBtn.addEventListener(
    "click",
    function () {

      submitResult("won");

    }
  );

}


if (lostBtn) {

  lostBtn.addEventListener(
    "click",
    function () {

      submitResult("lost");

    }
  );

}


if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    function () {

      if (!cancelSection) {

        return;

      }


      if (
        cancelSection.classList.contains(
          "hidden"
        )
      ) {

        show(cancelSection);

      } else {

        hide(cancelSection);

      }

    }
  );

}


if (confirmCancelBtn) {

  confirmCancelBtn.addEventListener(
    "click",
    cancelMatch
  );

}


/* =========================================================
   START
========================================================= */

if (checkLogin()) {

  loadBattle();


  setInterval(
    loadBattle,
    REFRESH_TIME
  );

}
