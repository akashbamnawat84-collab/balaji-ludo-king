/* =========================
   BALAJI LUDO KING
   LOGIN + OTP
========================= */

const mobileSection =
  document.getElementById("mobileSection");

const otpSection =
  document.getElementById("otpSection");

const mobileInput =
  document.getElementById("mobileNumber");

const otpInput =
  document.getElementById("otpInput");

const sendOtpBtn =
  document.getElementById("sendOtpBtn");

const verifyOtpBtn =
  document.getElementById("verifyOtpBtn");

const resendOtpBtn =
  document.getElementById("resendOtpBtn");

const resendText =
  document.getElementById("resendText");

const loginMessage =
  document.getElementById("loginMessage");


let generatedOtp = "";
let countdown = 60;


/* =========================
   MESSAGE
========================= */

function showMessage(message) {

  loginMessage.textContent = message;

}


/* =========================
   GENERATE DEMO OTP
========================= */

function generateOtp() {

  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();

}


/* =========================
   SEND OTP
========================= */

function sendOtp() {

  const mobile =
    mobileInput.value.replace(/\D/g, "");

  if (mobile.length !== 10) {

    showMessage(
      "Please enter a valid 10-digit mobile number."
    );

    return;
  }


  generatedOtp = generateOtp();

  console.log("Demo OTP:", generatedOtp);


  mobileSection.classList.add("hidden");

  otpSection.classList.remove("hidden");

  showMessage("");

  startCountdown();

}


/* =========================
   VERIFY OTP
========================= */

function verifyOtp() {

  const otp =
    otpInput.value.replace(/\D/g, "");

  if (otp.length !== 6) {

    showMessage(
      "Please enter the 6-digit OTP."
    );

    return;
  }


  if (otp !== generatedOtp) {

    showMessage(
      "Invalid OTP. Please try again."
    );

    return;
  }


  localStorage.setItem(
    "balajiLogin",
    "true"
  );

  localStorage.setItem(
    "balajiMobile",
    mobileInput.value
  );


  window.location.href =
    "home.html";

}


/* =========================
   COUNTDOWN
========================= */

function startCountdown() {

  countdown = 60;

  resendOtpBtn.disabled = true;

  resendText.textContent =
    "Resend available in 60s";


  const timer =
    setInterval(function () {

      countdown--;

      resendText.textContent =
        "Resend available in " +
        countdown +
        "s";


      if (countdown <= 0) {

        clearInterval(timer);

        resendText.textContent =
          "You can resend OTP";

        resendOtpBtn.disabled = false;

      }

    }, 1000);

}


/* =========================
   RESEND OTP
========================= */

function resendOtp() {

  generatedOtp = generateOtp();

  console.log(
    "New Demo OTP:",
    generatedOtp
  );

  showMessage(
    "OTP sent successfully!"
  );

  startCountdown();

}


/* =========================
   BUTTON EVENTS
========================= */

sendOtpBtn.addEventListener(
  "click",
  sendOtp
);


verifyOtpBtn.addEventListener(
  "click",
  verifyOtp
);


resendOtpBtn.addEventListener(
  "click",
  resendOtp
);


/* =========================
   OTP INPUT
========================= */

otpInput.addEventListener(
  "input",
  function () {

    this.value =
      this.value.replace(/\D/g, "");

  }
);


/* =========================
   MOBILE INPUT
========================= */

mobileInput.addEventListener(
  "input",
  function () {

    this.value =
      this.value.replace(/\D/g, "").slice(0, 10);

  }
);
