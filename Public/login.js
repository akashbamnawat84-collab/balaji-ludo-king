/* =========================================
   BALAJI LUDO KING
   LOGIN + MSG91 OTP WIDGET
   ========================================= */

let loginMobile = "";


/* =========================================
   SHOW MESSAGE
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
   SAVE LOGIN
   ========================================= */

function saveLogin(data) {

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
    data &&
    data.customer &&
    data.customer.id
  ) {

    localStorage.setItem(
      "balajiCustomerId",
      data.customer.id
    );

  }


  /*
    Keep wallet/customer information available
    for the existing Home page.
  */

  if (
    data &&
    data.customer
  ) {

    try {

      localStorage.setItem(
        "balajiCustomer",
        JSON.stringify(
          data.customer
        )
      );

    } catch (error) {

      console.warn(
        "Customer storage warning:",
        error
      );

    }

  }

}


/* =========================================
   LOGIN TO BALAJI BACKEND
   AFTER MSG91 OTP SUCCESS
   ========================================= */

async function loginWithMSG91(accessToken) {

  if (!accessToken) {

    showMessage(
      "OTP verification failed.",
      "#d32945"
    );

    return;
  }


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

          body: JSON.stringify({

            mobile:
              loginMobile,

            access_token:
              accessToken

          })

        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch (error) {

      data = {};

    }


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.error ||
        "Login failed"
      );

    }


    /* ==============================
       LOGIN SUCCESS
    ============================== */

    saveLogin(data);


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
      "Balaji Login Error:",
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
   MSG91 WIDGET SUCCESS
   ========================================= */

function handleMSG91Success(data) {

  console.log(
    "MSG91 Widget Success:",
    data
  );


  /*
    MSG91 may return the token in
    different property names depending
    on the Widget response.
  */

  const accessToken =
    data?.access_token ||
    data?.accessToken ||
    data?.token ||
    data?.data?.access_token ||
    data?.data?.accessToken;


  if (!accessToken) {

    console.error(
      "MSG91 access token not found:",
      data
    );


    showMessage(
      "OTP verified, but login token was not received.",
      "#d32945"
    );

    return;
  }


  loginWithMSG91(
    accessToken
  );

}


/* =========================================
   MSG91 WIDGET FAILURE
   ========================================= */

function handleMSG91Failure(error) {

  console.error(
    "MSG91 Widget Error:",
    error
  );


  showMessage(
    "OTP verification failed. Please try again.",
    "#d32945"
  );

}


/* =========================================
   SEND OTP
   ========================================= */

function sendOTP() {

  const input =
    document.getElementById(
      "mobileNumber"
    );


  if (!input) {

    return;

  }


  const mobile =
    input.value
      .replace(/\D/g, "")
      .slice(0, 10);


  /* ==============================
     MOBILE VALIDATION
  ============================== */

  if (
    !/^[6-9]\d{9}$/.test(mobile)
  ) {

    showMessage(
      "Please enter a valid 10-digit mobile number.",
      "#d32945"
    );

    return;
  }


  loginMobile =
    mobile;


  localStorage.setItem(
    "BALAJI_MOBILE",
    loginMobile
  );


  showMessage(
    "Sending OTP...",
    "#18864b"
  );


  /*
    MSG91 Widget is already loaded
    by login.html.

    We use the Widget's exposed
    sendOtp method.
  */

  try {

    if (
      typeof window.sendOtp !== "function"
    ) {

      console.error(
        "MSG91 sendOtp function not available."
      );


      showMessage(
        "OTP service is not ready. Please refresh and try again.",
        "#d32945"
      );

      return;
    }


    /*
      MSG91 Widget expects the mobile
      identifier.
    */

    window.sendOtp(
      "+91" + loginMobile
    );


    const otpSection =
      document.getElementById(
        "otpSection"
      );


    if (otpSection) {

      otpSection.classList.remove(
        "hidden"
      );

      otpSection.style.display =
        "flex";

    }


    showMessage(
      "OTP sent successfully.",
      "#18864b"
    );

  }
  catch (error) {

    console.error(
      "MSG91 Send OTP Error:",
      error
    );


    showMessage(
      "Unable to send OTP. Please try again.",
      "#d32945"
    );

  }

}


/* =========================================
   VERIFY OTP
   ========================================= */

function verifyOTP() {

  /*
    Important:
    MSG91 Widget performs the actual OTP
    verification.

    Once verification succeeds,
    MSG91 calls the success callback
    from login.html.

    Therefore we do NOT send the OTP
    itself to /api/login.
  */

  showMessage(
    "Please complete OTP verification.",
    "#18864b"
  );

}


/* =========================================
   BACK TO MOBILE
   ========================================= */

function backToLogin() {

  const otpSection =
    document.getElementById(
      "otpSection"
    );

  const otpInput =
    document.getElementById(
      "otpInput"
    );


  if (otpSection) {

    otpSection.classList.add(
      "hidden"
    );

    otpSection.style.display =
      "none";

  }


  if (otpInput) {

    otpInput.value = "";

  }


  showMessage(
    "",
    ""
  );


  const mobileInput =
    document.getElementById(
      "mobileNumber"
    );


  if (mobileInput) {

    mobileInput.focus();

  }

}


/* =========================================
   MOBILE INPUT
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const mobileInput =
      document.getElementById(
        "mobileNumber"
      );


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


    /* ==============================
       OTP INPUT
    ============================== */

    const otpInput =
      document.getElementById(
        "otpInput"
      );


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


    /* ==============================
       SEND BUTTON
    ============================== */

    const sendButton =
      document.getElementById(
        "sendOtpBtn"
      );


    if (sendButton) {

      sendButton.addEventListener(
        "click",
        sendOTP
      );

    }


    /* ==============================
       VERIFY BUTTON
    ============================== */

    const verifyButton =
      document.getElementById(
        "verifyOtpBtn"
      );


    if (verifyButton) {

      verifyButton.addEventListener(
        "click",
        verifyOTP
      );

    }


    console.log(
      "Balaji Ludo King Login Ready"
    );

  }
);
