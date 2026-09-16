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

documentFile.addEventListener("change", () => {

if (documentFile.files.length > 0) {

  if (documentFileName) {
    documentFileName.textContent =
      documentFile.files[0].name;
  }

} else {

  if (documentFileName) {
    documentFileName.textContent =
      "No file selected";
  }

}

});

}

if (selfieFile) {

selfieFile.addEventListener("change", () => {

if (selfieFile.files.length > 0) {

  if (selfieFileName) {
    selfieFileName.textContent =
      selfieFile.files[0].name;
  }

} else {

  if (selfieFileName) {
    selfieFileName.textContent =
      "No file selected";
  }

}

});

}

/* =========================================================
FIND CUSTOMER DATA
========================================================= */

function readStorageObject(storage, key) {

try {

const value = storage.getItem(key);

if (!value) return null;

try {

  return JSON.parse(value);

} catch {

  return {
    value: value
  };

}

} catch {

return null;

}

}

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

const storages = [

localStorage,
sessionStorage

];

for (const storage of storages) {

for (const key of keys) {

  const data =
    readStorageObject(storage, key);

  if (!data) continue;


  if (
    data.customer &&
    typeof data.customer === "object"
  ) {

    return data.customer;

  }


  if (
    data.user &&
    typeof data.user === "object"
  ) {

    return data.user;

  }


  if (
    data.data &&
    typeof data.data === "object"
  ) {

    return data.data;

  }


  if (
    data.id ||
    data.customer_id ||
    data.customerId ||
    data.mobile ||
    data.phone
  ) {

    return data;

  }

}

}

return null;

}

/* =========================================================
GET CUSTOMER ID
========================================================= */

function getCustomerId(customer) {

if (customer) {

return (

  customer.customer_id ||
  customer.customerId ||
  customer.id ||
  customer.player_id ||
  customer.playerId ||
  ""

);

}

const keys = [

"customer_id",
"customerId",
"playerId",
"player_id"

];

for (const key of keys) {

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
GET REGISTERED MOBILE
========================================================= */

function getCustomerMobile(customer) {

if (!customer) return "";

return (

customer.mobile ||
customer.phone ||
customer.phone_number ||
customer.mobile_number ||
""

);

}

/* =========================================================
GET REGISTERED NAME
========================================================= */

function getCustomerName(customer) {

if (!customer) return "";

return (

customer.full_name ||
customer.fullName ||
customer.name ||
customer.username ||
""

);

}

/* =========================================================
LOAD CUSTOMER INFORMATION
========================================================= */

function loadCustomerInformation() {

const customer =
getStoredCustomer();

const customerId =
getCustomerId(customer);

const registeredMobile =
getCustomerMobile(customer);

const registeredName =
getCustomerName(customer);

const nameInput =
document.getElementById("fullName");

const mobileInput =
document.getElementById("mobile");

if (
nameInput &&
registeredName &&
!nameInput.value
) {

nameInput.value =
  registeredName;

}

if (
mobileInput &&
registeredMobile
) {

const cleanMobile =
  String(registeredMobile)
    .replace(/\D/g, "")
    .slice(-10);


if (/^\d{10}$/.test(cleanMobile)) {

  mobileInput.value =
    cleanMobile;


  /*
   * Registered mobile को manually बदलने से
   * mismatch नहीं होगा।
   */

  mobileInput.readOnly = true;

  mobileInput.setAttribute(
    "readonly",
    "readonly"
  );

}

}

return {

customer,
customerId,
registeredMobile:
  registeredMobile
    ? String(registeredMobile)
        .replace(/\D/g, "")
        .slice(-10)
    : ""

};

}

/* =========================================================
SUBMIT KYC
========================================================= */

if (form) {

form.addEventListener("submit", async (event) => {

event.preventDefault();


if (successMessage) {

  successMessage.textContent = "";

}


/*
 * Customer information फिर से पढ़ें
 */

const customerInfo =
  loadCustomerInformation();


const customer =
  customerInfo.customer;


const customerId =
  customerInfo.customerId;


const registeredMobile =
  customerInfo.registeredMobile;


const fullName =
  document.getElementById("fullName")
    ?.value
    .trim() || "";


/*
 * अगर registered mobile मिल गया है तो
 * वही भेजेंगे।
 *
 * User द्वारा manually बदला हुआ number
 * use नहीं होगा।
 */

const mobile =
  registeredMobile ||
  document.getElementById("mobile")
    ?.value
    .trim() || "";


const dob =
  document.getElementById("dob")
    ?.value || "";


const documentType =
  document.getElementById("documentType")
    ?.value || "";


const documentNumber =
  document.getElementById("documentNumber")
    ?.value
    .trim() || "";


const agreement =
  document.getElementById("agreement")
    ?.checked || false;


/* =====================================================
   VALIDATION
===================================================== */

if (!customerId) {

  alert(
    "Customer login information नहीं मिला। पहले Login करें।"
  );

  return;

}


if (!mobile) {

  alert(
    "Registered mobile number नहीं मिला। पहले Login करें।"
  );

  return;

}


if (!/^\d{10}$/.test(mobile)) {

  alert(
    "Registered mobile number सही नहीं है।"
  );

  return;

}


if (fullName.length < 2) {

  alert(
    "पूरा नाम दर्ज करें।"
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
     SEND KYC
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


  let data = null;


  try {

    data =
      await response.json();

  } catch {

    data = {};

  }


  /* ===================================================
     ERROR
  =================================================== */

  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data.error ||
      "KYC submission failed"
    );

  }


  /* ===================================================
     SAVE LOCAL KYC STATUS
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

});

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

/* =========================================================
INITIALIZE
========================================================= */

loadCustomerInformation();

loadKYCStatus();
