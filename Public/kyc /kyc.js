// ======================================
// BALAJI LUDO KING - KYC
// ======================================


// ======================================
// ELEMENTS
// ======================================

const kycName =
  document.getElementById("kycName");

const kycMobile =
  document.getElementById("kycMobile");

const kycStatus =
  document.getElementById("kycStatus");

const kycMessage =
  document.getElementById("kycMessage");

const identityStatus =
  document.getElementById("identityStatus");

const startKycBtn =
  document.getElementById("startKycBtn");

const actionMessage =
  document.getElementById("actionMessage");


// ======================================
// LOAD USER DETAILS
// ======================================

function loadKycProfile() {

  const savedName =
    localStorage.getItem("balajiPlayerName");

  const savedMobile =
    localStorage.getItem("balajiMobile");


  if (kycName) {

    kycName.textContent =
      savedName || "Not available";

  }


  if (kycMobile) {

    kycMobile.textContent =
      savedMobile || "Not available";

  }


  const savedKycStatus =
    localStorage.getItem("balajiKycStatus");


  if (savedKycStatus === "verified") {

    if (kycStatus) {
      kycStatus.textContent =
        "Verified";
    }

    if (kycMessage) {
      kycMessage.textContent =
        "Your KYC verification is complete.";
    }

    if (identityStatus) {
      identityStatus.textContent =
        "Verified";
    }

    if (startKycBtn) {
      startKycBtn.textContent =
        "KYC Verified";
      startKycBtn.disabled = true;
    }

    if (actionMessage) {
      actionMessage.textContent =
        "Your account identity has been verified.";
    }

  }

}


// ======================================
// START KYC
// ======================================

if (startKycBtn) {

  startKycBtn.addEventListener(
    "click",
    () => {

      if (
        localStorage.getItem(
          "balajiKycStatus"
        ) === "verified"
      ) {
        return;
      }


      if (actionMessage) {

        actionMessage.textContent =
          "KYC verification will be available soon.";

      }

    }
  );

}


// ======================================
// START
// ======================================

loadKycProfile();
