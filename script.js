const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const gameCard = document.getElementById("gameCard");
const displayName = document.getElementById("displayName");
const coinsElement = document.getElementById("coins");

const addCoinsBtn = document.getElementById("addCoinsBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const roomInfo = document.getElementById("roomInfo");

let coins = 100;

gameCard.style.display = "none";

startBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();

  if (!name) {
    message.textContent = "Please enter your name.";
    return;
  }

  displayName.textContent = name;
  message.textContent = "Welcome, " + name + "!";

  gameCard.style.display = "block";
});

addCoinsBtn.addEventListener("click", () => {
  coins += 20;
  coinsElement.textContent = coins;
});

createRoomBtn.addEventListener("click", () => {
  if (coins < 10) {
    roomInfo.innerHTML = "<p>Not enough coins to create a room.</p>";
    return;
  }

  coins -= 10;
  coinsElement.textContent = coins;

  const roomCode = Math.floor(100000 + Math.random() * 900000);

  roomInfo.innerHTML = `
    <p><strong>Room Created!</strong></p>
    <p>Room Code: <strong>${roomCode}</strong></p>
    <p>Entry: 10 coins</p>
  `;
});
