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
  color:#fff;
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
  background:#fff;
  color:#111827;
}

button{
  background:#22c55e;
  color:#fff;
  font-weight:bold;
  cursor:pointer;
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
      <strong id="player1">Waiting...</strong>
    </div>

    <div class="player">
      🔵 Player 2:
      <strong id="player2">Waiting...</strong>
    </div>

    <div class="status" id="roomStatus">
      Waiting for Player 2...
    </div>

    <button class="red" onclick="cancelRoom()">
      ❌ Cancel Room
    </button>

  </div>

  <div class="card hidden" id="resultCard">

    <h3>🏆 Battle Result</h3>

    <p>
      Ludo King app में game खेलने के बाद
      यहाँ screenshot upload करें।
    </p>

    <input
      id="screenshot"
      type="file"
      accept="image/*"
    >

    <button onclick="submitResult()">
      📸 Submit Screenshot
    </button>

    <div class="message" id="resultMessage"></div>

  </div>

</div>

<div class="bottom-nav">

  <button onclick="home()">🏠<br>Home</button>
  <button onclick="wallet()">💰<br>Wallet</button>
  <button onclick="refer()">🎁<br>Refer</button>
  <button onclick="support()">💬<br>Support</button>
  <button onclick="profile()">👤<br>Profile</button>

</div>

<script>

let USER = null;
let CURRENT_ROOM = null;
let pollTimer = null;

function showMessage(id,text){
  document.getElementById(id).innerText = text;
}

async function login(){

  const name = document
    .getElementById("playerName")
    .value
    .trim();

  if(!name){
    showMessage(
      "loginMessage",
      "कृपया अपना नाम डालें।"
    );
    return;
  }

  try{

    const res = await fetch("/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({name})
    });

    const data = await res.json();

    if(!res.ok){
      showMessage(
        "loginMessage",
        data.error || "Login failed"
      );
      return;
    }

    USER = data;

    document.getElementById("wallet").innerText =
      data.wallet_balance || 0;

    document.getElementById("loginCard")
      .classList.add("hidden");

    document.getElementById("mainApp")
      .classList.remove("hidden");

  }catch(error){

    showMessage(
      "loginMessage",
      "Server connection error"
    );

  }
}

function showCreate(){

  document.getElementById("createCard")
    .classList.remove("hidden");

  document.getElementById("joinCard")
    .classList.add("hidden");

}

function showJoin(){

  document.getElementById("joinCard")
    .classList.remove("hidden");

  document.getElementById("createCard")
    .classList.add("hidden");

}

async function createRoom(){

  if(!USER){
    showMessage(
      "createMessage",
      "पहले login करें।"
    );
    return;
  }

  const code = document
    .getElementById("createCode")
    .value
    .trim();

  if(!/^\\d{8}$/.test(code)){

    showMessage(
      "createMessage",
      "Room Code exactly 8 digits का होना चाहिए।"
    );

    return;
  }

  try{

    const res = await fetch("/api/rooms/create",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        playerId:USER.id,
        playerName:USER.name,
        roomCode:code
      })
    });

    const data = await res.json();

    if(!res.ok){

      showMessage(
        "createMessage",
        data.error || "Room create नहीं हुआ।"
      );

      return;
    }

    CURRENT_ROOM = code;
    openRoom();

  }catch(error){

    showMessage(
      "createMessage",
      "Server connection error"
    );

  }
}

async function joinRoom(){

  if(!USER){
    showMessage(
      "joinMessage",
      "पहले login करें।"
    );
    return;
  }

  const code = document
    .getElementById("joinCode")
    .value
    .trim();

  if(!/^\\d{8}$/.test(code)){

    showMessage(
      "joinMessage",
      "Room Code exactly 8 digits का होना चाहिए।"
    );

    return;
  }

  try{

    const res = await fetch("/api/rooms/join",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        playerId:USER.id,
        playerName:USER.name,
        roomCode:code
      })
    });

    const data = await res.json();

    if(!res.ok){

      showMessage(
        "joinMessage",
        data.error || "Room join नहीं हुआ।"
      );

      return;
    }

    CURRENT_ROOM = code;
    openRoom();

  }catch(error){

    showMessage(
      "joinMessage",
      "Server connection error"
    );

  }
}

function openRoom(){

  document.getElementById("createCard")
    .classList.add("hidden");

  document.getElementById("joinCard")
    .classList.add("hidden");

  document.getElementById("roomCard")
    .classList.remove("hidden");

  document.getElementById("roomCode")
    .innerText = CURRENT_ROOM;

  updateRoom();

  if(pollTimer){
    clearInterval(pollTimer);
  }

  pollTimer = setInterval(updateRoom,3000);
}

async function updateRoom(){

  if(!CURRENT_ROOM)return;

  try{

    const res = await fetch(
      "/api/rooms/" + CURRENT_ROOM
    );

    const room = await res.json();

    if(!res.ok)return;

    document.getElementById("player1")
      .innerText = room.player1_name || "Waiting...";

    document.getElementById("player2")
      .innerText = room.player2_name || "Waiting...";

    if(room.player2_id){

      document.getElementById("roomStatus")
        .innerText =
        "✅ Player 2 Joined! अब Ludo King app में खेलें।";

      document.getElementById("resultCard")
        .classList.remove("hidden");

    }else{

      document.getElementById("roomStatus")
        .innerText =
        "Waiting for Player 2...";

    }

  }catch(error){

    console.log(error);

  }
}

async function copyCode(){

  if(!CURRENT_ROOM)return;

  try{

    await navigator.clipboard.writeText(
      CURRENT_ROOM
    );

    alert(
      "Room Code copied: " + CURRENT_ROOM
    );

  }catch(error){

    alert(
      "Room Code: " + CURRENT_ROOM
    );

  }
}

async function cancelRoom(){

  if(!CURRENT_ROOM || !USER)return;

  try{

    await fetch("/api/rooms/cancel",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        playerId:USER.id,
        roomCode:CURRENT_ROOM
      })
    });

  }catch(error){

    console.log(error);

  }

  CURRENT_ROOM = null;

  if(pollTimer){
    clearInterval(pollTimer);
    pollTimer = null;
  }

  document.getElementById("roomCard")
    .classList.add("hidden");

  document.getElementById("resultCard")
    .classList.add("hidden");
}

async function submitResult(){

  if(!CURRENT_ROOM || !USER)return;

  const file = document
    .getElementById("screenshot")
    .files[0];

  if(!file){

    showMessage(
      "resultMessage",
      "पहले Screenshot चुनें।"
    );

    return;
  }

  if(file.size > 5 * 1024 * 1024){

    showMessage(
      "resultMessage",
      "Screenshot 5MB से छोटा होना चाहिए।"
    );

    return;
  }

  const reader = new FileReader();

  reader.onload = async function(){

    try{

      const res = await fetch(
        "/api/rooms/result",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            playerId:USER.id,
            roomCode:CURRENT_ROOM,
            screenshot:reader.result
          })
        }
      );

      const data = await res.json();

      if(!res.ok){

        showMessage(
          "resultMessage",
          data.error || "Result submit नहीं हुआ।"
        );

        return;
      }

      showMessage(
        "resultMessage",
        "✅ Screenshot successfully submit हो गया।"
      );

    }catch(error){

      showMessage(
        "resultMessage",
        "Server connection error"
      );

    }
  };

  reader.readAsDataURL(file);
}

function home(){

  document.getElementById("createCard")
    .classList.add("hidden");

  document.getElementById("joinCard")
    .classList.add("hidden");

}

function wallet(){
  alert("Wallet section अभी तैयार किया जा रहा है।");
}

function refer(){
  alert("Refer section अभी तैयार किया जा रहा है।");
}

function support(){
  alert("Support section अभी तैयार किया जा रहा है।");
}

function profile(){
  alert("Profile section अभी तैयार किया जा रहा है।");
}

</script>

</body>
</html>`;

const corsHeaders = {
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type, Authorization"
};

function json(data,status=200){

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:{
        ...corsHeaders,
        "Content-Type":"application/json"
      }
    }
  );
}

export default {

  async fetch(request,env){

    if(request.method === "OPTIONS"){
      return new Response(null,{
        headers:corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try{

      if(path === "/" || path === "/index.html"){

        return new Response(
          HTML_CONTENT,
          {
            headers:{
              "Content-Type":
                "text/html; charset=utf-8"
            }
          }
        );
      }

      if(
        path === "/api/login" &&
        request.method === "POST"
      ){

        const body = await request.json();

        const name = String(
          body.name || ""
        ).trim();

        if(!name){
          return json(
            {error:"Name required"},
            400
          );
        }

        const id =
          "USR" +
          crypto.randomUUID()
            .replace(/-/g,"")
            .slice(0,10)
            .toUpperCase();

        return json({
          id,
          name,
          wallet_balance:0
        });
      }

      if(
        path === "/api/rooms/create" &&
        request.method === "POST"
      ){

        const body = await request.json();

        const playerId =
          String(body.playerId || "");

        const playerName =
          String(body.playerName || "");

        const roomCode =
          String(body.roomCode || "");

        if(
          !playerId ||
          !playerName ||
          !/^\\d{8}$/.test(roomCode)
        ){

          return json(
            {
              error:
                "Valid player and 8-digit room code required"
            },
            400
          );
        }

        const existing =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
          .bind(roomCode)
          .first();

        if(existing){

          return json(
            {
              error:
                "यह Room Code पहले से मौजूद है। दूसरा code डालें।"
            },
            409
          );
        }

        await env.DB.prepare(
          `INSERT INTO rooms
          (
            room_code,
            player1_id,
            player1_name,
            status,
            created_at
          )
          VALUES (?, ?, ?, 'WAITING', ?)`
        )
        .bind(
          roomCode,
          playerId,
          playerName,
          Date.now()
        )
        .run();

        return json({
          success:true,
          roomCode
        });
      }

      if(
        path === "/api/rooms/join" &&
        request.method === "POST"
      ){

        const body = await request.json();

        const playerId =
          String(body.playerId || "");

        const playerName =
          String(body.playerName || "");

        const roomCode =
          String(body.roomCode || "");

        if(
          !playerId ||
          !playerName ||
          !/^\\d{8}$/.test(roomCode)
        ){

          return json(
            {
              error:
                "Valid player and 8-digit room code required"
            },
            400
          );
        }

        const room =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code = ?"
          )
          .bind(roomCode)
          .first();

        if(!room){

          return json(
            {
              error:"Room Code नहीं मिला।"
            },
            404
          );
        }

        if(room.player1_id === playerId){

          return json({
            success:true,
            roomCode
          });
        }

        if(room.player2_id){

          return json(
            {
              error:
                "यह Room पहले से full है।"
            },
            409
          );
        }

        await env.DB.prepare(
          `UPDATE rooms
           SET player2_id=?,
               player2_name=?,
               status='READY'
           WHERE room_code=?`
        )
        .bind(
          playerId,
          playerName,
          roomCode
        )
        .run();

        return json({
          success:true,
          roomCode
        });
      }

      if(
        path.startsWith("/api/rooms/") &&
        request.method === "GET"
      ){

        const roomCode =
          decodeURIComponent(
            path.replace("/api/rooms/","")
          );

        if(!/^\\d{8}$/.test(roomCode)){

          return json(
            {error:"Invalid room code"},
            400
          );
        }

        const room =
          await env.DB.prepare(
            `SELECT
              room_code,
              player1_id,
              player1_name,
              player2_id,
              player2_name,
              status,
              result_screenshot,
              result_player_id,
              created_at
             FROM rooms
             WHERE room_code=?`
          )
          .bind(roomCode)
          .first();

        if(!room){

          return json(
            {error:"Room not found"},
            404
          );
        }

        return json(room);
      }

      if(
        path === "/api/rooms/cancel" &&
        request.method === "POST"
      ){

        const body = await request.json();

        const playerId =
          String(body.playerId || "");

        const roomCode =
          String(body.roomCode || "");

        const room =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code=?"
          )
          .bind(roomCode)
          .first();

        if(!room){

          return json(
            {error:"Room not found"},
            404
          );
        }

        if(
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ){

          return json(
            {error:"Not your room"},
            403
          );
        }

        await env.DB.prepare(
          "DELETE FROM rooms WHERE room_code=?"
        )
        .bind(roomCode)
        .run();

        return json({
          success:true
        });
      }

      if(
        path === "/api/rooms/result" &&
        request.method === "POST"
      ){

        const body = await request.json();

        const playerId =
          String(body.playerId || "");

        const roomCode =
          String(body.roomCode || "");

        const screenshot =
          String(body.screenshot || "");

        if(
          !playerId ||
          !roomCode ||
          !screenshot
        ){

          return json(
            {
              error:
                "Player, room and screenshot required"
            },
            400
          );
        }

        if(
          screenshot.length >
          7 * 1024 * 1024
        ){

          return json(
            {
              error:
                "Screenshot बहुत बड़ा है।"
            },
            400
          );
        }

        const room =
          await env.DB.prepare(
            "SELECT * FROM rooms WHERE room_code=?"
          )
          .bind(roomCode)
          .first();

        if(!room){

          return json(
            {error:"Room not found"},
            404
          );
        }

        if(
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ){

          return json(
            {
              error:
                "Player is not part of this room"
            },
            403
          );
        }

        await env.DB.prepare(
          `UPDATE rooms
           SET result_screenshot=?,
               result_player_id=?,
               status='RESULT_SUBMITTED'
           WHERE room_code=?`
        )
        .bind(
          screenshot,
          playerId,
          roomCode
        )
        .run();

        return
