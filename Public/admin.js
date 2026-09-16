/* =========================================================
   BALAJI LUDO KING
   ADMIN DASHBOARD JAVASCRIPT
========================================================= */

const pendingList = document.getElementById("pendingList");
const allList = document.getElementById("allList");

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const rejectedCount = document.getElementById("rejectedCount");
const totalCount = document.getElementById("totalCount");

const messageBox = document.getElementById("message");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text, type = "info") {

  if (!messageBox) return;

  messageBox.textContent = text;
  messageBox.className = `message ${type}`;

  setTimeout(() => {
    messageBox.textContent = "";
    messageBox.className = "message";
  }, 4000);
}


/* =========================================================
   HTML SECURITY
========================================================= */

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   MASK DOCUMENT NUMBER
========================================================= */

function maskDocumentNumber(value) {

  if (!value) {
    return "—";
  }

  const text = String(value);

  if (text.length <= 4) {
    return "****";
  }

  return "**** **** " + text.slice(-4);
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

  if (!value) {
    return "—";
  }

  try {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  } catch {

    return value;
  }
}


/* =========================================================
   LOAD PENDING KYC
========================================================= */

async function loadPendingKYC() {

  if (!pendingList) return;

  pendingList.innerHTML = `
    <div class="loading">
      Loading pending KYC...
    </div>
  `;

  try {

    const response = await fetch("/api/admin/kyc/pending");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load pending KYC");
    }

    const records = Array.isArray(data)
      ? data
      : (data.records || data.kyc || []);

    pendingCount.textContent = records.length;

    if (!records.length) {

      pendingList.innerHTML = `
        <div class="empty">
          No pending KYC found.
        </div>
      `;

      return;
    }

    pendingList.innerHTML = "";

    records.forEach(record => {

      pendingList.appendChild(
        createPendingCard(record)
      );

    });

  } catch (error) {

    console.error("Pending KYC error:", error);

    pendingList.innerHTML = `
      <div class="error">
        ${escapeHTML(error.message)}
      </div>
    `;

    showMessage(error.message, "error");
  }
}


/* =========================================================
   CREATE PENDING KYC CARD
========================================================= */

function createPendingCard(record) {

  const card = document.createElement("div");

  card.className = "kyc-card";

  card.innerHTML = `

    <div class="kyc-card-header">

      <div>
        <h3>
          ${escapeHTML(record.full_name || "Unknown User")}
        </h3>

        <span class="status pending">
          Pending
        </span>
      </div>

      <div class="customer-id">
        Customer ID:
        ${escapeHTML(record.customer_id || "—")}
      </div>

    </div>


    <div class="kyc-details">

      <div class="detail">
        <span>Mobile</span>
        <strong>
          ${escapeHTML(record.mobile || "—")}
        </strong>
      </div>

      <div class="detail">
        <span>Date of Birth</span>
        <strong>
          ${escapeHTML(record.dob || "—")}
        </strong>
      </div>

      <div class="detail">
        <span>Document</span>
        <strong>
          ${escapeHTML(record.document_type || "—")}
        </strong>
      </div>

      <div class="detail">
        <span>Document Number</span>
        <strong>
          ${escapeHTML(
            maskDocumentNumber(record.document_number)
          )}
        </strong>
      </div>

      <div class="detail">
        <span>Document File</span>
        <strong>
          ${escapeHTML(record.document_file_name || "—")}
        </strong>
      </div>

      <div class="detail">
        <span>Selfie File</span>
        <strong>
          ${escapeHTML(record.selfie_file_name || "—")}
        </strong>
      </div>

      <div class="detail full">
        <span>Submitted</span>
        <strong>
          ${escapeHTML(formatDate(record.submitted_at))}
        </strong>
      </div>

    </div>


    <div class="kyc-actions">

      <button
        class="approve-btn"
        data-id="${escapeHTML(record.id)}">

        ✓ Approve

      </button>

      <button
        class="reject-btn"
        data-id="${escapeHTML(record.id)}">

        ✕ Reject

      </button>

    </div>

  `;


  const approveButton =
    card.querySelector(".approve-btn");

  const rejectButton =
    card.querySelector(".reject-btn");


  approveButton.addEventListener(
    "click",
    () => approveKYC(record.id)
  );


  rejectButton.addEventListener(
    "click",
    () => rejectKYC(record.id)
  );


  return card;
}


/* =========================================================
   LOAD ALL KYC
========================================================= */

async function loadAllKYC() {

  if (!allList) return;

  allList.innerHTML = `
    <div class="loading">
      Loading KYC records...
    </div>
  `;

  try {

    const response =
      await fetch("/api/admin/kyc/all");

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to load KYC records"
      );
    }

    const records = Array.isArray(data)
      ? data
      : (data.records || data.kyc || []);

    totalCount.textContent = records.length;

    let approved = 0;
    let rejected = 0;

    records.forEach(record => {

      if (record.status === "Approved") {
        approved++;
      }

      if (record.status === "Rejected") {
        rejected++;
      }

    });

    approvedCount.textContent = approved;
    rejectedCount.textContent = rejected;


    if (!records.length) {

      allList.innerHTML = `
        <div class="empty">
          No KYC records found.
        </div>
      `;

      return;
    }


    allList.innerHTML = "";


    records.forEach(record => {

      allList.appendChild(
        createAllCard(record)
      );

    });


  } catch (error) {

    console.error("All KYC error:", error);

    allList.innerHTML = `
      <div class="error">
        ${escapeHTML(error.message)}
      </div>
    `;

    showMessage(error.message, "error");
  }
}


/* =========================================================
   CREATE ALL KYC CARD
========================================================= */

function createAllCard(record) {

  const card =
    document.createElement("div");

  card.className = "kyc-card";


  const status =
    record.status || "Pending";


  const statusClass =
    status.toLowerCase();


  card.innerHTML = `

    <div class="kyc-card-header">

      <div>

        <h3>
          ${escapeHTML(record.full_name || "Unknown User")}
        </h3>

        <span class="status ${escapeHTML(statusClass)}">
          ${escapeHTML(status)}
        </span>

      </div>

      <div class="customer-id">
        Customer ID:
        ${escapeHTML(record.customer_id || "—")}
      </div>

    </div>


    <div class="kyc-details">

      <div class="detail">
        <span>Mobile</span>
        <strong>
          ${escapeHTML(record.mobile || "—")}
        </strong>
      </div>

      <div class="detail">
        <span>Document</span>
        <strong>
          ${escapeHTML(record.document_type || "—")}
        </strong>
      </div>

      <div class="detail">
        <span>Document Number</span>
        <strong>
          ${escapeHTML(
            maskDocumentNumber(record.document_number)
          )}
        </strong>
      </div>

      <div class="detail">
        <span>Submitted</span>
        <strong>
          ${escapeHTML(formatDate(record.submitted_at))}
        </strong>
      </div>

      <div class="detail">
        <span>Reviewed</span>
        <strong>
          ${escapeHTML(formatDate(record.reviewed_at))}
        </strong>
      </div>

      ${
        record.rejection_reason
          ? `
            <div class="detail full">
              <span>Rejection Reason</span>
              <strong class="rejection-reason">
                ${escapeHTML(record.rejection_reason)}
              </strong>
            </div>
          `
          : ""
      }

    </div>

  `;


  return card;
}


/* =========================================================
   APPROVE KYC
========================================================= */

async function approveKYC(id) {

  if (!id) {
    showMessage("Invalid KYC ID", "error");
    return;
  }


  const confirmed =
    confirm(
      "Are you sure you want to approve this KYC?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const response =
      await fetch("/api/admin/kyc/approve", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          id: id
        })

      });


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error || "KYC approval failed"
      );

    }


    showMessage(
      "KYC approved successfully.",
      "success"
    );


    await refreshDashboard();


  } catch (error) {

    console.error(
      "Approve KYC error:",
      error
    );

    showMessage(
      error.message,
      "error"
    );

  }
}


/* =========================================================
   REJECT KYC
========================================================= */

async function rejectKYC(id) {

  if (!id) {

    showMessage(
      "Invalid KYC ID",
      "error"
    );

    return;
  }


  const reason =
    prompt(
      "Enter rejection reason:"
    );


  if (reason === null) {
    return;
  }


  const cleanReason =
    reason.trim();


  if (!cleanReason) {

    showMessage(
      "Rejection reason is required.",
      "error"
    );

    return;
  }


  try {

    const response =
      await fetch("/api/admin/kyc/reject", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          id: id,
          reason: cleanReason
        })

      });


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error || "KYC rejection failed"
      );

    }


    showMessage(
      "KYC rejected successfully.",
      "success"
    );


    await refreshDashboard();


  } catch (error) {

    console.error(
      "Reject KYC error:",
      error
    );

    showMessage(
      error.message,
      "error"
    );

  }
}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

async function refreshDashboard() {

  if (refreshBtn) {

    refreshBtn.disabled = true;
    refreshBtn.textContent = "Refreshing...";
  }


  try {

    await Promise.all([
      loadPendingKYC(),
      loadAllKYC()
    ]);

  } finally {

    if (refreshBtn) {

      refreshBtn.disabled = false;
      refreshBtn.textContent = "↻ Refresh";
    }

  }
}


/* =========================================================
   REFRESH BUTTON
========================================================= */

if (refreshBtn) {

  refreshBtn.addEventListener(
    "click",
    refreshDashboard
  );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "balaji_admin_session"
      );

      sessionStorage.removeItem(
        "balaji_admin_session"
      );

      window.location.href =
        "/admin-login.html";

    }
  );

}


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    refreshDashboard();

  }
);
