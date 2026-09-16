/* ======================================
BALAJI LUDO KING - PROFILE
====================================== */

/* ======================================
ELEMENTS
====================================== */

const profileName =
document.getElementById("profileName");

const profileMobile =
document.getElementById("profileMobile");

const nameValue =
document.getElementById("nameValue");

const mobileValue =
document.getElementById("mobileValue");

const playerIdElement =
document.getElementById("playerId");

const walletBtn =
document.getElementById("walletBtn");

const referBtn =
document.getElementById("referBtn");

const supportBtn =
document.getElementById("supportBtn");

const kycBtn =
document.getElementById("kycBtn");

const logoutBtn =
document.getElementById("logoutBtn");

/* ======================================
LOAD PROFILE
====================================== */

function loadProfile() {

const savedName =
localStorage.getItem("balajiPlayerName");

const savedMobile =
localStorage.getItem("balajiMobile");

let playerId =
localStorage.getItem("balajiPlayerId");

const name =
savedName || "Player";

const mobile =
savedMobile || "Not available";

/* Generate Player ID once */

if (!playerId) {

playerId =
  "BLK-" +
  Math.floor(
    100000 + Math.random() * 900000
  );

localStorage.setItem(
  "balajiPlayerId",
  playerId
);

}

if (profileName) {

profileName.textContent =
  name;

}

if (nameValue) {

nameValue.textContent =
  name;

}

if (profileMobile) {

profileMobile.textContent =
  mobile;

}

if (mobileValue) {

mobileValue.textContent =
  mobile;

}

if (playerIdElement) {

playerIdElement.textContent =
  playerId;

}

}

/* ======================================
FIND CUSTOMER
====================================== */

function getCustomer() {

const keys = [

"customer",
"customerData",
"currentCustomer",
"user",
"userData",
"balaji_customer",
"balaji_customer_data",
"balaji_user"

];

for (const key of keys) {

try {

  const value =
    localStorage.getItem(key);

  if (!value) continue;


  const parsed =
    JSON.parse(value);


  if (
    parsed &&
    typeof parsed === "object"
  ) {

    if (
      parsed.customer &&
      typeof parsed.customer === "object"
    ) {

      return parsed.customer;

    }


    if (
      parsed.user &&
      typeof parsed.user === "object"
    ) {

      return parsed.user;

    }


    if (
      parsed.data &&
      typeof parsed.data === "object"
    ) {

      return parsed.data;

    }


    return parsed;

  }

} catch {

  continue;

}

}

return null;

}

/* ======================================
GET CUSTOMER ID
====================================== */

function getCustomerId(customer) {

if (customer) {

return (

  customer.customer_id ||
  customer.customerId ||
  customer.id ||
  customer.player_id ||
  customer.playerId ||
  ""

);

}

const possibleKeys = [

"customer_id",
"customerId",
"playerId",
"player_id"

];

for (const key of possibleKeys) {

const value =
  localStorage.getItem(key);

if (value) {

  try {

    const parsed =
      JSON.parse(value);

    if (
      parsed &&
      typeof parsed === "object"
    ) {

      return (

        parsed.customer_id ||
        parsed.customerId ||
        parsed.id ||
        parsed.player_id ||
        parsed.playerId ||
        ""

      );

    }

  } catch {

    return value;

  }

}

}

return "";

}

/* ======================================
NORMALIZE KYC STATUS
====================================== */

function normalizeKYCStatus(status) {

if (!status) {

return "";

}

return String(status)
.trim()
.toUpperCase();

}

/* ======================================
UPDATE KYC UI
====================================== */

function updateKYCUI(status) {

if (!kycBtn) return;

const kycContent =
kycBtn.querySelector(".kyc-content");

const kycIcon =
kycBtn.querySelector(".kyc-icon");

const normalized =
normalizeKYCStatus(status);

/* ====================================
APPROVED
==================================== */

if (
normalized === "APPROVED" ||
normalized === "VERIFIED"
) {

if (kycIcon) {

  kycIcon.textContent =
    "✓";

}


if (kycContent) {

  const strong =
    kycContent.querySelector("strong");

  if (strong) {

    strong.textContent =
      "KYC VERIFIED";

  }

}


kycBtn.classList.add("kyc-approved");

return;

}

/* ====================================
PENDING
==================================== */

if (normalized === "PENDING") {

if (kycIcon) {

  kycIcon.textContent =
    "⏳";

}


if (kycContent) {

  const strong =
    kycContent.querySelector("strong");

  if (strong) {

    strong.textContent =
      "KYC VERIFICATION PENDING";

  }

}


kycBtn.classList.remove(
  "kyc-approved"
);

return;

}

/* ====================================
REJECTED
==================================== */

if (normalized === "REJECTED") {

if (kycIcon) {

  kycIcon.textContent =
    "✕";

}


if (kycContent) {

  const strong =
    kycContent.querySelector("strong");

  if (strong) {

    strong.textContent =
      "KYC REJECTED";

  }

}


kycBtn.classList.remove(
  "kyc-approved"
);

return;

}

/* ====================================
NOT SUBMITTED
==================================== */

if (kycIcon) {

kycIcon.textContent =
  "✓";

}

if (kycContent) {

const strong =
  kycContent.querySelector("strong");

if (strong) {

  strong.textContent =
    "Complete KYC Verification";

}

}

kycBtn.classList.remove(
"kyc-approved"
);

}

/* ======================================
LOAD KYC FROM LOCAL STORAGE
====================================== */

function loadLocalKYCStatus() {

try {

const saved =
  localStorage.getItem(
    "balaji_kyc_submission"
  );


if (!saved) return "";


const data =
  JSON.parse(saved);


if (
  data &&
  data.status
) {

  return data.status;

}

} catch {

return "";

}

return "";

}

/* ======================================
LOAD KYC FROM SERVER
====================================== */

async function loadKYCStatus() {

const customer =
getCustomer();

const customerId =
getCustomerId(customer);

/*

* First show locally saved status.
  */

const localStatus =
loadLocalKYCStatus();

if (localStatus) {

updateKYCUI(localStatus);

}

/*

* Customer ID नहीं मिला तो local status
* पर ही रहेंगे।
  */

if (!customerId) {

return;

}

try {

/*
 * Existing customer API
 */

const response =
  await fetch(
    "/api/customer?customer_id=" +
    encodeURIComponent(customerId)
  );


if (!response.ok) {

  return;

}


const data =
  await response.json();


/*
 * API response के अलग-अलग possible
 * structures को support करें।
 */

const serverCustomer =

  data?.customer ||
  data?.data ||
  data;


const serverStatus =

  serverCustomer?.kyc_status ||
  serverCustomer?.kycStatus ||
  data?.kyc_status ||
  data?.kycStatus ||
  "";


if (serverStatus) {

  updateKYCUI(serverStatus);


  /*
   * Server status local storage में भी
   * save करें ताकि अगली बार तुरंत दिखे।
   */

  const oldSubmission = {

    ...(function () {

      try {

        return JSON.parse(
          localStorage.getItem(
            "balaji_kyc_submission"
          ) || "{}"
        );

      } catch {

        return {};

      }

    })()

  };


  oldSubmission.customer_id =
    customerId;

  oldSubmission.status =
    normalizeKYCStatus(serverStatus);


  localStorage.setItem(
    "balaji_kyc_submission",
    JSON.stringify(oldSubmission)
  );

}

} catch (error) {

console.error(
  "KYC Status Error:",
  error
);

}

}

/* ======================================
WALLET
====================================== */

if (walletBtn) {

walletBtn.addEventListener(
"click",
() => {

  window.location.href =
    "wallet.html";

}

);

}

/* ======================================
REFER
====================================== */

if (referBtn) {

referBtn.addEventListener(
"click",
() => {

  window.location.href =
    "refer.html";

}

);

}

/* ======================================
SUPPORT
====================================== */

if (supportBtn) {

supportBtn.addEventListener(
"click",
() => {

  window.location.href =
    "support.html";

}

);

}

/* ======================================
KYC
====================================== */

if (kycBtn) {

kycBtn.addEventListener(
"click",
() => {

  window.location.href =
    "/kyc/";

}

);

}

/* ======================================
LOGOUT
====================================== */

if (logoutBtn) {

logoutBtn.addEventListener(
"click",
() => {

  const confirmLogout =
    confirm(
      "Are you sure you want to logout?"
    );


  if (!confirmLogout) {

    return;

  }


  localStorage.removeItem(
    "BALAJI_LOGIN"
  );

  localStorage.removeItem(
    "balajiLogin"
  );

  localStorage.removeItem(
    "balajiMobile"
  );


  window.location.href =
    "home.html";

}

);

}

/* ======================================
START
====================================== */

loadProfile();

loadKYCStatus();
