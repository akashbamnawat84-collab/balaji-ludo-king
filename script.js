// ========================================
// Balaji Ludo King - 2 Player Client
// ========================================

const welcomeCard = document.getElementById("welcomeCard");
const roomCard = document.getElementById("roomCard");
const ludoCard = document.getElementById("ludoCard");

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomInput = document.getElementById("joinRoomInput");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInfo = document.getElementById("roomInfo");

const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");
const turnText = document.getElementById("turnText");

const dice = document.getElementById("dice");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const diceResult = document.getElementById("diceResult");

let currentPlayer = "";
let currentRoom = "";
let playerId = "";
let socket = null;
let myTurn = false;

// Initial screen
roomCard.classList.add("hidden");
ludoCard.classList.add("hidden");
rollDiceBtn.disabled = true;

// Continue
startBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();

    if (!name) {
        message.textContent = "Please enter your name.";
        return;
    }

    if (name.length < 2) {
        message.textContent = "Name must be at least 2 characters.";
        return;
    }

    currentPlayer = name.substring(0, 20);

    localStorage.setItem(
        "balajiPlayerName",
        currentPlayer
    );

    welcomeCard.classList.add("hidden");
    roomCard.classList.remove("hidden");

    message.textContent = "";
});

// Create room
createRoomBtn.addEventListener("click", () => {
    if (!currentPlayer) {
        alert("Please enter your name first.");
        return;
    }

    currentRoom = generateRoomCode();

    roomInfo.innerHTML = `
        <p>Room Created</p>
        <div class="room-code">${currentRoom}</div>
        <p>Share this code with Player 2.</p>
        <p>Connecting...</p>
    `;

    connectToRoom(currentRoom);
});

// Join room
joinRoomBtn.addEventListener("click", () => {
    if (!currentPlayer) {
        alert("Please enter your name first.");
        return;
    }

    const code = joinRoomInput.value.trim();

    if (!/^\d{6}$/.test(code)) {
        roomInfo.innerHTML = `
            <p>Enter a valid 6-digit room code.</p>
        `;
        return;
    }

    currentRoom = code;

    roomInfo.innerHTML = `
        <p>Joining Room</p>
        <div class="room-code">${currentRoom}</div>
        <p>Connecting...</p>
    `;

    connectToRoom(currentRoom);
});

// WebSocket connection
function connectToRoom(room) {

    if (socket) {
        socket.close();
    }

    const protocol =
        window.location.protocol === "https:"
            ? "wss:"
            : "ws:";

    const wsUrl =
        `${protocol}//${window.location.host}/ws` +
        `?room=${encodeURIComponent(room)}` +
        `&name=${encodeURIComponent(currentPlayer)}`;

    socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {

        roomInfo.innerHTML = `
            <p>Connected to Room</p>
            <div class="room-code">${room}</div>
            <p>Waiting for another player...</p>
        `;

        ludoCard.classList.remove("hidden");

        turnText.textContent =
            "Waiting for players...";
    });

    socket.addEventListener("message", (event) => {

        try {
            const data = JSON.parse(event.data);

            handleServerMessage(data);

        } catch (error) {
            console.log("Invalid server message");
        }
    });

    socket.addEventListener("close", () => {

        rollDiceBtn.disabled = true;
        myTurn = false;

        turnText.textContent =
            "Disconnected from room.";
    });

    socket.addEventListener("error", () => {

        roomInfo.innerHTML = `
            <p>Unable to connect to room.</p>
            <p>Check Worker deployment.</p>
        `;
    });
}

// Server messages
function handleServerMessage(data) {

    if (data.type === "CONNECTED") {

        playerId = data.playerId;

        updatePlayers(data.players);

        roomInfo.innerHTML = `
            <p>Room Connected</p>
            <div class="room-code">${currentRoom}</div>
            <p>Players: ${data.players.length}/2</p>
        `;

        return;
    }

    if (data.type === "PLAYERS_UPDATE") {

        updatePlayers(data.players);

        if (data.players.length < 2) {

            turnText.textContent =
                "Waiting for Player 2...";

            rollDiceBtn.disabled = true;
            myTurn = false;

            return;
        }

        if (data.turnPlayerId) {
            setTurn(data.turnPlayerId);
        }

        return;
    }

    if (data.type === "DICE_RESULT") {

        const number = Number(data.dice);

        dice.textContent =
            getDiceEmoji(number);

        diceResult.textContent =
            `${data.playerName} rolled: ${number}`;

        return;
    }

    if (data.type === "TURN_UPDATE") {

        setTurn(data.playerId);

        return;
    }

    if (data.type === "NOT_YOUR_TURN") {

        turnText.textContent =
            "It's not your turn.";

        return;
    }

    if (data.type === "ROOM_FULL") {

        roomInfo.innerHTML = `
            <p>Room Full</p>
            <p>This room already has 2 players.</p>
        `;

        rollDiceBtn.disabled = true;

        return;
    }
}

// Update players
function updatePlayers(players) {

    player1Name.textContent =
        players[0]
            ? players[0].name
            : "Waiting...";

    player2Name.textContent =
        players[1]
            ? players[1].name
            : "Waiting...";
}

// Turn system
function setTurn(turnPlayerId) {

    myTurn =
        turnPlayerId === playerId;

    if (myTurn) {

        turnText.textContent =
            "Your Turn";

        rollDiceBtn.disabled = false;

    } else {

        turnText.textContent =
            "Opponent's Turn";

        rollDiceBtn.disabled = true;
    }
}

// Roll dice
rollDiceBtn.addEventListener("click", () => {

    if (!socket ||
        socket.readyState !== WebSocket.OPEN) {

        diceResult.textContent =
            "Not connected to room.";

        return;
    }

    if (!myTurn) {

        turnText.textContent =
            "It's not your turn.";

        return;
    }

    socket.send(
        JSON.stringify({
            type: "ROLL_DICE"
        })
    );
});

// Generate 6 digit room code
function generateRoomCode() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();
}

// Dice emoji
function getDiceEmoji(number) {

    const faces = {
        1: "⚀",
        2: "⚁",
        3: "⚂",
        4: "⚃",
        5: "⚄",
        6: "⚅"
    };

    return faces[number] || "🎲";
}

// Load saved name
window.addEventListener("load", () => {

    const savedName =
        localStorage.getItem(
            "balajiPlayerName"
        );

    if (savedName) {
        playerNameInput.value = savedName;
    }
});
