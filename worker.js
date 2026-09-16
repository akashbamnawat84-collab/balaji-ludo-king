const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const ROOM_WAIT_MS = 5 * 60 * 1000;
const REFERRAL_PERCENT = 3;


/* =========================================================
   COMMON
========================================================= */

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

function clean(value) {
  return String(value ?? "").trim();
}

function validRoomCode(code) {
  return /^\d{8}$/.test(clean(code));
}

function validMobile(mobile) {
  return /^\d{10}$/.test(clean(mobile));
}

function isExpired(createdAt) {
  const time = Number(createdAt);

  return (
    !Number.isFinite(time) ||
    Date.now() - time >= ROOM_WAIT_MS
  );
}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

/*
  Cloudflare Worker Secrets:

  BALAJI_ADMIN_ID
  BALAJI_ADMIN_PASSWORD

  Example:

  BALAJI_ADMIN_ID
  = Deepak Kumar Meena

  BALAJI_ADMIN_PASSWORD
  = आपका password
*/

const ADMIN_SESSION_TIME =
  6 * 60 * 60 * 1000;


/*
  Temporary in-memory admin sessions.

  NOTE:
  Cloudflare Worker isolates are temporary.
  This provides basic server-side session protection.
  A permanent multi-instance session system can be added
  later using Durable Objects or D1.
*/

const adminSessions = new Map();


function getAdminToken(request) {

  const authorization =
    request.headers.get("Authorization");

  if (!authorization) {
    return "";
  }

  if (
    authorization.startsWith("Bearer ")
  ) {

    return clean(
      authorization.slice(7)
    );

  }

  return "";
}


function createAdminToken() {

  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(
      byte =>
        byte.toString(16).padStart(2, "0")
    )
    .join("");
}


function saveAdminSession(token) {

  adminSessions.set(
    token,
    Date.now()
  );

}


function validAdminSession(token) {

  if (!token) {
    return false;
  }

  const createdAt =
    adminSessions.get(token);

  if (!createdAt) {
    return false;
  }

  if (
    Date.now() - createdAt >
    ADMIN_SESSION_TIME
  ) {

    adminSessions.delete(token);

    return false;
  }

  return true;
}


function requireAdmin(request) {

  const token =
    getAdminToken(request);

  return validAdminSession(token);

}


/* =========================================================
   CUSTOMER RESPONSE
========================================================= */

function customerResponse(customer) {

  return {

    id:
      customer.id,

    customer_id:
      customer.id,

    mobile:
      customer.mobile,

    phone:
      customer.mobile,

    name:
      customer.name,

    wallet_balance:
      Number(
        customer.wallet_balance || 0
      ),

    bonus_balance:
      Number(
        customer.bonus_balance || 0
      ),

    battle_played:
      Number(
        customer.battle_played || 0
      ),

    coin_won:
      Number(
        customer.coin_won || 0
      ),

    referral_code:
      customer.referral_code || "",

    referral_count:
      Number(
        customer.referral_count || 0
      ),

    referral_earned:
      Number(
        customer.referral_earned || 0
      ),

    withdrawal_amount:
      Number(
        customer.withdrawal_amount || 0
      ),

    email:
      customer.email || "",

    kyc_status:
      customer.kyc_status || "Pending",

    account_status:
      customer.account_status || "ACTIVE",

    created_at:
      customer.created_at

  };

}


/* =========================================================
   ROOM HELPERS
========================================================= */

async function getRoom(env, roomCode) {

  return env.DB.prepare(`
    SELECT
      room_code,
      player1_id,
      player1_name,
      player2_id,
      player2_name,
      status,
      result_screenshot,
      result_player_id,
      created_at
    FROM rooms
    WHERE room_code = ?
  `)
  .bind(roomCode)
  .first();

}


async function deleteRoom(env, roomCode) {

  await env.DB.prepare(
    "DELETE FROM rooms WHERE room_code = ?"
  )
  .bind(roomCode)
  .run();

}


/* =========================================================
   REFERRAL TABLE
========================================================= */

async function ensureReferralTable(env) {

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS referral_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id TEXT NOT NULL,
      referred_id TEXT NOT NULL UNIQUE,
      referral_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL
    )
  `)
  .run();

}


/* =========================================================
   UNIQUE REFERRAL CODE
========================================================= */

async function generateUniqueReferralCode(env) {

  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {

    const code =
      String(
        Math.floor(
          100000 +
          Math.random() * 900000
        )
      );

    const existing =
      await env.DB.prepare(`
        SELECT id
        FROM customers
        WHERE referral_code = ?
        LIMIT 1
      `)
      .bind(code)
      .first();

    if (!existing) {

      return code;

    }

  }

  throw new Error(
    "Unable to generate unique referral code"
  );

}


/* =========================================================
   REFERRAL SUMMARY
========================================================= */

async function getReferralSummary(
  env,
  customerId
) {

  await ensureReferralTable(env);

  const customer =
    await env.DB.prepare(`
      SELECT *
      FROM customers
      WHERE id = ?
    `)
    .bind(customerId)
    .first();

  if (!customer) {

    return null;

  }

  const referrals =
    await env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM referral_links
      WHERE referrer_id = ?
      AND status = 'ACTIVE'
    `)
    .bind(customerId)
    .first();

  return {

    customer_id:
      customer.id,

    referral_code:
      customer.referral_code || "",

    total_referral:
      Number(
        referrals?.total || 0
      ),

    total_earned:
      Number(
        customer.referral_earned || 0
      ),

    commission_percent:
      REFERRAL_PERCENT

  };

}


/* =========================================================
   CANCELLATION TABLE
========================================================= */

async function ensureCancellationTable(env) {

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS room_cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT NOT NULL,
      player_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
  .run();

}


/* =========================================================
   KYC TABLE
========================================================= */

async function ensureKYCTable(env) {

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      customer_id TEXT NOT NULL,

      full_name TEXT NOT NULL,

      mobile TEXT NOT NULL,

      dob TEXT NOT NULL,

      document_type TEXT NOT NULL,

      document_number TEXT NOT NULL,

      document_file_name TEXT DEFAULT '',

      selfie_file_name TEXT DEFAULT '',

      status TEXT NOT NULL DEFAULT 'PENDING',

      rejection_reason TEXT DEFAULT '',

      submitted_at INTEGER NOT NULL,

      reviewed_at INTEGER
    )
  `)
  .run();

}


/* =========================================================
   MAIN WORKER
========================================================= */

export default {

  async fetch(request, env) {

    if (
      request.method === "OPTIONS"
    ) {

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });

    }


    const url =
      new URL(request.url);

    const path =
      url.pathname;


    try {


      /* =====================================================
         ADMIN LOGIN
      ===================================================== */

      if (
        path === "/api/admin/login" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const adminId =
          clean(
            body.admin_id ||
            body.adminId ||
            body.username
          );


        const password =
          clean(
            body.password
          );


        if (
          !adminId ||
          !password
        ) {

          return json({
            success: false,
            error:
              "Admin ID and password required"
          }, 400);

        }


        const savedAdminId =
          clean(
            env.BALAJI_ADMIN_ID
          );


        const savedPassword =
          clean(
            env.BALAJI_ADMIN_PASSWORD
          );


        if (
          !savedAdminId ||
          !savedPassword
        ) {

          return json({
            success: false,
            error:
              "Admin authentication is not configured on the server"
          }, 500);

        }


        if (
          adminId !== savedAdminId ||
          password !== savedPassword
        ) {

          return json({
            success: false,
            error:
              "Invalid Admin ID or Password"
          }, 401);

        }


        const token =
          createAdminToken();


        saveAdminSession(token);


        return json({

          success:
            true,

          message:
            "Admin login successful",

          token,

          admin: {
            name:
              savedAdminId
          }

        });

      }


      /* =====================================================
         ADMIN LOGOUT
      ===================================================== */

      if (
        path === "/api/admin/logout" &&
        request.method === "POST"
      ) {

        const token =
          getAdminToken(request);


        if (token) {

          adminSessions.delete(
            token
          );

        }


        return json({

          success:
            true,

          message:
            "Admin logged out"

        });

      }


      /* =====================================================
         ADMIN SESSION CHECK
      ===================================================== */

      if (
        path === "/api/admin/session" &&
        request.method === "GET"
      ) {

        if (
          !requireAdmin(request)
        ) {

          return json({

            success:
              false,

            authenticated:
              false,

            error:
              "Admin authentication required"

          }, 401);

        }


        return json({

          success:
            true,

          authenticated:
            true

        });

      }


      /* =====================================================
         CUSTOMER LOGIN
      ===================================================== */

      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const mobile =
          clean(body.mobile);


        const otp =
          clean(body.otp);


        if (
          !validMobile(mobile)
        ) {

          return json({

            success:
              false,

            error:
              "Valid 10-digit mobile number required"

          }, 400);

        }


        if (otp) {

          if (
            !/^\d{6}$/.test(otp)
          ) {

            return json({

              success:
                false,

              error:
                "Valid 6-digit OTP required"

            }, 400);

          }


          let customer =
            await env.DB.prepare(`
              SELECT *
              FROM customers
              WHERE mobile = ?
            `)
            .bind(mobile)
            .first();


          if (!customer) {

            return json({

              success:
                false,

              error:
                "Mobile number not registered"

            }, 404);

          }


          if (
            !customer.referral_code
          ) {

            const newCode =
              await generateUniqueReferralCode(
                env
              );


            await env.DB.prepare(`
              UPDATE customers
              SET referral_code = ?
              WHERE id = ?
            `)
            .bind(
              newCode,
              customer.id
            )
            .run();


            customer =
              await env.DB.prepare(`
                SELECT *
                FROM customers
                WHERE id = ?
              `)
              .bind(customer.id)
              .first();

          }


          return json({

            success:
              true,

            existing:
              true,

            customer:
              customerResponse(
                customer
              )

          });

        }


        let existing =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE mobile = ?
          `)
          .bind(mobile)
          .first();


        if (existing) {

          if (
            !existing.referral_code
          ) {

            const newCode =
              await generateUniqueReferralCode(
                env
              );


            await env.DB.prepare(`
              UPDATE customers
              SET referral_code = ?
              WHERE id = ?
            `)
            .bind(
              newCode,
              existing.id
            )
            .run();


            existing =
              await env.DB.prepare(`
                SELECT *
                FROM customers
                WHERE id = ?
              `)
              .bind(existing.id)
              .first();

          }


          return json({

            success:
              true,

            existing:
              true,

            message:
              "OTP request accepted",

            customer:
              customerResponse(
                existing
              )

          });

        }


        const customerId =
          "CUS" +
          crypto.randomUUID()
            .replace(/-/g, "")
            .slice(0, 10)
            .toUpperCase();


        const referralCode =
          await generateUniqueReferralCode(
            env
          );


        const createdAt =
          Date.now();


        await env.DB.prepare(`
          INSERT INTO customers (
            id,
            mobile,
            name,
            wallet_balance,
            bonus_balance,
            battle_played,
            coin_won,
            referral_code,
            referral_count,
            referral_earned,
            withdrawal_amount,
            email,
            kyc_status,
            account_status,
            created_at
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
        `)
        .bind(
          customerId,
          mobile,
          "Player",
          0,
          0,
          0,
          0,
          referralCode,
          0,
          0,
          0,
          "",
          "Pending",
          "ACTIVE",
          createdAt
        )
        .run();


        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(customerId)
          .first();


        return json({

          success:
            true,

          existing:
            false,

          message:
            "OTP request accepted",

          customer:
            customerResponse(
              customer
            )

        });

      }


      /* =====================================================
         GET CUSTOMER

         SUPPORT:

         /api/customer/CUSTOMER_ID

         /api/customer?customer_id=CUSTOMER_ID

         /api/customer?customerId=CUSTOMER_ID
      ===================================================== */

      if (
        (
          path.startsWith(
            "/api/customer/"
          ) ||
          path === "/api/customer"
        ) &&
        request.method === "GET"
      ) {

        let customerId = "";


        if (
          path.startsWith(
            "/api/customer/"
          )
        ) {

          customerId =
            clean(
              path.replace(
                "/api/customer/",
                ""
              )
            );

        }


        if (!customerId) {

          customerId =
            clean(
              url.searchParams.get(
                "customer_id"
              ) ||
              url.searchParams.get(
                "customerId"
              )
            );

        }


        if (!customerId) {

          return json({

            success:
              false,

            error:
              "Customer ID required"

          }, 400);

        }


        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(customerId)
          .first();


        if (!customer) {

          return json({

            success:
              false,

            error:
              "Customer not found"

          }, 404);

        }


        return json({

          success:
            true,

          customer:
            customerResponse(
              customer
            )

        });

      }


      /* =====================================================
         UPDATE CUSTOMER
      ===================================================== */

      if (
        path === "/api/customer/update" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const customerId =
          clean(
            body.customer_id
          );


        const name =
          clean(
            body.name
          );


        const email =
          clean(
            body.email
          );


        if (!customerId) {

          return json({

            success:
              false,

            error:
              "Customer ID required"

          }, 400);

        }


        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(customerId)
          .first();


        if (!customer) {

          return json({

            success:
              false,

            error:
              "Customer not found"

          }, 404);

        }


        await env.DB.prepare(`
          UPDATE customers
          SET name = ?, email = ?
          WHERE id = ?
        `)
        .bind(
          name ||
            customer.name ||
            "Player",

          email,

          customerId
        )
        .run();


        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(customerId)
          .first();


        return json({

          success:
            true,

          customer:
            customerResponse(
              updated
            )

        });

      }


      /* =====================================================
         REFERRAL SUMMARY
      ===================================================== */

      if (
        path.startsWith(
          "/api/referral/"
        ) &&
        request.method === "GET"
      ) {

        const customerId =
          clean(
            path.replace(
              "/api/referral/",
              ""
            )
          );


        if (!customerId) {

          return json({

            success:
              false,

            error:
              "Customer ID required"

          }, 400);

        }


        const summary =
          await getReferralSummary(
            env,
            customerId
          );


        if (!summary) {

          return json({

            success:
              false,

            error:
              "Customer not found"

          }, 404);

        }


        return json({

          success:
            true,

          referral:
            summary

        });

      }


      /* =====================================================
         CLAIM REFERRAL
      ===================================================== */

      if (
        path === "/api/referral/claim" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const customerId =
          clean(
            body.customer_id ||
            body.customerId
          );


        const referralCode =
          clean(
            body.referral_code ||
            body.referralCode ||
            body.ref
          );


        if (!customerId) {

          return json({

            success:
              false,

            error:
              "Customer ID required"

          }, 400);

        }


        if (
          !/^\d{6}$/.test(
            referralCode
          )
        ) {

          return json({

            success:
              false,

            error:
              "Valid 6-digit referral code required"

          }, 400);

        }


        await ensureReferralTable(env);


        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(customerId)
          .first();


        if (!customer) {

          return json({

            success:
              false,

            error:
              "Customer not found"

          }, 404);

        }


        const referrer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE referral_code = ?
            LIMIT 1
          `)
          .bind(referralCode)
          .first();


        if (!referrer) {

          return json({

            success:
              false,

            error:
              "Referral code not found"

          }, 404);

        }


        if (
          referrer.id === customer.id
        ) {

          return json({

            success:
              false,

            error:
              "You cannot use your own referral code"

          }, 400);

        }


        const alreadyReferred =
          await env.DB.prepare(`
            SELECT *
            FROM referral_links
            WHERE referred_id = ?
            LIMIT 1
          `)
          .bind(customer.id)
          .first();


        if (alreadyReferred) {

          return json({

            success:
              false,

            error:
              "Referral already applied"

          }, 409);

        }


        await env.DB.prepare(`
          INSERT INTO referral_links (
            referrer_id,
            referred_id,
            referral_code,
            status,
            created_at
          )
          VALUES (?, ?, ?, 'ACTIVE', ?)
        `)
        .bind(
          referrer.id,
          customer.id,
          referralCode,
          Date.now()
        )
        .run();


        await env.DB.prepare(`
          UPDATE customers
          SET referral_count =
            COALESCE(referral_count, 0) + 1
          WHERE id = ?
        `)
        .bind(
          referrer.id
        )
        .run();


        return json({

          success:
            true,

          message:
            "Referral applied successfully",

          referrer_id:
            referrer.id,

          referral_code:
            referralCode

        });

      }


      /* =====================================================
         REFERRAL COMMISSION
      ===================================================== */

      if (
        path === "/api/referral/commission" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const referrerId =
          clean(
            body.referrer_id ||
            body.referrerId
          );


        const amount =
          Number(
            body.amount
          );


        if (!referrerId) {

          return json({

            success:
              false,

            error:
              "Referrer ID required"

          }, 400);

        }


        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {

          return json({

            success:
              false,

            error:
              "Valid amount required"

          }, 400);

        }


        await ensureReferralTable(env);


        const referrer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(referrerId)
          .first();


        if (!referrer) {

          return json({

            success:
              false,

            error:
              "Referrer not found"

          }, 404);

        }


        const commission =
          Number(
            (
              amount *
              REFERRAL_PERCENT /
              100
            ).toFixed(2)
          );


        await env.DB.prepare(`
          UPDATE customers
          SET referral_earned =
            COALESCE(referral_earned, 0) + ?
          WHERE id = ?
        `)
        .bind(
          commission,
          referrerId
        )
        .run();


        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(referrerId)
          .first();


        return json({

          success:
            true,

          commission_percent:
            REFERRAL_PERCENT,

          amount,

          commission,

          total_earned:
            Number(
              updated.referral_earned || 0
            )

        });

      }


      /* =====================================================
         CREATE ROOM
      ===================================================== */

      if (
        path === "/api/rooms/create" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          clean(
            body.player_id ||
            body.playerId
          );


        const playerName =
          clean(
            body.player_name ||
            body.playerName ||
            "Player"
          );


        const roomCode =
          clean(
            body.room_code ||
            body.roomCode
          );


        if (!playerId) {

          return json({

            success:
              false,

            error:
              "Player login required"

          }, 400);

        }


        if (
          !validRoomCode(
            roomCode
          )
        ) {

          return json({

            success:
              false,

            error:
              "8-digit Room Code required"

          }, 400);

        }


        const existing =
          await getRoom(
            env,
            roomCode
          );


        if (existing) {

          if (
            existing.status === "WAITING" &&
            isExpired(
              existing.created_at
            )
          ) {

            await deleteRoom(
              env,
              roomCode
            );

          } else {

            return json({

              success:
                false,

              error:
                "यह Room Code पहले से मौजूद है। दूसरा code डालें।"

            }, 409);

          }

        }


        const createdAt =
          Date.now();


        await env.DB.prepare(`
          INSERT INTO rooms (
            room_code,
            player1_id,
            player1_name,
            player2_id,
            player2_name,
            status,
            created_at
          )
          VALUES (
            ?, ?, ?, NULL, NULL, 'WAITING', ?
          )
        `)
        .bind(
          roomCode,
          playerId,
          playerName,
          createdAt
        )
        .run();


        return json({

          success:
            true,

          room: {

            room_code:
              roomCode,

            player1_id:
              playerId,

            player1_name:
              playerName,

            player2_id:
              null,

            player2_name:
              null,

            status:
              "WAITING",

            created_at:
              createdAt

          }

        });

      }


      /* =====================================================
         GET WAITING ROOM
      ===================================================== */

      if (
        path === "/api/rooms/waiting" &&
        request.method === "GET"
      ) {

        const room =
          await env.DB.prepare(`
            SELECT
              room_code,
              player1_id,
              player1_name,
              player2_id,
              player2_name,
              status,
              result_screenshot,
              result_player_id,
              created_at
            FROM rooms
            WHERE status = 'WAITING'
            ORDER BY created_at DESC
            LIMIT 1
          `)
          .first();


        if (!room) {

          return json({

            success:
              true,

            room:
              null

          });

        }


        if (
          isExpired(
            room.created_at
          )
        ) {

          await deleteRoom(
            env,
            room.room_code
          );


          return json({

            success:
              true,

            room:
              null

          });

        }


        return json({

          success:
            true,

          room

        });

      }


      /* =====================================================
         JOIN ROOM
      ===================================================== */

      if (
        path === "/api/rooms/join" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          clean(
            body.player_id ||
            body.playerId
          );


        const playerName =
          clean(
            body.player_name ||
            body.playerName ||
            "Player"
          );


        const roomCode =
          clean(
            body.room_code ||
            body.roomCode
          );


        if (!playerId) {

          return json({

            success:
              false,

            error:
              "Player login required"

          }, 400);

        }


        if (
          !validRoomCode(
            roomCode
          )
        ) {

          return json({

            success:
              false,

            error:
              "8-digit Room Code required"

          }, 400);

        }


        const room =
          await getRoom(
            env,
            roomCode
          );


        if (!room) {

          return json({

            success:
              false,

            error:
              "Room Code नहीं मिला।"

          }, 404);

        }


        if (
          room.status === "WAITING" &&
          isExpired(
            room.created_at
          )
        ) {

          await deleteRoom(
            env,
            roomCode
          );


          return json({

            success:
              false,

            error:
              "⏰ यह Room 5 मिनट बाद expire हो गया।"

          }, 410);

        }


        if (
          room.player1_id === playerId
        ) {

          return json({

            success:
              false,

            error:
              "Player 1 और Player 2 के लिए अलग mobile number इस्तेमाल करें।"

          }, 409);

        }


        if (room.player2_id) {

          return json({

            success:
              false,

            error:
              "यह Room पहले से full है।"

          }, 409);

        }


        const result =
          await env.DB.prepare(`
            UPDATE rooms
            SET
              player2_id = ?,
              player2_name = ?,
              status = 'READY'
            WHERE room_code = ?
            AND player2_id IS NULL
          `)
          .bind(
            playerId,
            playerName,
            roomCode
          )
          .run();


        if (!result.success) {

          return json({

            success:
              false,

            error:
              "Player 2 join नहीं कर पाया।"

          }, 500);

        }


        const updatedRoom =
          await getRoom(
            env,
            roomCode
          );


        if (
          !updatedRoom ||
          updatedRoom.player2_id !== playerId
        ) {

          return json({

            success:
              false,

            error:
              "Player 2 database में save नहीं हुआ।"

          }, 500);

        }


        return json({

          success:
            true,

          message:
            "Player 2 joined successfully 🎉",

          room:
            updatedRoom

        });

      }


      /* =====================================================
         GET ROOM
      ===================================================== */

      if (
        path.startsWith(
          "/api/rooms/"
        ) &&
        request.method === "GET"
      ) {

        const roomCode =
          path
            .replace(
              "/api/rooms/",
              ""
            )
            .trim();


        if (
          !validRoomCode(
            roomCode
          )
        ) {

          return json({

            success:
              false,

            error:
              "Invalid room code"

          }, 400);

        }


        const room =
          await getRoom(
            env,
            roomCode
          );


        if (!room) {

          return json({

            success:
              false,

            error:
              "Room not found"

          }, 404);

        }


        if (
          room.status === "WAITING" &&
          isExpired(
            room.created_at
          )
        ) {

          await deleteRoom(
            env,
            roomCode
          );


          return json({

            success:
              false,

            error:
              "Room expired"

          }, 410);

        }


        return json({

          success:
            true,

          room

        });

      }


      /* =====================================================
         CANCEL ROOM
      ===================================================== */

      if (
        path === "/api/rooms/cancel" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          clean(
            body.player_id ||
            body.player
          );


        const roomCode =
          clean(
            body.room_code ||
            body.roomCode
          );


        const reason =
          clean(
            body.reason ||
            body.cancel_reason
          );


        const validReasons = [

          "No Room Code",

          "Not Game Start",

          "Not Player Join",

          "Opposite Error"

        ];


        if (
          !playerId ||
          !validRoomCode(
            roomCode
          )
        ) {

          return json({

            success:
              false,

            error:
              "Player and valid Room Code required"

          }, 400);

        }


        if (
          !validReasons.includes(
            reason
          )
        ) {

          return json({

            success:
              false,

            error:
              "Valid cancellation reason required"

          }, 400);

        }


        const room =
          await getRoom(
            env,
            roomCode
          );


        if (!room) {

          return json({

            success:
              false,

            error:
              "Room not found"

          }, 404);

        }


        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {

          return json({

            success:
              false,

            error:
              "Not your room"

          }, 403);

        }


        await ensureCancellationTable(
          env
        );


        await env.DB.prepare(`
          INSERT INTO room_cancellations (
            room_code,
            player_id,
            reason,
            created_at
          )
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          roomCode,
          playerId,
          reason,
          Date.now()
        )
        .run();


        await deleteRoom(
          env,
          roomCode
        );


        return json({

          success:
            true,

          message:
            "Room cancelled successfully",

          reason

        });

      }


      /* =====================================================
         RESULT
      ===================================================== */

      if (
        path === "/api/rooms/result" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const playerId =
          clean(
            body.player_id ||
            body.playerId
          );


        const roomCode =
          clean(
            body.room_code ||
            body.roomCode
          );


        const screenshot =
          String(
            body.screenshot || ""
          );


        if (
          !playerId ||
          !validRoomCode(
            roomCode
          ) ||
          !screenshot
        ) {

          return json({

            success:
              false,

            error:
              "Player, room and screenshot required"

          }, 400);

        }


        const room =
          await getRoom(
            env,
            roomCode
          );


        if (!room) {

          return json({

            success:
              false,

            error:
              "Room not found"

          }, 404);

        }


        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {

          return json({

            success:
              false,

            error:
              "Player is not part of this room"

          }, 403);

        }


        await env.DB.prepare(`
          UPDATE rooms
          SET
            result_screenshot = ?,
            result_player_id = ?,
            status = 'RESULT_SUBMITTED'
          WHERE room_code = ?
        `)
        .bind(
          screenshot,
          playerId,
          roomCode
        )
        .run();


        return json({

          success:
            true,

          message:
            "Screenshot submitted successfully"

        });

      }


      /* =====================================================
         KYC SUBMIT
      ===================================================== */

      if (
        path === "/api/kyc/submit" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const customerId =
          clean(
            body.customer_id ||
            body.customerId
          );


        const fullName =
          clean(
            body.full_name ||
            body.fullName
          );


        const mobile =
          clean(
            body.mobile
          );


        const dob =
          clean(
            body.dob
          );


        const documentType =
          clean(
            body.document_type ||
            body.documentType
          );


        const documentNumber =
          clean(
            body.document_number ||
            body.documentNumber
          );


        const documentFileName =
          clean(
            body.document_file_name ||
            body.documentFileName
          );


        const selfieFileName =
          clean(
            body.selfie_file_name ||
            body.selfieFileName
          );


        if (!customerId) {

          return json({

            success:
              false,

            error:
              "Customer ID required"

          }, 400);

        }


        if (
          fullName.length < 2
        ) {

          return json({

            success:
              false,

            error:
              "Full name required"

          }, 400);

        }


        if (
          !validMobile(mobile)
        ) {

          return json({

            success:
              false,

            error:
              "Valid 10-digit mobile number required"

          }, 400);

        }


        if (!dob) {

          return json({

            success:
              false,

            error:
              "Date of birth required"

          }, 400);

        }


        const allowedDocuments = [

          "aadhaar",

          "pan",

          "voter",

          "driving-license"

        ];


        if (
          !allowedDocuments.includes(
            documentType
          )
        ) {

          return json({

            success:
              false,

            error:
              "Valid KYC document type required"

          }, 400);

        }


        if (
          documentNumber.length < 4
        ) {

          return json({

            success:
              false,

            error:
              "Document number required"

          }, 400);

        }


        if (!documentFileName) {

          return json({

            success:
              false,

            error:
              "KYC document upload required"

          }, 400);

        }


        if (!selfieFileName) {

          return json({

            success:
              false,

            error:
              "Selfie upload required"

          }, 400);

        }


        await ensureKYCTable(
          env
        );


        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(customerId)
          .first();


        if (!customer) {

          return json({

            success:
              false,

            error:
              "Customer not found"

          }, 404);

        }


        if (
          String(customer.mobile) !==
          String(mobile)
        ) {

          return json({

            success:
              false,

            error:
              "Mobile number does not match customer account"

          }, 403);

        }


        const pending =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            WHERE customer_id = ?
            AND status = 'PENDING'
            ORDER BY id DESC
            LIMIT 1
          `)
          .bind(customerId)
          .first();


        if (pending) {

          return json({

            success:
              true,

            already_pending:
              true,

            message:
              "Your KYC is already pending",

            kyc: {

              id:
                pending.id,

              status:
                pending.status,

              submitted_at:
                pending.submitted_at

            }

          });

        }


        const submittedAt =
          Date.now();


        const result =
          await env.DB.prepare(`
            INSERT INTO kyc_submissions (
              customer_id,
              full_name,
              mobile,
              dob,
              document_type,
              document_number,
              document_file_name,
              selfie_file_name,
              status,
              rejection_reason,
              submitted_at
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              'PENDING',
              '',
              ?
            )
          `)
          .bind(
            customerId,
            fullName,
            mobile,
            dob,
            documentType,
            documentNumber,
            documentFileName,
            selfieFileName,
            submittedAt
          )
          .run();


        await env.DB.prepare(`
          UPDATE customers
          SET kyc_status = 'Pending'
          WHERE id = ?
        `)
        .bind(customerId)
        .run();


        return json({

          success:
            true,

          message:
            "KYC submitted successfully",

          kyc: {

            id:
              result.meta?.last_row_id ||
              null,

            customer_id:
              customerId,

            status:
              "PENDING",

            submitted_at:
              submittedAt

          }

        });

      }


      /* =====================================================
         ADMIN API PROTECTION
         
         Every /api/admin/* endpoint below requires
         successful Admin Login.

         Login/logout/session are excluded because
         they handle authentication themselves.
      ===================================================== */

      if (
        path.startsWith(
          "/api/admin/"
        ) &&
        path !== "/api/admin/login" &&
        path !== "/api/admin/logout" &&
        path !== "/api/admin/session"
      ) {

        if (
          !requireAdmin(request)
        ) {

          return json({

            success:
              false,

            error:
              "Admin authentication required"

          }, 401);

        }

      }


      /* =====================================================
         ADMIN - PENDING KYC
      ===================================================== */

      if (
        path === "/api/admin/kyc/pending" &&
        request.method === "GET"
      ) {

        await ensureKYCTable(
          env
        );


        const result =
          await env.DB.prepare(`
            SELECT
              id,
              customer_id,
              full_name,
              mobile,
              dob,
              document_type,
              document_number,
              document_file_name,
              selfie_file_name,
              status,
              submitted_at
            FROM kyc_submissions
            WHERE status = 'PENDING'
            ORDER BY submitted_at DESC
          `)
          .all();


        return json({

          success:
            true,

          count:
            result.results?.length || 0,

          kyc:
            result.results || []

        });

      }


      /* =====================================================
         ADMIN - ALL KYC
      ===================================================== */

      if (
        path === "/api/admin/kyc/all" &&
        request.method === "GET"
      ) {

        await ensureKYCTable(
          env
        );


        const result =
          await env.DB.prepare(`
            SELECT
              id,
              customer_id,
              full_name,
              mobile,
              dob,
              document_type,
              document_number,
              document_file_name,
              selfie_file_name,
              status,
              rejection_reason,
              submitted_at,
              reviewed_at
            FROM kyc_submissions
            ORDER BY submitted_at DESC
          `)
          .all();


        return json({

          success:
            true,

          count:
            result.results?.length || 0,

          kyc:
            result.results || []

        });

      }


      /* =====================================================
         ADMIN - APPROVE KYC
      ===================================================== */

      if (
        path === "/api/admin/kyc/approve" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const kycId =
          Number(
            body.kyc_id ||
            body.kycId ||
            body.id
          );


        if (
          !Number.isInteger(
            kycId
          ) ||
          kycId <= 0
        ) {

          return json({

            success:
              false,

            error:
              "Valid KYC ID required"

          }, 400);

        }


        await ensureKYCTable(
          env
        );


        const kyc =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            WHERE id = ?
          `)
          .bind(kycId)
          .first();


        if (!kyc) {

          return json({

            success:
              false,

            error:
              "KYC submission not found"

          }, 404);

        }


        if (
          kyc.status !== "PENDING"
        ) {

          return json({

            success:
              false,

            error:
              "KYC is already reviewed"

          }, 409);

        }


        const reviewedAt =
          Date.now();


        await env.DB.prepare(`
          UPDATE kyc_submissions
          SET
            status = 'APPROVED',
            rejection_reason = '',
            reviewed_at = ?
          WHERE id = ?
        `)
        .bind(
          reviewedAt,
          kycId
        )
        .run();


        await env.DB.prepare(`
          UPDATE customers
          SET kyc_status = 'Approved'
          WHERE id = ?
        `)
        .bind(
          kyc.customer_id
        )
        .run();


        return json({

          success:
            true,

          message:
            "KYC approved successfully",

          kyc_id:
            kycId,

          status:
            "APPROVED"

        });

      }


      /* =====================================================
         ADMIN - REJECT KYC
      ===================================================== */

      if (
        path === "/api/admin/kyc/reject" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const kycId =
          Number(
            body.kyc_id ||
            body.kycId ||
            body.id
          );


        const reason =
          clean(
            body.reason ||
            body.rejection_reason ||
            "KYC rejected"
          );


        if (
          !Number.isInteger(
            kycId
          ) ||
          kycId <= 0
        ) {

          return json({

            success:
              false,

            error:
              "Valid KYC ID required"

          }, 400);

        }


        await ensureKYCTable(
          env
        );


        const kyc =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            WHERE id = ?
          `)
          .bind(kycId)
          .first();


        if (!kyc) {

          return json({

            success:
              false,

            error:
              "KYC submission not found"

          }, 404);

        }


        if (
          kyc.status !== "PENDING"
        ) {

          return json({

            success:
              false,

            error:
              "KYC is already reviewed"

          }, 409);

        }


        const reviewedAt =
          Date.now();


        await env.DB.prepare(`
          UPDATE kyc_submissions
          SET
            status = 'REJECTED',
            rejection_reason = ?,
            reviewed_at = ?
          WHERE id = ?
        `)
        .bind(
          reason,
          reviewedAt,
          kycId
        )
        .run();


        await env.DB.prepare(`
          UPDATE customers
          SET kyc_status = 'Rejected'
          WHERE id = ?
        `)
        .bind(
          kyc.customer_id
        )
        .run();


        return json({

          success:
            true,

          message:
            "KYC rejected successfully",

          kyc_id:
            kycId,

          status:
            "REJECTED",

          reason

        });

      }


      /* =====================================================
         KYC PAGE
      ===================================================== */

      if (
        path === "/kyc" ||
        path === "/kyc/"
      ) {

        const kycUrl =
          new URL(
            "/kyc/index.html",
            request.url
          );


        return env.ASSETS.fetch(
          new Request(
            kycUrl.toString(),
            request
          )
        );

      }


      /* =====================================================
         STATIC WEBSITE FILES
      ===================================================== */

      return env.ASSETS.fetch(
        request
      );


    } catch (error) {

      console.error(
        "Worker Error:",
        error
      );


      return json({

        success:
          false,

        error:
          error?.message ||
          "Server Error"

      }, 500);

    }

  }

};
