/* =========================================================
   BALAJI LUDO KING
   ROOM / BATTLE PAGE
   Login-compatible version
   Login.js को बदलने की जरूरत नहीं है.
========================================================= */

const API_BASE = "";

const REFRESH_TIME = 5000;


/* =========================================================
   ELEMENTS
========================================================= */

const backBtn =
  document.getElementById("backBtn");

const entryAmount =
  document.getElementById("entryAmount");

const winningPrize =
  document.getElementById("winningPrize");

const roomStatus =
  document.getElementById("roomStatus");

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

const roomCode =
  document.getElementById("roomCode");

const copyCodeBtn =
  document.getElementById("copyCodeBtn");

const waitingCard =
  document.getElementById("waitingCard");

const appPlayCard =
  document.getElementById("appPlayCard");

const resultCard =
  document.getElementById("resultCard");

const wonBtn =
  document.getElementById("wonBtn");

const lostBtn =
  document.getElementById("lostBtn");

const cancelResultBtn =
  document.getElementById("cancelResultBtn");

const cancelBtn =
  document.getElementById("cancelBtn");


/* =========================================================
   CURRENT LOGIN
   Existing login.js stores:

   balajiLogin
   balajiMobile

   इसलिए token/userId की जरूरत नहीं.
========================================================= */

function getMobile() {

  const mobile =
    localStorage.getItem("balajiMobile");

  if (!mobile) {
    return "";
  }

  return mobile
    .replace(/\D/g, "")
    .slice(-10);
}


/* =========================================================
   LOGIN CHECK
========================================================= */

function checkLogin() {

  const loggedIn =
    localStorage.getItem("balajiLogin");

  const mobile =
    getMobile();

  if (
    loggedIn !== "true" ||
    mobile.length !== 10
  ) {

    alert("Please login first.");

    window.location.href =
      "/login/";

    return false;
  }

  return true;
}


/* =========================================================
   GET BATTLE ID
========================================================= */

function getBattleId() {

  const savedId =
    localStorage.getItem(
      "balajiBattleId"
    );

  if (savedId) {
    return savedId;
  }


  try {

    const selected =
      JSON.parse(
        localStorage.getItem(
          "balajiSelectedBattle"
        ) || "null"
      );

    if (
      selected &&
      (
        selected.id ||
        selected.battleId
      )
    ) {

      return (
        selected.id ||
        selected.battleId
      );
    }

  } catch (error) {

    console.log(
      "Selected battle read error:",
      error
    );

  }

  return "";
}


/* =========================================================
   COMMON API
========================================================= */

async function api(
  path,
  options = {}
) {

  const mobile =
    getMobile();

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


  let data = null;

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
   MESSAGE
========================================================= */

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
   HIDE / SHOW
========================================================= */

function show(element) {

  if (element) {
    element.classList.remove("hidden");
  }

}


function hide(element) {

  if (element) {
    element.classList.add("hidden");
  }

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function money(value) {

  const number =
    Number(value || 0);

  return number
    .toFixed(2)
    .replace(/\.00$/, "");
}


/* =========================================================
   SAVE BATTLE ID
========================================================= */

function saveBattleId(id) {

  if (!id) {
    return;
  }

  localStorage.setItem(
    "balajiBattleId",
    String(id)
  );

}


/* =========================================================
   RENDER BATTLE
========================================================= */

function renderBattle(data) {

  const battle =
    data.battle ||
    data.data ||
    data;


  if (!battle) {
    return;
  }


  const id =
    battle.id ||
    battle.battleId;

  if (id) {
    saveBattleId(id);
  }


  /* ENTRY */

  if (entryAmount) {

    entryAmount.textContent =
      money(
        battle.amount ||
        battle.entry_fee ||
        battle.entryAmount ||
        0
      );

  }


  /* PRIZE */

  if (winningPrize) {

    winningPrize.textContent =
      money(
        battle.prize ||
        battle.winning_prize ||
        battle.winningPrize ||
        0
      );

  }


  /* STATUS */

  if (roomStatus) {

    roomStatus.textContent =
      formatStatus(
        battle.status
      );

  }


  /* PLAYERS */

  const players =
    battle.players ||
    [];


  if (
    battle.player1 ||
    battle.player_1
  ) {

    const p1 =
      battle.player1 ||
      battle.player_1;

    if (player1Name) {

      player1Name.textContent =
        p1.name ||
        p1.mobile ||
        "Player 1";

    }

  }


  if (
    battle.player2 ||
    battle.player_2
  ) {

    const p2 =
      battle.player2 ||
      battle.player_2;

    if (player2Name) {

      player2Name.textContent =
        p2.name ||
        p2.mobile ||
        "Player 2";

    }

  }


  if (players.length) {

    const p1 =
      players[0];

    const p2 =
      players[1];


    if (
      p1 &&
      player1Name
    ) {

      player1Name.textContent =
        p1.name ||
        p1.mobile ||
        "Player 1";

    }


    if (
      p2 &&
      player2Name
    ) {

      player2Name.textContent =
        p2.name ||
        p2.mobile ||
        "Player 2";

    }

  }


  /* PLAYER STATUS */

  if (player1Status) {

    player1Status.textContent =
      battle.player1Status ||
      battle.player_1_status ||
      "Joined";

  }


  if (player2Status) {

    player2Status.textContent =
      battle.player2Status ||
      battle.player_2_status ||
      (
        battle.player2 ||
        battle.player_2
          ? "Joined"
          : "Waiting"
      );

  }


  /* ROOM CODE */

  const code =
    battle.roomCode ||
    battle.room_code ||
    "";

  if (code) {

    displayRoomCode(code);

    hide(waitingCard);
    show(appPlayCard);
    show(resultCard);

  } else {

    show(waitingCard);

  }


  /* BATTLE STATUS */

  const status =
    String(
      battle.status || ""
    ).toLowerCase();


  if (
    status === "cancelled" ||
    status === "canceled"
  ) {

    hide(waitingCard);
    hide(appPlayCard);
    hide(resultCard);

  }


  if (
    status === "completed" ||
    status === "won" ||
    status === "lost" ||
    status === "cancel"
  ) {

    show(resultCard);

  }

}


/* =========================================================
   STATUS TEXT
========================================================= */

function formatStatus(status) {

  if (!status) {
    return "Waiting";
  }

  const value =
    String(status)
      .replace(/_/g, " ")
      .toLowerCase();


  return value
    .replace(
      /\b\w/g,
      function(char) {
        return char.toUpperCase();
      }
    );
}


/* =========================================================
   DISPLAY ROOM CODE
========================================================= */

function displayRoomCode(code) {

  const clean =
    String(code)
      .replace(/\D/g, "")
      .slice(0, 8);


  if (roomCode) {

    roomCode.textContent =
      clean || "--------";

  }


  if (roomCodeInput) {

    roomCodeInput.value =
      clean;

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
          .replace(/\D/g, "")
          .trim()
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

    const data =
      await api(
        "/api/battles/room-code",
        {
          method: "POST",

          body: JSON.stringify({

            battleId:
              battleId,

            roomCode:
              code,

            mobile:
              getMobile()

          })

        }
      );


    const returnedCode =
      data.roomCode ||
      data.room_code ||
      code;


    displayRoomCode(
      returnedCode
    );


    message(
      "Room code saved successfully.",
      true
    );


    hide(waitingCard);
    show(appPlayCard);
    show(resultCard);


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
        "Set Room Code";

    }

  }

}


/* =========================================================
   COPY ROOM CODE
========================================================= */

async function copyRoomCode() {

  const code =
    roomCode
      ? roomCode.textContent.trim()
      : "";


  if (
    !code ||
    code === "--------"
  ) {

    return;
  }


  try {

    await navigator.clipboard.writeText(
      code
    );

    message(
      "Room code copied.",
      true
    );

  } catch {

    message(
      "Copy failed. Please copy manually."
    );

  }

}


/* =========================================================
   SUBMIT RESULT
========================================================= */

async function submitResult(
  result
) {

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
      "Once result is submitted, it cannot be changed. Continue?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await api(
      "/api/battles/result",
      {
        method: "POST",

        body: JSON.stringify({

          battleId:
            battleId,

          result:
            result,

          mobile:
            getMobile()

        })

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
   CANCEL RESULT
========================================================= */

async function submitCancelResult() {

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
      "Cancel result submit करना है? Once submitted, it cannot be changed."
    );


  if (!confirmed) {
    return;
  }


  try {

    await api(
      "/api/battles/result",
      {
        method: "POST",

        body: JSON.stringify({

          battleId:
            battleId,

          result:
            "cancel",

          mobile:
            getMobile()

        })

      }
    );


    alert(
      "Cancel result submitted."
    );


    await loadBattle();


  } catch (error) {

    alert(
      error.message ||
      "Unable to cancel battle."
    );

  }

}


/* =========================================================
   CANCEL MATCH
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
    prompt(
      "Cancel reason enter करें:"
    );


  if (!reason) {
    return;
  }


  try {

    await api(
      "/api/battles/cancel",
      {
        method: "POST",

        body: JSON.stringify({

          battleId:
            battleId,

          reason:
            reason,

          mobile:
            getMobile()

        })

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

    if (roomStatus) {
      roomStatus.textContent =
        "Battle not found";
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

    if (roomStatus) {

      roomStatus.textContent =
        "Unable to load";

    }

  }

}


/* =========================================================
   BACK
========================================================= */

if (backBtn) {

  backBtn.addEventListener(
    "click",
    function(event) {

      event.preventDefault();

      window.location.href =
        "/battle.html";

    }
  );

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (setRoomCodeBtn) {

  setRoomCodeBtn.addEventListener(
    "click",
    setRoomCode
  );

}


if (copyCodeBtn) {

  copyCodeBtn.addEventListener(
    "click",
    copyRoomCode
  );

}


if (wonBtn) {

  wonBtn.addEventListener(
    "click",
    function() {

      submitResult("won");

    }
  );

}


if (lostBtn) {

  lostBtn.addEventListener(
    "click",
    function() {

      submitResult("lost");

    }
  );

}


if (cancelResultBtn) {

  cancelResultBtn.addEventListener(
    "click",
    submitCancelResult
  );

}


if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    cancelMatch
  );

}


/* =========================================================
   ROOM CODE INPUT
========================================================= */

if (roomCodeInput) {

  roomCodeInput.addEventListener(
    "input",
    function() {

      this.value =
        this.value
          .replace(/\D/g, "")
          .slice(0, 8);

    }
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
