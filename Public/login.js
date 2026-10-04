/* =========================================
   BALAJI LUDO KING
   MSG91 OTP WIDGET LOGIN
========================================= */

let loginMobile = "";
let otpReqId = "";
let resendTimer = null;


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

  const input =
    document.getElementById("mobileNumber");

  if (!input) return;

  const mobile =
    input.value
      .replace(/\D/g, "")
      .slice(0, 10);

  if (!/^[6-9]\d{9}$/.test(mobile)) {

    showMessage(
      "Please enter a valid 10-digit mobile number.",
      "#d32945"
    );

    return;
  }

  loginMobile = mobile;

  showMessage(
    "Sending OTP...",
    "#18864b"
  );

  if (
    typeof window.sendOtp !== "function"
  ) {

    showMessage(
      "MSG91 OTP service is not ready. Please refresh.",
      "#d32945"
    );

    console.error(
      "MSG91 sendOtp() is not available."
    );

    return;
  }

  window.sendOtp(

    "91" + loginMobile,

    function (data) {

      console.log(
        "MSG91 SEND SUCCESS:",
        data
      );

      otpReqId =
        data?.reqId ||
        data?.req_id ||
        data?.data?.reqId ||
        data?.data?.req_id ||
        "";

      const otpSection =
        document.getElementById("otpSection");

      if (otpSection) {

        otpSection.classList.remove("hidden");

        otpSection.style.display = "flex";
      }

      showMessage(
        "OTP sent successfully.",
        "#18864b"
      );

      startResendTimer();
    },

    function (error) {

      console.error(
        "MSG91 SEND ERROR:",
        error
      );

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

  const otpInput =
    document.getElementById("otpInput");

  if (!otpInput) return;

  const otp =
    otpInput.value
      .replace(/\D/g, "")
      .slice(0, 6);

  if (!/^\d{6}$/.test(otp)) {

    showMessage(
      "Please enter the 6-digit OTP.",
      "#d32945"
    );

    return;
  }

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

  showMessage(
    "Verifying OTP...",
    "#18864b"
  );

  console.log(
    "MSG91 VERIFY REQUEST:",
    {
      otpLength: otp.length,
      reqIdPresent: !!otpReqId
    }
  );


  /*
    MSG91 Web SDK verification.
    Login continues ONLY after MSG91
    reports successful OTP verification.
  */

  window.verifyOtp(

    otp,

    function (data) {

      console.log(
        "MSG91 OTP VERIFIED:",
        data
      );

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

        showMessage(
          "OTP verified, but secure login token was not received.",
          "#d32945"
        );

        return;
      }

      loginToBalaji(
        accessToken
      );

    },

    function (error) {

      console.error(
        "MSG91 OTP VERIFY ERROR:",
        error
      );

      showMessage(
        "Wrong or expired OTP.",
        "#d32945"
      );
    },

    otpReqId
  );
}


/* =========================================
   CLOUDFLARE LOGIN
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

    const data =
      await response.json();

    console.log(
      "BALAJI BACKEND LOGIN RESPONSE:",
      data
    );

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
    },

    function (error) {

      console.error(
        "MSG91 RESEND ERROR:",
        error
      );

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
            seconds +
            "s";
        }

        if (seconds <= 0) {

          clearInterval(
            resendTimer
          );

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


    const sendButton =
      document.getElementById("sendOtpBtn");

    if (sendButton) {

      sendButton.addEventListener(
        "click",
        sendOTP
      );
    }


    const verifyButton =
      document.getElementById("verifyOtpBtn");

    if (verifyButton) {

      verifyButton.addEventListener(
        "click",
        verifyOTP
      );
    }


    const resendButton =
      document.getElementById("resendOtpBtn");

    if (resendButton) {

      resendButton.addEventListener(
        "click",
        resendOTP
      );
    }


    console.log(
      "BALAJI LUDO KING - MSG91 OTP LOGIN READY"
    );

  }
);
