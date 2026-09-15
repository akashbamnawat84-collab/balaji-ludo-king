/* =========================
   BALAJI LUDO KING
   REFER & EARN
========================= */

const referralCode =
  document.getElementById("referralCode");

const totalReferral =
  document.getElementById("totalReferral");

const totalEarned =
  document.getElementById("totalEarned");

const copyCodeBtn =
  document.getElementById("copyCodeBtn");

const whatsappBtn =
  document.getElementById("whatsappBtn");

const telegramBtn =
  document.getElementById("telegramBtn");

const copyLinkBtn =
  document.getElementById("copyLinkBtn");

const walletBtn =
  document.getElementById("walletBtn");

const profileBtn =
  document.getElementById("profileBtn");


/* =========================
   DEMO REFERRAL DATA
========================= */

let savedCode =
  localStorage.getItem("balajiReferralCode");

if (!savedCode) {

  savedCode =
    Math.floor(
      100000 +
      Math.random() * 900000
    ).toString();

  localStorage.setItem(
    "balajiReferralCode",
    savedCode
  );
}


if (referralCode) {

  referralCode.textContent =
    savedCode;

}


/* =========================
   DEMO STATS
========================= */

const savedReferral =
  localStorage.getItem("balajiTotalReferral") || "0";

const savedEarned =
  localStorage.getItem("balajiTotalEarned") || "0";


if (totalReferral) {

  totalReferral.textContent =
    savedReferral;

}


if (totalEarned) {

  totalEarned.textContent =
    "₹" +
    Number(savedEarned).toFixed(2);

}


/* =========================
   REFERRAL LINK
========================= */

function getReferralLink() {

  const baseUrl =
    window.location.origin +
    window.location.pathname
      .replace(/\/refer\/.*$/, "");

  return (
    baseUrl +
    "/?ref=" +
    savedCode
  );

}


/* =========================
   COPY CODE
========================= */

if (copyCodeBtn) {

  copyCodeBtn.addEventListener(
    "click",
    async function () {

      try {

        await navigator.clipboard.writeText(
          savedCode
        );

        copyCodeBtn.textContent =
          "✅ Code Copied";

        setTimeout(function () {

          copyCodeBtn.textContent =
            "📋 Copy Code";

        }, 1500);

      } catch (error) {

        alert(
          "Referral Code: " +
          savedCode
        );

      }

    }
  );

}


/* =========================
   COPY LINK
========================= */

if (copyLinkBtn) {

  copyLinkBtn.addEventListener(
    "click",
    async function () {

      const link =
        getReferralLink();

      try {

        await navigator.clipboard.writeText(
          link
        );

        alert(
          "Referral link copied!"
        );

      } catch (error) {

        alert(link);

      }

    }
  );

}


/* =========================
   WHATSAPP
========================= */

if (whatsappBtn) {

  whatsappBtn.addEventListener(
    "click",
    function () {

      const link =
        getReferralLink();

      const message =
        "Join Balaji Ludo King using my referral code " +
        savedCode +
        "\n\n" +
        link;

      window.open(
        "https://wa.me/?text=" +
        encodeURIComponent(message),
        "_blank"
      );

    }
  );

}


/* =========================
   TELEGRAM
========================= */

if (telegramBtn) {

  telegramBtn.addEventListener(
    "click",
    function () {

      const link =
        getReferralLink();

      const message =
        "Join Balaji Ludo King using my referral code " +
        savedCode;

      window.open(
        "https://t.me/share/url?url=" +
        encodeURIComponent(link) +
        "&text=" +
        encodeURIComponent(message),
        "_blank"
      );

    }
  );

}


/* =========================
   WALLET
========================= */

if (walletBtn) {

  walletBtn.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      alert("Wallet section");

    }
  );

}


/* =========================
   PROFILE
========================= */

if (profileBtn) {

  profileBtn.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      alert("Profile section");

    }
  );

}
