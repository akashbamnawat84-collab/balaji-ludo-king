// ======================================================
// BALAJI LUDO KING
// 2 PLAYER - 4 PIECE LUDO
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

const roomMessage = document.getElementById("roomMessage");

const displayRoomCode =
  document.getElementById("displayRoomCode");

const gamePlayer1 =
  document.getElementById("gamePlayer1");

const gamePlayer2 =
  document.getElementById("gamePlayer2");

const gameMessage =
  document.getElementById("gameMessage");

const diceBtn =
  document.getElementById("diceBtn");

const diceElement =
  document.getElementById("dice");

const diceNumber =
  document.getElementById("diceNumber");

const resetGameBtn =
  document.getElementById("resetGameBtn");

const track =
  document.getElementById("track");


// ======================================================
// GAME VARIABLES
// ======================================================

let playerName = "";
let roomCode = "";
let playerNumber = 0;

let socket = null;

let gameStarted = false;
let currentPlayer = 1;

const HOME = -1;
const FINISH = 56;


// ======================================================
// DICE
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
// CREATE BOARD
// ======================================================

function createBoard() {

  if (!track) return;

  track.innerHTML = "";

  for (let i = 0; i < 52; i++) {

    const cell =
      document.createElement("div");

    cell.className = "track-cell";

    const angle =
      (i / 52) * Math.PI * 2;

    const x =
      50 + Math.cos(angle) * 42;

    const y =
      50 + Math.sin(angle) * 42;

    cell.style.left =
      `${x - 4}%`;

    cell.style.top =
      `${y - 4}%`;

    cell.textContent = "";

    track.appendChild(cell);
  }

  createPieces();
}


// ======================================================
// CREATE 8 PIECES
// ======================================================

function createPieces() {

  document
    .querySelectorAll(".piece")
    .forEach(p => p.remove());

  for (let player = 1; player <= 2; player++) {

    for (let piece = 0; piece < 4; piece++) {

      const element =
        document.createElement("div");

      element.className =
        `piece ${player === 1 ? "red-piece" : "green-piece"}`;

      element.id =
        `piece-${player}-${piece}`;

      element.textContent =
        player === 1 ? "●" : "●";

      element.style.left =
        player === 1
          ? `${6 + (piece % 2) * 7}%`
          : `${78 + (piece % 2) * 7}%`;

      element.style.top =
        player === 1
          ? `${78 + Math.floor(piece / 2) * 7}%`
          : `${6 + Math.floor(piece / 2) * 7}%`;

      const board =
        document.querySelector(".ludo-board");

      if (board) {
        board.appendChild(element);
      }
    }
  }
}


// ======================================================
// MOVE PIECES
// ======================================================

function updatePositions(positions) {

  for (let player = 1; player <= 2; player++) {

    const pieces =
      positions?.[player] || [HOME, HOME, HOME, HOME];

    for (let i = 0; i < 4; i++) {

      const position =
        Number(pieces[i]);

      const element =
        document.getElementById(
          `piece-${player}-${i}`
        );

      if (!element) continue;

      if (position === HOME || position < 0) {

        if (player === 1) {

          element.style.left =
            `${6 + (i % 2) * 7}%`;

          element.style.top =
            `${78 + Math.floor(i / 2) * 7}%`;

        } else {

          element.style.left =
            `${78 + (i % 2) * 7}%`;

          element.style.top =
            `${6 + Math.floor(i / 2) * 7}%`;
        }

        continue;
      }

      if (position >= FINISH) {

        element.style.left = "47%";
        element.style.top = "47%";

        continue;
      }

      const angle =
        (position / 52) * Math.PI * 2;

      const x =
        50 + Math.cos(angle) * 42;

      const y =
        50 + Math.sin(angle) * 42;

      element.style.left =
        `${x - 3}%`;

      element.style.top =
        `${y - 3}%`;
    }
  }
}


// ======================================================
// START
// ======================================================

startBtn?.addEventListener(
  "click",
  () => {

    const name =
      (playerNameInput?.value || "").trim();

    if (!name) {

      message.textContent =
        "कृपया अपना नाम डालें।";

      return;
    }

    playerName = name;

    localStorage.setItem(
      "balajiPlayerName",
      playerName
    );

    welcomeCard.classList.add("hidden");

    roomCard.classList.remove("hidden");

    roomMessage.textContent =
      "Create Room या Join Room करें।";
  }
);


// ======================================================
// ROOM CODE
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

createRoomBtn?.addEventListener(
  "click",
  () => {

    if (!playerName) {

      roomMessage.textContent =
        "पहले अपना नाम डालें।";

      return;
    }

    roomCode =
      generateRoomCode();

    roomCodeInput.value =
      roomCode;

    connectToRoom();
  }
);


// ======================================================
// JOIN ROOM
// ======================================================

joinRoomBtn?.addEventListener(
  "click",
  () => {

    const code =
      roomCodeInput.value.trim();

    if (!/^\d{6}$/.test(code)) {

      roomMessage.textContent =
        "6 digit Room Code डालें।";

      return;
    }

    roomCode = code;

    connectToRoom();
  }
);


// ======================================================
// CONNECT
// ======================================================

function connectToRoom() {

  if (socket) {

    try {
      socket.close();
    } catch {}
  }

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${location.host}/ws?room=${encodeURIComponent(roomCode)}&name=${encodeURIComponent(playerName)}`;

  roomMessage.textContent =
    "Room से connect हो रहा है...";

  socket =
    new WebSocket(wsUrl);


  socket.addEventListener(
    "open",
    () => {

      roomMessage.textContent =
        "✅ Room Connected";
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

        console.error(error);
      }
    }
  );


  socket.addEventListener(
    "close",
    () => {

      if (gameStarted) {

        gameMessage.textContent =
          "Connection बंद हो गया।";

      } else {

        roomMessage.textContent =
          "Room connection बंद हो गया।";
      }
    }
  );
}


// ======================================================
// SERVER MESSAGES
// ======================================================

function handleServerMessage(data) {

  if (data.type === "connected") {

    playerNumber =
      Number(data.player);

    roomCode =
      data.roomCode || roomCode;

    displayRoomCode.textContent =
      roomCode;

    return;
  }


  if (data.type === "room") {

    updatePlayers(data.players || []);

    return;
  }


  if (data.type === "game_start") {

    gameStarted = true;

    currentPlayer =
      Number(data.currentPlayer) || 1;

    updatePlayers(
      data.players || []
    );

    roomCard.classList.add("hidden");

    ludoCard.classList.remove("hidden");

    updatePositions(
      data.positions
    );

    updateTurn();

    return;
  }


  if (data.type === "move") {

    currentPlayer =
      Number(data.currentPlayer);

    showDice(data.dice);

    updatePositions(
      data.positions
    );

    updateTurn();

    return;
  }


  if (data.type === "game_over") {

    showDice(data.dice);

    updatePositions(
      data.positions
    );

    if (
      Number(data.winner) ===
      playerNumber
    ) {

      gameMessage.textContent =
        `🏆 आप जीत गए! ${data.winnerName}`;

    } else {

      gameMessage.textContent =
        `😔 आप हार गए। Winner: ${data.winnerName}`;
    }

    diceBtn.disabled = true;

    return;
  }


  if (data.type === "reset") {

    currentPlayer = 1;

    diceBtn.disabled = false;

    showDice(null);

    updatePositions(
      data.positions
    );

    updateTurn();

    return;
  }


  if (data.type === "player_left") {

    gameStarted = false;

    updatePlayers(
      data.players || []
    );

    gameMessage.textContent =
      "Opponent ने room छोड़ दिया।";

    diceBtn.disabled = true;

    return;
  }


  if (data.type === "error") {

    if (gameStarted) {

      gameMessage.textContent =
        data.message;

    } else {

      roomMessage.textContent =
        data.message;
    }
  }
}


// ======================================================
// PLAYERS
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

  player1Element.textContent = p1;
  player2Element.textContent = p2;

  gamePlayer1.textContent = p1;
  gamePlayer2.textContent = p2;
}


// ======================================================
// DICE
// ======================================================

function showDice(value) {

  if (!value) {

    diceElement.textContent = "🎲";
    diceNumber.textContent = "-";

    return;
  }

  diceElement.textContent =
    diceFaces[value] || "🎲";

  diceNumber.textContent =
    value;
}


// ======================================================
// TURN
// ======================================================

function updateTurn() {

  if (currentPlayer === playerNumber) {

    gameMessage.textContent =
      "🎲 आपकी turn है — Dice Roll करें!";

    diceBtn.disabled = false;

  } else {

    gameMessage.textContent =
      "⏳ Opponent's Turn";

    diceBtn.disabled = true;
  }
}


// ======================================================
// ROLL
// ======================================================

diceBtn?.addEventListener(
  "click",
  () => {

    if (!socket) return;

    if (
      socket.readyState !==
      WebSocket.OPEN
    ) return;

    if (!gameStarted) return;

    if (
      currentPlayer !==
      playerNumber
    ) {

      gameMessage.textContent =
        "⏳ अभी दूसरे player की turn है।";

      return;
    }

    socket.send(
      JSON.stringify({
        type: "roll"
      })
    );
  }
);


// ======================================================
// RESET
// ======================================================

resetGameBtn?.addEventListener(
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


// ======================================================
// WALLET
// ======================================================

const balanceElement =
  document.getElementById("balance");

const depositBtn =
  document.getElementById("depositBtn");

const withdrawBtn =
  document.getElementById("withdrawBtn");

const depositSection =
  document.getElementById("depositSection");

const withdrawSection =
  document.getElementById("withdrawSection");

const depositAmount =
  document.getElementById("depositAmount");

const withdrawAmount =
  document.getElementById("withdrawAmount");

const demoUpi =
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


let balance =
  Number(
    localStorage.getItem(
      "balajiDemoBalance"
    )
  ) || 0;


let transactions =
  JSON.parse(
    localStorage.getItem(
      "balajiDemoTransactions"
    ) || "[]"
  );


function updateBalance() {

  balanceElement.textContent =
    balance.toFixed(2);

  localStorage.setItem(
    "balajiDemoBalance",
    balance
  );
}


function renderTransactions() {

  if (!transactions.length) {

    transactionsElement.innerHTML =
      '<p class="empty">No transactions yet</p>';

    return;
  }

  transactionsElement.innerHTML =
    transactions.map(tx => {

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

          <strong>
            ${sign} ₹${Number(tx.amount).toFixed(2)}
          </strong>
        </div>
      `;

    }).join("");
}


function saveTransactions() {

  localStorage.setItem(
    "balajiDemoTransactions",
    JSON.stringify(transactions)
  );
}


depositBtn?.addEventListener(
  "click",
  () => {

    withdrawSection.classList.add("hidden");

    depositSection.classList.toggle(
      "hidden"
    );
  }
);


withdrawBtn?.addEventListener(
  "click",
  () => {

    depositSection.classList.add("hidden");

    withdrawSection.classList.toggle(
      "hidden"
    );
  }
);


submitDeposit?.addEventListener(
  "click",
  () => {

    const amount =
      Number(depositAmount.value);

    if (
      !amount ||
      amount <= 0
    ) {

      depositMessage.textContent =
        "सही amount डालें।";

      return;
    }

    balance += amount;

    updateBalance();

    transactions.unshift({
      type: "deposit",
      amount,
      title: "Demo Deposit",
      status: "SUCCESS - DEMO",
      date: new Date().toLocaleString()
    });

    saveTransactions();

    renderTransactions();

    depositAmount.value = "";

    depositMessage.textContent =
      `₹${amount} demo balance में add हो गया।`;
  }
);


submitWithdraw?.addEventListener(
  "click",
  () => {

    const amount =
      Number(withdrawAmount.value);

    const upi =
      demoUpi.value.trim();

    if (!amount || amount <= 0) {

      withdrawMessage.textContent =
        "सही withdrawal amount डालें।";

      return;
    }

    if (amount > balance) {

      withdrawMessage.textContent =
        "Demo balance पर्याप्त नहीं है।";

      return;
    }

    if (!upi.includes("@")) {

      withdrawMessage.textContent =
        "Demo UPI ID डालें।";

      return;
    }

    balance -= amount;

    updateBalance();

    transactions.unshift({
      type: "withdraw",
      amount,
      title: "Demo Withdrawal",
      status: "PENDING - DEMO",
      date: new Date().toLocaleString()
    });

    saveTransactions();

    renderTransactions();

    withdrawAmount.value = "";
    demoUpi.value = "";

    withdrawMessage.textContent =
      `₹${amount} demo withdrawal request बन गई।`;
  }
);


// ======================================================
// INIT
// ======================================================

const savedName =
  localStorage.getItem(
    "balajiPlayerName"
  );

if (
  savedName &&
  playerNameInput
) {

  playerNameInput.value// ======================================================
// BALAJI LUDO KING
// 2 PLAYER - 4 PIECE LUDO
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

const roomMessage = document.getElementById("roomMessage");

const displayRoomCode =
  document.getElementById("displayRoomCode");

const gamePlayer1 =
  document.getElementById("gamePlayer1");

const gamePlayer2 =
  document.getElementById("gamePlayer2");

const gameMessage =
  document.getElementById("gameMessage");

const diceBtn =
  document.getElementById("diceBtn");

const diceElement =
  document.getElementById("dice");

const diceNumber =
  document.getElementById("diceNumber");

const resetGameBtn =
  document.getElementById("resetGameBtn");

const track =
  document.getElementById("track");


// ======================================================
// GAME VARIABLES
// ======================================================

let playerName = "";
let roomCode = "";
let playerNumber = 0;

let socket = null;

let gameStarted = false;
let currentPlayer = 1;

const HOME = -1;
const FINISH = 56;


// ======================================================
// DICE
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
// CREATE BOARD
// ======================================================

function createBoard() {

  if (!track) return;

  track.innerHTML = "";

  for (let i = 0; i < 52; i++) {

    const cell =
      document.createElement("div");

    cell.className = "track-cell";

    const angle =
      (i / 52) * Math.PI * 2;

    const x =
      50 + Math.cos(angle) * 42;

    const y =
      50 + Math.sin(angle) * 42;

    cell.style.left =
      `${x - 4}%`;

    cell.style.top =
      `${y - 4}%`;

    cell.textContent = "";

    track.appendChild(cell);
  }

  createPieces();
}


// ======================================================
// CREATE 8 PIECES
// ======================================================

function createPieces() {

  document
    .querySelectorAll(".piece")
    .forEach(p => p.remove());

  for (let player = 1; player <= 2; player++) {

    for (let piece = 0; piece < 4; piece++) {

      const element =
        document.createElement("div");

      element.className =
        `piece ${player === 1 ? "red-piece" : "green-piece"}`;

      element.id =
        `piece-${player}-${piece}`;

      element.textContent =
        player === 1 ? "●" : "●";

      element.style.left =
        player === 1
          ? `${6 + (piece % 2) * 7}%`
          : `${78 + (piece % 2) * 7}%`;

      element.style.top =
        player === 1
          ? `${78 + Math.floor(piece / 2) * 7}%`
          : `${6 + Math.floor(piece / 2) * 7}%`;

      const board =
        document.querySelector(".ludo-board");

      if (board) {
        board.appendChild(element);
      }
    }
  }
}


// ======================================================
// MOVE PIECES
// ======================================================

function updatePositions(positions) {

  for (let player = 1; player <= 2; player++) {

    const pieces =
      positions?.[player] || [HOME, HOME, HOME, HOME];

    for (let i = 0; i < 4; i++) {

      const position =
        Number(pieces[i]);

      const element =
        document.getElementById(
          `piece-${player}-${i}`
        );

      if (!element) continue;

      if (position === HOME || position < 0) {

        if (player === 1) {

          element.style.left =
            `${6 + (i % 2) * 7}%`;

          element.style.top =
            `${78 + Math.floor(i / 2) * 7}%`;

        } else {

          element.style.left =
            `${78 + (i % 2) * 7}%`;

          element.style.top =
            `${6 + Math.floor(i / 2) * 7}%`;
        }

        continue;
      }

      if (position >= FINISH) {

        element.style.left = "47%";
        element.style.top = "47%";

        continue;
      }

      const angle =
        (position / 52) * Math.PI * 2;

      const x =
        50 + Math.cos(angle) * 42;

      const y =
        50 + Math.sin(angle) * 42;

      element.style.left =
        `${x - 3}%`;

      element.style.top =
        `${y - 3}%`;
    }
  }
}


// ======================================================
// START
// ======================================================

startBtn?.addEventListener(
  "click",
  () => {

    const name =
      (playerNameInput?.value || "").trim();

    if (!name) {

      message.textContent =
        "कृपया अपना नाम डालें।";

      return;
    }

    playerName = name;

    localStorage.setItem(
      "balajiPlayerName",
      playerName
    );

    welcomeCard.classList.add("hidden");

    roomCard.classList.remove("hidden");

    roomMessage.textContent =
      "Create Room या Join Room करें।";
  }
);


// ======================================================
// ROOM CODE
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

createRoomBtn?.addEventListener(
  "click",
  () => {

    if (!playerName) {

      roomMessage.textContent =
        "पहले अपना नाम डालें।";

      return;
    }

    roomCode =
      generateRoomCode();

    roomCodeInput.value =
      roomCode;

    connectToRoom();
  }
);


// ======================================================
// JOIN ROOM
// ======================================================

joinRoomBtn?.addEventListener(
  "click",
  () => {

    const code =
      roomCodeInput.value.trim();

    if (!/^\d{6}$/.test(code)) {

      roomMessage.textContent =
        "6 digit Room Code डालें।";

      return;
    }

    roomCode = code;

    connectToRoom();
  }
);


// ======================================================
// CONNECT
// ======================================================

function connectToRoom() {

  if (socket) {

    try {
      socket.close();
    } catch {}
  }

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${protocol}//${location.host}/ws?room=${encodeURIComponent(roomCode)}&name=${encodeURIComponent(playerName)}`;

  roomMessage.textContent =
    "Room से connect हो रहा है...";

  socket =
    new WebSocket(wsUrl);


  socket.addEventListener(
    "open",
    () => {

      roomMessage.textContent =
        "✅ Room Connected";
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

        console.error(error);
      }
    }
  );


  socket.addEventListener(
    "close",
    () => {

      if (gameStarted) {

        gameMessage.textContent =
          "Connection बंद हो गया।";

      } else {

        roomMessage.textContent =
          "Room connection बंद हो गया।";
      }
    }
  );
}


// ======================================================
// SERVER MESSAGES
// ======================================================

function handleServerMessage(data) {

  if (data.type === "connected") {

    playerNumber =
      Number(data.player);

    roomCode =
      data.roomCode || roomCode;

    displayRoomCode.textContent =
      roomCode;

    return;
  }


  if (data.type === "room") {

    updatePlayers(data.players || []);

    return;
  }


  if (data.type === "game_start") {

    gameStarted = true;

    currentPlayer =
      Number(data.currentPlayer) || 1;

    updatePlayers(
      data.players || []
    );

    roomCard.classList.add("hidden");

    ludoCard.classList.remove("hidden");

    updatePositions(
      data.positions
    );

    updateTurn();

    return;
  }


  if (data.type === "move") {

    currentPlayer =
      Number(data.currentPlayer);

    showDice(data.dice);

    updatePositions(
      data.positions
    );

    updateTurn();

    return;
  }


  if (data.type === "game_over") {

    showDice(data.dice);

    updatePositions(
      data.positions
    );

    if (
      Number(data.winner) ===
      playerNumber
    ) {

      gameMessage.textContent =
        `🏆 आप जीत गए! ${data.winnerName}`;

    } else {

      gameMessage.textContent =
        `😔 आप हार गए। Winner: ${data.winnerName}`;
    }

    diceBtn.disabled = true;

    return;
  }


  if (data.type === "reset") {

    currentPlayer = 1;

    diceBtn.disabled = false;

    showDice(null);

    updatePositions(
      data.positions
    );

    updateTurn();

    return;
  }


  if (data.type === "player_left") {

    gameStarted = false;

    updatePlayers(
      data.players || []
    );

    gameMessage.textContent =
      "Opponent ने room छोड़ दिया।";

    diceBtn.disabled = true;

    return;
  }


  if (data.type === "error") {

    if (gameStarted) {

      gameMessage.textContent =
        data.message;

    } else {

      roomMessage.textContent =
        data.message;
    }
  }
}


// ======================================================
// PLAYERS
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

  player1Element.textContent = p1;
  player2Element.textContent = p2;

  gamePlayer1.textContent = p1;
  gamePlayer2.textContent = p2;
}


// ======================================================
// DICE
// ======================================================

function showDice(value) {

  if (!value) {

    diceElement.textContent = "🎲";
    diceNumber.textContent = "-";

    return;
  }

  diceElement.textContent =
    diceFaces[value] || "🎲";

  diceNumber.textContent =
    value;
}


// ======================================================
// TURN
// ======================================================

function updateTurn() {

  if (currentPlayer === playerNumber) {

    gameMessage.textContent =
      "🎲 आपकी turn है — Dice Roll करें!";

    diceBtn.disabled = false;

  } else {

    gameMessage.textContent =
      "⏳ Opponent's Turn";

    diceBtn.disabled = true;
  }
}


// ======================================================
// ROLL
// ======================================================

diceBtn?.addEventListener(
  "click",
  () => {

    if (!socket) return;

    if (
      socket.readyState !==
      WebSocket.OPEN
    ) return;

    if (!gameStarted) return;

    if (
      currentPlayer !==
      playerNumber
    ) {

      gameMessage.textContent =
        "⏳ अभी दूसरे player की turn है।";

      return;
    }

    socket.send(
      JSON.stringify({
        type: "roll"
      })
    );
  }
);


// ======================================================
// RESET
// ======================================================

resetGameBtn?.addEventListener(
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


// ======================================================
// WALLET
// ======================================================

const balanceElement =
  document.getElementById("balance");

const depositBtn =
  document.getElementById("depositBtn");

const withdrawBtn =
  document.getElementById("withdrawBtn");

const depositSection =
  document.getElementById("depositSection");

const withdrawSection =
  document.getElementById("withdrawSection");

const depositAmount =
  document.getElementById("depositAmount");

const withdrawAmount =
  document.getElementById("withdrawAmount");

const demoUpi =
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


let balance =
  Number(
    localStorage.getItem(
      "balajiDemoBalance"
    )
  ) || 0;


let transactions =
  JSON.parse(
    localStorage.getItem(
      "balajiDemoTransactions"
    ) || "[]"
  );


function updateBalance() {

  balanceElement.textContent =
    balance.toFixed(2);

  localStorage.setItem(
    "balajiDemoBalance",
    balance
  );
}


function renderTransactions() {

  if (!transactions.length) {

    transactionsElement.innerHTML =
      '<p class="empty">No transactions yet</p>';

    return;
  }

  transactionsElement.innerHTML =
    transactions.map(tx => {

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

          <strong>
            ${sign} ₹${Number(tx.amount).toFixed(2)}
          </strong>
        </div>
      `;

    }).join("");
}


function saveTransactions() {

  localStorage.setItem(
    "balajiDemoTransactions",
    JSON.stringify(transactions)
  );
}


depositBtn?.addEventListener(
  "click",
  () => {

    withdrawSection.classList.add("hidden");

    depositSection.classList.toggle(
      "hidden"
    );
  }
);


withdrawBtn?.addEventListener(
  "click",
  () => {

    depositSection.classList.add("hidden");

    withdrawSection.classList.toggle(
      "hidden"
    );
  }
);


submitDeposit?.addEventListener(
  "click",
  () => {

    const amount =
      Number(depositAmount.value);

    if (
      !amount ||
      amount <= 0
    ) {

      depositMessage.textContent =
        "सही amount डालें।";

      return;
    }

    balance += amount;

    updateBalance();

    transactions.unshift({
      type: "deposit",
      amount,
      title: "Demo Deposit",
      status: "SUCCESS - DEMO",
      date: new Date().toLocaleString()
    });

    saveTransactions();

    renderTransactions();

    depositAmount.value = "";

    depositMessage.textContent =
      `₹${amount} demo balance में add हो गया।`;
  }
);


submitWithdraw?.addEventListener(
  "click",
  () => {

    const amount =
      Number(withdrawAmount.value);

    const upi =
      demoUpi.value.trim();

    if (!amount || amount <= 0) {

      withdrawMessage.textContent =
        "सही withdrawal amount डालें।";

      return;
    }

    if (amount > balance) {

      withdrawMessage.textContent =
        "Demo balance पर्याप्त नहीं है।";

      return;
    }

    if (!upi.includes("@")) {

      withdrawMessage.textContent =
        "Demo UPI ID डालें।";

      return;
    }

    balance -= amount;

    updateBalance();

    transactions.unshift({
      type: "withdraw",
      amount,
      title: "Demo Withdrawal",
      status: "PENDING - DEMO",
      date: new Date().toLocaleString()
    });

    saveTransactions();

    renderTransactions();

    withdrawAmount.value = "";
    demoUpi.value = "";

    withdrawMessage.textContent =
      `₹${amount} demo withdrawal request बन गई।`;
  }
);


// ======================================================
// INIT
// ======================================================

const savedName =
  localStorage.getItem(
    "balajiPlayerName"
  );

if (
  savedName &&
  playerNameInput
) {

  playerNameInput.value =
    savedName;
}

createBoard();

updateBalance();

renderTransactions();

showDice(null); =
    savedName;
}

createBoard();

updateBalance();

renderTransactions();

showDice(null);
