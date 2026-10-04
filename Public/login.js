/* =========================================
   BALAJI LUDO KING
   MSG91 OTP WIDGET LOGIN
   ========================================= */

let loginMobile = "";
let msg91Widget = null;


/* =========================================
   MSG91 WIDGET CONFIG
   ========================================= */

const MSG91_WIDGET_ID =
  "366972756179303139373432";


/* =========================================
   LOAD MSG91 OTP WIDGET
   ========================================= */

function loadMSG91Widget() {

  return new Promise(function (resolve, reject) {

    if (
      typeof window.initSendOTP === "function" ||
      typeof window.sendOtp === "function"
    ) {
      resolve();
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://verify.msg91.com/otp-provider.js"]'
      );

    if (existingScript) {

      existingScript.addEventListener(
        "load",
        function () {
          resolve();
        }
      );

      existingScript.addEventListener(
        "error",
        function () {
          reject(
            new Error("MSG91 Widget failed to load")
          );
        }
      );

      return;
    }


    const script =
      document.createElement("script");

    script.src =
      "https://verify.msg91.com/otp-provider.js";

    script.async = true;

    script.onload = function () {
      resolve();
    };

    script.onerror = function () {
      reject(
        new Error("MSG91 Widget failed to load")
      );
    };

    document.head.appendChild(script);

  });

}


/* =========================================
   SEND OTP
   ========================================= */

async function sendOTP() {

  const input =
    document.getElementById("mobileNumber");

  const message =
    document.getElementById("loginMessage");

  if (!input || !message) {
    return;
  }


  const mobile =
    input.value
      .replace(/\D/g, "")
      .slice(0, 10);


  if (mobile.length !== 10) {

    message.style.color = "#d32945";

    message.textContent =
      "Please enter a valid 10-digit mobile number.";

    return;
  }


  loginMobile = mobile;

  localStorage.setItem(
    "BALAJI_MOBILE",
    loginMobile
  );


  message.style.color = "#18864b";

  message.textContent =
    "Sending OTP...";


  try {

    await loadMSG91Widget();


    /*
      MSG91 Widget integration.

      The Widget itself handles:
      - OTP sending
      - OTP verification
      - resend
      - expiry
    */


    if (
      typeof window.initSendOTP === "function"
    ) {

      window.initSendOTP({

        widgetId:
          MSG91_WIDGET_ID,

        identifier:
          "+91" + mobile

      });

    }
    else if (
      typeof window.sendOtp === "function"
    ) {

      window.sendOtp({

        widgetId:
          MSG91_WIDGET_ID,

        identifier:
          "+91" + mobile

      });

    }
    else {

      throw new Error(
        "MSG91 Widget is not available"
      );

    }


    message.style.color = "#18864b";

    message.textContent =
      "OTP sent. Please verify the OTP.";


    const otpSection =
      document.getElementById("otpSection");

    if (otpSection) {
      otpSection.style.display = "flex";
    }

  }
  catch (error) {

    console.error(
      "MSG91 OTP Error:",
      error
    );

    message.style.color = "#d32945";

    message.textContent =
      "Unable to send OTP. Please try again.";

  }

}


/* =========================================
   MSG91 VERIFIED CALLBACK
   ========================================= */

async function onMSG91Verified(accessToken) {

  const message =
    document.getElementById("otpMessage");


  if (!accessToken) {

    if (message) {

      message.style.color =
        "#d32945";

      message.textContent =
        "OTP verification failed.";

    }

    return;

  }


  if (message) {

    message.style.color =
      "#18864b";

    message.textContent =
      "OTP verified. Logging in...";

  }


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


    const data =
      await response.json();


    if (!response.ok || !data.success) {

      throw new Error(
        data.error ||
        "Login failed"
      );

    }


    /* =====================================
       LOGIN SUCCESS
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


    if (message) {

      message.style.color =
        "#18864b";

      message.textContent =
        "Login successful.";

    }


    setTimeout(function () {

      window.location.href =
        "../home.html";

    }, 500);

  }
  catch (error) {

    console.error(
      "Login Error:",
      error
    );


    if (message) {

      message.style.color =
        "#d32945";

      message.textContent =
        error.message ||
        "Login failed. Please try again.";

    }

  }

}


/* =========================================
   MSG91 CALLBACK BRIDGE
   ========================================= */

window.onMSG91Verified =
  onMSG91Verified;


/*
  Some MSG91 widget versions return
  the access token through a callback.
*/

window.msg91Callback =
  function (response) {

    console.log(
      "MSG91 Callback:",
      response
    );


    const token =
      response?.access_token ||
      response?.accessToken ||
      response?.token ||
      response?.data?.access_token ||
      response?.data?.accessToken;


    if (token) {

      onMSG91Verified(token);

    }

  };


/* =========================================
   BACK TO MOBILE
   ========================================= */

function backToLogin() {

  const otpSection =
    document.getElementById("otpSection");

  const otpInput =
    document.getElementById("otpInput");

  const otpMessage =
    document.getElementById("otpMessage");

  const loginMessage =
    document.getElementById("loginMessage");


  if (otpSection) {
    otpSection.style.display = "none";
  }

  if (otpInput) {
    otpInput.value = "";
  }

  if (otpMessage) {
    otpMessage.textContent = "";
  }

  if (loginMessage) {
    loginMessage.textContent = "";
  }


  const mobileInput =
    document.getElementById("mobileNumber");

  if (mobileInput) {
    mobileInput.focus();
  }

}


/* =========================================
   MOBILE INPUT
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
   OTP INPUT
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
          .slice(0, 4);

    }
  );

}


/* =========================================
   PAGE LOAD
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "Balaji Ludo King MSG91 Login Ready"
    );

  }
);
