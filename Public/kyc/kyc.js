const kycForm = document.getElementById("kycForm");
const message = document.getElementById("message");
const backBtn = document.getElementById("backBtn");

const mobileInput = document.getElementById("mobile");
const documentNumber = document.getElementById("documentNumber");
const documentFile = document.getElementById("documentFile");
const selfieFile = document.getElementById("selfieFile");


/* =========================
   MOBILE NUMBER
========================= */

mobileInput.addEventListener("input", () => {
  mobileInput.value = mobileInput.value
    .replace(/\D/g, "")
    .slice(0, 10);
});


/* =========================
   FILE NAME DISPLAY
========================= */

documentFile.addEventListener("change", () => {
  updateFileText(documentFile, "Choose Document");
});

selfieFile.addEventListener("change", () => {
  updateFileText(selfieFile, "Choose Selfie");
});


function updateFileText(input, defaultText) {

  const box = input.parentElement;
  const strong = box.querySelector("strong");

  if (!strong) return;

  if (input.files && input.files.length > 0) {
    strong.textContent = input.files[0].name;
  } else {
    strong.textContent = defaultText;
  }
}


/* =========================
   MESSAGE
========================= */

function showMessage(text, type = "success") {

  message.textContent = text;
  message.style.display = "block";

  if (type === "error") {
    message.style.background = "#fff1f1";
    message.style.color = "#c62828";
    message.style.border = "1px solid #ffd2d2";
  } else {
    message.style.background = "#eefbf3";
    message.style.color = "#218548";
    message.style.border = "1px solid #ccefd9";
  }
}


/* =========================
   FORM SUBMIT
========================= */

kycForm.addEventListener("submit", (event) => {

  event.preventDefault();

  const fullName =
    document.getElementById("fullName").value.trim();

  const mobile =
    mobileInput.value.trim();

  const dob =
    document.getElementById("dob").value;

  const documentType =
    document.getElementById("documentType").value;

  const docNumber =
    documentNumber.value.trim();

  const agreement =
    document.getElementById("agreement").checked;


  /* ---------- VALIDATION ---------- */

  if (fullName.length < 2) {
    showMessage("Please enter your full name.", "error");
    return;
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    showMessage(
      "Please enter a valid 10 digit mobile number.",
      "error"
    );
    return;
  }

  if (!dob) {
    showMessage("Please select your date of birth.", "error");
    return;
  }

  if (!documentType) {
    showMessage("Please select a KYC document.", "error");
    return;
  }

  if (docNumber.length < 4) {
    showMessage(
      "Please enter a valid document number.",
      "error"
    );
    return;
  }

  if (!documentFile.files.length) {
    showMessage(
      "Please upload your KYC document.",
      "error"
    );
    return;
  }

  if (!selfieFile.files.length) {
    showMessage(
      "Please upload your selfie.",
      "error"
    );
    return;
  }

  if (!agreement) {
    showMessage(
      "Please accept the confirmation checkbox.",
      "error"
    );
    return;
  }


  /* ---------- DEMO SUBMISSION ---------- */

  const kycData = {
    fullName: fullName,
    mobile: mobile,
    dob: dob,
    documentType: documentType,
    documentNumber: docNumber,
    submittedAt: new Date().toISOString()
  };

  localStorage.setItem(
    "balaji_kyc_submission",
    JSON.stringify(kycData)
  );


  showMessage(
    "KYC submitted successfully. Your details are saved for this session.",
    "success"
  );


  /* ---------- UPDATE STATUS ---------- */

  const statusText =
    document.querySelector(".status-box strong");

  if (statusText) {
    statusText.textContent = "Submitted";
  }

  const statusDot =
    document.querySelector(".status-dot");

  if (statusDot) {
    statusDot.style.background = "#22a05a";
  }

});


/* =========================
   BACK BUTTON
========================= */

backBtn.addEventListener("click", () => {

  if (document.referrer) {
    history.back();
  } else {
    window.location.href = "/";
  }

});


/* =========================
   LOAD SAVED STATUS
========================= */

window.addEventListener("DOMContentLoaded", () => {

  const saved =
    localStorage.getItem("balaji_kyc_submission");

  if (saved) {

    const statusText =
      document.querySelector(".status-box strong");

    if (statusText) {
      statusText.textContent = "Submitted";
    }

    const statusDot =
      document.querySelector(".status-dot");

    if (statusDot) {
      statusDot.style.background = "#22a05a";
    }
  }

});
