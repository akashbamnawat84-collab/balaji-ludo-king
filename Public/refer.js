/* =========================================
   BALAJI LUDO KING
   REFER & EARN MODULE

   IMPORTANT:
   This file only controls the Refer page.
   Login and Customer Support are NOT touched.
========================================= */


/* =========================
   ELEMENTS
========================= */

const totalReferralEl =
  document.getElementById("totalReferral");

const totalEarnedEl =
  document.getElementById("totalEarned");

const referralCodeEl =
  document.getElementById("referralCode");

const copyCodeBtn =
  document.getElementById("copyCodeBtn");

const whatsappBtn =
  document.getElementById("whatsappBtn");

const telegramBtn =
  document.getElementById("telegramBtn");

const copyLinkBtn =
  document.getElementById("copyLinkBtn");

const copyMessage =
  document.getElementById("copyMessage");

const historyList =
  document.getElementById("historyList");


/* =========================
   DEFAULT USER DATA

   अभी demo values हैं.
   बाद में backend से आएँगे.
========================= */

const demoUser = {
  referralCode: "000000",
  totalReferral: 0,
  totalEarned: 0,
  history: []
};


/* =========================
   GET REFERRAL CODE
========================= */

function getReferralCode() {

  const params =
    new URLSearchParams(window.location.search);

  const code =
    params.get("ref");

  if (code && /^[0-9]{6}$/.test(code)) {
    return code;
  }

  return demoUser.referralCode;
}


/* =========================
   REFERRAL LINK
========================= */

function getReferralLink() {

  const code =
    referralCodeEl.textContent.trim();

  const baseUrl =
    window.location.origin;

  return `${baseUrl}/login?ref=${encodeURIComponent(code)}`;
}


/* =========================
   SHARE MESSAGE
========================= */

function getShareMessage() {

  const code =
    referralCodeEl.textContent.trim();

  const link =
    getReferralLink();

  return (
    `🎮 Balaji Ludo King\n\n` +
    `Play Ludo and enjoy the game!\n\n` +
    `Join using my referral code: ${code}\n\n` +
    `Join here:\n${link}`
  );
}


/* =========================
   COPY TEXT
========================= */

async function copyText(text) {

  try {

    await navigator.clipboard.writeText(text);

    showCopyMessage("Copied successfully!");

  } catch (error) {

    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    showCopyMessage("Copied successfully!");
  }
}


/* =========================
   COPY MESSAGE
========================= */

function showCopyMessage(message) {

  copyMessage.textContent = message;

  setTimeout(() => {
    copyMessage.textContent = "";
  }, 2000);
}


/* =========================
   WHATSAPP
========================= */

whatsappBtn.addEventListener("click", () => {

  const message =
    encodeURIComponent(getShareMessage());

  const url =
    `https://wa.me/?text=${message}`;

  window.open(url, "_blank");
});


/* =========================
   TELEGRAM
========================= */

telegramBtn.addEventListener("click", () => {

  const message =
    encodeURIComponent(getShareMessage());

  const link =
    encodeURIComponent(getReferralLink());

  const url =
    `https://t.me/share/url?url=${link}&text=${message}`;

  window.open(url, "_blank");
});


/* =========================
   COPY CODE
========================= */

copyCodeBtn.addEventListener("click", () => {

  const code =
    referralCodeEl.textContent.trim();

  copyText(code);
});


/* =========================
   COPY LINK
========================= */

copyLinkBtn.addEventListener("click", () => {

  copyText(getReferralLink());
});


/* =========================
   RENDER HISTORY
========================= */

function renderHistory(history) {

  if (!history || history.length === 0) {

    historyList.innerHTML = `
      <div class="empty-history">
        No referral activity yet.
      </div>
    `;

    return;
  }

  historyList.innerHTML = "";

  history.forEach(item => {

    const row =
      document.createElement("div");

    row.className = "history-row";

    row.innerHTML = `
      <div>
        <div class="history-user">
          ${escapeHtml(item.user)}
        </div>

        <div class="history-date">
          ${escapeHtml(item.date)}
        </div>
      </div>

      <div class="history-amount">
        +₹${Number(item.amount || 0).toFixed(2)}
      </div>
    `;

    historyList.appendChild(row);
  });
}


/* =========================
   SECURITY HELPER
========================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   LOAD USER
========================= */

function loadReferPage() {

  const code =
    getReferralCode();

  referralCodeEl.textContent =
    code;

  /*
    अभी demo data.

    जब backend तैयार होगा,
    यहाँ current logged-in user's
    real referral data आएगा.
  */

  totalReferralEl.textContent =
    demoUser.totalReferral;

  totalEarnedEl.textContent =
    `₹${Number(demoUser.totalEarned).toFixed(2)}`;

  renderHistory(
    demoUser.history
  );
}


/* =========================
   START
========================= */

loadReferPage();
