/* =========================
   BALAJI LUDO KING
   SUPPORT JAVASCRIPT
========================= */


/* =========================
   WHATSAPP SUPPORT
========================= */

const whatsappBtn =
  document.getElementById("whatsappBtn");

if (whatsappBtn) {

  whatsappBtn.addEventListener("click", function () {

    /*
      यहां अपना official WhatsApp support number
      बाद में डाल सकते हैं.

      Format:
      91XXXXXXXXXX
    */

    const supportNumber = "";

    if (!supportNumber) {

      alert(
        "WhatsApp support number will be added here."
      );

      return;
    }

    const message =
      encodeURIComponent(
        "Hello Balaji Ludo King Support, I need help."
      );

    window.open(
      "https://wa.me/" +
      supportNumber +
      "?text=" +
      message,
      "_blank"
    );

  });

}


/* =========================
   FAQ
========================= */

const faqQuestions =
  document.querySelectorAll(".faq-question");

faqQuestions.forEach(function (question) {

  question.addEventListener("click", function () {

    const item =
      this.closest(".faq-item");

    item.classList.toggle("open");

  });

});


/* =========================
   WALLET
========================= */

const walletBtn =
  document.getElementById("walletBtn");

if (walletBtn) {

  walletBtn.addEventListener("click", function (event) {

    event.preventDefault();

    alert("Wallet section");

  });

}


/* =========================
   PROFILE
========================= */

const profileBtn =
  document.getElementById("profileBtn");

if (profileBtn) {

  profileBtn.addEventListener("click", function (event) {

    event.preventDefault();

    alert("Profile section");

  });

}
