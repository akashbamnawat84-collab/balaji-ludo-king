// =====================================
// BALAJI LUDO KING - ROOM
// Win / Lost / Cancel
// Win Screenshot inside I Won
// Demo Coins Only
// =====================================

const WAIT_TIME_MS = 5 * 60 * 1000;


// =====================================
// ELEMENTS
// =====================================

const entryFee =
  document.getElementById("entryFee");

const winningPrize =
  document.getElementById("winningPrize");

const creatorState =
  document.getElementById("creatorState");

const player2WaitingState =
  document.getElementById("player2WaitingState");

const roomCodeState =
  document.getElementById("roomCodeState");

const waitingSeconds =
  document.getElementById("waitingSeconds");

const player2WaitingSeconds =
  document.getElementById("player2WaitingSeconds");

const matchStatus =
  document.getElementById("matchStatus");

const player2Status =
  document.getElementById("player2Status");

const readyStatus =
  document.getElementById("readyStatus");

const roomCode =
  document.getElementById("roomCode");

const backBtn =
  document.getElementById("backBtn");

const cancelBtn =
  document.getElementById("cancelBtn");

const player2CancelBtn =
  document.getElementById("player2CancelBtn");

const cancelReadyBtn =
  document.getElementById("cancelReadyBtn");

const roomCodeInput =
  document.getElementById("roomCodeInput");

const submitRoomCodeBtn =
  document.getElementById("submitRoomCodeBtn");

const roomCodeMessage =
  document.getElementById("roomCodeMessage");

const copyCodeBtn =
  document.getElementById("copyCodeBtn");

const wonBtn =
  document.getElementById("wonBtn");

const lostBtn =
  document.getElementById("lostBtn");

const winSection =
  document.getElementById("winSection");

const resultScreenshot =
  document.getElementById("resultScreenshot");

const selectedFileName =
  document.getElementById("selectedFileName");

const submitResultBtn =
  document.getElementById("submitResultBtn");

const resultMessage =
  document.getElementById("resultMessage");


// =====================================
// SELECTED BATTLE
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

    const battle =
      JSON.parse(data);

    if (!battle || !battle.id) {
      return null;
    }

    return battle;

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
// PLAYER
// =====================================

function getPlayerName() {

  return (
    localStorage.getItem(
      "balajiPlayerName"
    ) ||
    localStorage.getItem(
      "playerName"
    ) ||
    "Customer"
  );

}


function getPlayerRole() {

  if (!selectedBattle) {
    return "PLAYER1";
  }

  const currentPlayer =
    getPlayerName();

  const creator =
    selectedBattle.playerName || "";

  const secondPlayer =
    localStorage.getItem(
      "balajiSecondPlayer"
    ) || "";


  if (
    secondPlayer &&
    secondPlayer === currentPlayer &&
    creator !== currentPlayer
  ) {

    return "PLAYER2";

  }


  return "PLAYER1";
}


const playerRole =
  getPlayerRole();


// =====================================
// BATTLE DETAILS
// =====================================

if (selectedBattle) {

  if (entryFee) {

    entryFee.textContent =
      selectedBattle.entry +
      " Demo Coins";

  }


  if (winningPrize) {

    winningPrize.textContent =
      selectedBattle.prize +
      " Demo Coins";

  }

}


// =====================================
// WAITING TIME
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
// ROOM CODE
// =====================================

let savedRoomCode =
  localStorage.getItem(
    "balajiRoomCode"
  );


// =====================================
// SHOW PLAYER 1
// =====================================

function showCreatorScreen() {

  if (creatorState) {
    creatorState.style.display =
      "block";
  }

  if (player2WaitingState) {
    player2WaitingState.style.display =
      "none";
  }

  if (roomCodeState) {
    roomCodeState.style.display =
      "none";
  }

}


// =====================================
// SHOW PLAYER 2 WAITING
// =====================================

function showPlayer2Waiting() {

  if (creatorState) {
    creatorState.style.display =
      "none";
  }

  if (player2WaitingState) {
    player2WaitingState.style.display =
      "block";
  }

  if (roomCodeState) {
    roomCodeState.style.display =
      "none";
  }

}


// =====================================
// SHOW ROOM READY
// =====================================

function showRoomCode(code) {

  if (!code) {
    return;
  }


  if (creatorState) {
    creatorState.style.display =
      "none";
  }

  if (player2WaitingState) {
    player2WaitingState.style.display =
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
      "ROOM READY";

  }

}


// =====================================
// SUBMIT ROOM CODE
// PLAYER 1 ONLY
// =====================================

if (submitRoomCodeBtn) {

  submitRoomCodeBtn.addEventListener(
    "click",
    function () {

      const code =
        roomCodeInput
          ? roomCodeInput.value.trim()
          : "";


      if (!/^\d{8}$/.test(code)) {

        if (roomCodeMessage) {

          roomCodeMessage.textContent =
            "❌ Please enter a valid 8-digit Room Code.";

        }

        return;
      }


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


      if (roomCodeMessage) {

        roomCodeMessage.textContent =
          "✅ Room Code accepted.";

      }


      if (matchStatus) {

        matchStatus.textContent =
          "ROOM READY";

      }


      showRoomCode(
        savedRoomCode
      );

    }
  );

}


// =====================================
// TIMER
// =====================================

function updateWaitingTimer() {

  if (savedRoomCode) {
    return;
  }


  const elapsed =
    Date.now() -
    waitingStartedAt;


  const remaining =
    Math.max(
      0,
      WAIT_TIME_MS -
      elapsed
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


  const timeText =
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");


  if (waitingSeconds) {

    waitingSeconds.textContent =
      timeText;

  }


  if (player2WaitingSeconds) {

    player2WaitingSeconds.textContent =
      timeText;

  }


  if (remaining <= 0) {

    if (matchStatus) {
      matchStatus.textContent =
        "EXPIRED";
    }

    if (player2Status) {
      player2Status.textContent =
        "EXPIRED";
    }

  }

}


// =====================================
// MOVE TO RUNNING
// ONLY AFTER ROOM CODE
// =====================================

function moveBattleToRunning() {

  if (!selectedBattle) {
    return;
  }


  if (!savedRoomCode) {
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


    const exists =
      runningBattles.some(
        function (battle) {

          return (
            battle.id ===
            selectedBattle.id
          );

        }
      );


    if (!exists) {

      runningBattles.unshift({

        id:
          selectedBattle.id,

        playerName:
          selectedBattle.playerName,

        secondPlayer:
          localStorage.getItem(
            "balajiSecondPlayer"
          ) ||
          "Player 2",

        entry:
          selectedBattle.entry,

        prize:
          selectedBattle.prize,

        roomCode:
          savedRoomCode,

        status:
          "RUNNING",

        resultStatus:
          "WAITING",

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


      if (
        !code ||
        code === "--------"
      ) {
        return;
      }


      try {

        await navigator.clipboard
          .writeText(code);


        copyCodeBtn.textContent =
          "✅ Code Copied";


        setTimeout(
          function () {

            copyCodeBtn.textContent =
              "📋 Copy Room Code";

          },
          1500
        );


      } catch (error) {

        alert(
          "Room Code: " +
          code
        );

      }

    }
  );

}


// =====================================
// OPEN LUDO KING
// =====================================

if (roomCodeState) {

  roomCodeState.addEventListener(
    "click",
    function () {

      if (savedRoomCode) {

        moveBattleToRunning();

      }

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
          "पहले Room Code ready होना चाहिए।"
        );

        return;

      }


      moveBattleToRunning();


      if (winSection) {

        winSection.style.display =
          "block";

        winSection.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      }


      if (readyStatus) {

        readyStatus.textContent =
          "WIN SCREENSHOT REQUIRED";

      }

    }
  );

}


// =====================================
// I LOST
// =====================================

if (lostBtn) {

  lostBtn.addEventListener(
    "click",
    function () {

      if (!savedRoomCode) {

        alert(
          "पहले Room Code ready होना चाहिए।"
        );

        return;

      }


      moveBattleToRunning();


      localStorage.setItem(
        "balajiResultStatus",
        "LOST"
      );


      try {

        let runningBattles =
          JSON.parse(
            localStorage.getItem(
              "balajiRunningBattles"
            ) || "[]"
          );


        runningBattles =
          runningBattles.map(
            function (battle) {

              if (
                selectedBattle &&
                battle.id ===
                selectedBattle.id
              ) {

                return {

                  ...battle,

                  resultStatus:
                    "LOST",

                  submittedAt:
                    Date.now()

                };

              }


              return battle;

            }
          );


        localStorage.setItem(
          "balajiRunningBattles",
          JSON.stringify(
            runningBattles
          )
        );


      } catch (error) {

        console.log(
          "Lost result error:",
          error
        );

      }


      if (readyStatus) {

        readyStatus.textContent =
          "RESULT: LOST";

      }


      wonBtn.disabled =
        true;

      lostBtn.disabled =
        true;

      if (resultMessage) {

        resultMessage.textContent =
          "❌ Lost result submitted.";

      }

    }
  );

}


// =====================================
// WIN SCREENSHOT SELECT
// =====================================

if (resultScreenshot) {

  resultScreenshot.addEventListener(
    "change",
    function () {

      const file =
        resultScreenshot.files &&
        resultScreenshot.files[0];


      if (!file) {

        if (selectedFileName) {

          selectedFileName.textContent =
            "No screenshot selected";

        }

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        resultScreenshot.value =
          "";


        if (selectedFileName) {

          selectedFileName.textContent =
            "❌ Please select an image.";

        }

        return;

      }


      if (selectedFileName) {

        selectedFileName.textContent =
          "📸 " +
          file.name;

      }

    }
  );

}


// =====================================
// SUBMIT WIN RESULT
// =====================================

if (submitResultBtn) {

  submitResultBtn.addEventListener(
    "click",
    function () {

      if (!savedRoomCode) {

        if (resultMessage) {

          resultMessage.textContent =
            "❌ पहले Room Code ready होना चाहिए।";

        }

        return;

      }


      const file =
        resultScreenshot &&
        resultScreenshot.files &&
        resultScreenshot.files[0];


      if (!file) {

        if (resultMessage) {

          resultMessage.textContent =
            "❌ पहले Win Screenshot select करें।";

        }

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        if (resultMessage) {

          resultMessage.textContent =
            "❌ केवल image screenshot upload करें।";

        }

        return;

      }


      moveBattleToRunning();


      localStorage.setItem(
        "balajiResultStatus",
        "WIN_SUBMITTED"
      );


      localStorage.setItem(
        "balajiResultScreenshot",
        file.name
      );


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


        runningBattles =
          runningBattles.map(
            function (battle) {

              if (
                selectedBattle &&
                battle.id ===
                selectedBattle.id
              ) {

                return {

                  ...battle,

                  resultStatus:
                    "WIN_SUBMITTED",

                  resultScreenshot:
                    file.name,

                  submittedAt:
                    Date.now()

                };

              }


              return battle;

            }
          );


        localStorage.setItem(
          "balajiRunningBattles",
          JSON.stringify(
            runningBattles
          )
        );


      } catch (error) {

        console.log(
          "Win result error:",
          error
        );

      }


      if (readyStatus) {

        readyStatus.textContent =
          "WIN SUBMITTED";

      }


      if (resultMessage) {

        resultMessage.textContent =
          "✅ Win Result submitted. Admin verification pending.";

      }


      submitResultBtn.disabled =
        true;

      submitResultBtn.textContent =
        "✅ Win Submitted";

      wonBtn.disabled =
        true;

      lostBtn.disabled =
        true;

    }
  );

}


// =====================================
// CANCEL
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

  localStorage.removeItem(
    "balajiResultScreenshot"
  );

  localStorage.removeItem(
    "balajiResultStatus"
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


if (player2CancelBtn) {

  player2CancelBtn.addEventListener(
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
// INITIAL STATE
// =====================================

if (savedRoomCode) {

  showRoomCode(
    savedRoomCode
  );

} else {

  if (playerRole === "PLAYER2") {

    showPlayer2Waiting();

  } else {

    showCreatorScreen();

  }

  updateWaitingTimer();

}


// =====================================
// TIMER
// =====================================

setInterval(
  updateWaitingTimer,
  1000
);
