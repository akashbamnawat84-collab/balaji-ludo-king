/* =========================================================
   BALAJI LUDO KING
   REAL MSG91 OTP LOGIN
========================================================= */


/* =========================================================
   REAL MSG91 CONFIG
========================================================= */

const MSG91_WIDGET_ID =
  "366972756179303139373432";

const MSG91_TOKEN_AUTH =
  "572770TyB7Lb7lZ56ac23c05P1";


/* =========================================================
   STATE
========================================================= */

let loginMobile = "";

let otpSent = false;

let resendTimer = null;

let resendSeconds = 30;

let msg91Ready = false;

let msg91Loading = false;


/* =========================================================
   ELEMENTS
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

const changeNumberBtn =
  document.getElementById("changeNumberBtn");

const maskedMobile =
  document.getElementById("maskedMobile");

const resendTimerEl =
  document.getElementById("resendTimer");

const loginMessage =
  document.getElementById("loginMessage");

const sendBtnText =
  document.getElementById("sendBtnText");

const verifyBtnText =
  document.getElementById("verifyBtnText");

const sendLoader =
  document.getElementById("sendLoader");

const verifyLoader =
  document.getElementById("verifyLoader");


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
  text,
  type = "info"
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = text;

  loginMessage.className =
    "login-message " + type;
}


/* =========================================================
   MOBILE
========================================================= */

function getCleanMobile() {

  return String(
    mobileInput?.value || ""
  )
    .replace(/\D/g, "")
    .slice(0, 10);
}


function isValidIndianMobile(
  mobile
) {

  return /^[6-9]\d{9}$/.test(
    mobile
  );
}


function getMSG91Identifier(
  mobile
) {

  return "91" + mobile;
}


function maskMobile(
  mobile
) {

  if (
    !mobile ||
    mobile.length !== 10
  ) {

    return "+91 XXXXX XXXXX";
  }

  return (
    "+91 " +
    mobile.slice(0, 2) +
    "XXXX" +
    mobile.slice(6)
  );
}


/* =========================================================
   LOAD MSG91
========================================================= */

function loadMSG91Widget() {

  return new Promise(
    (resolve, reject) => {

      if (
        typeof window.initSendOTP ===
        "function"
      ) {

        initializeMSG91();

        resolve();

        return;
      }


      if (msg91Loading) {

        const waitTimer =
          setInterval(() => {

            if (
              typeof window.initSendOTP ===
              "function"
            ) {

              clearInterval(
                waitTimer
              );

              initializeMSG91();

              resolve();
            }

          }, 100);


        setTimeout(() => {

          clearInterval(
            waitTimer
          );

          if (!msg91Ready) {

            reject(
              new Error(
                "MSG91 OTP service failed to load."
              )
            );

          }

        }, 15000);

        return;
      }


      msg91Loading = true;


      const urls = [
        "https://verify.msg91.com/otp-provider.js",
        "https://verify.phone91.com/otp-provider.js"
      ];


      let index = 0;


      function attempt() {

        const script =
          document.createElement(
            "script"
          );

        script.type =
          "text/javascript";

        script.src =
          urls[index];

        script.async = true;


        script.onload = () => {

          if (
            typeof window.initSendOTP ===
            "function"
          ) {

            msg91Loading = false;

            initializeMSG91();

            resolve();

            return;
          }


          index++;

          if (
            index < urls.length
          ) {

            attempt();

          } else {

            msg91Loading = false;

            reject(
              new Error(
                "MSG91 initialization method unavailable."
              )
            );
          }

        };


        script.onerror = () => {

          index++;

          if (
            index < urls.length
          ) {

            attempt();

          } else {

            msg91Loading = false;

            reject(
              new Error(
                "Unable to load MSG91 OTP service."
              )
            );

          }

        };


        document.head.appendChild(
          script
        );

      }


      attempt();

    }
  );
}


/* =========================================================
   INITIALIZE MSG91
========================================================= */

function initializeMSG91() {

  if (msg91Ready) {
    return;
  }


  try {

    const configuration = {

      widgetId:
        MSG91_WIDGET_ID,

      tokenAuth:
        MSG91_TOKEN_AUTH,

      identifier:
        loginMobile
          ? getMSG91Identifier(
              loginMobile
            )
          : "",

      exposeMethods: true,

      captchaRenderId:
        "msg91-captcha"

    };


    window.initSendOTP(
      configuration
    );


    msg91Ready = true;


    console.log(
      "MSG91 OTP Widget initialized."
    );

  } catch (error) {

    msg91Ready = false;

    console.error(
      "MSG91 initialization error:",
      error
    );

    throw error;
  }
}


/* =========================================================
   SEND BUTTON LOADING
========================================================= */

function setSendLoading(
  loading
) {

  if (!sendOtpBtn) {
    return;
  }

  sendOtpBtn.disabled =
    loading;


  if (sendBtnText) {

    sendBtnText.textContent =
      loading
        ? "SENDING OTP..."
        : "SEND OTP";
  }


  if (sendLoader) {

    sendLoader.classList.toggle(
      "hidden",
      !loading
    );
  }
}


/* =========================================================
   VERIFY BUTTON LOADING
========================================================= */

function setVerifyLoading(
  loading
) {

  if (!verifyOtpBtn) {
    return;
  }

  verifyOtpBtn.disabled =
    loading;


  if (verifyBtnText) {

    verifyBtnText.textContent =
      loading
        ? "VERIFYING..."
        : "VERIFY & LOGIN";
  }


  if (verifyLoader) {

    verifyLoader.classList.toggle(
      "hidden",
      !loading
    );
  }
}


/* =========================================================
   SHOW OTP
========================================================= */

function showOTPSection() {

  mobileSection?.classList.remove(
    "active"
  );

  otpSection?.classList.add(
    "active"
  );


  if (maskedMobile) {

    maskedMobile.textContent =
      maskMobile(
        loginMobile
      );
  }


  if (otpInput) {

    otpInput.value = "";

    setTimeout(() => {

      otpInput.focus();

    }, 150);

  }


  startResendTimer();
}


/* =========================================================
   SHOW MOBILE
========================================================= */

function showMobileSection() {

  otpSection?.classList.remove(
    "active"
  );

  mobileSection?.classList.add(
    "active"
  );


  otpSent = false;

  stopResendTimer();


  if (otpInput) {

    otpInput.value = "";
  }


  if (resendOtpBtn) {

    resendOtpBtn.disabled =
      true;
  }


  showMessage(
    "",
    "info"
  );
}


/* =========================================================
   SEND OTP
========================================================= */

async function sendOTP() {

  const mobile =
    getCleanMobile();


  if (
    !isValidIndianMobile(
      mobile
    )
  ) {

    showMessage(
      "Please enter a valid 10-digit Indian mobile number.",
      "error"
    );

    mobileInput?.focus();

    return;
  }


  loginMobile =
    mobile;


  setSendLoading(
    true
  );


  showMessage(
    "Preparing secure OTP verification...",
    "info"
  );


  try {

    await loadMSG91Widget();


    if (
      typeof window.sendOtp !==
      "function"
    ) {

      throw new Error(
        "MSG91 Send OTP is unavailable."
      );
    }


    const identifier =
      getMSG91Identifier(
        loginMobile
      );


    window.sendOtp(

      identifier,

      function (data) {

        console.log(
          "MSG91 OTP sent:",
          data
        );


        otpSent = true;

        setSendLoading(
          false
        );


        showOTPSection();


        showMessage(
          "OTP sent successfully. Please check your mobile.",
          "success"
        );

      },

      function (error) {

        console.error(
          "MSG91 Send OTP error:",
          error
        );


        setSendLoading(
          false
        );


        showMessage(
          getMSG91ErrorMessage(
            error
          ),
          "error"
        );

      }

    );

  } catch (error) {

    console.error(
      "Send OTP error:",
      error
    );


    setSendLoading(
      false
    );


    showMessage(
      getMSG91ErrorMessage(
        error
      ),
      "error"
    );

  }
}


/* =========================================================
   VERIFY OTP
========================================================= */

async function verifyOTP() {

  if (!otpSent) {

    showMessage(
      "Please request OTP first.",
      "error"
    );

    return;
  }


  const otp =
    String(
      otpInput?.value || ""
    )
      .replace(/\D/g, "")
      .slice(0, 6);


  if (
    !/^\d{6}$/.test(
      otp
    )
  ) {

    showMessage(
      "Please enter the 6-digit OTP.",
      "error"
    );

    otpInput?.focus();

    return;
  }


  setVerifyLoading(
    true
  );


  showMessage(
    "Verifying OTP...",
    "info"
  );


  try {

    if (
      typeof window.verifyOtp !==
      "function"
    ) {

      throw new Error(
        "MSG91 Verify OTP is unavailable."
      );
    }


    window.verifyOtp(

      Number(otp),

      async function (data) {

        console.log(
          "MSG91 OTP verified:",
          data
        );


        try {

          const accessToken =
            extractAccessToken(
              data
            );


          if (
            !accessToken
          ) {

            throw new Error(
              "MSG91 did not return a verified access token."
            );
          }


          await completeBalajiLogin(
            accessToken
          );

        } catch (error) {

          console.error(
            "Balaji login error:",
            error
          );


          setVerifyLoading(
            false
          );


          showMessage(
            getMSG91ErrorMessage(
              error
            ),
            "error"
          );

        }

      },

      function (error) {

        console.error(
          "MSG91 Verify OTP error:",
          error
        );


        setVerifyLoading(
          false
        );


        showMessage(
          getMSG91ErrorMessage(
            error
          ),
          "error"
        );

      },

      getMSG91Identifier(
        loginMobile
      )

    );

  } catch (error) {

    console.error(
      "Verify OTP error:",
      error
    );


    setVerifyLoading(
      false
    );


    showMessage(
      getMSG91ErrorMessage(
        error
      ),
      "error"
    );

  }
}


/* =========================================================
   ACCESS TOKEN
========================================================= */

function extractAccessToken(
  data
) {

  if (!data) {
    return "";
  }


  const candidates = [

    data.access_token,

    data.accessToken,

    data["access-token"],

    data.token,

    data.jwt,

    data?.data?.access_token,

    data?.data?.accessToken,

    data?.data?.["access-token"],

    data?.data?.token,

    data?.data?.jwt

  ];


  for (
    const value of candidates
  ) {

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {

      return String(
        value
      ).trim();

    }

  }


  return "";
}


/* =========================================================
   BALAJI API LOGIN
========================================================= */

async function completeBalajiLogin(
  accessToken
) {

  showMessage(
    "Creating your Balaji Ludo account...",
    "info"
  );


  const response =
    await fetch(
      "/api/login",
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

  } catch {

    data = {};

  }


  if (
    !response.ok
  ) {

    throw new Error(
      data?.error ||
      data?.message ||
      "Login failed. Please try again."
    );
  }


  if (
    !data ||
    data.success !== true
  ) {

    throw new Error(
      data?.error ||
      data?.message ||
      "Login verification failed."
    );
  }


  saveCustomerSession(
    data
  );


  showMessage(
    "Login successful. Opening Balaji Ludo King...",
    "success"
  );


  setTimeout(() => {

    window.location.href =
      "/home/";

  }, 500);
}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveCustomerSession(
  data
) {

  const customer =
    data.customer ||
    data.user ||
    data;


  const mobile =
    customer?.mobile ||
    loginMobile;


  const customerId =
    customer?.id ||
    customer?.customer_id ||
    "";


  const walletBalance =
    Number(
      customer?.wallet_balance ??
      customer?.wallet ??
      0
    );


  localStorage.setItem(
    "balajiMobile",
    mobile
  );


  localStorage.setItem(
    "balajiCustomerId",
    customerId
  );


  localStorage.setItem(
    "balajiWalletBalance",
    String(
      walletBalance
    )
  );


  localStorage.setItem(
    "balajiCustomer",
    JSON.stringify(
      customer
    )
  );


  localStorage.setItem(
    "balajiLoggedIn",
    "true"
  );


  localStorage.setItem(
    "balajiLoginTime",
    String(
      Date.now()
    )
  );
}


/* =========================================================
   RESEND OTP
========================================================= */

function resendOTP() {

  if (
    !otpSent ||
    !loginMobile ||
    resendSeconds > 0
  ) {

    return;
  }


  if (
    typeof window.retryOtp !==
    "function"
  ) {

    showMessage(
      "Resend service is unavailable. Please try again.",
      "error"
    );

    return;
  }


  resendOtpBtn.disabled =
    true;


  showMessage(
    "Sending a new OTP...",
    "info"
  );


  window.retryOtp(

    null,

    function (data) {

      console.log(
        "MSG91 resend:",
        data
      );


      showMessage(
        "New OTP sent successfully.",
        "success"
      );


      startResendTimer();

    },

    function (error) {

      console.error(
        "MSG91 resend error:",
        error
      );


      resendOtpBtn.disabled =
        false;


      showMessage(
        getMSG91ErrorMessage(
          error
        ),
        "error"
      );

    },

    getMSG91Identifier(
      loginMobile
    )

  );
}


/* =========================================================
   RESEND TIMER
========================================================= */

function startResendTimer() {

  stopResendTimer();

  resendSeconds = 30;


  if (resendOtpBtn) {

    resendOtpBtn.disabled =
      true;
  }


  updateResendTimer();


  resendTimer =
    setInterval(() => {

      resendSeconds--;

      updateResendTimer();


      if (
        resendSeconds <= 0
      ) {

        stopResendTimer();


        if (resendOtpBtn) {

          resendOtpBtn.disabled =
            false;
        }

      }

    }, 1000);
}


function updateResendTimer() {

  if (!resendTimerEl) {
    return;
  }


  if (
    resendSeconds > 0
  ) {

    resendTimerEl.textContent =
      "(" +
      resendSeconds +
      "s)";

  } else {

    resendTimerEl.textContent =
      "";
  }
}


function stopResendTimer() {

  if (resendTimer) {

    clearInterval(
      resendTimer
    );

    resendTimer = null;
  }
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getMSG91ErrorMessage(
  error
) {

  if (!error) {

    return (
      "OTP verification failed. Please try again."
    );
  }


  if (
    typeof error ===
    "string"
  ) {

    return error;
  }


  const message =
    error.message ||
    error.msg ||
    error.error ||
    error.description;


  if (message) {

    return String(
      message
    );
  }


  try {

    return JSON.stringify(
      error
    );

  } catch {

    return (
      "OTP verification failed. Please try again."
    );
  }
}


/* =========================================================
   INPUT RESTRICTIONS
========================================================= */

mobileInput?.addEventListener(
  "input",
  function () {

    this.value =
      this.value
        .replace(/\D/g, "")
        .slice(0, 10);

  }
);


otpInput?.addEventListener(
  "input",
  function () {

    this.value =
      this.value
        .replace(/\D/g, "")
        .slice(0, 6);

  }
);


/* =========================================================
   ENTER - MOBILE
========================================================= */

mobileInput?.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      sendOTP();

    }

  }
);


/* =========================================================
   ENTER - OTP
========================================================= */

otpInput?.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      verifyOTP();

    }

  }
);


/* =========================================================
   BUTTONS
========================================================= */

sendOtpBtn?.addEventListener(
  "click",
  sendOTP
);


verifyOtpBtn?.addEventListener(
  "click",
  verifyOTP
);


resendOtpBtn?.addEventListener(
  "click",
  resendOTP
);


changeNumberBtn?.addEventListener(
  "click",
  showMobileSection
);


/* =========================================================
   START
========================================================= */

window.addEventListener(
  "load",
  function () {

    console.log(
      "BALAJI LUDO KING - REAL MSG91 LOGIN"
    );

    console.log(
      "Demo OTP is disabled."
    );

  }
);
