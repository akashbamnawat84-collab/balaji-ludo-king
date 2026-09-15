// =====================================
// BALAJI LUDO KING - ROOM
// Demo Coins • Room • Result Screenshot
// =====================================

const WAIT_TIME_MS = 5 * 60 * 1000;


// =====================================
// ELEMENTS
// =====================================

const entryFee = document.getElementById("entryFee");
const winningPrize = document.getElementById("winningPrize");

const waitingState = document.getElementById("waitingState");
const roomCodeState = document.getElementById("roomCodeState");

const waitingSeconds = document.getElementById("waitingSeconds");

const matchStatus = document.getElementById("matchStatus");
const readyStatus = document.getElementById("readyStatus");

const roomCode = document.getElementById("roomCode");

const backBtn = document.getElementById("backBtn");
const cancelBtn = document.getElementById("cancelBtn");
const cancelReadyBtn = document.getElementById("cancelReadyBtn");

const copyCodeBtn = document.getElementById("copyCodeBtn");
const playLudoBtn = document.getElementById("playLudoBtn");

const roomCodeInput = document.getElementById("roomCodeInput");
const submitRoomCodeBtn =
  document.getElementById("submitRoomCodeBtn");

const roomCodeMessage =
  document.getElementById("roomCodeMessage");

const resultScreenshot =
  document.getElementById("resultScreenshot");

const selectedFileName =
  document.getElementById("selectedFileName");

const submitResultBtn =
  document.getElementById("submitResultBtn");

const resultMessage =
  document.getElementById("resultMessage");


// =====================================
// GET SELECTED BATTLE
// =====================================

function getSelectedBattle() {

  try {

    const data =
      localStorage.getItem("balajiSelectedBattle");

    if (!data) {
      return null;
    }

    const battle = JSON.parse(data);

    if (!battle || !battle.id) {
      return null;
    }

    return battle;

  } catch (error) {

    console.log("Selected battle error:", error);

    return null;
  }
}


const selectedBattle = getSelectedBattle();


// =====================================
// SHOW BATTLE DETAILS
// =====================================

if (selectedBattle) {

  if (entryFee) {
    entryFee.textContent =
      selectedBattle.entry + " Demo Coins";
  }

  if (winningPrize) {
    winningPrize.textContent =
      selectedBattle.prize + " Demo Coins";
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

  waitingStartedAt = Date.now();

  localStorage.setItem(
    "balajiRoomWaitingStartedAt",
    String(waitingStartedAt)
  );

}


// =====================================
// ROOM CODE
// =====================================

let savedRoomCode =
  localStorage.getItem("balajiRoomCode");


// =====================================
// GENERATE 8-DIGIT ROOM CODE
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
// SHOW ROOM CODE STATE
// =====================================

function showRoomCode(code) {

  if (!code) {
    return;
  }

  if (waitingState) {
    waitingState.style.display = "none";
  }

  if (roomCodeState) {
    roomCodeState.style.display = "block";
  }

  if (roomCode) {
    roomCode.textContent = code;
  }

  if (readyStatus) {
    readyStatus.textContent = "ROOM READY";
  }

}


// =====================================
// SUBMIT ROOM CODE
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


      savedRoomCode = code;

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


      showRoomCode(code);

    }
  );

}


// =====================================
// WAITING TIMER
// =====================================

function updateWaitingTimer() {

  if (savedRoomCode) {
    return;
  }

  const elapsed =
    Date.now() - waitingStartedAt;

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


  if (remaining <= 0) {

    if (matchStatus) {
      matchStatus.textContent = "EXPIRED";
    }

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

      if (!code || code === "--------") {
        return;
      }


      try {

        await navigator.clipboard.writeText(code);

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
          "Room Code: " + code
        );

      }

    }
  );

}


// =====================================
// MARK BATTLE RUNNING
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
          savedRoomCode || "",

        status:
          "RUNNING",

        roomAccepted:
          true,

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
// OPEN LUDO KING APP
// =====================================

if (playLudoBtn) {

  playLudoBtn.addEventListener(
    "click",
    function () {

      if (!savedRoomCode) {

        alert(
          "पहले Room Code डालें।"
        );

        return;
      }


      moveBattleToRunning();


      /*
       * Website किसी third-party Ludo app
       * के अंदर match control नहीं कर सकती।
       *
       * इसलिए यहाँ Ludo King खोलने की कोशिश
       * की जाती है। अगर device/app इसे support
       * नहीं करता तो browser में कुछ नहीं होगा।
       */

      window.location.href =
        "ludoking://";


      setTimeout(
        function () {

          alert(
            "Ludo King app खोलें और Room Code " +
            savedRoomCode +
            " डालकर match खेलें।"
          );

        },
        1200
      );

    }
  );

}


// =====================================
// SCREENSHOT SELECTED
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


      if (!file.type.startsWith("image/")) {

        resultScreenshot.value = "";

        if (selectedFileName) {
          selectedFileName.textContent =
            "❌ Please select an image.";
        }

        return;
      }


      if (selectedFileName) {

        selectedFileName.textContent =
          "📸 " + file.name;

      }

    }
  );

}


// =====================================
// SUBMIT RESULT
// =====================================

if (submitResultBtn) {

  submitResultBtn.addEventListener(
    "click",
    function () {

      if (!savedRoomCode) {

        if (resultMessage) {
          resultMessage.textContent =
            "❌ पहले Room Code डालें।";
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


      if (!file.type.startsWith("image/")) {

        if (resultMessage) {
          resultMessage.textContent =
            "❌ केवल image screenshot upload करें।";
        }

        return;
      }


      /*
       * अभी Demo Mode में screenshot की
       * जानकारी localStorage में रखी जा रही है।
       * असली Admin upload/storage के लिए
       * backend storage बाद में जोड़ा जाएगा।
       */

      localStorage.setItem(
        "balajiResultScreenshot",
        file.name
      );

      localStorage.setItem(
        "balajiResultStatus",
        "SUBMITTED"
      );


      moveBattleToRunning();


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
                    "SUBMITTED",

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
          "Result update error:",
          error
        );

      }


      if (readyStatus) {
        readyStatus.textContent =
          "RESULT SUBMITTED";
      }


      if (resultMessage) {

        resultMessage.textContent =
          "✅ Result submitted. Admin verification pending.";

      }


      submitResultBtn.disabled = true;

      submitResultBtn.textContent =
        "✅ Result Submitted";

    }
  );

}


// =====================================
// INITIAL STATE
// =====================================

if (savedRoomCode) {

  showRoomCode(savedRoomCode);

} else {

  updateWaitingTimer();

}


// =====================================
// TIMER
// =====================================

setInterval(
  updateWaitingTimer,
  1000
);
