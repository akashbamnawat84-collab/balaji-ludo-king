const SESSION_COOKIE = "balaji_admin_session";
const SESSION_MAX_AGE = 86400;

// ======================================================
// MAIN WORKER
// ======================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // ADMIN LOGIN
    // =========================
    if (url.pathname === "/api/admin/login") {
      if (request.method !== "POST") {
        return json(
          { success: false, message: "Method not allowed" },
          405
        );
      }

      try {
        const body = await request.json();

        const adminId = String(body.adminId || "").trim();
        const password = String(body.password || "");

        const correctAdminId =
          String(env.BALAJI_ADMIN_ID || "").trim();

        const correctPassword =
          String(env.BALAJI_ADMIN_PASSWORD || "");

        if (
          !correctAdminId ||
          !correctPassword ||
          adminId !== correctAdminId ||
          password !== correctPassword
        ) {
          return json(
            {
              success: false,
              message: "Invalid Admin ID or Password.",
            },
            401
          );
        }

        const sessionToken = await createSessionToken(
          env,
          adminId
        );

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
                `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`,
            },
          }
        );
      } catch {
        return json(
          {
            success: false,
            message: "Invalid request.",
          },
          400
        );
      }
    }

    // =========================
    // CHECK ADMIN SESSION
    // =========================
    if (url.pathname === "/api/admin/session") {
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

    // =========================
    // ADMIN LOGOUT
    // =========================
    if (url.pathname === "/api/admin/logout") {
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
    // CUSTOMER + KYC API
    // ==================================================

    if (
      url.pathname === "/api/admin/customers" ||
      url.pathname.startsWith("/api/admin/customers/")
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

      const stub = env.CUSTOMER_STORE.get(id);

      return stub.fetch(request);
    }

    // =========================
    // PROTECT ADMIN DASHBOARD
    // =========================
    if (url.pathname === "/admin.html") {
      const valid = await verifySession(request, env);

      if (!valid) {
        return Response.redirect(
          `${url.origin}/admin-login.html`,
          302
        );
      }
    }

    // =========================
    // WEBSOCKET LUDO ROOM
    // =========================
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", {
          status: 426,
        });
      }

      const room = url.searchParams.get("room");

      if (!room || !/^\d{6}$/.test(room)) {
        return new Response("Invalid room code", {
          status: 400,
        });
      }

      const id = env.LUDO_ROOM.idFromName(room);
      const stub = env.LUDO_ROOM.get(id);

      return stub.fetch(request);
    }

    // =========================
    // WEBSITE FILES
    // =========================
    if (!env.ASSETS) {
      return new Response("ASSETS binding is missing", {
        status: 500,
      });
    }

    return env.ASSETS.fetch(request);
  },
};

// ======================================================
// SESSION TOKEN
// ======================================================

async function createSessionToken(env, adminId) {
  const timestamp = Date.now();

  const payload = `${adminId}:${timestamp}`;

  const signature = await signData(
    payload,
    env.BALAJI_ADMIN_PASSWORD
  );

  return `${timestamp}.${signature}`;
}

// ======================================================
// VERIFY SESSION
// ======================================================

async function verifySession(request, env) {
  try {
    const cookies = request.headers.get("Cookie") || "";

    const match = cookies.match(
      new RegExp(`${SESSION_COOKIE}=([^;]+)`)
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

    const payload = `${adminId}:${timestamp}`;

    const expectedSignature = await signData(
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

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  return arrayBufferToHex(signature);
}

// ======================================================
// TIMING SAFE COMPARISON
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
// ARRAY BUFFER → HEX
// ======================================================

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

// ======================================================
// JSON RESPONSE
// ======================================================

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
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

  init() {
    if (this.initialized) {
      return;
    }

    // =========================
    // CUSTOMERS TABLE
    // =========================

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

    // =========================
    // CUSTOMER KYC TABLE
    // =========================

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

    this.initialized = true;
  }

  async fetch(request) {
    this.init();

    const url = new URL(request.url);

    // ==================================================
    // GET CUSTOMERS
    // ==================================================

    if (
      request.method === "GET" &&
      url.pathname === "/api/admin/customers"
    ) {
      const rows = this.sql
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
      url.pathname === "/api/admin/customers"
    ) {
      try {
        const body = await request.json();

        const name = String(body.name || "").trim();
        const mobile = String(body.mobile || "").trim();

        if (!name) {
          return json(
            {
              success: false,
              message: "Customer name is required.",
            },
            400
          );
        }

        const now = Date.now();

        this.sql.exec(
          `
          INSERT INTO customers
          (name, mobile, wallet, status, created_at)
          VALUES (?, ?, 0, 'Active', ?)
          `,
          name,
          mobile,
          now
        );

        const customer = this.sql
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
          message: "Customer created.",
          customer,
        });
      } catch {
        return json(
          {
            success: false,
            message: "Unable to create customer.",
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
      const id = Number(
        url.pathname.split("/").pop()
      );

      const customer = this.sql
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
            message: "Customer not found.",
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
    // BLOCK / UNBLOCK CUSTOMER
    // ==================================================

    if (
      request.method === "PATCH" &&
      /^\/api\/admin\/customers\/\d+$/.test(
        url.pathname
      )
    ) {
      const id = Number(
        url.pathname.split("/").pop()
      );

      try {
        const body = await request.json();

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
          message: `Customer ${status}.`,
        });
      } catch {
        return json(
          {
            success: false,
            message: "Unable to update customer.",
          },
          400
        );
      }
    }

    // ==================================================
    // GET CUSTOMER KYC
    // ==================================================

    if (
      request.method === "GET" &&
      /^\/api\/admin\/customers\/\d+\/kyc$/.test(
        url.pathname
      )
    ) {
      const parts = url.pathname.split("/");
      const customerId = Number(parts[4]);

      const customer = this.sql
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
            message: "Customer not found.",
          },
          404
        );
      }

      const kyc = this.sql
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
    // CREATE / UPDATE CUSTOMER KYC
    // ==================================================

    if (
      request.method === "POST" &&
      /^\/api\/admin\/customers\/\d+\/kyc$/.test(
        url.pathname
      )
    ) {
      const parts = url.pathname.split("/");
      const customerId = Number(parts[4]);

      try {
        const body = await request.json();

        const documentType =
          String(body.documentType || "").trim();

        const documentNumber =
          String(body.documentNumber || "").trim();

        const documentUrl =
          String(body.documentUrl || "").trim();

        if (!documentType) {
          return json(
            {
              success: false,
              message: "Document type is required.",
            },
            400
          );
        }

        if (!documentNumber) {
          return json(
            {
              success: false,
              message: "Document number is required.",
            },
            400
          );
        }

        const customer = this.sql
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
              message: "Customer not found.",
            },
            404
          );
        }

        const now = Date.now();

        const existing = this.sql
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
            VALUES (?, ?, ?, ?, 'Pending', '', ?, NULL)
            `,
            customerId,
            documentType,
            documentNumber,
            documentUrl,
            now
          );
        }

        const kyc = this.sql
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
          message: "KYC submitted successfully.",
          kyc,
        });
      } catch {
        return json(
          {
            success: false,
            message: "Unable to save KYC.",
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
      const parts = url.pathname.split("/");
      const customerId = Number(parts[4]);

      try {
        const body = await request.json();

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

        const existing = this.sql
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
              message: "KYC record not found.",
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
          message: `KYC ${status}.`,
        });
      } catch {
        return json(
          {
            success: false,
            message: "Unable to update KYC.",
          },
          400
        );
      }
    }

    return json(
      {
        success: false,
        message: "Customer API endpoint not found.",
      },
      404
    );
  }
}

// ======================================================
// LUDO DURABLE OBJECT
// ======================================================

export class LudoRoom {
  constructor(state) {
    this.state = state;
    this.players = new Map();
    this.turnPlayerId = null;
  }

  async fetch(request) {
    if (
      request.headers.get("Upgrade") !== "websocket"
    ) {
      return new Response("Ludo Room Server");
    }

    const pair = new WebSocketPair();

    const client = pair[0];
    const server = pair[1];

    const url = new URL(request.url);

    const name =
      url.searchParams.get("name") ||
      "Player";

    // Maximum 2 players
    if (this.players.size >= 2) {
      server.accept();

      server.send(
        JSON.stringify({
          type: "ROOM_FULL",
          message: "Room already has 2 players.",
        })
      );

      server.close();

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    server.accept();

    const playerId = crypto.randomUUID();

    const player = {
      id: playerId,
      name: name.substring(0, 20),
      socket: server,
    };

    this.players.set(playerId, player);

    if (!this.turnPlayerId) {
      this.turnPlayerId = playerId;
    }

    server.send(
      JSON.stringify({
        type: "CONNECTED",
        playerId,
        playerNumber: this.players.size,
        players: this.getPlayers(),
      })
    );

    this.broadcastPlayers();

    server.addEventListener(
      "message",
      (event) => {
        this.handleMessage(
          playerId,
          event.data
        );
      }
    );

    server.addEventListener(
      "close",
      () => {
        this.players.delete(playerId);

        if (this.turnPlayerId === playerId) {
          const remainingPlayer =
            this.players.values().next().value;

          this.turnPlayerId =
            remainingPlayer
              ? remainingPlayer.id
              : null;
        }

        this.broadcastPlayers();
      }
    );

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  getPlayers() {
    return [
      ...this.players.values(),
    ].map((player) => ({
      id: player.id,
      name: player.name,
    }));
  }

  handleMessage(playerId, data) {
    try {
      const message = JSON.parse(data);

      if (message.type === "ROLL_DICE") {
        const player =
          this.players.get(playerId);

        if (!player) {
          return;
        }

        if (this.turnPlayerId !== playerId) {
          player.socket.send(
            JSON.stringify({
              type: "NOT_YOUR_TURN",
            })
          );

          return;
        }

        const dice =
          Math.floor(
            Math.random() * 6
          ) + 1;

        this.broadcast({
          type: "DICE_RESULT",
          playerId,
          playerName: player.name,
          dice,
        });

        if (dice !== 6) {
          this.changeTurn(playerId);
        }
      }

      if (message.type === "PING") {
        const player =
          this.players.get(playerId);

        if (player) {
          player.socket.send(
            JSON.stringify({
              type: "PONG",
            })
          );
        }
      }
    } catch {
      console.log("Invalid message");
    }
  }

  changeTurn(currentPlayerId) {
    const playerIds = [
      ...this.players.keys(),
    ];

    if (playerIds.length < 2) {
      return;
    }

    const currentIndex =
      playerIds.indexOf(currentPlayerId);

    const nextIndex =
      (currentIndex + 1) %
      playerIds.length;

    this.turnPlayerId =
      playerIds[nextIndex];

    this.broadcast({
      type: "TURN_UPDATE",
      playerId: this.turnPlayerId,
    });
  }

  broadcastPlayers() {
    this.broadcast({
      type: "PLAYERS_UPDATE",
      players: this.getPlayers(),
      turnPlayerId: this.turnPlayerId,
    });
  }

  broadcast(message) {
    const text = JSON.stringify(message);

    for (const player of this.players.values()) {
      try {
        player.socket.send(text);
      } catch {
        console.log("Send failed");
      }
    }
  }
}
