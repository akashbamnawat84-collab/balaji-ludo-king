/* =========================================================
   BALAJI LUDO KING - PROFILE
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

  const nameEl = document.getElementById("profileName");
  const mobileEl = document.getElementById("profileMobile");
  const playerIdEl = document.getElementById("playerId");

  const walletBtn = document.getElementById("walletBtn");
  const referBtn = document.getElementById("referBtn");
  const supportBtn = document.getElementById("supportBtn");
  const kycBtn = document.getElementById("kycBtn");
  const logoutBtn = document.getElementById("logoutBtn");


  /* =========================================================
     CUSTOMER DATA
  ========================================================= */

  function getStoredCustomer() {

    const keys = [
      "customer",
      "customerData",
      "currentCustomer",
      "user",
      "userData",
      "balaji_customer",
      "balaji_customer_data",
      "balaji_user"
    ];

    for (const key of keys) {

      try {

        const value = localStorage.getItem(key);

        if (!value) continue;

        const data = JSON.parse(value);

        if (data && typeof data === "object") {
          return data;
        }

      } catch (error) {
        // Ignore invalid storage values
      }

    }

    return null;
  }


  const customer = getStoredCustomer();


  /* =========================================================
     GET CUSTOMER ID
  ========================================================= */

  function getCustomerId() {

    if (customer) {

      return (
        customer.customer_id ||
        customer.customerId ||
        customer.id ||
        ""
      );

    }

    return (
      localStorage.getItem("balajiPlayerId") ||
      localStorage.getItem("customer_id") ||
      localStorage.getItem("customerId") ||
      ""
    );

  }


  /* =========================================================
     GET NAME
  ========================================================= */

  function getName() {

    if (customer) {

      return (
        customer.full_name ||
        customer.fullName ||
        customer.name ||
        customer.player_name ||
        customer.playerName ||
        ""
      );

    }

    return (
      localStorage.getItem("balajiPlayerName") ||
      localStorage.getItem("playerName") ||
      ""
    );

  }


  /* =========================================================
     GET MOBILE
  ========================================================= */

  function getMobile() {

    if (customer) {

      return (
        customer.mobile ||
        customer.phone ||
        customer.phone_number ||
        ""
      );

    }

    return (
      localStorage.getItem("balajiMobile") ||
      localStorage.getItem("mobile") ||
      ""
    );

  }


  const customerId = getCustomerId();
  const customerName = getName();
  const customerMobile = getMobile();


  /* =========================================================
     PROFILE NAME
  ========================================================= */

  if (nameEl) {

    nameEl.textContent =
      customerName || "Player";

  }


  /* =========================================================
     PROFILE MOBILE
  ========================================================= */

  if (mobileEl) {

    if (customerMobile) {

      const mobileString =
        String(customerMobile);

      if (mobileString.length >= 10) {

        mobileEl.textContent =
          "******" +
          mobileString.slice(-4);

      } else {

        mobileEl.textContent =
          mobileString;

      }

    } else {

      mobileEl.textContent = "";

    }

  }


  /* =========================================================
     PLAYER ID
  ========================================================= */

  let playerId =
    localStorage.getItem("balajiPlayerId");


  if (!playerId) {

    playerId =
      "BLK-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    localStorage.setItem(
      "balajiPlayerId",
      playerId
    );

  }


  if (playerIdEl) {

    playerIdEl.textContent =
      playerId;

  }


  /* =========================================================
     KYC ELEMENTS
  ========================================================= */

  const kycIcon =
    kycBtn
      ? kycBtn.querySelector(".kyc-icon")
      : null;

  const kycStrong =
    kycBtn
      ? kycBtn.querySelector("strong")
      : null;


  /* =========================================================
     NORMALIZE KYC STATUS
  ========================================================= */

  function normalizeKycStatus(status) {

    if (!status) return "";

    return String(status)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  }


  /* =========================================================
     UPDATE KYC UI
  ========================================================= */

  function updateKycUI(status) {

    const normalized =
      normalizeKycStatus(status);


    if (!kycBtn) return;


    if (
      normalized === "approved" ||
      normalized === "verified" ||
      normalized === "complete"
    ) {

      if (kycIcon) {
        kycIcon.textContent = "✓";
      }

      if (kycStrong) {
        kycStrong.textContent =
          "KYC VERIFIED";
      }

      return;

    }


    if (
      normalized === "pending" ||
      normalized === "verificationpending"
    ) {

      if (kycIcon) {
        kycIcon.textContent = "⏳";
      }

      if (kycStrong) {
        kycStrong.textContent =
          "KYC VERIFICATION PENDING";
      }

      return;

    }


    if (
      normalized === "rejected"
    ) {

      if (kycIcon) {
        kycIcon.textContent = "✕";
      }

      if (kycStrong) {
        kycStrong.textContent =
          "KYC REJECTED";
      }

      return;

    }


    if (kycIcon) {
      kycIcon.textContent = "✓";
    }

    if (kycStrong) {
      kycStrong.textContent =
        "Complete KYC Verification";
    }

  }


  /* =========================================================
     LOCAL KYC STATUS
  ========================================================= */

  let currentKycStatus = "";


  try {

    const savedKyc =
      localStorage.getItem(
        "balaji_kyc_submission"
      );


    if (savedKyc) {

      const kycData =
        JSON.parse(savedKyc);


      currentKycStatus =
        kycData.status ||
        kycData.kyc_status ||
        "";

    }

  } catch (error) {

    console.log(
      "KYC local data read failed."
    );

  }


  updateKycUI(currentKycStatus);


  /* =========================================================
     GET FRESH KYC STATUS FROM SERVER
  ========================================================= */

  if (customerId) {

    try {

      const response =
        await fetch(
          "/api/customer?customer_id=" +
          encodeURIComponent(customerId)
        );


      if (response.ok) {

        const data =
          await response.json();


        const serverCustomer =
          data.customer ||
          data.data ||
          data;


        const serverKycStatus =
          serverCustomer.kyc_status ||
          serverCustomer.kycStatus ||
          "";


        if (serverKycStatus) {

          currentKycStatus =
            serverKycStatus;


          updateKycUI(
            serverKycStatus
          );


          /* Save latest status locally */

          try {

            let savedData = {};

            const old =
              localStorage.getItem(
                "balaji_kyc_submission"
              );


            if (old) {

              savedData =
                JSON.parse(old);

            }


            savedData.status =
              serverKycStatus;


            savedData.kyc_status =
              serverKycStatus;


            localStorage.setItem(
              "balaji_kyc_submission",
              JSON.stringify(savedData)
            );

          } catch (error) {

            console.log(
              "KYC status cache failed."
            );

          }

        }

      }

    } catch (error) {

      console.log(
        "KYC server status check failed."
      );

    }

  }


  /* =========================================================
     WALLET
  ========================================================= */

  if (walletBtn) {

    walletBtn.addEventListener(
      "click",
      function () {

        window.location.href =
          "wallet.html";

      }
    );

  }


  /* =========================================================
     REFER
  ========================================================= */

  if (referBtn) {

    referBtn.addEventListener(
      "click",
      function () {

        window.location.href =
          "refer.html";

      }
    );

  }


  /* =========================================================
     SUPPORT
  ========================================================= */

  if (supportBtn) {

    supportBtn.addEventListener(
      "click",
      function () {

        window.location.href =
          "support.html";

      }
    );

  }


  /* =========================================================
     KYC
  ========================================================= */

  if (kycBtn) {

    kycBtn.addEventListener(
      "click",
      function () {

        window.location.href =
          "/kyc/";

      }
    );

  }


  /* =========================================================
     LOGOUT
     PROFILE → LOGOUT → LOGIN PAGE
  ========================================================= */

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      function () {

        /* Remove login/session data */

        localStorage.removeItem(
          "BALAJI_LOGIN"
        );

        localStorage.removeItem(
          "balajiLogin"
        );

        localStorage.removeItem(
          "balajiMobile"
        );


        /* Keep player/KYC data if needed */


        /* Go directly to Login */

        window.location.replace(
          "/login/"
        );

      }
    );

  }

});
