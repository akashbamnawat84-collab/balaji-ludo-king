// =====================================
// BALAJI LUDO KING - ROOM
// DEMO / FREE PLAY
// =====================================


// Generate 8 digit room code
function generateRoomCode() {
  const number = Math.floor(
    10000000 + Math.random() * 90000000
  );

  return String(number);
}


// Get existing room code
let roomCode = localStorage.getItem("balajiRoomCode");

if (!roomCode) {
  roomCode = generateRoomCode();

  localStorage.setItem(
    "balajiRoomCode",
    roomCode
  );
}


// Show room code
const roomCodeElement =
  document.getElementById("roomCode");

if (roomCodeElement) {
  roomCodeElement.textContent = roomCode;
}


// =====================================
// PLAYER NAME
// =====================================

const player1Name =
  document.getElementById("player1Name");

const savedName =
  localStorage.getItem("balajiPlayerName");

if (player1Name && savedName) {
  player1Name.textContent = savedName;
}


// =====================================
// COPY ROOM CODE
// =====================================

const copyCodeBtn =
  document.getElementById("copyCodeBtn");

if (copyCodeBtn) {

  copyCodeBtn.addEventListener(
    "click",
    async function () {

      try {

        await navigator.clipboard.writeText(
          roomCode
        );

        copyCodeBtn.textContent =
          "✅ Room Code Copied";

        setTimeout(function () {

          copyCodeBtn.textContent =
            "📋 Copy Room Code";

        }, 1500);

      } catch (error) {

        alert(
          "Room Code: " + roomCode
        );

      }

    }
  );

}


// =====================================
// BACK
// =====================================

const backBtn =
  document.getElementById("backBtn");

if (backBtn) {

  backBtn.addEventListener(
    "click",
    function () {

      window.location.href =
        "home.html";

    }
  );

}


// =====================================
// CANCEL
// =====================================

const cancelBtn =
  document.getElementById("cancelBtn");

if (cancelBtn) {

  cancelBtn.addEventListener(
    "click",
    function () {

      const confirmCancel =
        confirm(
          "Cancel this match?"
        );

      if (!confirmCancel) {
        return;
      }

      localStorage.removeItem(
        "balajiRoomCode"
      );

      window.location.href =
        "home.html";

    }
  );

}


// =====================================
// START GAME
// =====================================

const startGameBtn =
  document.getElementById("startGameBtn");

if (startGameBtn) {

  startGameBtn.addEventListener(
    "click",
    function () {

      window.location.href =
        "game.html";

    }
  );

}
