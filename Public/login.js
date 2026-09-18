/* =========================================================
   BALAJI LUDO KING
   LOGIN + MSG91 REAL OTP
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


let countdown = 60;
let countdownTimer = null;
let otpRequestInProgress = false;
let verifyRequestInProgress = false;


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
    .slice(0, 10);

}


/* =========================================================
   SEND OTP - MSG91
========================================================= */

function sendOtp() {

  const mobile = getMobile();

  if (mobile.length !== 10) {

    showMessage(
      "Please enter a valid 10-digit mobile number."
    );

    return;
  }


  if (
    typeof window.sendOtp !== "function"
  ) {

    showMessage(
      "OTP service is not loaded. Please refresh and try again."
    );

    console.error(
      "MSG91 sendOtp() is not available."
    );

    return;
  }


  if (otpRequestInProgress) {
    return;
  }


  otpRequestInProgress = true;

  if (sendOtpBtn) {
    sendOtpBtn.disabled = true;
  }


  showMessage(
    "Sending OTP..."
  );


  /*
    Save mobile temporarily.
    Login is NOT completed here.
  */

  localStorage.setItem(
    "balajiMobile",
    mobile
  );


  /*
    MSG91 expects country code.
    Example:
    9876543210
    becomes:
    919876543210
  */

  const identifier =
    "91" + mobile;


  window.sendOtp(

    identifier,

    function (data) {

      console.log(
        "MSG91 OTP sent:",
        data
      );


      otpRequestInProgress = false;


      if (mobileSection) {
        mobileSection.classList.add("hidden");
      }


      if (otpSection) {
        otpSection.classList.remove("hidden");
      }


      if (otpInput) {

        otpInput.value = "";

        otpInput.focus();

      }


      showMessage(
        "OTP sent successfully."
      );


      startCountdown();

    },

    function (error) {

      console.error(
        "MSG91 Send OTP Error:",
        error
      );


      otpRequestInProgress = false;


      if (sendOtpBtn) {
        sendOtpBtn.disabled = false;
      }


      showMessage(
        "Unable to send OTP. Please try again."
      );

    }

  );

}


/* =========================================================
   VERIFY OTP - MSG91
========================================================= */

function verifyOtp() {

  const otp =
    otpInput
      ? otpInput.value
          .replace(/\D/g, "")
          .slice(0, 4)
      : "";


  if (otp.length !== 4) {

    showMessage(
      "Please enter the 4-digit OTP."
    );

    return;
  }


  if (
    typeof window.verifyOtp !== "function"
  ) {

    showMessage(
      "OTP verification service is not loaded."
    );

    console.error(
      "MSG91 verifyOtp() is not available."
    );

    return;
  }


  if (verifyRequestInProgress) {
    return;
  }


  verifyRequestInProgress = true;


  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = true;
  }


  showMessage(
    "Verifying OTP..."
  );


  /*
    MSG91 widget verifies the OTP.

    Successful verification returns
    an access token/JWT in the callback.
  */

  window.verifyOtp(

    Number(otp),

    async function (data) {

      console.log(
        "MSG91 OTP verified:",
        data
      );


      /*
        Extract access token from MSG91 response.
        Different widget versions may return
        the token under different property names.
      */

      const accessToken =
        extractAccessToken(data);


      if (!accessToken) {

        console.error(
          "MSG91 access token missing:",
          data
        );


        verifyRequestInProgress = false;


        if (verifyOtpBtn) {
          verifyOtpBtn.disabled = false;
        }


        showMessage(
          "OTP verified, but login token was not received."
        );

        return;
      }


      /*
        Send verified token to our Worker.

        IMPORTANT:
        The MSG91 AuthKey is NEVER sent from browser.
      */

      await completeServerLogin(
        accessToken
      );

    },

    function (error) {

      console.error(
        "MSG91 Verify OTP Error:",
        error
      );


      verifyRequestInProgress = false;


      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = false;
      }


      showMessage(
        "Invalid or expired OTP. Please try again."
      );

    }

  );

}


/* =========================================================
   EXTRACT MSG91 ACCESS TOKEN
========================================================= */

function extractAccessToken(data) {

  if (!data) {
    return "";
  }


  if (typeof data === "string") {

    return data;

  }


  return (
    data.access_token ||
    data.accessToken ||
    data["access-token"] ||
    data.token ||
    data.jwt ||
    data.data?.access_token ||
    data.data?.accessToken ||
    data.data?.["access-token"] ||
    data.data?.token ||
    ""
  );

}


/* =========================================================
   SERVER LOGIN
========================================================= */

async function completeServerLogin(
  accessToken
) {

  try {

    const response =
      await fetch(
        "/api/login/verify",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            access_token:
              accessToken
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {

      console.error(
        "Server Login Error:",
        data
      );


      verifyRequestInProgress = false;


      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = false;
      }


      showMessage(
        data.message ||
        "Login failed. Please try again."
      );

      return;
    }


    /*
      Server has now verified:
      MSG91 token
      + mobile
      + customer ID
    */


    const customerId =
      data.customer_id;

    const mobile =
      data.mobile;

    const sessionToken =
      data.session_token;


    if (!customerId || !mobile) {

      console.error(
        "Invalid server login response:",
        data
      );


      verifyRequestInProgress = false;


      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = false;
      }


      showMessage(
        "Login response is incomplete."
      );

      return;
    }


    /*
      Save login information.

      Existing pages continue to receive
      the same localStorage keys.
    */

    localStorage.setItem(
      "balajiLogin",
      "true"
    );


    localStorage.setItem(
      "balajiMobile",
      mobile
    );


    localStorage.setItem(
      "balajiCustomerId",
      String(customerId)
    );


    localStorage.setItem(
      "customerId",
      String(customerId)
    );


    localStorage.setItem(
      "customerMobile",
      mobile
    );


    /*
      New secure session token.
    */

    if (sessionToken) {

      localStorage.setItem(
        "balajiSessionToken",
        sessionToken
      );

    }


    showMessage(
      "Login successful."
    );


    if (countdownTimer) {

      clearInterval(
        countdownTimer
      );

      countdownTimer = null;

    }


    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = true;
    }


    /*
      Go to Home
    */

    setTimeout(function () {

      window.location.href =
        "/home.html";

    }, 500);

  }

  catch (error) {

    console.error(
      "Server login request failed:",
      error
    );


    verifyRequestInProgress = false;


    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = false;
    }


    showMessage(
      "Network error. Please try again."
    );

  }

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

  if (countdownTimer) {
    return;
  }


  const mobile = getMobile();


  if (mobile.length !== 10) {

    showMessage(
      "Please enter your mobile number again."
    );

    return;
  }


  /*
    MSG91 widget controls its own retry/resend
    protection according to the widget settings.
  */

  if (
    typeof window.retryOtp !== "function"
  ) {

    showMessage(
      "Resend service is not available. Please refresh."
    );

    console.error(
      "MSG91 retryOtp() is not available."
    );

    return;
  }


  showMessage(
    "Resending OTP..."
  );


  window.retryOtp(

    null,

    function (data) {

      console.log(
        "MSG91 OTP resent:",
        data
      );


      showMessage(
        "OTP resent successfully."
      );


      if (otpInput) {

        otpInput.value = "";

        otpInput.focus();

      }


      startCountdown();

    },

    function (error) {

      console.error(
        "MSG91 Retry OTP Error:",
        error
      );


      showMessage(
        "Unable to resend OTP. Please try again."
      );

    }

  );

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
          .slice(0, 4);

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

      if (event.key === "Enter") {

        sendOtp();

      }

    }
  );

}


if (otpInput) {

  otpInput.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {

        verifyOtp();

      }

    }
  );

}
