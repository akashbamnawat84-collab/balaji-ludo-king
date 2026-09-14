// =========================================
// PROFILE DATA
// =========================================

function loadProfile() {

  const name =
    localStorage.getItem("player_name") ||
    localStorage.getItem("playerName") ||
    "Player";

  const playerId =
    localStorage.getItem("player_id") ||
    localStorage.getItem("playerId") ||
    "PLAYER";

  const wallet =
    localStorage.getItem("wallet_balance") ||
    "0";

  const bonus =
    localStorage.getItem("bonus_balance") ||
    "0";

  const battles =
    localStorage.getItem("battle_played") ||
    "0";

  const coins =
    localStorage.getItem("coin_won") ||
    "0";

  const referral =
    localStorage.getItem("referral_earned") ||
    "0";

  const withdrawal =
    localStorage.getItem("withdrawal_amount") ||
    "0";

  const phone =
    localStorage.getItem("phone_number") ||
    "Not Added";

  const email =
    localStorage.getItem("email") ||
    "Not Added";


  const profileName =
    document.getElementById("profileName");

  const profileId =
    document.getElementById("profileId");

  const customerId =
    document.getElementById("customerId");

  const profileWallet =
    document.getElementById("profileWallet");

  const profileBonus =
    document.getElementById("profileBonus");

  const battlePlayed =
    document.getElementById("battlePlayed");

  const coinWon =
    document.getElementById("coinWon");

  const referralEarned =
    document.getElementById("referralEarned");

  const withdrawalAmount =
    document.getElementById("withdrawalAmount");

  const profilePhone =
    document.getElementById("profilePhone");

  const profileEmail =
    document.getElementById("profileEmail");


  if (profileName)
    profileName.textContent = name;

  if (profileId)
    profileId.textContent =
      "Player ID: " + playerId;

  if (customerId)
    customerId.textContent = playerId;

  if (profileWallet)
    profileWallet.textContent =
      "₹" + Number(wallet).toFixed(2);

  if (profileBonus)
    profileBonus.textContent =
      "₹" + Number(bonus).toFixed(2);

  if (battlePlayed)
    battlePlayed.textContent = battles;

  if (coinWon)
    coinWon.textContent =
      "₹" + Number(coins).toFixed(0);

  if (referralEarned)
    referralEarned.textContent =
      "₹" + Number(referral).toFixed(0);

  if (withdrawalAmount)
    withdrawalAmount.textContent =
      "₹" + Number(withdrawal).toFixed(0);

  if (profilePhone)
    profilePhone.textContent = phone;

  if (profileEmail)
    profileEmail.textContent = email;
}


// =========================================
// PROFILE ACTIONS
// =========================================

function editProfile() {

  const oldName =
    localStorage.getItem("player_name") ||
    "Player";

  const newName =
    prompt(
      "अपना नाम डालें:",
      oldName
    );

  if (
    newName &&
    newName.trim()
  ) {

    localStorage.setItem(
      "player_name",
      newName.trim()
    );

    loadProfile();
  }
}


function editEmail() {

  const oldEmail =
    localStorage.getItem("email") ||
    "";

  const newEmail =
    prompt(
      "अपना Email डालें:",
      oldEmail
    );

  if (
    newEmail &&
    newEmail.trim()
  ) {

    localStorage.setItem(
      "email",
      newEmail.trim()
    );

    loadProfile();
  }
}


function goHome() {

  const profileSection =
    document.getElementById(
      "profileSection"
    );

  if (profileSection) {
    profileSection.style.display =
      "none";
  }

  const homeSection =
    document.getElementById(
      "homeSection"
    );

  if (homeSection) {
    homeSection.style.display =
      "block";
  }
}


function openWallet() {

  alert(
    "Wallet section जल्द उपलब्ध होगा।"
  );
}


function openRefer() {

  alert(
    "Refer & Earn section जल्द उपलब्ध होगा।"
  );
}


function openSupport() {

  alert(
    "Support section जल्द उपलब्ध होगा।"
  );
}


// =========================================
// LOAD PROFILE
// =========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadProfile();
  }
);
