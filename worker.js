const HTML_CONTENT = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Balaji Ludo King</title>

<style>
*{box-sizing:border-box}

body{
  margin:0;
  padding:15px;
  font-family:Arial,sans-serif;
  background:#0f172a;
  color:white;
}

.topbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:#1e293b;
  padding:14px;
  border-radius:12px;
  margin-bottom:15px;
}

.logo{
  font-size:19px;
  font-weight:bold;
  color:#fbbf24;
}

.wallet{
  color:#22c55e;
  font-weight:bold;
}

.card{
  background:#1e293b;
  border:1px solid #334155;
  border-radius:14px;
  padding:18px;
  margin-bottom:15px;
}

h2,h3{
  margin-top:0;
}

input,button{
  width:100%;
  padding:13px;
  margin-top:10px;
  border-radius:8px;
  border:none;
  font-size:16px;
}

input{
  background:white;
  color:#111827;
}

button{
  background:#22c55e;
  color:white;
  font-weight:bold;
}

.orange{background:#f59e0b}
.blue{background:#3b82f6}
.red{background:#ef4444}

.hidden{
  display:none!important;
}

.room-code{
  text-align:center;
  font-size:30px;
  font-weight:bold;
  letter-spacing:5px;
  color:#fbbf24;
  background:#0f172a;
  padding:15px;
  border-radius:10px;
  margin:15px 0;
}

.player{
  background:#334155;
  padding:13px;
  border-radius:8px;
  margin-top:10px;
}

.status{
  text-align:center;
  color:#fbbf24;
  font-weight:bold;
  margin:15px 0;
}

.message{
  text-align:center;
  color:#fbbf24;
  font-weight:bold;
  margin-top:12px;
}

.info{
  background:#334155;
  padding:12px;
  border-radius:8px;
  line-height:1.6;
}

.bottom-nav{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:4px;
  background:#1e293b;
  padding:8px;
  border-radius:12px;
  margin-top:20px;
}

.bottom-nav button{
  background:transparent;
  font-size:11px;
  padding:8px 2px;
  margin:0;
}
</style>
</head>

<body>

<div class="topbar">
  <div class="logo">👑 Balaji Ludo King</div>
  <div class="wallet">₹<span id="wallet">0</span></div>
</div>

<div class="card" id="loginCard">
  <h2>Welcome 👋</h2>
  <p>अपना नाम डालकर आगे बढ़ें</p>

  <input
    id="playerName"
    type="text"
    maxlength="20"
    placeholder="अपना नाम डालें"
  >

  <button onclick="login()">Continue</button>

  <div class="message" id="loginMessage"></div>
</div>

<div id="mainApp" class="hidden">

  <div class="card">
    <h2>🎮 2 Player Battle</h2>

    <div class="info">
      यहाँ केवल Room और Battle Management होगा।<br>
      Actual Ludo gameplay Ludo King app में होगा।
    </div>

    <button class="orange" onclick="showCreate()">
      🏠 Create Room
    </button>

    <button class="blue" onclick="showJoin()">
      🔗 Join Room
    </button>
  </div>

  <div class="card hidden" id="createCard">
    <h3>🏠 Create Room</h3>

    <p>अपना 8-Digit Room Code डालें।</p>

    <input
      id="createCode"
      type="text"
      maxlength="8"
      inputmode="numeric"
      placeholder="8-Digit Room Code"
    >

    <button onclick="createRoom()">Create Room</button>

    <div class="message" id="createMessage"></div>
  </div>

  <div class="card hidden" id="joinCard">
    <h3>🔗 Join Room</h3>

    <p>Player 1 से मिला हुआ 8-Digit Room Code डालें।</p>

    <input
      id="joinCode"
      type="text"
      maxlength="8"
      inputmode="numeric"
      placeholder="Enter 8-Digit Room Code"
    >

    <button onclick="joinRoom()">Join Room</button>

    <div class="message" id="joinMessage"></div>
  </div>

  <div class="card hidden" id="roomCard">

    <h3>⏳ Waiting Room</h3>

    <p style="text-align:center">Room Code</p>

    <div class="room-code" id="roomCode">
      --------
    </div>

    <button class="blue" onclick="copyCode()">
      📋 Copy Room Code
    </button>

    <div class="player">
      🟢 Player 1:
      <strong id="player1">Waiting
