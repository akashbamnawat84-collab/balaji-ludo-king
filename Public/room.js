// =====================================
// BALAJI LUDO KING - ROOM
// Demo Coins • Room Waiting System
// =====================================

const WAIT_TIME_MS = 5 * 60 * 1000;

// =====================================
// ELEMENTS
// =====================================

const entryFee = document.getElementById("entryFee");
const winningPrize = document.getElementById("winningPrize");

const waitingState =
  document.getElementById("waitingState");

const roomCodeState =
  document.getElementById("roomCodeState");

const waitingSeconds =
  document.getElementById("waitingSeconds");

const matchStatus =
  document.getElementById("matchStatus");

const readyStatus =
  document.getElementById("readyStatus");

const roomCode =
  document.getElementById("roomCode");

const backBtn =
  document.getElementById("backBtn");

const cancelBtn =
  document.getElementById("cancelBtn");

const cancelReadyBtn =
  document.getElementById("cancelReadyBtn");

const copyCodeBtn =
  document.getElementById("copyCodeBtn");

const playLudoBtn =
  document.getElementById("playLudoBtn");

const wonBtn =
  document.getElementById("wonBtn");

const lostBtn =
  document.getElementById("lostBtn");


// =====================================
// GET SELECTED BATTLE
// =====================================

function getSelectedBattle() {

  try {

    const data =
      localStorage.getItem(
        "balajiSelectedBattle"
      );

    if (!data) {
      return null;
    }

    return JSON.parse(data);

  } catch (error) {

    console.log(
      "Selected battle error:",
      error
    );

    return null;

  }

}

const selectedBattle =
  getSelectedBattle();


// =====================================
// SHOW BATTLE DETAILS
// =====================================

if (selectedBattle) {

  if (entryFee) {

    entryFee.textContent =
      selectedBattle.entry || 0;

  }

  if (winningPrize) {

    winningPrize.textContent =
      selectedBattle.prize || 0;

  }

}


// =====================================
// WAITING START TIME
// =====================================

let waitingStartedAt =
  Number(
    localStorage.getItem(
      "balajiRoomWaitingStartedAt"
    )
  );

if (!waitingStartedAt) {

  waitingStartedAt =
    Date.now();

  localStorage.setItem(
    "balajiRoomWaitingStartedAt",
    String(waitingStartedAt)
  );

}


// =====================================
// GENERATE ROOM CODE
// =====================================

function generateRoomCode() {

  return String(
    Math.floor(
      10000000 +
      Math.random() * 90000000
    )
  );

}


// =====================================
// CHECK SAVED ROOM CODE
// =====================================

let savedRoomCode =
  localStorage.getItem(
    "balajiRoomCode"
  );


// =====================================
// SHOW ROOM CODE
// =====================================

function showRoomCode(code) {

  if (!code) {
    return;
  }

  if (waitingState) {

    waitingState.style.display =
      "none";

  }

  if (roomCodeState) {

    roomCodeState.style.display =
      "block";

  }

  if (roomCode) {

    roomCode.textContent =
      code;

  }

  if (readyStatus) {

    readyStatus.textContent =
      "READY";

  }

}


// =====================================
// CREATE ROOM CODE
// =====================================

function createRoomCode() {

  if (savedRoomCode) {

    showRoomCode(
      savedRoomCode
    );

    return;

  }

  const code =
    generateRoomCode();

  savedRoomCode =
    code;

  localStorage.setItem(
    "balajiRoomCode",
    code
  );

  localStorage.setItem(
    "balajiRoomCodeCreatedAt",
    String(Date.now())
  );

  showRoomCode(code);

}


// =====================================
// WAITING TIMER
// =====================================

function updateWaitingTimer() {

  // अगर room code पहले से है
  if (savedRoomCode) {

    return;

  }

  const elapsed =
    Date.now() -
    waitingStartedAt;

  const remaining =
    Math.max(
      0,
      WAIT_TIME_MS - elapsed
    );

  const totalSeconds =
    Math.floor(
      remaining / 1000
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  if (waitingSeconds) {

    waitingSeconds.textContent =
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");

  }


  // 5 मिनट पूरे
  if (remaining <= 0) {

    if (matchStatus) {

      matchStatus.textContent =
        "EXPIRED";

    }

    if (waitingSeconds) {

      waitingSeconds.textContent =
        "00:00";

    }

    return;

  }

}


// =====================================
// BACK
// =====================================

if (backBtn) {

  backBtn.addEventListener(
    "click",
    function () {

      window.location.href =
        "battle.html";

    }
  );

}


// =====================================
// CANCEL WAITING
// =====================================

function cancelRoom() {

  localStorage.removeItem(
    "balajiSelectedBattle"
  );

  localStorage.removeItem(
    "balajiSecondPlayer"
  );

  localStorage.removeItem(
    "balajiRoomCode"
  );

  localStorage.removeItem(
    "balajiRoomWaitingStartedAt"
  );

  localStorage.removeItem(
    "balajiRoomCodeCreatedAt"
  );

  window.location.href =
    "battle.html";

}


if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    cancelRoom
  );

}


if (cancelReadyBtn) {

  cancelReadyBtn.addEventListener(
    "click",
    cancelRoom
  );

}


// =====================================
// COPY ROOM CODE
// =====================================

if (copyCodeBtn) {

  copyCodeBtn.addEventListener(
    "click",
    async function () {

      const code =
        roomCode
          ? roomCode.textContent.trim()
          : "";

      if (!code) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          code
        );

        copyCodeBtn.textContent =
          "✅ Code Copied";

        setTimeout(
          function () {

            copyCodeBtn.textContent =
              "📋 Copy Code";

          },
          1500
        );

      } catch (error) {

        alert(
          "Room Code: " + code
        );

      }

    }
  );

}


// =====================================
// MARK BATTLE AS RUNNING
// =====================================

function moveBattleToRunning() {

  if (!selectedBattle) {
    return;
  }

  try {

    let runningBattles =
      JSON.parse(
        localStorage.getItem(
          "balajiRunningBattles"
        ) || "[]"
      );

    if (!Array.isArray(runningBattles)) {
      runningBattles = [];
    }

    const alreadyRunning =
      runningBattles.some(
        function (battle) {

          return (
            battle.id ===
            selectedBattle.id
          );

        }
      );

    if (!alreadyRunning) {

      runningBattles.unshift({

        id:
          selectedBattle.id,

        playerName:
          selectedBattle.playerName,

        secondPlayer:
          localStorage.getItem(
            "balajiSecondPlayer"
          ) || "Player 2",

        entry:
          selectedBattle.entry,

        prize:
          selectedBattle.prize,

        roomCode:
          savedRoomCode,

        status:
          "RUNNING",

        roomAccepted:
          true,

        createdAt:
          Date.now()

      });

      localStorage.setItem(
        "balajiRunningBattles",
        JSON.stringify(
          runningBattles
        )
      );

    }

  } catch (error) {

    console.log(
      "Running battle error:",
      error
    );

  }

}


// =====================================
// PLAY LUDO
// =====================================

if (playLudoBtn) {

  playLudoBtn.addEventListener(
    "click",
    function () {

      if (!savedRoomCode) {

        alert(
          "पहले Room Code का इंतजार करें।"
        );

        return;

      }

      moveBattleToRunning();

      /*
       * अभी Game page तैयार नहीं है।
       * इसलिए फिलहाल battle.html पर नहीं भेजेंगे।
       *
       * जब actual Ludo board बनेगा,
       * इसी button से game.html खुलेगा।
       */

      alert(
        "Room Ready! Ludo Game अगले step में खुलेगा।"
      );

    }
  );

}


// =====================================
// I WON
// =====================================

if (wonBtn) {

  wonBtn.addEventListener(
    "click",
    function () {

      if (!savedRoomCode) {

        alert(
          "Room Code मिलने के बाद ही result दे सकते हैं।"
        );

        return;

      }

      moveBattleToRunning();

      if (readyStatus) {

        readyStatus.textContent =
          "RESULT: I WON";

      }

      alert(
        "Demo Result: I Won
