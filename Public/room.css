document.addEventListener("DOMContentLoaded", ()=>{
  const url = new URLSearchParams(window.location.search);
  const amount = url.get("amount") || "50";
  document.getElementById("roomAmount").innerText = `₹${amount} BATTLE`;
  document.getElementById("roomCode").innerText = "BALAJI-" + Math.floor(Math.random()*9000+1000);
  
  let time = 300; // 5 min
  setInterval(()=>{
    time--;
    let m = Math.floor(time/60), s = time%60;
    document.getElementById("timer").innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    if(time<=0){ alert("Room Expired!"); window.location.href="battle.html"; }
  },1000);

  setTimeout(()=>{
    document.getElementById("p2").innerText = "Opponent***";
    document.querySelector(".player.wait small").innerText = "Joined";
    document.querySelector(".player.wait small").style.color = "#00ff88";
  },3000);
});

function copyCode(){
  const code = document.getElementById("roomCode").innerText;
  navigator.clipboard.writeText(code);
  alert("Copied: "+code);
}

function submitResult(type){
  if(confirm(type=="win" ? "Aap jeete ho? Screenshot hai?" : "Aap haare ho? Confirm karo")){
    if(type=="win"){
      alert("Admin result check karega, 2 min me paisa wallet me aa jayega!");
      let amt = new URLSearchParams(window.location.search).get("amount")||50;
      let win = Math.floor(amt*1.8);
      let bal = parseInt(localStorage.getItem("balaji_wallet")||0);
      localStorage.setItem("balaji_wallet", bal+win);
    }else{
      alert("Better luck next time!");
    }
    window.location.href="battle.html";
  }
}
