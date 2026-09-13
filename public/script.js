// ======================================================
// BALAJI LUDO KING
// ONLINE 2 PLAYER GAME
// CLOUDFLARE WEBSOCKET
// DEMO WALLET
// ======================================================

const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCode");

const player1Element = document.getElementById("player1");
const player2Element = document.getElementById("player2");

const displayRoomCode = document.getElementById("displayRoomCode");
const gamePlayer1 = document.getElementById("gamePlayer1");
const gamePlayer2 = document.getElementById("gamePlayer2");

const diceBtn = document.getElementById("diceBtn");
const diceElement = document.getElementById("dice");
const gameMessage = document.getElementById("gameMessage");

const player1Piece = document.getElementById("player1Piece");
const player2Piece = document.getElementById("player2Piece");

const resetGameBtn = document.getElementById("resetGameBtn");

// ======================================================
// WALLET
// ======================================================

const balanceElement = document.getElementById("balance");

const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

const depositSection = document.getElementById("depositSection");
const withdrawSection = document.getElementById("withdrawSection");

const depositAmountInput =
  document.getElementById("depositAmount");

const withdrawAmountInput =
  document.getElementById("withdrawAmount");

const demoUpiInput =
  document.getElementById("demoUpi");

const submitDeposit =
  document.getElementById("submitDeposit");

const submitWithdraw =
  document.getElementById("submitWithdraw");

const depositMessage =
  document.getElementById("depositMessage");

const withdrawMessage =
  document.getElementById("withdrawMessage");

const transactionsElement =
  document.getElementById("transactions");

// ======================================================
// GAME VARIABLES
// ======================================================

let playerName = "";
let roomCode = "";
let playerNumber = 0;

let socket = null;

let gameStarted = false;
let currentPlayer = 1;

const WIN_POSITION = 20;

// ======================================================
// DICE FACES
// ======================================================

const diceFaces = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅"
};

// ======================================================
// WALLET STORAGE
// ======================================================

let balance =
  Number(localStorage.getItem("balajiDemoBalance")) || 0;

let transactions =
  JSON.parse(
    localStorage.getItem("balajiDemoTransactions") || "[]"
  );

// ======================================================
// UPDATE BALANCE
// ======================================================

function updateBalance() {

  if (!balanceElement) return;

  balanceElement.textContent =
    balance.toFixed(2);

  localStorage.setItem(
    "balajiDemoBalance",
    String(balance)
  );
}

// ======================================================
// SAVE TRANSACTIONS
// ======================================================

function saveTransactions() {

  localStorage.setItem(
    "balajiDemoTransactions",
    JSON.stringify(transactions)
  );
}

// ======================================================
// SHOW TRANSACTIONS
// ======================================================

function renderTransactions() {

  if (!transactionsElement) return;

  if (transactions.length === 0) {

    transactionsElement.innerHTML =
      '<p class="empty">No transactions yet</p>';

    return;
  }

  transactionsElement.innerHTML =
    transactions.map(tx => {

      const amountClass =
        tx.type === "deposit"
          ? "deposit-text"
          : "withdraw-text";

      const sign =
        tx.type === "deposit"
          ? "+"
          : "-";

      return `
        <div class="transaction">
          <div>
            <div class="transaction-title">
              ${tx.title}
            </div>

            <div class="transaction-date">
              ${tx.date}
            </div>

            <div class="status">
              ${tx.status}
            </div>
          </div>

          <div class="transaction-amount ${amountClass}">
            ${sign} ₹${Number(tx.amount).toFixed(2)}
          </div>
        </div>
      `;
    }).join("");
}

// ======================================================
// ADD TRANSACTION
// ======================================================

function addTransaction(
  type,
  amount,
  title,
  status
) {

  transactions.unshift({
    type,
    amount,
    title,
    status,
    date: new Date().toLocaleString()
  });

  saveTransactions();
  renderTransactions();
}

// ======================================================
// WALLET BUTTONS
// ======================================================

if (depositBtn) {

  depositBtn.addEventListener(
    "click",
    () => {

      if (withdrawSection) {
        withdrawSection.classList.add("hidden");
      }

      if (depositSection) {
        depositSection.classList.toggle("hidden");
      }
    }
  );
}

if (withdrawBtn) {

  withdrawBtn.addEventListener(
    "click",
    () => {

      if (depositSection) {
        depositSection.classList.add("hidden");
      }

      if (withdrawSection) {
        withdrawSection.classList.toggle("hidden");
      }
    }
  );
}

// ======================================================
// DEMO DEPOSIT
// ======================================================

if (submitDeposit) {

  submitDeposit.addEventListener(
    "click",
    () => {

      const amount =
        Number(depositAmountInput?.value || 0);

      if (!amount || amount <= 0) {

        if (depositMessage) {
          depositMessage.textContent =
            "कृपया सही amount डालें।";
        }

        return;
      }

      if (amount > 100000) {

        if (depositMessage) {
          depositMessage.textContent =
            "Maximum demo deposit ₹1,00,000 है।";
        }

        return;
      }

      balance += amount;

      updateBalance();

      addTransaction(
        "deposit",
        amount,
        "Demo Deposit",
        "SUCCESS - DEMO"
      );

      if (depositAmountInput) {
        depositAmountInput.value = "";
      }

      if (depositMessage) {
        depositMessage.textContent =
          `₹${amount.toFixed(2)} demo balance में add हो गया।`;
      }
    }
  );
}

// ======================================================
// DEMO WITHDRAW
// ======================================================

if (submitWithdraw) {

  submitWithdraw.addEventListener(
    "click",
    () => {

      const amount =
        Number(withdrawAmountInput?.value || 0);

      const upi =
        (demoUpiInput?.value || "").trim();

      if (!amount || amount <= 0) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "कृपया सही withdrawal amount डालें।";
        }

        return;
      }

      if (amount > balance) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "Demo balance पर्याप्त नहीं है।";
        }

        return;
      }

      if (!upi.includes("@")) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "कृपया demo UPI ID डालें।";
        }

        return;
      }

      balance -= amount;

      updateBalance();

      addTransaction(
        "withdraw",
        amount,
        "Demo Withdrawal",
        "PENDING - DEMO"
      );

      if (withdrawAmountInput) {
        withdrawAmountInput.value = "";
      }

      if (demoUpiInput) {
        demoUpiInput.value = "";
      }

      if (withdrawMessage) {
        withdrawMessage.textContent =
          `₹${amount.toFixed(2)} demo withdrawal request बन गई।`;
      }
    }
  );
}

// ======================================================
// START GAME
// ======================================================

if (startBtn) {

  startBtn.addEventListener(
    "click",
    () => {

      const name =
        (playerNameInput?.value || "").trim();

      if (!name) {

        if (message) {
          message.textContent =
            "कृपया अपना नाम डालें।";
        }

        return;
      }

      playerName = name;

      localStorage.setItem(
        "balajiPlayerName",
        playerName
      );

      if (welcomeCard) {
        welcomeCard.classList.add("hidden");
      }

      if (roomCard) {
        roomCard.classList.remove("hidden");
      }

      if (message) {
        message.textContent = "";
      }

      updateRoomMessage(
        "Create Room या Join Room करें।"
      );
    }
  );
}

// ======================================================
// GENERATE 6 DIGIT ROOM CODE
// ======================================================

function generateRoomCode() {

  return String(
    Math.floor(
      100000 +
      Math.random() * 900000
    )
  );
}

// ======================================================
// CREATE ROOM
// ======================================================

if (createRoomBtn) {

  createRoomBtn.addEventListener(
    "click",
    () => {

      if (!playerName) {

        updateRoomMessage(
          "पहले अपना नाम डालें।"
        );

        return;
      }

      roomCode =
        generateRoomCode();

      if (roomCodeInput) {
        roomCodeInput.value =
          roomCode;
      }

      player1Element.textContent =
        playerName;

      player2Element.textContent =
        "Waiting...";

      connectToRoom();
    }
  );
}

// ======================================================
// JOIN ROOM
// ======================================================

if (joinRoomBtn) {

  joinRoomBtn.addEventListener(
    "click",
    () => {

      if (!playerName) {

        updateRoomMessage(
          "पहले अपना नाम डालें।"
        );

        return;
      }

      const code =
        (roomCodeInput?.value || "")
          .trim();

      if (!/^\d{6}$/.test(code)) {

        updateRoomMessage(
          "6 digit Room Code डालें।"
        );

        return;
      }

      roomCode = code;

      connectToRoom();
    }
  );
}

// ======================================================
// UPDATE ROOM MESSAGE
// ======================================================

function updateRoomMessage(text) {

  const roomMessage =
    document.getElementById("roomMessage");

  if (roomMessage) {
    roomMessage.textContent = text;
  }
}

// ======================================================
// CONNECT WEBSOCKET
// ======================================================

function connectToRoom() {

  if (socket) {

    try {
      socket.close();
    } catch (error) {
      // Ignore
    }
  }

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${location.host}/ws?room=${encodeURIComponent(roomCode)}&name=${encodeURIComponent(playerName)}`;

  updateRoomMessage(
    "Room से connect हो रहा है..."
  );

  try {

    socket =
      new WebSocket(wsUrl);

  } catch (error) {

    updateRoomMessage(
      "WebSocket connection नहीं बन पाया।"
    );

    return;
  }

  socket.addEventListener(
    "open",
    () => {

      updateRoomMessage(
        "Room से connected ✅"
      );
    }
  );

  socket.addEventListener(
    "message",
    event => {

      try {

        const data =
          JSON.parse(event.data);

        handleServerMessage(data);

      } catch (error) {

        console.error(
          "Invalid server message:",
          error
        );
      }
    }
  );

  socket.addEventListener(
    "close",
    () => {

      if (gameStarted) {

        updateGameMessage(
          "Connection बंद हो गया।"
        );

      } else {

        updateRoomMessage(
          "Room connection बंद हो गया।"
        );
      }
    }
  );

  socket.addEventListener(
    "error",
    () => {

      updateRoomMessage(
        "Room connection में समस्या हुई।"
      );
    }
  );
}

// ======================================================
// SERVER MESSAGE HANDLER
// ======================================================

function handleServerMessage(data) {

  // ----------------------------------------------------
  // CONNECTED
  // ----------------------------------------------------

  if (data.type === "connected") {

    playerNumber =
      Number(data.player) || 0;

    roomCode =
      data.roomCode || roomCode;

    if (displayRoomCode) {
      displayRoomCode.textContent =
        roomCode;
    }

    if (playerNumber === 1) {

      player1Element.textContent =
        playerName;

      updateRoomMessage(
        `Room ${roomCode} बनाया गया। Player 2 का इंतजार है...`
      );

    } else if (playerNumber === 2) {

      player2Element.textContent =
        playerName;

      updateRoomMessage(
        `Room ${roomCode} में join हो गए।`
      );
    }

    return;
  }

  // ----------------------------------------------------
  // ROOM STATE
  // ----------------------------------------------------

  if (data.type === "room") {

    updatePlayers(
      data.players || []
    );

    return;
  }

  // ----------------------------------------------------
  // GAME START
  // ----------------------------------------------------

  if (data.type === "game_start") {

    gameStarted = true;

    currentPlayer =
      Number(data.currentPlayer) || 1;

    updatePlayers(
      data.players || []
    );

    showGameCard();

    updatePositions(
      data.positions || {
        1: 0,
        2: 0
      }
    );

    updateTurnMessage();

    return;
  }

  // ----------------------------------------------------
  // MOVE
  // ----------------------------------------------------

  if (data.type === "move") {

    currentPlayer =
      Number(data.currentPlayer) || 1;

    if (data.dice) {
      showDice(data.dice);
    }

    updatePositions(
      data.positions || {
        1: 0,
        2: 0
      }
    );

    updateTurnMessage();

    return;
  }

  // ----------------------------------------------------
  // GAME OVER
  // ----------------------------------------------------

  if (data.type === "game_over") {

    gameStarted = true;

    if (data.dice) {
      showDice(data.dice);
    }

    updatePositions(
      data.positions || {
        1: 0,
        2: 0
      }
    );

    const winner =
      Number(data.winner);

    const winnerName =
      data.winnerName || "Player";

    if (winner === playerNumber) {

      updateGameMessage(
        `🏆 आप जीत गए! ${winnerName} Winner है।`
      );

    } else {

      updateGameMessage(
        `😔 आप हार गए। ${winnerName} Winner है।`
      );
    }

    if (diceBtn) {
      diceBtn.disabled = true;
    }

    return;
  }

  // ----------------------------------------------------
  // RESET
  // ----------------------------------------------------

  if (data.type === "reset") {

    currentPlayer = 1;

    if (diceBtn) {
      diceBtn.disabled = false;
    }

    showDice(null);

    updatePositions(
      data.positions || {
        1: 0,
        2: 0
      }
    );

    updateTurnMessage();

    return;
  }

  // ----------------------------------------------------
  // PLAYER LEFT
  // ----------------------------------------------------

  if (data.type === "player_left") {

    gameStarted = false;

    updatePlayers(
      data.players || []
    );

    updateGameMessage(
      "Player 2 ने room छोड़ दिया।"
    );

    if (diceBtn) {
      diceBtn.disabled = true;
    }

    return;
  }

  // ----------------------------------------------------
  // ERROR
  // ----------------------------------------------------

  if (data.type === "error") {

    if (gameStarted) {

      updateGameMessage(
        data.message || "Game error."
      );

    } else {

      updateRoomMessage(
        data.message || "Room error."
      );
    }
  }
}

// ======================================================
// UPDATE PLAYERS
// ======================================================

function updatePlayers(players) {

  let p1 = "Waiting...";
  let p2 = "Waiting...";

  players.forEach(player => {

    if (Number(player.number) === 1) {
      p1 = player.name;
    }

    if (Number(player.number) === 2) {
      p2 = player.name;
    }
  });

  if (player1Element) {
    player1Element.textContent = p1;
  }

  if (player2Element) {
    player2Element.textContent = p2;
  }

  if (gamePlayer1) {
    gamePlayer1.textContent = p1;
  }

  if (gamePlayer2) {
    gamePlayer2.textContent = p2;
  }
}

// ======================================================
// SHOW GAME CARD
// ======================================================

function showGameCard() {

  if (roomCard) {
    roomCard.classList.add("hidden");
  }

  if (ludoCard) {
    ludoCard.classList.remove("hidden");
  }

  if (displayRoomCode) {
    displayRoomCode.textContent =
      roomCode;
  }
}

// ======================================================
// DICE BUTTON
// ======================================================

if (diceBtn) {

  diceBtn.addEventListener(
    "click",
    () => {

      if (!socket) {

        updateGameMessage(
          "Room connection नहीं है।"
        );

        return;
      }

      if (
        socket.readyState !==
        WebSocket.OPEN
      ) {

        updateGameMessage(
          "Room connection उपलब्ध नहीं है।"
        );

        return;
      }

      if (!gameStarted) {

        updateGameMessage(
          "Game अभी शुरू नहीं हुआ।"
        );

        return;
      }

      if (currentPlayer !== playerNumber) {

        updateGameMessage(
          "⏳ अभी दूसरे player की turn है।"
        );

        return;
      }

      socket.send(
        JSON.stringify({
          type: "roll"
        })
      );
    }
  );
}

// ======================================================
// RESET GAME
// ======================================================

if (resetGameBtn) {

  resetGameBtn.addEventListener(
    "click",
    () => {

      if (!socket) return;

      if (
        socket.readyState !==
        WebSocket.OPEN
      ) return;

      socket.send(
        JSON.stringify({
          type: "reset"
        })
      );
    }
  );
}

// ======================================================
// SHOW DICE
// ======================================================

function showDice(value) {

  if (!diceElement) return;

  if (!value) {

    diceElement.textContent =
      "🎲";

    return;
  }

  const number =
    Number(value);

  diceElement.textContent =
    diceFaces[number] || "🎲";
}

// ======================================================
// UPDATE POSITIONS
// ======================================================

function updatePositions(positions) {

  const p1 =
    Number(positions?.[1]) || 0;

  const p2 =
    Number(positions?.[2]) || 0;

  const max =
    WIN_POSITION;

  const p1Percent =
    8 + ((p1 / max) * 82);

  const p2Percent =
    8 + ((p2 / max) * 82);

  if (player1Piece) {
    player1Piece.style.left =
      `${Math.min(p1Percent, 90)}%`;
  }

  if (player2Piece) {
    player2Piece.style.left =
      `${Math.min(p2Percent, 90)}%`;
  }
}

// ======================================================
// TURN MESSAGE
// ======================================================

function updateTurnMessage() {

  if (!gameStarted) return;

  if (currentPlayer === playerNumber) {

    updateGameMessage(
      "🎲 आपकी turn है — Dice Roll करें!"
    );

    if (diceBtn) {
      diceBtn.disabled = false;
    }

  } else {

    updateGameMessage(
      "⏳ दूसरे player की turn है..."
    );

    if (diceBtn) {
      diceBtn.disabled = true;
    }
  }
}

// ======================================================
// GAME MESSAGE
// ======================================================

function updateGameMessage(text) {

  if (gameMessage) {
    gameMessage.textContent =
      text;
  }
}

// ======================================================
// LOAD SAVED NAME
// ======================================================

const savedName =
  localStorage.getItem(
    "balajiPlayerName"
  );

if (savedName && playerNameInput) {

  playerNameInput.value =
    savedName;
}

// ======================================================
// INITIALIZE WALLET
// ======================================================

updateBalance();
renderTransactions();

// ======================================================
// INITIAL DICE
// ======================================================

showDice(null);
