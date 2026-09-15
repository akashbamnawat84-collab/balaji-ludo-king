/* =========================================
   BALAJI LUDO KING
   LOGIN + OTP ONLY
   ========================================= */

let loginMobile = "";


/* =========================================
   SEND OTP
   ========================================= */

function sendOTP() {

  const input =
    document.getElementById("mobileNumber");

  const message =
    document.getElementById("loginMessage");

  const mobile =
    input.value.replace(/\D/g, "");


  /* CHECK MOBILE NUMBER */

  if (mobile.length !== 10) {

    message.textContent =
      "Please enter a valid 10-digit mobile number.";

    return;
  }


  /* SAVE MOBILE NUMBER */

  loginMobile = mobile;

  localStorage.setItem(
    "BALAJI_MOBILE",
    loginMobile
  );


  /* SHOW MESSAGE */

  message.style.color = "#18864b";

  message.textContent =
    "OTP sent successfully.";


  /* OPEN OTP SCREEN */

  document.getElementById(
    "otpSection"
  ).style.display = "flex";


  /* FOCUS OTP INPUT */

  setTimeout(function () {

    const otpInput =
      document.getElementById("otpInput");

    if (otpInput) {
      otpInput.focus();
    }

  }, 100);

}


/* =========================================
   VERIFY OTP
   ========================================= */

function verifyOTP() {

  const otpInput =
    document.getElementById("otpInput");

  const message =
    document.getElementById("otpMessage");

  const otp =
    otpInput.value.replace(/\D/g, "");


  /* CHECK OTP */

  if (otp.length !== 6) {

    message.style.color = "#d32945";

    message.textContent =
      "Please enter a valid 6-digit OTP.";

    return;
  }


  /* =========================================
     KEEP EXISTING LOGIN DATA
     ========================================= */

  localStorage.setItem(
    "BALAJI_LOGIN",
    "true"
  );

  localStorage.setItem(
    "balajiLogin",
    "true"
  );

  localStorage.setItem(
    "balajiMobile",
    loginMobile
  );


  /* LOGIN SUCCESS */

  message.style.color = "#18864b";

  message.textContent =
    "Login successful.";


  /* =========================================
     GO TO EXISTING HOME
     ========================================= */

  setTimeout(function () {

    window.location.href =
      "../home.html";

  }, 500);

}


/* =========================================
   BACK TO LOGIN
   ========================================= */

function backToLogin() {

  document.getElementById(
    "otpSection"
  ).style.display = "none";


  document.getElementById(
    "otpInput"
  ).value = "";


  document.getElementById(
    "otpMessage"
  ).textContent = "";


  document.getElementById(
    "loginMessage"
  ).textContent = "";


  document.getElementById(
    "mobileNumber"
  ).focus();

}


/* =========================================
   MOBILE NUMBER — ONLY DIGITS
   ========================================= */

const mobileInput =
  document.getElementById("mobileNumber");


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


/* =========================================
   OTP — ONLY DIGITS
   ========================================= */

const otpInput =
  document.getElementById("otpInput");


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
