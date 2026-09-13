/*
========================================
 BALAJI LUDO KING
 2 PLAYER DEMO GAME + DEMO WALLET
========================================
*/

/* =====================================
   COMMON ELEMENTS
===================================== */

const balanceElement = document.getElementById("balance");

const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

const depositSection = document.getElementById("depositSection");
const withdrawSection = document.getElementById("withdrawSection");

const depositAmount = document.getElementById("depositAmount");
const withdrawAmount = document.getElementById("withdrawAmount");

const demoUpi = document.getElementById("demoUpi");

const submitDeposit = document.getElementById("submitDeposit");
const submitWithdraw = document.getElementById("submitWithdraw");

const depositMessage = document.getElementById("depositMessage");
const withdrawMessage = document.getElementById("withdrawMessage");

const transactionsElement = document.getElementById("transactions");


/* =====================================
   LUDO ELEMENTS
===================================== */

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

const diceBtn = document.getElementById("diceBtn");
const diceElement = document.getElementById("dice");

const gameMessage = document.getElementById("gameMessage");

const player1Piece = document.getElementById("player1Piece");
const player2Piece = document.getElementById("player2Piece");

const resetGameBtn = document.getElementById("resetGameBtn");


/* =====================================
   DEMO WALLET
===================================== */

let balance = Number(
  localStorage.getItem("balajiDemoBalance")
) || 0;

let transactions = [];

try {
  transactions =
    JSON.parse(
      localStorage.getItem("balajiDemoTransactions")
    ) || [];
} catch (error) {
  transactions = [];
}


/* =====================================
   UPDATE BALANCE
===================================== */

function updateBalance() {

  if (!balanceElement) return;

  balanceElement.textContent =
    balance.toFixed(2);

  localStorage.setItem(
    "balajiDemoBalance",
    balance.toString()
  );
}


/* =====================================
   SAVE TRANSACTIONS
===================================== */

function saveTransactions() {

  localStorage.setItem(
    "balajiDemoTransactions",
    JSON.stringify(transactions)
  );
}


/* =====================================
   SHOW TRANSACTIONS
===================================== */

function showTransactions() {

  if (!transactionsElement) return;

  if (transactions.length === 0) {

    transactionsElement.innerHTML =
      '<p class="empty">No transactions yet</p>';

    return;
  }

  transactionsElement.innerHTML = "";

  transactions
    .slice()
    .reverse()
    .forEach(transaction => {

      const div =
        document.createElement("div");

      div.className = "transaction";


      const left =
        document.createElement("div");


      const title =
        document.createElement("div");

      title.className =
        "transaction-title";

      title.textContent =
        transaction.type === "deposit"
          ? "💰 Demo Deposit"
          : "🏦 Demo Withdrawal";


      const date =
        document.createElement("div");

      date.className =
        "transaction-date";

      date.textContent =
        transaction.date;


      const status =
        document.createElement("div");

      status.className =
        "status";

      status.textContent =
        "Status: " +
        transaction.status;


      left.appendChild(title);
      left.appendChild(date);
      left.appendChild(status);


      const amount =
        document.createElement("div");

      amount.className =
        "transaction-amount " +
        (
          transaction.type === "deposit"
            ? "deposit-text"
            : "withdraw-text"
        );


      amount.textContent =
        (
          transaction.type === "deposit"
            ? "+"
            : "-"
        ) +
        " ₹" +
        Number(transaction.amount).toFixed(2);


      div.appendChild(left);
      div.appendChild(amount);

      transactionsElement.appendChild(div);

    });
}


/* =====================================
   DEPOSIT BUTTON
===================================== */

if (depositBtn) {

  depositBtn.addEventListener(
    "click",
    () => {

      if (depositSection) {
        depositSection.classList.remove("hidden");
      }

      if (withdrawSection) {
        withdrawSection.classList.add("hidden");
      }

      if (depositMessage) {
        depositMessage.textContent = "";
      }

      if (depositAmount) {
        depositAmount.focus();
      }

    }
  );

}


/* =====================================
   WITHDRAW BUTTON
===================================== */

if (withdrawBtn) {

  withdrawBtn.addEventListener(
    "click",
    () => {

      if (withdrawSection) {
        withdrawSection.classList.remove("hidden");
      }

      if (depositSection) {
        depositSection.classList.add("hidden");
      }

      if (withdrawMessage) {
        withdrawMessage.textContent = "";
      }

      if (withdrawAmount) {
        withdrawAmount.focus();
      }

    }
  );

}


/* =====================================
   DEMO DEPOSIT
===================================== */

if (submitDeposit) {

  submitDeposit.addEventListener(
    "click",
    () => {

      const amount =
        Number(
          depositAmount
            ? depositAmount.value
            : 0
        );


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
            "Demo limit: ₹100000";
        }

        return;
      }


      balance += amount;


      transactions.push({

        type: "deposit",

        amount: amount,

        status: "APPROVED - DEMO",

        date:
          new Date().toLocaleString("en-IN")

      });


      saveTransactions();

      updateBalance();

      showTransactions();


      if (depositAmount) {
        depositAmount.value = "";
      }


      if (depositMessage) {
        depositMessage.textContent =
          "✅ Demo balance successfully added.";
      }

    }
  );

}


/* =====================================
   DEMO WITHDRAWAL
===================================== */

if (submitWithdraw) {

  submitWithdraw.addEventListener(
    "click",
    () => {

      const amount =
        Number(
          withdrawAmount
            ? withdrawAmount.value
            : 0
        );


      const upi =
        demoUpi
          ? demoUpi.value.trim()
          : "";


      if (!amount || amount <= 0) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "कृपया सही withdrawal amount डालें।";
        }

        return;
      }


      if (!upi) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "कृपया Demo UPI ID डालें।";
        }

        return;
      }


      if (!upi.includes("@")) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "Demo UPI ID का format सही नहीं है।";
        }

        return;
      }


      if (amount > balance) {

        if (withdrawMessage) {
          withdrawMessage.textContent =
            "❌ Insufficient demo balance.";
        }

        return;
      }


      balance -= amount;


      transactions.push({

        type: "withdraw",

        amount: amount,

        upi: upi,

        status: "PENDING - DEMO",

        date:
          new Date().toLocaleString("en-IN")

      });


      saveTransactions();

      updateBalance();

      showTransactions();


      if (withdrawAmount) {
        withdrawAmount.value = "";
      }

      if (demoUpi) {
        demoUpi.value = "";
      }


      if (withdrawMessage) {
        withdrawMessage.textContent =
          "✅ Demo withdrawal request created.";
      }

    }
  );

}


/* =====================================
   LUDO GAME DATA
===================================== */

let currentPlayerName = "";

let roomCode = "";

let isHost = false;

let player1Name = "";

let player2Name = "";

let currentTurn = 1;

let player1Position = 0;

let player2Position = 0;

const WIN_POSITION = 20;


/* =====================================
   RANDOM ROOM CODE
===================================== */

function generateRoomCode() {

  const letters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ";

  let code = "";

  for (let i = 0; i < 6; i++) {

    code +=
      letters[
        Math.floor(
          Math.random() *
          letters.length
        )
      ];

  }

  return code;
}


/* =====================================
   START PLAYER
===================================== */

if (startBtn) {

  startBtn.addEventListener(
    "click",
    () => {

      const name =
        playerNameInput
          ? playerNameInput.value.trim()
          : "";


      if (!name) {

        if (message) {
          message.textContent =
            "कृपया अपना नाम डालें।";
        }

        return;
      }


      currentPlayerName = name;

      localStorage.setItem(
        "balajiPlayerName",
        currentPlayerName
      );


      if (welcomeCard) {
        welcomeCard.classList.add("hidden");
      }

      if (roomCard) {
        roomCard.classList.remove("hidden");
      }


      if (message) {
        message.textContent =
          "Welcome " +
          currentPlayerName +
          " 👋";
      }

    }
  );

}


/* =====================================
   CREATE ROOM
===================================== */

if (createRoomBtn) {

  createRoomBtn.addEventListener(
    "click",
    () => {

      if (!currentPlayerName) {

        const savedName =
          localStorage.getItem(
            "balajiPlayerName"
          );

        if (savedName) {
          currentPlayerName = savedName;
        }

      }


      if (!currentPlayerName) {

        if (message) {
          message.textContent =
            "पहले अपना नाम डालें।";
        }

        return;
      }


      roomCode =
        generateRoomCode();

      isHost = true;

      player1Name =
        currentPlayerName;

      player2Name = "";


      if (roomCodeInput) {
        roomCodeInput.value =
          roomCode;
      }


      updatePlayers();


      if (gameMessage) {
        gameMessage.textContent =
          "Room created. Player 2 के join करने का इंतजार है.";
      }


      showLudoCard();

    }
  );

}


/* =====================================
   JOIN ROOM
===================================== */

if (joinRoomBtn) {

  joinRoomBtn.addEventListener(
    "click",
    () => {

      const enteredCode =
        roomCodeInput
          ? roomCodeInput.value
              .trim()
              .toUpperCase()
          : "";


      if (!enteredCode) {

        if (message) {
          message.textContent =
            "कृपया Room Code डालें।";
        }

        return;
      }


      roomCode =
        enteredCode;

      isHost = false;

      player2Name =
        currentPlayerName || "Player 2";


      if (!player1Name) {
        player1Name =
          "Player 1";
      }


      updatePlayers();


      if (gameMessage) {
        gameMessage.textContent =
          "आप Room में join हो गए।";
      }


      showLudoCard();

    }
  );

}


/* =====================================
   SHOW LUDO CARD
===================================== */

function showLudoCard() {

  if (roomCard) {
    roomCard.classList.add("hidden");
  }

  if (ludoCard) {
    ludoCard.classList.remove("hidden");
  }

  updatePlayers();

  updateGameUI();

}


/* =====================================
   UPDATE PLAYERS
===================================== */

function updatePlayers() {

  if (player1Element) {

    player1Element.textContent =
      player1Name ||
      "Waiting...";

  }


  if (player2Element) {

    player2Element.textContent =
      player2Name ||
      "Waiting...";

  }

}


/* =====================================
   DICE ROLL
===================================== */

function rollDice() {

  return Math.floor(
    Math.random() * 6
  ) + 1;

}


/* =====================================
   DICE BUTTON
===================================== */

if (diceBtn) {

  diceBtn.addEventListener(
    "click",
    () => {

      if (!player1Name) {

        if (gameMessage) {
          gameMessage.textContent =
            "Player 1 का इंतजार है.";
        }

        return;
      }


      if (!player2Name) {

        if (gameMessage) {
          gameMessage.textContent =
            "Waiting for Player 2...";
        }

        return;
      }


      const dice =
        rollDice();


      if (diceElement) {

        diceElement.textContent =
          dice;

      }


      moveCurrentPlayer(dice);

    }
  );

}


/* =====================================
   MOVE PLAYER
===================================== */

function moveCurrentPlayer(dice) {

  if (currentTurn === 1) {

    player1Position += dice;

    if (
      player1Position >
      WIN_POSITION
    ) {

      player1Position =
        WIN_POSITION;

    }


    if (gameMessage) {

      gameMessage.textContent =
        player1Name +
        " ने " +
        dice +
        " चलाया।";

    }


    updatePiece(
      player1Piece,
      player1Position
    );


    if (
      player1Position >=
      WIN_POSITION
    ) {

      endGame(
        player1Name
      );

      return;
    }


    currentTurn = 2;

  } else {

    player2Position += dice;

    if (
      player2Position >
      WIN_POSITION
    ) {

      player2Position =
        WIN_POSITION;

    }


    if (gameMessage) {

      gameMessage.textContent =
        player2Name +
        " ने " +
        dice +
        " चलाया।";

    }


    updatePiece(
      player2Piece,
      player2Position
    );


    if (
      player2Position >=
      WIN_POSITION
    ) {

      endGame(
        player2Name
      );

      return;
    }


    currentTurn = 1;

  }


  updateGameUI();

}


/* =====================================
   UPDATE PIECE
===================================== */

function updatePiece(
  piece,
  position
) {

  if (!piece) return;


  /*
    Board को 20 steps का demo track
    माना गया है।

    अगर HTML में .piece मौजूद है,
    तो CSS position बदलकर basic
    movement दिखाई जाएगी।
  */

  const percentage =
    Math.min(
      position /
        WIN_POSITION *
        80,
      80
    );


  piece.style.left =
    percentage + "%";

}


/* =====================================
   GAME UI
===================================== */

function updateGameUI() {

  if (gameMessage) {

    if (
      currentTurn === 1
    ) {

      gameMessage.textContent =
        player1Name
          ? "🎲 " +
            player1Name +
            " की turn है।"
          : "Waiting...";

    } else {

      gameMessage.textContent =
        player2Name
          ? "🎲 " +
            player2Name +
            " की turn है।"
          : "Waiting...";

    }

  }


  if (player1Piece) {

    updatePiece(
      player1Piece,
      player1Position
    );

  }


  if (player2Piece) {

    updatePiece(
      player2Piece,
      player2Position
    );

  }

}


/* =====================================
   WIN / LOSE
===================================== */

function endGame(winner) {

  if (diceBtn) {
    diceBtn.disabled = true;
  }


  if (gameMessage) {

    gameMessage.textContent =
      "🏆 " +
      winner +
      " जीत गया! 🎉";

  }

}


/* =====================================
   RESET GAME
===================================== */

function resetGame() {

  player1Position = 0;

  player2Position = 0;

  currentTurn = 1;


  if (diceElement) {
    diceElement.textContent =
      "🎲";
  }


  if (diceBtn) {
    diceBtn.disabled = false;
  }


  updateGameUI();

}


if (resetGameBtn) {

  resetGameBtn.addEventListener(
    "click",
    resetGame
  );

}


/* =====================================
   LOAD SAVED PLAYER
===================================== */

const savedPlayerName =
  localStorage.getItem(
    "balajiPlayerName"
  );

if (
  savedPlayerName &&
  playerNameInput
) {

  playerNameInput.value =
    savedPlayerName;

}


/* =====================================
   INITIALIZE
===================================== */

updateBalance();

showTransactions();

updatePlayers();

updateGameUI();


/*
========================================
 IMPORTANT DEMO NOTICE

 यह Wallet केवल Demo/Test है।

 इसमें:
 - Real UPI payment नहीं
 - Real deposit नहीं
 - Real withdrawal नहीं
 - Bank transfer नहीं

 Balance और transactions केवल
 browser localStorage में save होते हैं।
========================================
*/
