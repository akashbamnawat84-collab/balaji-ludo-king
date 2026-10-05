document.addEventListener("DOMContentLoaded", () => {
  const walletEl = document.getElementById("walletBalance");
  if(walletEl) walletEl.innerText = localStorage.getItem("balaji_wallet") || "0";
  
  loadBattles("all");

  setInterval(()=>{
    const el = document.getElementById("liveCount");
    if(el){ el.innerText = `LIVE • ${Math.floor(Math.random()*200+200)} Playing`; }
  },3000);
});

const allBattles = [
  {id:1, amount:10, win:18, user:"Raju***", time:"2s ago"},
  {id:2, amount:50, win:90, user:"Amit***", time:"5s ago"},
  {id:3, amount:100, win:180, user:"Balaji***", time:"10s ago"},
  {id:4, amount:25, win:45, user:"King***", time:"15s ago"},
  {id:5, amount:500, win:900, user:"Ludo***", time:"20s ago"},
  {id:6, amount:10, win:18, user:"Pro***", time:"25s ago"},
];

function loadBattles(filter){
  const list = document.getElementById("battleList");
  if(!list) return;
  list.innerHTML = "";
  let filtered = filter=="all" ? allBattles : allBattles.filter(b=>b.amount==filter);
  if(filtered.length==0){
    list.innerHTML = `<p style="text-align:center; color:#8a93b2; margin:20px;">No battles for ₹${filter}</p>`;
    return;
  }
  filtered.forEach(b=>{
    list.innerHTML += `
      <div class="game-card">
        <div class="left">
          <h3>₹${b.amount} Battle</h3>
          <p>${b.user} • Win ₹${b.win} • ${b.time}</p>
        </div>
        <button class="right" onclick="joinBattle(${b.amount}, ${b.id})">PLAY</button>
      </div>`;
  });
}

function filterBattle(amt){
  document.querySelectorAll(".battle-tabs .tab").forEach(t=>t.classList.remove("active"));
  event.target.classList.add("active");
  loadBattles(amt);
}

function joinBattle(amount, id){
  let bal = parseInt(localStorage.getItem("balaji_wallet")||0);
  if(bal < amount){
    alert(`Balance kam hai! Aapka balance ₹${bal}\nPehle wallet me add karo`);
    window.location.href="wallet.html";
    return;
  }
  if(confirm(`₹${amount} Battle Join karna hai?\nWin: ₹${Math.floor(amount*1.8)}`)){
    localStorage.setItem("current_battle", JSON.stringify({amount:amount, id:id}));
    window.location.href=`room.html?amount=${amount}&id=${id}`;
  }
}

function createBattle(amount){
  let bal = parseInt(localStorage.getItem("balaji_wallet")||0);
  if(bal < amount){
    alert(`Balance kam hai! Balance: ₹${bal}`);
    window.location.href="wallet.html";
    return;
  }
  if(confirm(`₹${amount} ka naya battle banana hai?`)){
    localStorage.setItem("current_battle", JSON.stringify({amount:amount, id:Date.now()}));
    window.location.href=`room.html?amount=${amount}&create=true`;
  }
}
