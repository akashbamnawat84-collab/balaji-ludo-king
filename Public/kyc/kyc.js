const form = document.getElementById("kycForm");

const documentFile =
  document.getElementById("documentFile");

const selfieFile =
  document.getElementById("selfieFile");

const documentFileName =
  document.getElementById("documentFileName");

const selfieFileName =
  document.getElementById("selfieFileName");

const statusText =
  document.getElementById("kycStatus");

const successMessage =
  document.getElementById("successMessage");


/* =========================================================
   SHOW FILE NAME
========================================================= */

if (documentFile) {

  documentFile.addEventListener(
    "change",
    () => {

      if (documentFile.files.length > 0) {

        documentFileName.textContent =
          documentFile.files[0].name;

      } else {

        documentFileName.textContent =
          "No file selected";

      }

    }
  );

}


if (selfieFile) {

  selfieFile.addEventListener(
    "change",
    () => {

      if (selfieFile.files.length > 0) {

        selfieFileName.textContent =
          selfieFile.files[0].name;

      } else {

        selfieFileName.textContent =
          "No file selected";

      }

    }
  );

}


/* =========================================================
   GET CUSTOMER ID
========================================================= */

function getCustomerId() {

  const possibleKeys = [
    "customer_id",
    "customerId",
    "playerId",
    "player_id",
    "balaji_customer"
  ];


  for (const key of possibleKeys) {

    const value =
      localStorage.getItem(key);

    if (value) {

      try {

        const parsed =
          JSON.parse(value);

        if (
          parsed &&
          typeof parsed === "object"
        ) {

          return (
            parsed.customer_id ||
            parsed.customerId ||
            parsed.id ||
            parsed.player_id ||
            parsed.playerId ||
            ""
          );

        }

      } catch {

        return value;

      }

    }

  }


  return "";

}


/* =========================================================
   GET CUSTOMER OBJECT
========================================================= */

function getStoredCustomer() {

  const keys = [
    "customer",
    "user",
    "balaji_customer",
    "currentCustomer"
  ];


  for (const key of keys) {

    const value =
      localStorage.getItem(key);

    if (!value) continue;


    try {

      const parsed =
        JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object"
      ) {

        if (
          parsed.customer &&
          typeof parsed.customer === "object"
        ) {

          return parsed.customer;

        }

        return parsed;

      }

    } catch {

      continue;

    }

  }


  return null;

}


/* =========================================================
   SUBMIT KYC
========================================================= */

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (successMessage) {

        successMessage.textContent = "";

      }


      const fullName =
        document.getElementById(
          "fullName"
        )?.value.trim() || "";


      const mobile =
        document.getElementById(
          "mobile"
        )?.value.trim() || "";


      const dob =
        document.getElementById(
          "dob"
        )?.value || "";


      const documentType =
        document.getElementById(
          "documentType"
        )?.value || "";


      const documentNumber =
        document.getElementById(
          "documentNumber"
        )?.value.trim() || "";


      const agreement =
        document.getElementById(
          "agreement"
        )?.checked || false;


      const customer =
        getStoredCustomer();


      const customerId =
        getCustomerId() ||
        customer?.customer_id ||
        customer?.customerId ||
        customer?.id ||
        "";


      /* =====================================================
         VALIDATION
      ===================================================== */

      if (!customerId) {

        alert(
          "Customer login information नहीं मिला। पहले Login करें।"
        );

        return;

      }


      if (fullName.length < 2) {

        alert(
          "पूरा नाम दर्ज करें।"
        );

        return;

      }


      if (!/^\d{10}$/.test(mobile)) {

        alert(
          "10 digit mobile number दर्ज करें।"
        );

        return;

      }


      if (!dob) {

        alert(
          "Date of Birth चुनें।"
        );

        return;

      }


      if (!documentType) {

        alert(
          "KYC document चुनें।"
        );

        return;

      }


      if (documentNumber.length < 4) {

        alert(
          "Document number दर्ज करें।"
        );

        return;

      }


      if (
        !documentFile ||
        documentFile.files.length === 0
      ) {

        alert(
          "KYC document upload करें।"
        );

        return;

      }


      if (
        !selfieFile ||
        selfieFile.files.length === 0
      ) {

        alert(
          "Selfie upload करें।"
        );

        return;

      }


      if (!agreement) {

        alert(
          "Declaration checkbox select करें।"
        );

        return;

      }


      /* =====================================================
         BUTTON
      ===================================================== */

      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "Submitting...";

      }


      try {


        /* ===================================================
           SEND TO WORKER
        =================================================== */

        const response =
          await fetch(
            "/api/kyc/submit",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({

                customer_id:
                  customerId,

                full_name:
                  fullName,

                mobile:
                  mobile,

                dob:
                  dob,

                document_type:
                  documentType,

                document_number:
                  documentNumber,

                document_file_name:
                  documentFile.files[0].name,

                selfie_file_name:
                  selfieFile.files[0].name

              })
            }
          );


        const data =
          await response.json();


        /* ===================================================
           ERROR
        =================================================== */

        if (!response.ok || !data.success) {

          throw new Error(
            data.error ||
            "KYC submission failed"
          );

        }


        /* ===================================================
           LOCAL SESSION UPDATE
        =================================================== */

        const submission = {

          id:
            data.kyc?.id || null,

          customer_id:
            customerId,

          full_name:
            fullName,

          mobile:
            mobile,

          dob:
            dob,

          document_type:
            documentType,

          status:
            "PENDING",

          submitted_at:
            data.kyc?.submitted_at ||
            Date.now()

        };


        localStorage.setItem(
          "balaji_kyc_submission",
          JSON.stringify(submission)
        );


        /* ===================================================
           STATUS
        =================================================== */

        if (statusText) {

          statusText.textContent =
            "KYC Status: Pending";

        }


        if (successMessage) {

          successMessage.textContent =
            "KYC submitted successfully. Your KYC is now Pending for Admin verification.";

        }


        alert(
          "KYC successfully submitted. Admin verification pending."
        );


        /* ===================================================
           RESET FILE INPUTS
        =================================================== */

        if (documentFile) {

          documentFile.value = "";

        }


        if (selfieFile) {

          selfieFile.value = "";

        }


        if (documentFileName) {

          documentFileName.textContent =
            "No file selected";

        }


        if (selfieFileName) {

          selfieFileName.textContent =
            "No file selected";

        }


      } catch (error) {

        console.error(
          "KYC Submit Error:",
          error
        );


        alert(
          error?.message ||
          "KYC submit नहीं हो पाया।"
        );

      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            "Submit KYC";

        }

      }

    }
  );

}


/* =========================================================
   BACK BUTTON
========================================================= */

const backButton =
  document.getElementById(
    "backButton"
  );


if (backButton) {

  backButton.addEventListener(
    "click",
    () => {

      if (window.history.length > 1) {

        window.history.back();

      } else {

        window.location.href = "/";

      }

    }
  );

}


/* =========================================================
   LOAD EXISTING KYC STATUS
========================================================= */

function loadKYCStatus() {

  const saved =
    localStorage.getItem(
      "balaji_kyc_submission"
    );


  if (!saved) return;


  try {

    const data =
      JSON.parse(saved);


    if (
      data &&
      data.status
    ) {

      if (statusText) {

        statusText.textContent =
          "KYC Status: " +
          data.status;

      }

    }

  } catch {

    // Ignore invalid local data

  }

}


loadKYCStatus();
