const API = "/api";

// =====================================
// ELEMENTS
// =====================================

const homeSection = document.getElementById("homeSection");
const roomSection = document.getElementById("roomSection");
const resultSection = document.getElementById("resultSection");
const moneySection = document.getElementById("moneySection");
const referSection = document.getElementById("referSection");
const supportSection = document.getElementById("supportSection");
const profileSection = document.getElementById("profileSection");

const openRoomBtn = document.getElementById("openRoomBtn");

const createRoomCard = document.getElementById("createRoomCard");
const createRoomCodeInput =
  document.getElementById("createRoomCodeInput");
const createRoomBtn =
  document.getElementById("createRoomBtn");
const createMessage =
  document.getElementById("createMessage");

const createdRoom =
  document.getElementById("createdRoom");

const roomCodeDisplay =
  document.getElementById("roomCodeDisplay");

const player1Status =
  document.getElementById("player1Status");

const player2Status =
  document.getElementById("player2Status");

const waitingMessage =
  document.getElementById("waitingMessage");

const createTimer =
  document.getElementById("createTimer");

const copyRoomBtn =
  document.getElementById("copyRoomBtn");

const leaveRoomBtn =
  document.getElementById("leaveRoomBtn");

const joinSection =
  document.getElementById("joinSection");

const roomCodeInput =
  document.getElementById("roomCodeInput");

const joinRoomBtn =
  document.getElementById("joinRoomBtn");

const joinMessage =
  document.getElementById("joinMessage");

const joinedRoom =
  document.getElementById("joinedRoom");

const joinedRoomCode =
  document.getElementById("joinedRoomCode");

const joinedPlayer1Status =
  document.getElementById("joinedPlayer1Status");

const joinedPlayer2Status =
  document.getElementById("joinedPlayer2Status");

const joinTimer =
  document.getElementById("joinTimer");

const joinWaitingMessage =
  document.getElementById("joinWaitingMessage");

const joinedLeaveBtn =
  document.getElementById("joinedLeaveBtn");

const gameStartBox =
  document.getElementById("gameStartBox");

const openLudoKingBtn =
  document.getElementById("openLudoKingBtn");

const playedGameBtn =
  document.getElementById("playedGameBtn");

const resultRoomCode =
  document.getElementById("resultRoomCode");

const resultScreenshot =
  document.getElementById("resultScreenshot");

const fileName =
  document.getElementById("fileName");

const submitResultBtn =
  document.getElementById("submitResultBtn");

const resultMessage =
  document.getElementById("resultMessage");

const topWallet =
  document.getElementById("topWallet");

const topRefer =
  document.getElementById("topRefer");

const walletBalance =
  document.getElementById("walletBalance");

const referBalance =
  document.getElementById("referBalance");

const player1Name =
  document.getElementById("player1Name");

const player2Name =
  document.getElementById("player2Name");


// =====================================
// PLAYER DATA
// =====================================

let playerId =
  localStorage.getItem("balaji_player_id") || "";

let playerName =
  localStorage.getItem("balaji_player_name") || "";

let currentRoomCode =
  localStorage.getItem("balaji_room_code") || "";

let playerNumber =
  Number(
    localStorage.getItem(
      "balaji_player_number"
    ) || "0"
  );

let wallet = 0;

let referWallet = 0;


// =====================================
// ROOM TIMER
// =====================================

const ROOM_WAIT_SECONDS = 5 * 60;

let roomPollTimer = null;
let roomTimer = null;
let roomExpiryInProgress = false;


// =====================================
// COMMON HELPERS
// =====================================

function hideAllSections() {

  [
    homeSection,
    roomSection,
    resultSection,
    moneySection,
    referSection,
    supportSection,
    profileSection
  ].forEach((section) => {

    if (section) {
      section.style.display = "none";
    }

  });
}


function showSection(section) {

  hideAllSections();

  if (section) {
    section.style.display = "block";
  }
}


function setMessage(
  element,
  text,
  type = ""
) {

  if (!element) return;

  element.textContent = text;

  element.classList.remove(
    "success",
    "error",
    "warning"
  );

  if (type) {
    element.classList.add(type);
  }
}


// =====================================
// LOGIN
// =====================================

async function checkLogin() {

  if (playerId && playerName) {
    return true;
  }

  const name =
    prompt(
      "Enter your name to continue"
    );

  if (!name || !name.trim()) {
    return false;
  }

  return loginUser(
    name.trim()
  );
}


async function loginUser(name) {

  try {

    const response =
      await fetch(
        `${API}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            name
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Login failed"
      );
    }

    playerId =
      data.id ||
      data.player_id ||
      "";

    playerName =
      data.name ||
      name;

    wallet =
      Number(
        data.wallet ??
        data.wallet_balance ??
        0
      );

    if (!playerId) {

      throw new Error(
        "Player ID not received"
      );
    }

    localStorage.setItem(
      "balaji_player_id",
      playerId
    );

    localStorage.setItem(
      "balaji_player_name",
      playerName
    );

    updateProfile();

    return true;

  } catch (error) {

    alert(
      error.message ||
      "Login failed"
    );

    return false;
  }
}


// =====================================
// PROFILE / BALANCE
// =====================================

function updateProfile() {

  document
    .querySelectorAll(
      "[data-player-name]"
    )
    .forEach((element) => {

      element.textContent =
        playerName ||
        "Guest";

    });


  document
    .querySelectorAll(
      "[data-wallet]"
    )
    .forEach((element) => {

      element.textContent =
        `₹${wallet.toFixed(2)}`;

    });


  if (topWallet) {
    topWallet.textContent =
      `₹${wallet.toFixed(2)}`;
  }


  if (walletBalance) {
    walletBalance.textContent =
      `₹${wallet.toFixed(2)}`;
  }


  if (topRefer) {
    topRefer.textContent =
      `₹${referWallet.toFixed(2)}`;
  }


  if (referBalance) {
    referBalance.textContent =
      `₹${referWallet.toFixed(2)}`;
  }


  if (player1Name && playerNumber === 1) {
    player1Name.textContent =
      playerName || "Player 1";
  }


  if (player2Name && playerNumber === 2) {
    player2Name.textContent =
      playerName || "Player 2";
  }
}


// =====================================
// ROOM DATA
// =====================================

function saveRoomData(
  code,
  number
) {

  currentRoomCode =
    String(code || "").trim();

  playerNumber =
    Number(number || 0);

  localStorage.setItem(
    "balaji_room_code",
    currentRoomCode
  );

  localStorage.setItem(
    "balaji_player_number",
    String(playerNumber)
  );
}


function clearRoomData() {

  currentRoomCode = "";
  playerNumber = 0;

  localStorage.removeItem(
    "balaji_room_code"
  );

  localStorage.removeItem(
    "balaji_player_number"
  );
}


// =====================================
// ROOM CODE
// =====================================

function validRoomCode(code) {

  return /^\d{8}$/.test(
    String(code || "").trim()
  );
}


function makeNumericOnly(input) {

  if (!input) return;

  input.addEventListener(
    "input",
    () => {

      input.value =
        input.value
          .replace(/\D/g, "")
          .slice(0, 8);

    }
  );
}


makeNumericOnly(
  createRoomCodeInput
);

makeNumericOnly(
  roomCodeInput
);


// =====================================
// PLAY NOW
// =====================================

if (openRoomBtn) {

  openRoomBtn.addEventListener(
    "click",
    async () => {

      const loggedIn =
        await checkLogin();

      if (!loggedIn) return;

      showSection(
        roomSection
      );

      if (
        currentRoomCode &&
        (
          playerNumber === 1 ||
          playerNumber === 2
        )
      ) {

        restoreCurrentRoom();

        return;
      }

      resetRoomScreen();

    }
  );
}


// =====================================
// RESET ROOM
// =====================================

function resetRoomScreen() {

  stopRoomPolling();
  stopRoomTimer();

  roomExpiryInProgress = false;

  if (createRoomCard) {
    createRoomCard.style.display =
      "block";
  }

  if (joinSection) {
    joinSection.style.display =
      "block";
  }

  if (createdRoom) {
    createdRoom.style.display =
      "none";
  }

  if (joinedRoom) {
    joinedRoom.style.display =
      "none";
  }

  if (gameStartBox) {
    gameStartBox.style.display =
      "none";
  }

  if (createRoomCodeInput) {
    createRoomCodeInput.value = "";
  }

  if (roomCodeInput) {
    roomCodeInput.value = "";
  }

  setMessage(
    createMessage,
    ""
  );

  setMessage(
    joinMessage,
    ""
  );

  if (createTimer) {
    createTimer.textContent =
      "⏳ Waiting for Player 2...";
  }

  if (joinTimer) {
    joinTimer.textContent =
      "⏳ Waiting...";
  }

  clearRoomData();
}


// =====================================
// CREATE ROOM
// =====================================

if (createRoomBtn) {

  createRoomBtn.addEventListener(
    "click",
    createRoom
  );
}


async function createRoom() {

  const loggedIn =
    await checkLogin();

  if (!loggedIn) return;


  const code =
    createRoomCodeInput
      ? createRoomCodeInput.value.trim()
      : "";


  // NO AUTOMATIC CODE GENERATION

  if (!validRoomCode(code)) {

    setMessage(
      createMessage,
      "⚠️ 8-digit Room Code डालें।",
      "error"
    );

    return;
  }


  if (!playerId) {

    setMessage(
      createMessage,
      "❌ Player login नहीं है।",
      "error"
    );

    return;
  }


  createRoomBtn.disabled = true;

  setMessage(
    createMessage,
    "⏳ Room create हो रहा है..."
  );


  try {

    const response =
      await fetch(
        `${API}/rooms/create`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            room_code:
              code,

            player_id:
              playerId,

            player_name:
              playerName

          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Room create नहीं हुआ"
      );
    }


    saveRoomData(
      code,
      1
    );


    showCreatedRoom(
      data.room ||
      data
    );


    startRoomPolling();


  } catch (error) {

    setMessage(
      createMessage,
      `❌ ${error.message}`,
      "error"
    );

  } finally {

    createRoomBtn.disabled =
      false;
  }
}


// =====================================
// CREATED ROOM
// =====================================

function showCreatedRoom(room) {

  if (createRoomCard) {
    createRoomCard.style.display =
      "none";
  }

  if (joinSection) {
    joinSection.style.display =
      "none";
  }

  if (createdRoom) {
    createdRoom.style.display =
      "block";
  }

  if (joinedRoom) {
    joinedRoom.style.display =
      "none";
  }

  if (gameStartBox) {
    gameStartBox.style.display =
      "none";
  }


  if (roomCodeDisplay) {

    roomCodeDisplay.textContent =
      currentRoomCode;
  }


  if (player1Name) {

    player1Name.textContent =
      playerName ||
      "Player 1";
  }


  if (player2Name) {

    player2Name.textContent =
      "Player 2";
  }


  if (player1Status) {

    player1Status.textContent =
      "Player 1 • Ready";
  }


  if (player2Status) {

    player2Status.textContent =
      "Player 2 • Waiting...";
  }


  if (waitingMessage) {

    waitingMessage.textContent =
      "Waiting for Player 2...";
  }


  if (
    room &&
    room.created_at
  ) {

    startRoomTimer(
      room.created_at
    );

  } else {

    if (createTimer) {

      createTimer.textContent =
        "⏳ Waiting for Player 2...";
    }
  }
}


// =====================================
// JOIN ROOM
// =====================================

if (joinRoomBtn) {

  joinRoomBtn.addEventListener(
    "click",
    joinRoom
  );
}


async function joinRoom() {

  const loggedIn =
    await checkLogin();

  if (!loggedIn) return;


  const code =
    roomCodeInput
      ? roomCodeInput.value.trim()
      : "";


  if (!validRoomCode(code)) {

    setMessage(
      joinMessage,
      "⚠️ 8-digit Room Code डालें।",
      "error"
    );

    return;
  }


  if (!playerId) {

    setMessage(
      joinMessage,
      "❌ Player login नहीं है।",
      "error"
    );

    return;
  }


  joinRoomBtn.disabled = true;


  setMessage(
    joinMessage,
    "⏳ Room join हो रहा है..."
  );


  try {

    const response =
      await fetch(
        `${API}/rooms/join`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            room_code:
              code,

            player_id:
              playerId,

            player_name:
              playerName

          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Room join नहीं हुआ"
      );
    }


    saveRoomData(
      code,
      2
    );


    showJoinedRoom(
      data.room ||
      data
    );


    startRoomPolling();


  } catch (error) {

    setMessage(
      joinMessage,
      `❌ ${error.message}`,
      "error"
    );

  } finally {

    joinRoomBtn.disabled =
      false;
  }
}


// =====================================
// JOINED ROOM
// =====================================

function showJoinedRoom(room) {

  if (createRoomCard) {
    createRoomCard.style.display =
      "none";
  }

  if (joinSection) {
    joinSection.style.display =
      "none";
  }

  if (createdRoom) {
    createdRoom.style.display =
      "none";
  }

  if (joinedRoom) {
    joinedRoom.style.display =
      "block";
  }

  if (gameStartBox) {
    gameStartBox.style.display =
      "none";
  }


  if (joinedRoomCode) {

    joinedRoomCode.textContent =
      currentRoomCode;
  }


  if (joinedPlayer1Status) {

    joinedPlayer1Status.textContent =
      "Player 1 • Ready";
  }


  if (joinedPlayer2Status) {

    joinedPlayer2Status.textContent =
      "Player 2 • Ready";
  }


  if (player1Name) {

    player1Name.textContent =
      room?.player1_name ||
      "Player 1";
  }


  if (player2Name) {

    player2Name.textContent =
      room?.player2_name ||
      playerName ||
      "Player 2";
  }


  if (joinWaitingMessage) {

    joinWaitingMessage.textContent =
      "Room joined successfully.";
  }


  if (
    room &&
    room.created_at
  ) {

    startRoomTimer(
      room.created_at
    );
  }


  if (
    room?.player2_id ||
    room?.status === "READY"
  ) {

    showReadyBox(room);
  }
}


// =====================================
// ROOM POLLING
// =====================================

function startRoomPolling() {

  stopRoomPolling();

  if (!currentRoomCode)
    return;


  checkRoomStatus();


  roomPollTimer =
    setInterval(
      checkRoomStatus,
      3000
    );
}


function stopRoomPolling() {

  if (roomPollTimer) {

    clearInterval(
      roomPollTimer
    );

    roomPollTimer = null;
  }
}


// =====================================
// TIMER
// =====================================

function stopRoomTimer() {

  if (roomTimer) {

    clearInterval(
      roomTimer
    );

    roomTimer = null;
  }
}


function getCreatedTime(
  createdAt
) {

  if (!createdAt) {
    return NaN;
  }


  if (
    typeof createdAt === "number"
  ) {

    if (
      createdAt < 10000000000
    ) {

      return createdAt * 1000;
    }

    return createdAt;
  }


  const value =
    String(createdAt).trim();


  if (/^\d+$/.test(value)) {

    const number =
      Number(value);

    if (
      number < 10000000000
    ) {

      return number * 1000;
    }

    return number;
  }


  const parsed =
    Date.parse(value);


  return parsed;
}


function updateRoomTimer(
  createdAt
) {

  const createdTime =
    getCreatedTime(
      createdAt
    );


  if (
    Number.isNaN(createdTime)
  ) {

    if (createTimer) {

      createTimer.textContent =
        "⏳ Waiting for Player 2...";
    }

    if (joinTimer) {

      joinTimer.textContent =
        "⏳ Waiting...";
    }

    return;
  }


  const elapsed =
    Math.floor(
      (
        Date.now() -
        createdTime
      ) / 1000
    );


  const remaining =
    ROOM_WAIT_SECONDS -
    elapsed;


  if (remaining <= 0) {

    if (createTimer) {

      createTimer.textContent =
        "⏰ 5 मिनट पूरे हो गए।";
    }

    if (joinTimer) {

      joinTimer.textContent =
        "⏰ 5 मिनट पूरे हो गए।";
    }


    stopRoomTimer();

    expireRoom();

    return;
  }


  const minutes =
    Math.floor(
      remaining / 60
    );


  const seconds =
    remaining % 60;


  const text =
    `⏳ Room Time Left: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


  if (createTimer) {

    createTimer.textContent =
      text;
  }


  if (joinTimer) {

    joinTimer.textContent =
      text;
  }
}


function startRoomTimer(
  createdAt
) {

  if (!createdAt)
    return;


  stopRoomTimer();


  updateRoomTimer(
    createdAt
  );


  roomTimer =
    setInterval(
      () => {

        updateRoomTimer(
          createdAt
        );

      },
      1000
    );
}


// =====================================
// EXPIRE ROOM
// =====================================

async function expireRoom() {

  if (roomExpiryInProgress)
    return;


  if (!currentRoomCode)
    return;


  roomExpiryInProgress = true;


  const code =
    currentRoomCode;


  try {

    await fetch(
      `${API}/rooms/cancel`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          room_code:
            code,

          player_id:
            playerId

        })
      }
    );

  } catch (error) {

    console.log(
      "Expire error:",
      error
    );
  }


  stopRoomPolling();
  stopRoomTimer();

  clearRoomData();


  if (createdRoom) {

    createdRoom.style.display =
      "none";
  }

  if (joinedRoom) {

    joinedRoom.style.display =
      "none";
  }

  if (gameStartBox) {

    gameStartBox.style.display =
      "none";
  }

  if (createRoomCard) {

    createRoomCard.style.display =
      "block";
  }

  if (joinSection) {

    joinSection.style.display =
      "block";
  }


  setMessage(
    createMessage,
    "⏰ Room 5 मिनट में expire हो गया।",
    "warning"
  );


  setMessage(
    joinMessage,
    "⏰ Room 5 मिनट में expire हो गया।",
    "warning"
  );


  roomExpiryInProgress = false;
}


// =====================================
// ROOM STATUS
// =====================================

async function checkRoomStatus() {

  if (!currentRoomCode)
    return;


  try {

    const response =
      await fetch(
        `${API}/rooms/${encodeURIComponent(
          currentRoomCode
        )}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      if (
        response.status === 404 ||
        response.status === 410
      ) {

        stopRoomPolling();
        stopRoomTimer();

        clearRoomData();

        showSection(
          roomSection
        );


        if (createRoomCard) {

          createRoomCard.style.display =
            "block";
        }

        if (joinSection) {

          joinSection.style.display =
            "block";
        }

        if (createdRoom) {

          createdRoom.style.display =
            "none";
        }

        if (joinedRoom) {

          joinedRoom.style.display =
            "none";
        }


        setMessage(
          createMessage,
          "⏰ Room नहीं मिला या expire हो गया।",
          "warning"
        );


        return;
      }


      throw new Error(
        "Room status failed"
      );
    }


    const room =
      await response.json();


    // =================================
    // PLAYER 1 VIEW
    // =================================

    if (playerNumber === 1) {

      if (player1Status) {

        player1Status.textContent =
          "Player 1 • Ready";
      }


      if (player2Status) {

        player2Status.textContent =
          room.player2_id
            ? "Player 2 • Ready"
            : "Player 2 • Waiting...";
      }


      if (waitingMessage) {

        waitingMessage.textContent =
          room.player2_id
            ? "Both players are ready!"
            : "Waiting for Player 2...";
      }


      if (player1Name) {

        player1Name.textContent =
          room.player1_name ||
          playerName ||
          "Player 1";
      }


      if (player2Name) {

        player2Name.textContent =
          room.player2_name ||
          "Player 2";
      }
    }


    // =================================
    // PLAYER 2 VIEW
    // =================================

    if (playerNumber === 2) {

      if (joinedPlayer1Status) {

        joinedPlayer1Status.textContent =
          room.player1_id
            ? "Player 1 • Ready"
            : "Player 1 • Waiting...";
      }


      if (joinedPlayer2Status) {

        joinedPlayer2Status.textContent =
          "Player 2 • Ready";
      }


      if (player1Name) {

        player1Name.textContent =
          room.player1_name ||
          "Player 1";
      }


      if (player2Name) {

        player2Name.textContent =
          room.player2_name ||
          playerName ||
          "Player 2";
      }


      if (joinWaitingMessage) {

        joinWaitingMessage.textContent =
          room.player2_id
            ? "Both players are ready!"
            : "Waiting...";
      }
    }


    // =================================
    // TIMER
    // =================================

    if (
      room.status === "WAITING" &&
      !room.player2_id
    ) {

      if (
        room.created_at &&
        !roomTimer
      ) {

        startRoomTimer(
          room.created_at
        );
      }

    } else {

      stopRoomTimer();
    }


    // =================================
    // BOTH PLAYERS READY
    // =================================

    if (
      room.player2_id ||
      room.status === "READY"
    ) {

      showReadyBox(
        room
      );
    }


    // =================================
    // RESULT
    // =================================

    if (
      room.status ===
      "RESULT_SUBMITTED"
    ) {

      stopRoomPolling();
      stopRoomTimer();
    }


  } catch (error) {

    console.log(
      "Room status error:",
      error
    );
  }
}


// =====================================
// READY BOX
// =====================================

function showReadyBox(room) {

  stopRoomTimer();
  stopRoomPolling();


  if (createdRoom) {

    createdRoom.style.display =
      "none";
  }


  if (joinedRoom) {

    joinedRoom.style.display =
      "none";
  }


  if (gameStartBox) {

    gameStartBox.style.display =
      "block";
  }


  if (resultRoomCode) {

    resultRoomCode.textContent =
      currentRoomCode;
  }
}


// =====================================
// COPY CODE
// =====================================

if (copyRoomBtn) {

  copyRoomBtn.addEventListener(
    "click",
    async () => {

      if (!currentRoomCode)
        return;


      try {

        await navigator.clipboard.writeText(
          currentRoomCode
        );


        copyRoomBtn.textContent =
          "✅ Copied";


        setTimeout(
          () => {

            copyRoomBtn.textContent =
              "Copy Code";

          },
          1500
        );


      } catch (error) {

        alert(
          `Room Code: ${currentRoomCode}`
        );
      }
    }
  );
}


// =====================================
// OPEN LUDO KING
// =====================================

if (openLudoKingBtn) {

  openLudoKingBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "ludoking://";


      setTimeout(
        () => {

          window.open(
            "https://www.ludoking.com/",
            "_blank"
          );

        },
        1200
      );
    }
  );
}


// =====================================
// PLAYED GAME
// =====================================

if (playedGameBtn) {

  playedGameBtn.addEventListener(
    "click",
    () => {

      showSection(
        resultSection
      );


      if (resultRoomCode) {

        resultRoomCode.textContent =
          currentRoomCode;
      }
    }
  );
}


// =====================================
// FILE → BASE64
// =====================================

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () =>
        resolve(
          reader.result
        );


      reader.onerror = () =>
        reject(
          new Error(
            "File read failed"
          )
        );


      reader.readAsDataURL(
        file
      );
    }
  );
}


// =====================================
// SCREENSHOT SELECT
// =====================================

if (resultScreenshot) {

  resultScreenshot.addEventListener(
    "change",
    async () => {

      const file =
        resultScreenshot.files?.[0];


      if (!file)
        return;


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        setMessage(
          resultMessage,
          "❌ केवल image screenshot चुनें।",
          "error"
        );

        resultScreenshot.value =
          "";

        return;
      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        setMessage(
          resultMessage,
          "❌ Screenshot 5 MB से छोटा होना चाहिए।",
          "error"
        );

        resultScreenshot.value =
          "";

        return;
      }


      if (fileName) {

        fileName.textContent =
          file.name;
      }


      setMessage(
        resultMessage,
        "📤 Screenshot upload हो रहा है..."
      );


      await submitResult(
        file
      );
    }
  );
}


// =====================================
// RESULT BUTTON
// =====================================

if (submitResultBtn) {

  submitResultBtn.addEventListener(
    "click",
    async () => {

      const file =
        resultScreenshot?.files?.[0];


      if (!file) {

        setMessage(
          resultMessage,
          "⚠️ पहले screenshot चुनें।",
          "warning"
        );

        return;
      }


      await submitResult(
        file
      );
    }
  );
}


// =====================================
// SUBMIT RESULT
// =====================================

async function submitResult(
  file
) {

  if (!playerId) {

    setMessage(
      resultMessage,
      "❌ Player login नहीं है।",
      "error"
    );

    return;
  }


  if (!currentRoomCode) {

    setMessage(
      resultMessage,
      "❌ कोई active room नहीं है।",
      "error"
    );

    return;
  }


  if (!file) {

    setMessage(
      resultMessage,
      "⚠️ Screenshot चुनें।",
      "warning"
    );

    return;
  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    setMessage(
      resultMessage,
      "❌ केवल image screenshot allowed है।",
      "error"
    );

    return;
  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    setMessage(
      resultMessage,
      "❌ Screenshot 5 MB से बड़ा है।",
      "error"
    );

    return;
  }


  if (submitResultBtn) {

    submitResultBtn.disabled =
      true;

    submitResultBtn.textContent =
      "Uploading...";
  }


  try {

    const base64 =
      await fileToBase64(
        file
      );


    const response =
      await fetch(
        `${API}/rooms/result`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            room_code:
              currentRoomCode,

            player_id:
              playerId,

            screenshot:
              base64

          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Upload failed"
      );
    }


    setMessage(
      resultMessage,
      "✅ Screenshot successfully uploaded!",
      "success"
    );


    if (submitResultBtn) {

      submitResultBtn.textContent =
        "✅ Uploaded";
    }


    stopRoomPolling();
    stopRoomTimer();


  } catch (error) {

    setMessage(
      resultMessage,
      `❌ ${error.message}`,
      "error"
    );


    if (submitResultBtn) {

      submitResultBtn.disabled =
        false;

      submitResultBtn.textContent =
        "Upload Result";
    }
  }
}


// =====================================
// LEAVE / CANCEL ROOM
// =====================================

if (leaveRoomBtn) {

  leaveRoomBtn.addEventListener(
    "click",
    leaveRoom
  );
}


if (joinedLeaveBtn) {

  joinedLeaveBtn.addEventListener(
    "click",
    leaveRoom
  );
}


async function leaveRoom() {

  if (!currentRoomCode) {

    resetRoomScreen();

    return;
  }


  const confirmed =
    confirm(
      "क्या आप Room छोड़ना चाहते हैं?"
    );


  if (!confirmed)
    return;


  try {

    await fetch(
      `${API}/rooms/cancel`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          room_code:
            currentRoomCode,

          player_id:
            playerId

        })
      }
    );

  } catch (error) {

    console.log(
      "Leave room error:",
      error
    );
  }


  resetRoomScreen();

  showSection(
    roomSection
  );


  setMessage(
    createMessage,
    "🚪 Room छोड़ दिया गया।",
    "success"
  );
}


// =====================================
// RESTORE ROOM
// =====================================

function restoreCurrentRoom() {

  if (!currentRoomCode) {

    resetRoomScreen();

    return;
  }


  if (playerNumber === 1) {

    if (createRoomCard) {

      createRoomCard.style.display =
        "none";
    }

    if (joinSection) {

      joinSection.style.display =
        "none";
    }

    if (createdRoom) {

      createdRoom.style.display =
        "block";
    }

    if (roomCodeDisplay) {

      roomCodeDisplay.textContent =
        currentRoomCode;
    }

  }


  if (playerNumber === 2) {

    if (createRoomCard) {

      createRoomCard.style.display =
        "none";
    }

    if (joinSection) {

      joinSection.style.display =
        "none";
    }

    if (joinedRoom) {

      joinedRoom.style.display =
        "block";
    }

    if (joinedRoomCode) {

      joinedRoomCode.textContent =
        currentRoomCode;
    }
  }


  startRoomPolling();
}


// =====================================
// NAVIGATION
// =====================================

const homeBtn =
  document.getElementById(
    "homeBtn"
  );

const walletBtn =
  document.getElementById(
    "walletBtn"
  );

const referBtn =
  document.getElementById(
    "referBtn"
  );

const supportBtn =
  document.getElementById(
    "supportBtn"
  );

const profileBtn =
  document.getElementById(
    "profileBtn"
  );


if (homeBtn) {

  homeBtn.onclick = () =>
    showSection(
      homeSection
    );
}


if (walletBtn) {

  walletBtn.onclick = () =>
    showSection(
      moneySection
    );
}


if (referBtn) {

  referBtn.onclick = () =>
    showSection(
      referSection
    );
}


if (supportBtn) {

  supportBtn.onclick = () =>
    showSection(
      supportSection
    );
}


if (profileBtn) {

  profileBtn.onclick = () =>
    showSection(
      profileSection
    );
}


// =====================================
// HOME BUTTONS
// =====================================

document
  .querySelectorAll(
    ".goHomeBtn"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        showSection(
          homeSection
        );

      }
    );

  });


// =====================================
// START
// =====================================

updateProfile();


if (
  currentRoomCode &&
  (
    playerNumber === 1 ||
    playerNumber === 2
  )
) {

  showSection(
    roomSection
  );

  restoreCurrentRoom();

} else {

  showSection(
    homeSection
  );
}


console.log(
  "✅ Balaji Ludo King - New Script Loaded"
);
