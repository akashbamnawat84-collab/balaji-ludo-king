// ======================================================
// BALAJI LUDO KING - CLOUDFLARE WORKER
// ADMIN + CUSTOMER + KYC + DEPOSIT + WITHDRAW + WALLET
// 2 PLAYER LUDO
// ======================================================

const SESSION_COOKIE = "balaji_admin_session";
const SESSION_MAX_AGE = 24 * 60 * 60;

// ======================================================
// MAIN WORKER
// ======================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {

      // ==================================================
      // ADMIN LOGIN
      // ==================================================

      if (
        request.method === "POST" &&
        url.pathname === "/api/admin/login"
      ) {
        try {
          const body = await request.json();

          const adminId = String(body.adminId || "").trim();
          const password = String(body.password || "");

          const validId =
            adminId === String(env.BALAJI_ADMIN_ID || "").trim();

          const validPassword =
            password === String(env.BALAJI_ADMIN_PASSWORD || "");

          if (!validId || !validPassword) {
            return json(
              {
                success: false,
                message: "Invalid Admin ID or Password.",
              },
              401
            );
          }

          const timestamp = Date.now();

          const signature = await signData(
            `${adminId}:${timestamp}`,
            env.BALAJI_ADMIN_PASSWORD
          );

          const token = `${timestamp}.${signature}`;

          return new Response(
            JSON.stringify({
              success: true,
              message: "Login successful.",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie":
                  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`,
              },
            }
          );

        } catch {
          return json(
            {
              success: false,
              message: "Invalid login request.",
            },
            400
          );
        }
      }

      // ==================================================
      // ADMIN SESSION CHECK
      // ==================================================

      if (
        request.method === "GET" &&
        url.pathname === "/api/admin/session"
      ) {
        const valid = await verifySession(request, env);

        if (!valid) {
          return json(
            {
              success: false,
              authenticated: false,
            },
            401
          );
        }

        return json({
          success: true,
          authenticated: true,
        });
      }

      // ==================================================
      // ADMIN LOGOUT
      // ==================================================

      if (
        request.method === "POST" &&
        url.pathname === "/api/admin/logout"
      ) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Logged out.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie":
                `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
            },
          }
        );
      }

      // ==================================================
      // CUSTOMER / KYC / WALLET / DEPOSIT / WITHDRAW
      // ==================================================

      if (
        url.pathname === "/api/admin/customers" ||
        url.pathname.startsWith("/api/admin/customers/") ||
        url.pathname.startsWith("/api/admin/deposits") ||
        url.pathname.startsWith("/api/admin/withdrawals") ||
        url.pathname.startsWith("/api/admin/wallet") ||
        url.pathname.startsWith("/api/admin/settings")
      ) {
        const valid = await verifySession(request, env);

        if (!valid) {
          return json(
            {
              success: false,
              message: "Unauthorized",
            },
            401
          );
        }

        const id =
          env.CUSTOMER_STORE.idFromName("customers");

        const stub =
          env.CUSTOMER_STORE.get(id);

        return stub.fetch(request);
      }

      // ==================================================
      // PROTECT ADMIN DASHBOARD
      // ==================================================

      if (url.pathname === "/admin.html") {
        const valid = await verifySession(request, env);

        if (!valid) {
          return Response.redirect(
            `${url.origin}/admin-login.html`,
            302
          );
        }
      }

      // ==================================================
      // LUDO WEBSOCKET
      // ==================================================

      if (url.pathname === "/ws") {
        const roomCode =
          url.searchParams.get("room") ||
          url.searchParams.get("roomCode") ||
          "default";

        const id =
          env.LUDO_ROOM.idFromName(roomCode);

        const stub =
          env.LUDO_ROOM.get(id);

        return stub.fetch(request);
      }

      // ==================================================
      // ASSETS
      // ==================================================

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response("Balaji Ludo King", {
        status: 200,
      });

    } catch (error) {
      return json(
        {
          success: false,
          message: "Server error.",
          error: String(error?.message || error),
        },
        500
      );
    }
  },
};

// ======================================================
// VERIFY SESSION
// ======================================================

async function verifySession(request, env) {
  try {
    const cookie =
      request.headers.get("Cookie") || "";

    const match =
      cookie.match(
        new RegExp(
          `${SESSION_COOKIE}=([^;]+)`
        )
      );

    if (!match) {
      return false;
    }

    const token = match[1];

    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const timestamp = Number(parts[0]);
    const signature = parts[1];

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    if (
      Date.now() - timestamp >
      SESSION_MAX_AGE * 1000
    ) {
      return false;
    }

    const adminId =
      String(env.BALAJI_ADMIN_ID || "").trim();

    const payload =
      `${adminId}:${timestamp}`;

    const expectedSignature =
      await signData(
        payload,
        env.BALAJI_ADMIN_PASSWORD
      );

    return timingSafeEqual(
      signature,
      expectedSignature
    );

  } catch {
    return false;
  }
}

// ======================================================
// SIGN DATA
// ======================================================

async function signData(data, secret) {
  const encoder = new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(String(secret || "")),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data)
    );

  return arrayBufferToHex(signature);
}

// ======================================================
// TIMING SAFE
// ======================================================

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return result === 0;
}

// ======================================================
// BUFFER TO HEX
// ======================================================

function arrayBufferToHex(buffer) {
  return [
    ...new Uint8Array(buffer),
  ]
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

// ======================================================
// JSON
// ======================================================

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );
}

// ======================================================
// CUSTOMER STORE
// ======================================================

export class CustomerStore {

  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;
    this.initialized = false;
  }

  // ==================================================
  // DATABASE
  // ==================================================

  init() {
    if (this.initialized) {
      return;
    }

    // --------------------------------------------------
    // CUSTOMERS
    // --------------------------------------------------

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT DEFAULT '',
        wallet REAL DEFAULT 0,
        status TEXT DEFAULT 'Active',
        created_at INTEGER NOT NULL
      )
    `);

    // --------------------------------------------------
    // KYC
    // --------------------------------------------------

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS customer_kyc (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL UNIQUE,
        document_type TEXT DEFAULT '',
        document_number TEXT DEFAULT '',
        document_url TEXT DEFAULT '',
        status TEXT DEFAULT 'Pending',
        rejection_reason TEXT DEFAULT '',
        submitted_at INTEGER,
        verified_at INTEGER,
        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
      )
    `);

    // --------------------------------------------------
    // DEPOSITS
    // --------------------------------------------------

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        utr TEXT DEFAULT '',
        note TEXT DEFAULT '',
        status TEXT DEFAULT 'Pending',
        created_at INTEGER NOT NULL,
        processed_at INTEGER,
        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
      )
    `);

    // --------------------------------------------------
    // WITHDRAWALS
    // --------------------------------------------------

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        upi_id TEXT DEFAULT '',
        qr_url TEXT DEFAULT '',
        note TEXT DEFAULT '',
        status TEXT DEFAULT 'Pending',
        created_at INTEGER NOT NULL,
        processed_at INTEGER,
        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
      )
    `);

    // --------------------------------------------------
    // WALLET LEDGER
    // --------------------------------------------------

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS wallet_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        reference_type TEXT DEFAULT '',
        reference_id INTEGER,
        note TEXT DEFAULT '',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
      )
    `);

    // --------------------------------------------------
    // UPI SETTINGS
    // --------------------------------------------------

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),

        deposit_upi_id TEXT DEFAULT '',
        deposit_qr_url TEXT DEFAULT '',

        withdraw_upi_id TEXT DEFAULT '',
        withdraw_qr_url TEXT DEFAULT '',

        updated_at INTEGER
      )
    `);

    this.sql.exec(`
      INSERT OR IGNORE INTO payment_settings
      (
        id,
        deposit_upi_id,
        deposit_qr_url,
        withdraw_upi_id,
        withdraw_qr_url,
        updated_at
      )
      VALUES
      (
        1,
        '',
        '',
        '',
        '',
        ?
      )
    `, Date.now());

    this.initialized = true;
  }

  // ==================================================
  // FETCH
  // ==================================================

  async fetch(request) {

    this.init();

    const url =
      new URL(request.url);

    // ==================================================
    // GET CUSTOMERS
    // ==================================================

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/admin/customers"
    ) {

      const rows =
        this.sql
          .exec(`
            SELECT
              id,
              name,
              mobile,
              wallet,
              status,
              created_at
            FROM customers
            ORDER BY id DESC
          `)
          .toArray();

      return json({
        success: true,
        customers: rows,
      });
    }

    // ==================================================
    // CREATE CUSTOMER
    // ==================================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/admin/customers"
    ) {

      try {

        const body =
          await request.json();

        const name =
          String(
            body.name || ""
          ).trim();

        const mobile =
          String(
            body.mobile || ""
          ).trim();

        if (!name) {
          return json(
            {
              success: false,
              message:
                "Customer name is required.",
            },
            400
          );
        }

        const now = Date.now();

        this.sql.exec(
          `
          INSERT INTO customers
          (
            name,
            mobile,
            wallet,
            status,
            created_at
          )
          VALUES
          (?, ?, 0, 'Active', ?)
          `,
          name,
          mobile,
          now
        );

        const customer =
          this.sql
            .exec(`
              SELECT
                id,
                name,
                mobile,
                wallet,
                status,
                created_at
              FROM customers
              ORDER BY id DESC
              LIMIT 1
            `)
            .toArray()[0];

        return json({
          success: true,
          message:
            "Customer created.",
          customer,
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to create customer.",
          },
          400
        );
      }
    }

    // ==================================================
    // CUSTOMER DETAILS
    // ==================================================

    if (
      request.method === "GET" &&
      /^\/api\/admin\/customers\/\d+$/.test(
        url.pathname
      )
    ) {

      const id =
        Number(
          url.pathname
            .split("/")
            .pop()
        );

      const customer =
        this.sql
          .exec(
            `
            SELECT
              id,
              name,
              mobile,
              wallet,
              status,
              created_at
            FROM customers
            WHERE id = ?
            `,
            id
          )
          .toArray()[0];

      if (!customer) {
        return json(
          {
            success: false,
            message:
              "Customer not found.",
          },
          404
        );
      }

      return json({
        success: true,
        customer,
      });
    }

    // ==================================================
    // BLOCK / UNBLOCK
    // ==================================================

    if (
      request.method === "PATCH" &&
      /^\/api\/admin\/customers\/\d+$/.test(
        url.pathname
      )
    ) {

      const id =
        Number(
          url.pathname
            .split("/")
            .pop()
        );

      try {

        const body =
          await request.json();

        const status =
          body.status === "Blocked"
            ? "Blocked"
            : "Active";

        this.sql.exec(
          `
          UPDATE customers
          SET status = ?
          WHERE id = ?
          `,
          status,
          id
        );

        return json({
          success: true,
          message:
            `Customer ${status}.`,
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to update customer.",
          },
          400
        );
      }
    }

    // ==================================================
    // GET KYC
    // ==================================================

    if (
      request.method === "GET" &&
      /^\/api\/admin\/customers\/\d+\/kyc$/.test(
        url.pathname
      )
    ) {

      const parts =
        url.pathname.split("/");

      const customerId =
        Number(parts[4]);

      const customer =
        this.sql
          .exec(
            `
            SELECT
              id,
              name,
              mobile,
              wallet,
              status,
              created_at
            FROM customers
            WHERE id = ?
            `,
            customerId
          )
          .toArray()[0];

      if (!customer) {
        return json(
          {
            success: false,
            message:
              "Customer not found.",
          },
          404
        );
      }

      const kyc =
        this.sql
          .exec(
            `
            SELECT
              id,
              customer_id,
              document_type,
              document_number,
              document_url,
              status,
              rejection_reason,
              submitted_at,
              verified_at
            FROM customer_kyc
            WHERE customer_id = ?
            `,
            customerId
          )
          .toArray()[0];

      return json({
        success: true,
        customer,
        kyc: kyc || null,
      });
    }

    // ==================================================
    // SAVE KYC
    // ==================================================

    if (
      request.method === "POST" &&
      /^\/api\/admin\/customers\/\d+\/kyc$/.test(
        url.pathname
      )
    ) {

      const parts =
        url.pathname.split("/");

      const customerId =
        Number(parts[4]);

      try {

        const body =
          await request.json();

        const documentType =
          String(
            body.documentType || ""
          ).trim();

        const documentNumber =
          String(
            body.documentNumber || ""
          ).trim();

        const documentUrl =
          String(
            body.documentUrl || ""
          ).trim();

        if (!documentType) {
          return json(
            {
              success: false,
              message:
                "Document type is required.",
            },
            400
          );
        }

        if (!documentNumber) {
          return json(
            {
              success: false,
              message:
                "Document number is required.",
            },
            400
          );
        }

        const customer =
          this.sql
            .exec(
              `
              SELECT id
              FROM customers
              WHERE id = ?
              `,
              customerId
            )
            .toArray()[0];

        if (!customer) {
          return json(
            {
              success: false,
              message:
                "Customer not found.",
            },
            404
          );
        }

        const now =
          Date.now();

        const existing =
          this.sql
            .exec(
              `
              SELECT id
              FROM customer_kyc
              WHERE customer_id = ?
              `,
              customerId
            )
            .toArray()[0];

        if (existing) {

          this.sql.exec(
            `
            UPDATE customer_kyc
            SET
              document_type = ?,
              document_number = ?,
              document_url = ?,
              status = 'Pending',
              rejection_reason = '',
              submitted_at = ?,
              verified_at = NULL
            WHERE customer_id = ?
            `,
            documentType,
            documentNumber,
            documentUrl,
            now,
            customerId
          );

        } else {

          this.sql.exec(
            `
            INSERT INTO customer_kyc
            (
              customer_id,
              document_type,
              document_number,
              document_url,
              status,
              rejection_reason,
              submitted_at,
              verified_at
            )
            VALUES
            (?, ?, ?, ?, 'Pending', '', ?, NULL)
            `,
            customerId,
            documentType,
            documentNumber,
            documentUrl,
            now
          );
        }

        return json({
          success: true,
          message:
            "KYC submitted successfully.",
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to save KYC.",
          },
          400
        );
      }
    }

    // ==================================================
    // VERIFY / REJECT KYC
    // ==================================================

    if (
      request.method === "PATCH" &&
      /^\/api\/admin\/customers\/\d+\/kyc$/.test(
        url.pathname
      )
    ) {

      const parts =
        url.pathname.split("/");

      const customerId =
        Number(parts[4]);

      try {

        const body =
          await request.json();

        const status =
          body.status === "Verified"
            ? "Verified"
            : body.status === "Rejected"
              ? "Rejected"
              : "Pending";

        const rejectionReason =
          String(
            body.rejectionReason || ""
          ).trim();

        const existing =
          this.sql
            .exec(
              `
              SELECT id
              FROM customer_kyc
              WHERE customer_id = ?
              `,
              customerId
            )
            .toArray()[0];

        if (!existing) {
          return json(
            {
              success: false,
              message:
                "KYC record not found.",
            },
            404
          );
        }

        const verifiedAt =
          status === "Verified"
            ? Date.now()
            : null;

        this.sql.exec(
          `
          UPDATE customer_kyc
          SET
            status = ?,
            rejection_reason = ?,
            verified_at = ?
          WHERE customer_id = ?
          `,
          status,
          rejectionReason,
          verifiedAt,
          customerId
        );

        return json({
          success: true,
          message:
            `KYC ${status}.`,
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to update KYC.",
          },
          400
        );
      }
    }

    // ==================================================
    // UPI SETTINGS - GET
    // ==================================================

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/admin/settings/upi"
    ) {

      const settings =
        this.sql
          .exec(`
            SELECT
              deposit_upi_id,
              deposit_qr_url,
              withdraw_upi_id,
              withdraw_qr_url,
              updated_at
            FROM payment_settings
            WHERE id = 1
          `)
          .toArray()[0];

      return json({
        success: true,
        settings,
      });
    }

    // ==================================================
    // UPI SETTINGS - SAVE
    // ==================================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/admin/settings/upi"
    ) {

      try {

        const body =
          await request.json();

        const depositUpiId =
          String(
            body.depositUpiId || ""
          ).trim();

        const depositQrUrl =
          String(
            body.depositQrUrl || ""
          ).trim();

        const withdrawUpiId =
          String(
            body.withdrawUpiId || ""
          ).trim();

        const withdrawQrUrl =
          String(
            body.withdrawQrUrl || ""
          ).trim();

        this.sql.exec(
          `
          UPDATE payment_settings
          SET
            deposit_upi_id = ?,
            deposit_qr_url = ?,
            withdraw_upi_id = ?,
            withdraw_qr_url = ?,
            updated_at = ?
          WHERE id = 1
          `,
          depositUpiId,
          depositQrUrl,
          withdrawUpiId,
          withdrawQrUrl,
          Date.now()
        );

        return json({
          success: true,
          message:
            "UPI settings saved.",
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to save UPI settings.",
          },
          400
        );
      }
    }

    // ==================================================
    // GET DEPOSITS
    // ==================================================

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/admin/deposits"
    ) {

      const rows =
        this.sql
          .exec(`
            SELECT
              d.id,
              d.customer_id,
              c.name AS customer_name,
              c.mobile,
              d.amount,
              d.utr,
              d.note,
              d.status,
              d.created_at,
              d.processed_at
            FROM deposits d
            JOIN customers c
              ON c.id = d.customer_id
            ORDER BY d.id DESC
          `)
          .toArray();

      return json({
        success: true,
        deposits: rows,
      });
    }

    // ==================================================
    // CREATE DEPOSIT
    // ==================================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/admin/deposits"
    ) {

      try {

        const body =
          await request.json();

        const customerId =
          Number(body.customerId);

        const amount =
          Number(body.amount);

        const utr =
          String(body.utr || "").trim();

        const note =
          String(body.note || "").trim();

        if (!Number.isInteger(customerId)) {
          return json(
            {
              success: false,
              message:
                "Invalid customer.",
            },
            400
          );
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          return json(
            {
              success: false,
              message:
                "Invalid deposit amount.",
            },
            400
          );
        }

        const customer =
          this.sql
            .exec(
              `
              SELECT id
              FROM customers
              WHERE id = ?
              `,
              customerId
            )
            .toArray()[0];

        if (!customer) {
          return json(
            {
              success: false,
              message:
                "Customer not found.",
            },
            404
          );
        }

        this.sql.exec(
          `
          INSERT INTO deposits
          (
            customer_id,
            amount,
            utr,
            note,
            status,
            created_at
          )
          VALUES
          (?, ?, ?, ?, 'Pending', ?)
          `,
          customerId,
          amount,
          utr,
          note,
          Date.now()
        );

        return json({
          success: true,
          message:
            "Deposit request created.",
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to create deposit.",
          },
          400
        );
      }
    }

    // ==================================================
    // DEPOSIT APPROVE / REJECT
    // ==================================================

    if (
      request.method === "PATCH" &&
      /^\/api\/admin\/deposits\/\d+$/.test(
        url.pathname
      )
    ) {

      const depositId =
        Number(
          url.pathname
            .split("/")
            .pop()
        );

      try {

        const body =
          await request.json();

        const requestedStatus =
          body.status === "Approved"
            ? "Approved"
            : body.status === "Rejected"
              ? "Rejected"
              : "Pending";

        const deposit =
          this.sql
            .exec(
              `
              SELECT
                id,
                customer_id,
                amount,
                status
              FROM deposits
              WHERE id = ?
              `,
              depositId
            )
            .toArray()[0];

        if (!deposit) {
          return json(
            {
              success: false,
              message:
                "Deposit not found.",
            },
            404
          );
        }

        // ----------------------------------------------
        // ALREADY PROCESSED
        // ----------------------------------------------

        if (deposit.status !== "Pending") {
          return json(
            {
              success: false,
              message:
                `Deposit already ${deposit.status}.`,
            },
            409
          );
        }

        // ----------------------------------------------
        // REJECT
        // ----------------------------------------------

        if (requestedStatus === "Rejected") {

          this.sql.exec(
            `
            UPDATE deposits
            SET
              status = 'Rejected',
              processed_at = ?
            WHERE id = ?
            `,
            Date.now(),
            depositId
          );

          return json({
            success: true,
            message:
              "Deposit rejected.",
          });
        }

        // ----------------------------------------------
        // APPROVE
        // ----------------------------------------------

        const customer =
          this.sql
            .exec(
              `
              SELECT
                id,
                wallet
              FROM customers
              WHERE id = ?
              `,
              deposit.customer_id
            )
            .toArray()[0];

        if (!customer) {
          return json(
            {
              success: false,
              message:
                "Customer not found.",
            },
            404
          );
        }

        const oldBalance =
          Number(customer.wallet || 0);

        const newBalance =
          oldBalance +
          Number(deposit.amount);

        // Update wallet
        this.sql.exec(
          `
          UPDATE customers
          SET wallet = ?
          WHERE id = ?
          `,
          newBalance,
          customer.id
        );

        // Update deposit
        this.sql.exec(
          `
          UPDATE deposits
          SET
            status = 'Approved',
            processed_at = ?
          WHERE id = ?
          `,
          Date.now(),
          depositId
        );

        // Ledger
        this.sql.exec(
          `
          INSERT INTO wallet_ledger
          (
            customer_id,
            type,
            amount,
            balance_after,
            reference_type,
            reference_id,
            note,
            created_at
          )
          VALUES
          (
            ?,
            'Deposit',
            ?,
            ?,
            'Deposit',
            ?,
            ?,
            ?
          )
          `,
          customer.id,
          Number(deposit.amount),
          newBalance,
          depositId,
          "Deposit approved",
          Date.now()
        );

        return json({
          success: true,
          message:
            "Deposit approved and wallet updated.",
          balance: newBalance,
        });

      } catch {
        return json(
          {
            success: false,
            message:
              "Unable to process deposit.",
          },
          400
        );
      }
    }

    // ==================================================
    // GET WITHDRAWALS
    // ==================================================

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/admin/withdrawals"
    ) {

      const rows =
        this.sql
          .exec(`
            SELECT
              w.id,
              w.customer_id,
              c.name AS customer_name,
              c.mobile,
              w.amount,
              w.upi_id,
              w.qr_url,
              w.note,
              w.status,
              w.created_at,
              w.processed_at
            FROM withdrawals w
            JOIN customers c
              ON c.id = w.customer_id
            ORDER BY w.id DESC
          `)
          .toArray();

      return json({
        success: true,
        withdrawals: rows,
      });
    }

    // ==================================================
    // CREATE WITHDRAWAL
    // ==================================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/admin/withdrawals"
    ) {

      try {

        const body =
          await request.json();

        const customerId =
          Number(body.customerId);

        const amount =
          Number(body.amount);

        const upiId =
          String(
            body.upiId || ""
          ).trim();

        const qrUrl =
          String(
            body.qrUrl || ""
          ).trim();

        const note =
          String(
            body.note || ""
          ).trim();

        if (!Number.isInteger(customerId)) {
          return json(
            {
              success: false,
              message:
                "Invalid customer.",
            },
            400
          );
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          return json(
            {
              success: false,
              message:
                "Invalid withdrawal amount.",
            },
            400
          );
        }

        if (!upiId && !qrUrl) {
          return json(
            {
              success: false,
              message:
                "UPI ID or QR Code is required.",
            },
            400
          );
        }

        const customer =
          this.sql
            .exec(
              `
              SELECT
                id,
                wallet,
                status
              FROM customers
              WHERE id = ?
              `,
              customerId
            )
            .toArray()[0];

        if (!customer) {
          return json(
            {
              success: false,
              message:
                "Customer not found.",
            },
            404
          );
        }

        if (customer.status === "Blocked") {
          return json(
            {
             
