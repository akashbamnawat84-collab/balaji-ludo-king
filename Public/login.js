/* =========================================================
   BALAJI LUDO KING
   LOGIN + DEMO OTP
   FINAL VERSION
========================================================= */

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
let countdownTimer = null;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {

  if (loginMessage) {
    loginMessage.textContent = message;
  }

}


/* =========================================================
   MOBILE
========================================================= */

function getMobile() {

  if (!mobileInput) {
    return "";
  }

  return mobileInput.value
    .replace(/\D/g, "")
    .slice(-10);

}


/* =========================================================
   GENERATE DEMO OTP
========================================================= */

function generateOtp() {

  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();

}


/* =========================================================
   SEND OTP
========================================================= */

function sendOtp() {

  const mobile = getMobile();


  if (mobile.length !== 10) {

    showMessage(
      "Please enter a valid 10-digit mobile number."
    );

    return;
  }


  generatedOtp = generateOtp();


  /*
    Demo OTP.
    अभी कोई real SMS service connected नहीं है.
  */

  console.log(
    "BALAJI LUDO KING Demo OTP:",
    generatedOtp
  );


  /* Mobile save */
  localStorage.setItem(
    "balajiMobile",
    mobile
  );


  /* Show OTP section */

  if (mobileSection) {
    mobileSection.classList.add("hidden");
  }

  if (otpSection) {
    otpSection.classList.remove("hidden");
  }


  /*
    Demo में OTP screen पर message में दिखा रहे हैं
    ताकि mobile से test किया जा सके.
  */

  showMessage(
    "Demo OTP: " + generatedOtp
  );


  if (otpInput) {
    otpInput.value = "";
    otpInput.focus();
  }


  startCountdown();

}


/* =========================================================
   VERIFY OTP
========================================================= */

function verifyOtp() {

  const otp =
    otpInput
      ? otpInput.value
          .replace(/\D/g, "")
          .slice(0, 6)
      : "";


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


  /* =======================================================
     LOGIN SUCCESS
  ======================================================= */

  const mobile = getMobile();


  localStorage.setItem(
    "balajiLogin",
    "true"
  );


  localStorage.setItem(
    "balajiMobile",
    mobile
  );


  /*
    Customer ID अभी mobile पर आधारित रख रहे हैं.
    इससे Battle / Room pages को user पहचानने में मदद मिलेगी.
  */

  localStorage.setItem(
    "balajiCustomerId",
    mobile
  );


  localStorage.setItem(
    "customerId",
    mobile
  );


  localStorage.setItem(
    "customerMobile",
    mobile
  );


  showMessage(
    "Login successful."
  );


  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = true;
  }


  /* Stop countdown */

  if (countdownTimer) {

    clearInterval(
      countdownTimer
    );

    countdownTimer = null;

  }


  /* Go Home */

  setTimeout(function () {

    window.location.href =
      "/home.html";

  }, 500);

}


/* =========================================================
   COUNTDOWN
========================================================= */

function startCountdown() {

  countdown = 60;


  if (countdownTimer) {

    clearInterval(
      countdownTimer
    );

  }


  if (resendOtpBtn) {
    resendOtpBtn.disabled = true;
  }


  if (resendText) {

    resendText.textContent =
      "Resend available in 60s";

  }


  countdownTimer =
    setInterval(function () {

      countdown--;


      if (resendText) {

        resendText.textContent =
          "Resend available in " +
          countdown +
          "s";

      }


      if (countdown <= 0) {

        clearInterval(
          countdownTimer
        );

        countdownTimer = null;


        if (resendText) {

          resendText.textContent =
            "You can resend OTP";

        }


        if (resendOtpBtn) {

          resendOtpBtn.disabled =
            false;

        }

      }

    }, 1000);

}


/* =========================================================
   RESEND OTP
========================================================= */

function resendOtp() {

  const mobile = getMobile();


  if (mobile.length !== 10) {

    showMessage(
      "Please enter your mobile number again."
    );

    return;
  }


  generatedOtp =
    generateOtp();


  console.log(
    "BALAJI LUDO KING Demo OTP:",
    generatedOtp
  );


  showMessage(
    "New Demo OTP: " + generatedOtp
  );


  if (otpInput) {

    otpInput.value = "";

    otpInput.focus();

  }


  startCountdown();

}


/* =========================================================
   OTP INPUT
========================================================= */

if (otpInput) {

  otpInput.addEventListener(
    "input",
    function () {

      this.value =
        this.value
          .replace(/\D/g, "")
          .slice(0, 6);

    }
  );

}


/* =========================================================
   MOBILE INPUT
========================================================= */

if (mobileInput) {

  mobileInput.addEventListener(
    "input",
    function () {

      this.value =
        this.value
          .replace(/\D/g, "")
          .slice(0, 10);

    }
  );

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (sendOtpBtn) {

  sendOtpBtn.addEventListener(
    "click",
    sendOtp
  );

}


if (verifyOtpBtn) {

  verifyOtpBtn.addEventListener(
    "click",
    verifyOtp
  );

}


if (resendOtpBtn) {

  resendOtpBtn.addEventListener(
    "click",
    resendOtp
  );

}


/* =========================================================
   ENTER KEY
========================================================= */

if (mobileInput) {

  mobileInput.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Enter"
      ) {

        sendOtp();

      }

    }
  );

}


if (otpInput) {

  otpInput.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Enter"
      ) {

        verifyOtp();

      }

    }
  );

}
