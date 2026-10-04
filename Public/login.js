/* =========================================
   BALAJI LUDO KING
   REAL MSG91 OTP LOGIN
========================================= */

let loginMobile = "";
let otpReqId = "";
let resendTimer = null;
let isSendingOTP = false;
let isVerifyingOTP = false;


/* =========================================
   MESSAGE
========================================= */

function showMessage(text, color) {

  const message =
    document.getElementById("loginMessage");

  if (!message) return;

  message.textContent = text;

  if (color) {
    message.style.color = color;
  }
}


/* =========================================
   SEND OTP
========================================= */

function sendOTP() {

  if (isSendingOTP) {
    return;
  }

  const input =
    document.getElementById("mobileNumber");

  const sendButton =
    document.getElementById("sendOtpBtn");

  if (!input) return;

  const mobile =
    input.value
      .replace(/\D/g, "")
      .slice(0, 10);

  /* ONLY VALID INDIAN MOBILE */

  if (!/^[6-9][0-9]{9}$/.test(mobile)) {

    showMessage(
      "Please enter a valid 10-digit Indian mobile number.",
      "#d32945"
    );

    return;
  }

  loginMobile = mobile;
  otpReqId = "";

  isSendingOTP = true;

  if (sendButton) {
    sendButton.disabled = true;
  }

  showMessage(
    "Sending OTP...",
    "#18864b"
  );

  /* MSG91 SDK CHECK */

  if (
    typeof window.sendOtp !== "function"
  ) {

    isSendingOTP = false;

    if (sendButton) {
      sendButton.disabled = false;
    }

    showMessage(
      "MSG91 OTP service is not ready. Please refresh the page.",
      "#d32945"
    );

    console.error(
      "MSG91 sendOtp() is not available."
    );

    return;
  }


  /* =====================================
     SEND REAL OTP
  ===================================== */

  window.sendOtp(

    "91" + loginMobile,

    function (data) {

      console.log(
        "MSG91 SEND SUCCESS:",
        data
      );

      isSendingOTP = false;

      otpReqId =
        data?.reqId ||
        data?.req_id ||
        data?.data?.reqId ||
        data?.data?.req_id ||
        "";

      if (!otpReqId) {

        console.warn(
          "MSG91 request ID was not returned:",
          data
        );
      }


      /* SHOW OTP SECTION */

      const otpSection =
        document.getElementById("otpSection");

      if (otpSection) {

        otpSection.classList.remove("hidden");

        otpSection.style.display = "flex";
      }


      /* DISABLE SEND BUTTON */

      if (sendButton) {
        sendButton.disabled = true;
      }


      showMessage(
        "OTP sent successfully.",
        "#18864b"
      );


      /* START RESEND TIMER */

      startResendTimer();


      /* FOCUS OTP */

      const otpInput =
        document.getElementById("otpInput");

      if (otpInput) {
        otpInput.focus();
      }

    },

    function (error) {

      console.error(
        "MSG91 SEND ERROR:",
        error
      );

      isSendingOTP = false;

      if (sendButton) {
        sendButton.disabled = false;
      }

      showMessage(
        "Unable to send OTP. Please try again.",
        "#d32945"
      );
    }
  );
}


/* =========================================
   VERIFY OTP
========================================= */

function verifyOTP() {

  if (isVerifyingOTP) {
    return;
  }

  const otpInput =
    document.getElementById("otpInput");

  const verifyButton =
    document.getElementById("verifyOtpBtn");

  if (!otpInput) return;


  /* GET ONLY DIGITS */

  const otp =
    otpInput.value
      .replace(/\D/g, "")
      .slice(0, 4);


  /* 4 DIGIT OTP */

  if (!/^[0-9]{4}$/.test(otp)) {

    showMessage(
      "Please enter the 4-digit OTP.",
      "#d32945"
    );

    return;
  }


  /* MOBILE CHECK */

  if (!/^[6-9][0-9]{9}$/.test(loginMobile)) {

    showMessage(
      "Invalid mobile number. Please request OTP again.",
      "#d32945"
    );

    return;
  }


  /* MSG91 SDK CHECK */

  if (
    typeof window.verifyOtp !== "function"
  ) {

    showMessage(
      "MSG91 OTP service is not ready. Please refresh.",
      "#d32945"
    );

    console.error(
      "MSG91 verifyOtp() is not available."
    );

    return;
  }


  isVerifyingOTP = true;

  if (verifyButton) {
    verifyButton.disabled = true;
  }

  showMessage(
    "Verifying OTP...",
    "#18864b"
  );


  console.log(
    "MSG91 VERIFY REQUEST:",
    {
      mobile: loginMobile,
      otpLength: otp.length,
      reqIdPresent: !!otpReqId
    }
  );


  /* =====================================
     MSG91 REAL OTP VERIFICATION
  ===================================== */

  window.verifyOtp(

    otp,

    function (data) {

      console.log(
        "MSG91 OTP VERIFIED:",
        data
      );


      /*
        MSG91 must return a secure access token.
        Without this token, backend login
        MUST NOT continue.
      */

      const accessToken =
        data?.access_token ||
        data?.accessToken ||
        data?.token ||
        data?.data?.access_token ||
        data?.data?.accessToken ||
        data?.data?.token ||
        "";


      if (!accessToken) {

        console.error(
          "MSG91 ACCESS TOKEN MISSING:",
          data
        );

        isVerifyingOTP = false;

        if (verifyButton) {
          verifyButton.disabled = false;
        }

        showMessage(
          "OTP verification failed. Secure token was not received.",
          "#d32945"
        );

        return;
      }


      /*
        ONLY NOW send login request
        to Cloudflare backend.
      */

      loginToBalaji(
        accessToken
      );

    },

    function (error) {

      console.error(
        "MSG91 OTP VERIFY ERROR:",
        error
      );

      isVerifyingOTP = false;

      if (verifyButton) {
        verifyButton.disabled = false;
      }

      showMessage(
        "Wrong or expired OTP.",
        "#d32945"
      );
    },

    otpReqId
  );
}


/* =========================================
   CLOUDFLARE SECURE LOGIN
========================================= */

async function loginToBalaji(
  accessToken
) {

  showMessage(
    "OTP verified. Logging in...",
    "#18864b"
  );


  try {

    const response =
      await fetch(
        "../api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              mobile: loginMobile,
              access_token: accessToken
            })
        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    console.log(
      "BALAJI BACKEND LOGIN RESPONSE:",
      data
    );


    /*
      BACKEND MUST ACCEPT LOGIN ONLY
      AFTER MSG91 TOKEN VERIFICATION.
    */

    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.error ||
        "Secure login failed."
      );
    }


    /* =====================================
       SAVE LOGIN
    ===================================== */

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


    if (
      data.customer &&
      data.customer.id
    ) {

      localStorage.setItem(
        "balajiCustomerId",
        data.customer.id
      );
    }


    if (data.customer) {

      localStorage.setItem(
        "balajiCustomer",
        JSON.stringify(
          data.customer
        )
      );
    }


    showMessage(
      "Login successful.",
      "#18864b"
    );


    /* =====================================
       REDIRECT HOME
    ===================================== */

    setTimeout(
      function () {

        window.location.href =
          "../home.html";

      },
      500
    );

  }
  catch (error) {

    console.error(
      "BALAJI LOGIN ERROR:",
      error
    );

    isVerifyingOTP = false;

    const verifyButton =
      document.getElementById("verifyOtpBtn");

    if (verifyButton) {
      verifyButton.disabled = false;
    }

    showMessage(
      error.message ||
      "Login failed. Please try again.",
      "#d32945"
    );
  }
}


/* =========================================
   RESEND OTP
========================================= */

function resendOTP() {

  if (!loginMobile) {

    showMessage(
      "Please enter your mobile number first.",
      "#d32945"
    );

    return;
  }


  if (
    typeof window.retryOtp !== "function"
  ) {

    showMessage(
      "MSG91 resend service is not ready.",
      "#d32945"
    );

    return;
  }


  const resendButton =
    document.getElementById("resendOtpBtn");

  if (resendButton) {
    resendButton.disabled = true;
  }


  showMessage(
    "Resending OTP...",
    "#18864b"
  );


  window.retryOtp(

    null,

    function (data) {

      console.log(
        "MSG91 RESEND SUCCESS:",
        data
      );


      otpReqId =
        data?.reqId ||
        data?.req_id ||
        data?.data?.reqId ||
        data?.data?.req_id ||
        otpReqId;


      showMessage(
        "OTP resent successfully.",
        "#18864b"
      );


      startResendTimer();


      const otpInput =
        document.getElementById("otpInput");

      if (otpInput) {
        otpInput.value = "";
        otpInput.focus();
      }

    },

    function (error) {

      console.error(
        "MSG91 RESEND ERROR:",
        error
      );


      if (resendButton) {
        resendButton.disabled = false;
      }


      showMessage(
        "Unable to resend OTP.",
        "#d32945"
      );
    },

    otpReqId
  );
}


/* =========================================
   RESEND TIMER
========================================= */

function startResendTimer() {

  const resendButton =
    document.getElementById("resendOtpBtn");

  const resendText =
    document.getElementById("resendText");

  if (!resendButton) return;


  resendButton.disabled = true;

  let seconds = 10;


  if (resendTimer) {

    clearInterval(
      resendTimer
    );
  }


  if (resendText) {

    resendText.textContent =
      "Resend available in " +
      seconds +
      "s";
  }


  resendTimer =
    setInterval(
      function () {

        seconds--;


        if (resendText) {

          resendText.textContent =
            "Resend available in " +
            Math.max(seconds, 0) +
            "s";
        }


        if (seconds <= 0) {

          clearInterval(
            resendTimer
          );

          resendTimer = null;

          resendButton.disabled =
            false;


          if (resendText) {

            resendText.textContent =
              "Resend available";
          }
        }

      },
      1000
    );
}


/* =========================================
   BACK TO MOBILE
========================================= */

function backToLogin() {

  const otpSection =
    document.getElementById("otpSection");

  const otpInput =
    document.getElementById("otpInput");


  if (otpSection) {

    otpSection.classList.add("hidden");

    otpSection.style.display =
      "none";
  }


  if (otpInput) {

    otpInput.value = "";
  }


  otpReqId = "";

  showMessage("", "");


  const mobileInput =
    document.getElementById("mobileNumber");


  if (mobileInput) {

    mobileInput.focus();
  }
}


/* =========================================
   PAGE EVENTS
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {


    /* MOBILE INPUT */

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


    /* OTP INPUT */

    const otpInput =
      document.getElementById("otpInput");


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


    /* SEND OTP */

    const sendButton =
      document.getElementById("sendOtpBtn");


    if (sendButton) {

      sendButton.addEventListener(
        "click",
        sendOTP
      );
    }


    /* VERIFY OTP */

    const verifyButton =
      document.getElementById("verifyOtpBtn");


    if (verifyButton) {

      verifyButton.addEventListener(
        "click",
        verifyOTP
      );
    }


    /* RESEND OTP */

    const resendButton =
      document.getElementById("resendOtpBtn");


    if (resendButton) {

      resendButton.addEventListener(
        "click",
        resendOTP
      );
    }


    console.log(
      "BALAJI LUDO KING - REAL MSG91 OTP LOGIN READY"
    );

  }
);
