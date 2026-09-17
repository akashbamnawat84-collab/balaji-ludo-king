const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Balaji-Mobile"
};

const ROOM_WAIT_MS = 5 * 60 * 1000;
const REFERRAL_PERCENT = 3;

const BATTLE_WAIT_MS = 5 * 60 * 1000;
const RESULT_WINDOW_MS = 15 * 60 * 1000;

const MIN_BET = 50;
const MAX_BET = 10000;


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
   LOGIN MOBILE → CUSTOMER ID
========================================================= */

async function getPlayerIdFromRequest(request, env) {

  const mobile =
    clean(
      request.headers.get("X-Balaji-Mobile")
    ).replace(/\D/g, "");

  if (!validMobile(mobile)) {
    return "";
  }

  let customer =
    await env.DB.prepare(`
      SELECT *
      FROM customers
      WHERE mobile = ?
      LIMIT 1
    `)
    .bind(mobile)
    .first();

  if (customer?.id) {
    return clean(customer.id);
  }

  const customerId =
    "CUS" +
    crypto.randomUUID()
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase();

  const referralCode =
    await generateUniqueReferralCode(env);

  const createdAt =
    Date.now();

  try {

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

  } catch (error) {

    customer =
      await env.DB.prepare(`
        SELECT *
        FROM customers
        WHERE mobile = ?
        LIMIT 1
      `)
      .bind(mobile)
      .first();

    if (customer?.id) {
      return clean(customer.id);
    }

    throw error;
  }

  return customerId;
}


/* =========================================================
   BATTLE COMMISSION
========================================================= */

function calculateBattleCommission(amount) {

  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value < 250) {
    return Number(
      (value * 0.10).toFixed(2)
    );
  }

  if (value <= 500) {
    return 25;
  }

  return Number(
    (value * 0.05).toFixed(2)
  );
}


function calculateWinningPrize(amount) {

  const entry = Number(amount);

  const commission =
    calculateBattleCommission(entry);

  return Number(
    (entry * 2 - commission).toFixed(2)
  );
}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

const ADMIN_SESSION_TIME =
  6 * 60 * 60 * 1000;

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
    SELECT *
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
   BATTLE TABLE
========================================================= */

async function ensureBattleTable(env) {

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS battles (
      id INTEGER PRIMARY KEY,

      creator_id TEXT NOT NULL,
      joiner_id TEXT,

      creator_name TEXT NOT NULL,
      opponent_id TEXT,
      opponent_name TEXT,

      entry_fee REAL NOT NULL DEFAULT 0,
      entry_amount REAL NOT NULL DEFAULT 0,

      prize_amount REAL NOT NULL DEFAULT 0,
      winning_prize REAL NOT NULL DEFAULT 0,

      commission_amount REAL NOT NULL DEFAULT 0,

      room_code TEXT,

      status TEXT NOT NULL DEFAULT 'OPEN',

      winner_claimed_by TEXT,
      final_winner_id TEXT,

      result_player_id TEXT,
      result_status TEXT,

      screenshot_url TEXT DEFAULT '',
      result_screenshot TEXT DEFAULT '',

      cancel_reason TEXT DEFAULT '',

      created_at INTEGER NOT NULL,

      joined_at INTEGER,
      room_ready_at INTEGER,
      result_submitted_at INTEGER
    )
  `)
  .run();
}


/* =========================================================
   BATTLE RESPONSE
========================================================= */

function battleResponse(battle) {

  if (!battle) {
    return null;
  }

  return {

    id:
      battle.id,

    creator_id:
      battle.creator_id,

    creator_name:
      battle.creator_name,

    opponent_id:
      battle.opponent_id || null,

    opponent_name:
      battle.opponent_name || null,

    entry_amount:
      Number(
        battle.entry_amount ??
        battle.entry_fee ??
        0
      ),

    winning_prize:
      Number(
        battle.winning_prize ??
        battle.prize_amount ??
        0
      ),

    commission_amount:
      Number(
        battle.commission_amount || 0
      ),

    status:
      battle.status,

    room_code:
      battle.room_code || null,

    result_player_id:
      battle.result_player_id ||
      battle.final_winner_id ||
      null,

    result_status:
      battle.result_status || null,

    result_screenshot:
      battle.result_screenshot ||
      battle.screenshot_url ||
      "",

    cancel_reason:
      battle.cancel_reason || "",

    created_at:
      Number(
        battle.created_at || 0
      ),

    joined_at:
      battle.joined_at
        ? Number(battle.joined_at)
        : null,

    room_ready_at:
      battle.room_ready_at
        ? Number(battle.room_ready_at)
        : null,

    result_submitted_at:
      battle.result_submitted_at
        ? Number(battle.result_submitted_at)
        : null
  };
}


/* =========================================================
   GET BATTLE
========================================================= */

async function getBattle(env, battleId) {

  return env.DB.prepare(`
    SELECT *
    FROM battles
    WHERE id = ?
  `)
  .bind(battleId)
  .first();
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
          adminSessions.delete(token);
        }

        return json({

          success:
            true,

          message:
            "Admin logged out"

        });

      }


      /* =====================================================
         ADMIN SESSION
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
            success: false,
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
            success: false,
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
            success: false,
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
            success: false,
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
            success: false,
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
            success: false,
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
            success: false,
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
            success: false,
            error:
              "Referral code not found"
          }, 404);

        }

        if (
          referrer.id === customer.id
        ) {

          return json({
            success: false,
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
            success: false,
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
            success: false,
            error:
              "Referrer ID required"
          }, 400);

        }

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {

          return json({
            success: false,
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
            success: false,
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
         BATTLE - CREATE
      ===================================================== */

      if (
        path === "/api/battles/create" &&
        request.method === "POST"
      ) {

        await ensureBattleTable(env);

        const body =
          await request.json();

        let playerId =
          clean(
            body.player_id ||
            body.playerId ||
            body.customer_id ||
            body.customerId
          );

        if (!playerId) {

          playerId =
            await getPlayerIdFromRequest(
              request,
              env
            );

        }

        if (!playerId) {

          return json({
            success: false,
            error:
              "Player login required"
          }, 400);

        }

        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
            LIMIT 1
          `)
          .bind(playerId)
          .first();

        if (!customer) {

          return json({
            success: false,
            error:
              "Customer not found"
          }, 404);

        }

        const playerName =
          clean(
            body.player_name ||
            body.playerName ||
            customer.name ||
            "Player"
          );

        const amount =
          Number(
            body.amount ??
            body.entry_amount ??
            body.entryAmount
          );

        if (
          !Number.isFinite(amount) ||
          amount < MIN_BET ||
          amount > MAX_BET
        ) {

          return json({
            success: false,
            error:
              `Battle amount must be between ${MIN_BET} and ${MAX_BET} BALAJI LUDO Coin`
          }, 400);

        }

        if (
          amount % 50 !== 0
        ) {

          return json({
            success: false,
            error:
              "Battle amount must be in multiples of 50"
          }, 400);

        }

        const commission =
          calculateBattleCommission(
            amount
          );

        const prize =
          calculateWinningPrize(
            amount
          );

        const lastBattle =
          await env.DB.prepare(`
            SELECT MAX(id) AS max_id
            FROM battles
          `)
          .first();

        let battleId =
          Number(
            lastBattle?.max_id || 0
          ) + 1;

        const createdAt =
          Date.now();

        await env.DB.prepare(`
          INSERT INTO battles (
            id,
            creator_id,
            joiner_id,
            creator_name,
            opponent_id,
            opponent_name,
            entry_fee,
            entry_amount,
            prize_amount,
            winning_prize,
            commission_amount,
            room_code,
            status,
            winner_claimed_by,
            final_winner_id,
            result_player_id,
            result_status,
            screenshot_url,
            result_screenshot,
            cancel_reason,
            created_at,
            joined_at,
            room_ready_at,
            result_submitted_at
          )
          VALUES (
            ?,
            ?,
            NULL,
            ?,
            NULL,
            NULL,
            ?,
            ?,
            ?,
            ?,
            ?,
            NULL,
            'OPEN',
            NULL,
            NULL,
            NULL,
            NULL,
            '',
            '',
            '',
            ?,
            NULL,
            NULL,
            NULL
          )
        `)
        .bind(
          battleId,
          playerId,
          playerName,
          amount,
          amount,
          prize,
          prize,
          commission,
          createdAt
        )
        .run();

        const battle =
          await getBattle(
            env,
            battleId
          );

        return json({

          success:
            true,

          message:
            "Battle created successfully",

          battle:
            battleResponse(
              battle
            )

        });

      }


      /* =====================================================
         BATTLE - OPEN
      ===================================================== */

      if (
        path === "/api/battles/open" &&
        request.method === "GET"
      ) {

        await ensureBattleTable(env);

        const result =
          await env.DB.prepare(`
            SELECT *
            FROM battles
            WHERE status = 'OPEN'
            ORDER BY created_at DESC
          `)
          .all();

        const now =
          Date.now();

        const active = [];

        for (
          const battle of
          result.results || []
        ) {

          if (
            now -
            Number(battle.created_at) >=
            BATTLE_WAIT_MS
          ) {

            await env.DB.prepare(`
              UPDATE battles
              SET status = 'EXPIRED'
              WHERE id = ?
              AND status = 'OPEN'
            `)
            .bind(
              battle.id
            )
            .run();

            continue;
          }

          active.push(
            battleResponse(
              battle
            )
          );
        }

        return json({

          success:
            true,

          count:
            active.length,

          battles:
            active

        });

      }


      /* =====================================================
         BATTLE - MY
      ===================================================== */

      if (
        path === "/api/battles/my" &&
        request.method === "GET"
      ) {

        await ensureBattleTable(env);

        let playerId =
          clean(
            url.searchParams.get(
              "player_id"
            ) ||
            url.searchParams.get(
              "playerId"
            ) ||
            url.searchParams.get(
              "customer_id"
            ) ||
            url.searchParams.get(
              "customerId"
            )
          );

        if (!playerId) {

          playerId =
            await getPlayerIdFromRequest(
              request,
              env
            );

        }

        if (!playerId) {

          return json({
            success: false,
            error:
              "Player login required"
          }, 400);

        }

        const result =
          await env.DB.prepare(`
            SELECT *
            FROM battles
            WHERE creator_id = ?
            OR opponent_id = ?
            ORDER BY created_at DESC
            LIMIT 50
          `)
          .bind(
            playerId,
            playerId
          )
          .all();

        return json({

          success:
            true,

          count:
            result.results?.length || 0,

          battles:
            (
              result.results || []
            ).map(
              battleResponse
            )

        });

      }


      /* =====================================================
         BATTLE - GET
      ===================================================== */

      if (
        path.startsWith(
          "/api/battles/"
        ) &&
        request.method === "GET"
      ) {

        const battleId =
          clean(
            path.replace(
              "/api/battles/",
              ""
            )
          );

        if (!battleId) {

          return json({
            success: false,
            error:
              "Battle ID required"
          }, 400);

        }

        await ensureBattleTable(env);

        const battle =
          await getBattle(
            env,
            battleId
          );

        if (!battle) {

          return json({
            success: false,
            error:
              "Battle not found"
          }, 404);

        }

        return json({

          success:
            true,

          battle:
            battleResponse(
              battle
            )

        });

      }


      /* =====================================================
         BATTLE - JOIN
      ===================================================== */

      if (
        path === "/api/battles/join" &&
        request.method === "POST"
      ) {

        await ensureBattleTable(env);

        const body =
          await request.json();

        const battleId =
          clean(
            body.battle_id ||
            body.battleId
          );

        let playerId =
          clean(
            body.player_id ||
            body.playerId ||
            body.customer_id ||
            body.customerId
          );

        if (!playerId) {

          playerId =
            await getPlayerIdFromRequest(
              request,
              env
            );

        }

        const playerName =
          clean(
            body.player_name ||
            body.playerName ||
            "Player"
          );

        if (
          !battleId ||
          !playerId
        ) {

          return json({
            success: false,
            error:
              "Battle and player required"
          }, 400);

        }

        const battle =
          await getBattle(
            env,
            battleId
          );

        if (!battle) {

          return json({
            success: false,
            error:
              "Battle not found"
          }, 404);

        }

        if (
          battle.status !== "OPEN"
        ) {

          return json({
            success: false,
            error:
              "This Battle is no longer open"
          }, 409);

        }

        if (
          Date.now() -
          Number(battle.created_at) >=
          BATTLE_WAIT_MS
        ) {

          await env.DB.prepare(`
            UPDATE battles
            SET status = 'EXPIRED'
            WHERE id = ?
            AND status = 'OPEN'
          `)
          .bind(
            battleId
          )
          .run();

          return json({
            success: false,
            error:
              "⏰ Battle expired after 5 minutes"
          }, 410);

        }

        if (
          String(battle.creator_id) ===
          String(playerId)
        ) {

          return json({
            success: false,
            error:
              "You cannot join your own Battle"
          }, 409);

        }

        const opponent =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `)
          .bind(playerId)
          .first();

        if (!opponent) {

          return json({
            success: false,
            error:
              "Customer not found"
          }, 404);

        }

        const joinedAt =
          Date.now();

        const update =
          await env.DB.prepare(`
            UPDATE battles
            SET
              opponent_id = ?,
              opponent_name = ?,
              joiner_id = ?,
              status = 'JOINED',
              joined_at = ?
            WHERE id = ?
            AND status = 'OPEN'
            AND opponent_id IS NULL
          `)
          .bind(
            playerId,
            playerName ||
              opponent.name ||
              "Player",
            playerId,
            joinedAt,
            battleId
          )
          .run();

        if (
          !update.success ||
          Number(
            update.meta?.changes || 0
          ) !== 1
        ) {

          return json({
            success: false,
            error:
              "Battle was already joined by another player"
          }, 409);

        }

        const updated =
          await getBattle(
            env,
            battleId
          );

        return json({

          success:
            true,

          message:
            "Battle joined successfully",

          battle:
            battleResponse(
              updated
            )

        });

      }


      /* =====================================================
         BATTLE - ROOM CODE
      ===================================================== */

      if (
        path === "/api/battles/room-code" &&
        request.method === "POST"
      ) {

        await ensureBattleTable(env);

        const body =
          await request.json();

        const battleId =
          clean(
            body.battle_id ||
            body.battleId
          );

        let playerId =
          clean(
            body.player_id ||
            body.playerId ||
            body.customer_id ||
            body.customerId
          );

        if (!playerId) {

          playerId =
            await getPlayerIdFromRequest(
              request,
              env
            );

        }

        const roomCode =
          clean(
            body.room_code ||
            body.roomCode
          );

        if (
          !battleId ||
          !playerId
        ) {

          return json({
            success: false,
            error:
              "Battle and player required"
          }, 400);

        }

        if (
          !validRoomCode(roomCode)
        ) {

          return json({
            success: false,
            error:
              "8-digit Room Code required"
          }, 400);

        }

        const battle =
          await getBattle(
            env,
            battleId
          );

        if (!battle) {

          return json({
            success: false,
            error:
              "Battle not found"
          }, 404);

        }

        if (
          String(battle.creator_id) !==
          String(playerId)
        ) {

          return json({
            success: false,
            error:
              "Only Player 1 can set the Room Code"
          }, 403);

        }

        if (
          battle.status !== "JOINED" &&
          battle.status !== "ROOM_READY"
        ) {

          return json({
            success: false,
            error:
              "Battle is not ready for Room Code"
          }, 409);

        }

        const existingRoom =
          await getRoom(
            env,
            roomCode
          );

        if (existingRoom) {

          if (
            existingRoom.status === "WAITING" &&
            isExpired(
              existingRoom.created_at
            )
          ) {

            await deleteRoom(
              env,
              roomCode
            );

          } else {

            return json({
              success: false,
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
            ?, ?, ?, ?, ?, 'READY', ?
          )
        `)
        .bind(
          roomCode,
          battle.creator_id,
          battle.creator_name,
          battle.opponent_id,
          battle.opponent_name,
          createdAt
        )
        .run();

        await env.DB.prepare(`
          UPDATE battles
          SET
            room_code = ?,
            status = 'ROOM_READY',
            room_ready_at = ?
          WHERE id = ?
        `)
        .bind(
          roomCode,
          createdAt,
          battleId
        )
        .run();

        const updated =
          await getBattle(
            env,
            battleId
          );

        return json({

          success:
            true,

          message:
            "Room Code is ready",

          battle:
            battleResponse(
              updated
            )

        });

      }


      /* =====================================================
         BATTLE - CANCEL
      ===================================================== */

      if (
        path === "/api/battles/cancel" &&
        request.method === "POST"
      ) {

        await ensureBattleTable(env);

        const body =
          await request.json();

        const battleId =
          clean(
            body.battle_id ||
            body.battleId
          );

        let playerId =
          clean(
            body.player_id ||
            body.playerId ||
            body.customer_id ||
            body.customerId
          );

        if (!playerId) {

          playerId =
            await getPlayerIdFromRequest(
              request,
              env
            );

        }

        const reason =
          clean(
            body.reason ||
            body.cancel_reason
          );

        const validReasons = [
          "No Room Code",
          "Not Game Start",
          "Not Player Join",
          "Opposite Error",
          "No Fresh ID",
          "No Token Open",
          "Other"
        ];

        if (
          !battleId ||
          !playerId
        ) {

          return json({
            success: false,
            error:
              "Battle and player required"
          }, 400);

        }

        if (
          !validReasons.includes(
            reason
          )
        ) {

          return json({
            success: false,
            error:
              "Valid cancellation reason required"
          }, 400);

        }

        const battle =
          await getBattle(
            env,
            battleId
          );

        if (!battle) {

          return json({
            success: false,
            error:
              "Battle not found"
          }, 404);

        }

        if (
          String(battle.creator_id) !==
            String(playerId) &&
          String(battle.opponent_id) !==
            String(playerId)
        ) {

          return json({
            success: false,
            error:
              "You are not part of this Battle"
          }, 403);

        }

        if (
          [
            "CANCELLED",
            "FINAL_CANCEL",
            "FINAL_WIN",
            "FINAL_LOSS"
          ].includes(
            battle.status
          )
        ) {

          return json({
            success: false,
            error:
              "Battle result has already been submitted"
          }, 409);

        }

        await env.DB.prepare(`
          UPDATE battles
          SET
            status = 'CANCELLED',
            cancel_reason = ?,
            result_player_id = ?,
            result_status = 'CANCELLED',
            result_submitted_at = ?
          WHERE id = ?
        `)
        .bind(
          reason,
          playerId,
          Date.now(),
          battleId
        )
        .run();

        if (
          battle.room_code
        ) {

          await env.DB.prepare(`
            UPDATE rooms
            SET status = 'CANCELLED'
            WHERE room_code = ?
          `)
          .bind(
            battle.room_code
          )
          .run();

        }

        const updated =
          await getBattle(
            env,
            battleId
          );

        return json({

          success:
            true,

          message:
            "Cancellation submitted. Final decision will be according to Admin rules.",

          battle:
            battleResponse(
              updated
            )

        });

      }


      /* =====================================================
         BATTLE - RESULT
      ===================================================== */

      if (
        path === "/api/battles/result" &&
        request.method === "POST"
      ) {

        await ensureBattleTable(env);

        const body =
          await request.json();

        const battleId =
          clean(
            body.battle_id ||
            body.battleId
          );

        let playerId =
          clean(
            body.player_id ||
            body.playerId ||
            body.customer_id ||
            body.customerId
          );

        if (!playerId) {

          playerId =
            await getPlayerIdFromRequest(
              request,
              env
            );

        }

        const resultStatus =
          clean(
            body.result_status ||
            body.resultStatus ||
            body.result
          ).toUpperCase();

        const screenshot =
          clean(
            body.screenshot ||
            body.result_screenshot
          );

        if (
          !battleId ||
          !playerId
        ) {

          return json({
            success: false,
            error:
              "Battle and player required"
          }, 400);

        }

        if (
          ![
            "WON",
            "LOST"
          ].includes(
            resultStatus
          )
        ) {

          return json({
            success: false,
            error:
              "Result must be WON or LOST"
          }, 400);

        }

        if (!screenshot) {

          return json({
            success: false,
            error:
              "Screenshot required"
          }, 400);

        }

        const battle =
          await getBattle(
            env,
            battleId
          );

        if (!battle) {

          return json({
            success: false,
            error:
              "Battle not found"
          }, 404);

        }

        if (
          String(battle.creator_id) !==
            String(playerId) &&
          String(battle.opponent_id) !==
            String(playerId)
        ) {

          return json({
            success: false,
            error:
              "You are not part of this Battle"
          }, 403);

        }

        if (
          battle.status === "CANCELLED" ||
          battle.status === "FINAL_CANCEL" ||
          battle.status === "FINAL_WIN" ||
          battle.status === "FINAL_LOSS" ||
          battle.result_status
        ) {

          return json({
            success: false,
            error:
              "Result has already been submitted and cannot be changed"
          }, 409);

        }

        if (
          battle.status !== "ROOM_READY"
        ) {

          return json({
            success: false,
            error:
              "Battle is not ready for result"
          }, 409);

        }

        if (
          battle.room_ready_at &&
          Date.now() -
          Number(battle.room_ready_at) >
          RESULT_WINDOW_MS
        ) {

          return json({
            success: false,
            error:
              "⏰ Result submission window has expired"
          }, 410);

        }

        const submittedAt =
          Date.now();

        const update =
          await env.DB.prepare(`
            UPDATE battles
            SET
              result_player_id = ?,
              result_status = ?,
              result_screenshot = ?,
              screenshot_url = ?,
              result_submitted_at = ?,
              status = 'RESULT_SUBMITTED'
            WHERE id = ?
            AND result_status IS NULL
          `)
          .bind(
            playerId,
            resultStatus,
            screenshot,
            screenshot,
            submittedAt,
            battleId
          )
          .run();

        if (
          !update.success ||
          Number(
            update.meta?.changes || 0
          ) !== 1
        ) {

          return json({
            success: false,
            error:
              "Result could not be submitted"
          }, 409);

        }

        const updated =
          await getBattle(
            env,
            battleId
          );

        return json({

          success:
            true,

          message:
            "Result submitted successfully. Final decision is subject to Admin review.",

          battle:
            battleResponse(
              updated
            )

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
            success: false,
            error:
              "Customer ID required"
          }, 400);

        }

        if (
          fullName.length < 2
        ) {

          return json({
            success: false,
            error:
              "Full name required"
          }, 400);

        }

        if (
          !validMobile(mobile)
        ) {

          return json({
            success: false,
            error:
              "Valid 10-digit mobile number required"
          }, 400);

        }

        if (!dob) {

          return json({
            success: false,
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
            success: false,
            error:
              "Valid KYC document type required"
          }, 400);

        }

        if (
          documentNumber.length < 4
        ) {

          return json({
            success: false,
            error:
              "Document number required"
          }, 400);

        }

        if (!documentFileName) {

          return json({
            success: false,
            error:
              "KYC document upload required"
          }, 400);

        }

        if (!selfieFileName) {

          return json({
            success: false,
            error:
              "Selfie upload required"
          }, 400);

        }

        await ensureKYCTable(env);

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
            success: false,
            error:
              "Customer not found"
          }, 404);

        }

        if (
          String(customer.mobile) !==
          String(mobile)
        ) {

          return json({
            success: false,
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
         GET CUSTOMER KYC STATUS
      ===================================================== */

      if (
        path.startsWith("/api/kyc/") &&
        path !== "/api/kyc/submit" &&
        request.method === "GET"
      ) {

        const customerId =
          clean(
            path.replace(
              "/api/kyc/",
              ""
            )
          );

        if (!customerId) {

          return json({
            success: false,
            error:
              "Customer ID required"
          }, 400);

        }

        await ensureKYCTable(env);

        const kyc =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            WHERE customer_id = ?
            ORDER BY id DESC
            LIMIT 1
          `)
          .bind(customerId)
          .first();

        return json({

          success: true,

          kyc:
            kyc || null

        });

      }


      /* =====================================================
         ADMIN - KYC PENDING
      ===================================================== */

      if (
        path === "/api/admin/kyc/pending" &&
        request.method === "GET"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        await ensureKYCTable(env);

        const result =
          await env.DB.prepare(`
            SELECT *
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

          kycs:
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

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        await ensureKYCTable(env);

        const result =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            ORDER BY submitted_at DESC
            LIMIT 500
          `)
          .all();

        return json({

          success:
            true,

          count:
            result.results?.length || 0,

          kycs:
            result.results || []

        });

      }


      /* =====================================================
         ADMIN - KYC APPROVE
      ===================================================== */

      if (
        path === "/api/admin/kyc/approve" &&
        request.method === "POST"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        await ensureKYCTable(env);

        const body =
          await request.json();

        const kycId =
          clean(
            body.kyc_id ||
            body.kycId ||
            body.id
          );

        if (!kycId) {

          return json({
            success: false,
            error:
              "KYC ID required"
          }, 400);

        }

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
            success: false,
            error:
              "KYC submission not found"
          }, 404);

        }

        if (
          String(kyc.status).toUpperCase() !==
          "PENDING"
        ) {

          return json({
            success: false,
            error:
              "This KYC has already been reviewed"
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
          AND status = 'PENDING'
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

        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            WHERE id = ?
          `)
          .bind(kycId)
          .first();

        return json({

          success:
            true,

          message:
            "KYC approved successfully",

          kyc:
            updated

        });

      }


      /* =====================================================
         ADMIN - KYC REJECT
      ===================================================== */

      if (
        path === "/api/admin/kyc/reject" &&
        request.method === "POST"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        await ensureKYCTable(env);

        const body =
          await request.json();

        const kycId =
          clean(
            body.kyc_id ||
            body.kycId ||
            body.id
          );

        const reason =
          clean(
            body.reason ||
            body.rejection_reason ||
            "KYC rejected by Admin"
          );

        if (!kycId) {

          return json({
            success: false,
            error:
              "KYC ID required"
          }, 400);

        }

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
            success: false,
            error:
              "KYC submission not found"
          }, 404);

        }

        if (
          String(kyc.status).toUpperCase() !==
          "PENDING"
        ) {

          return json({
            success: false,
            error:
              "This KYC has already been reviewed"
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
          AND status = 'PENDING'
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

        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM kyc_submissions
            WHERE id = ?
          `)
          .bind(kycId)
          .first();

        return json({

          success:
            true,

          message:
            "KYC rejected successfully",

          kyc:
            updated

        });

      }


      /* =====================================================
         ADMIN - BATTLES
      ===================================================== */

      if (
        path === "/api/admin/battles" &&
        request.method === "GET"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        await ensureBattleTable(env);

        const status =
          clean(
            url.searchParams.get("status")
          ).toUpperCase();

        let result;

        if (status) {

          result =
            await env.DB.prepare(`
              SELECT *
              FROM battles
              WHERE status = ?
              ORDER BY created_at DESC
              LIMIT 500
            `)
            .bind(status)
            .all();

        } else {

          result =
            await env.DB.prepare(`
              SELECT *
              FROM battles
              ORDER BY created_at DESC
              LIMIT 500
            `)
            .all();

        }

        return json({

          success:
            true,

          count:
            result.results?.length || 0,

          battles:
            (
              result.results || []
            ).map(
              battleResponse
            )

        });

      }


      /* =====================================================
         ADMIN - BATTLE DECISION
      ===================================================== */

      if (
        path === "/api/admin/battles/decision" &&
        request.method === "POST"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        await ensureBattleTable(env);

        const body =
          await request.json();

        const battleId =
          clean(
            body.battle_id ||
            body.battleId
          );

        const decision =
          clean(
            body.decision ||
            body.result ||
            body.status
          ).toUpperCase();

        const winnerId =
          clean(
            body.winner_id ||
            body.winnerId ||
            body.result_player_id
          );

        const reason =
          clean(
            body.reason ||
            body.cancel_reason
          );

        if (!battleId) {

          return json({
            success: false,
            error:
              "Battle ID required"
          }, 400);

        }

        if (
          ![
            "WIN",
            "LOSS",
            "CANCEL",
            "FINAL_WIN",
            "FINAL_LOSS",
            "FINAL_CANCEL"
          ].includes(
            decision
          )
        ) {

          return json({
            success: false,
            error:
              "Valid Admin decision required"
          }, 400);

        }

        const battle =
          await getBattle(
            env,
            battleId
          );

        if (!battle) {

          return json({
            success: false,
            error:
              "Battle not found"
          }, 404);

        }

        if (
          [
            "FINAL_WIN",
            "FINAL_LOSS",
            "FINAL_CANCEL"
          ].includes(
            battle.status
          )
        ) {

          return json({
            success: false,
            error:
              "Battle has already received a final decision"
          }, 409);

        }


        /* =================================================
           FINAL CANCEL
        ================================================= */

        if (
          decision === "CANCEL" ||
          decision === "FINAL_CANCEL"
        ) {

          await env.DB.prepare(`
            UPDATE battles
            SET
              status = 'FINAL_CANCEL',
              result_status = 'CANCELLED',
              cancel_reason = ?,
              result_submitted_at = ?
            WHERE id = ?
          `)
          .bind(
            reason ||
              "Cancelled by Admin",
            Date.now(),
            battleId
          )
          .run();

          if (
            battle.room_code
          ) {

            await env.DB.prepare(`
              UPDATE rooms
              SET status = 'CANCELLED'
              WHERE room_code = ?
            `)
            .bind(
              battle.room_code
            )
            .run();

          }

        } else {

          if (!winnerId) {

            return json({
              success: false,
              error:
                "Winner player ID required"
            }, 400);

          }

          const isCreator =
            String(
              battle.creator_id
            ) ===
            String(
              winnerId
            );

          const isOpponent =
            String(
              battle.opponent_id
            ) ===
            String(
              winnerId
            );

          if (
            !isCreator &&
            !isOpponent
          ) {

            return json({
              success: false,
              error:
                "Winner must be a player from this Battle"
            }, 400);

          }

          const finalStatus =
            decision === "FINAL_LOSS"
              ? "FINAL_LOSS"
              : "FINAL_WIN";

          await env.DB.prepare(`
            UPDATE battles
            SET
              status = ?,
              result_player_id = ?,
              result_status = 'WON',
              final_winner_id = ?,
              winner_claimed_by = ?,
              result_submitted_at = ?
            WHERE id = ?
          `)
          .bind(
            finalStatus,
            winnerId,
            winnerId,
            winnerId,
            Date.now(),
            battleId
          )
          .run();

          const prize =
            Number(
              battle.winning_prize ||
              battle.prize_amount ||
              0
            );

          if (prize > 0) {

            const winner =
              await env.DB.prepare(`
                SELECT *
                FROM customers
                WHERE id = ?
              `)
              .bind(
                winnerId
              )
              .first();

            if (winner) {

              await env.DB.prepare(`
                UPDATE customers
                SET
                  wallet_balance =
                    COALESCE(wallet_balance, 0) + ?,
                  coin_won =
                    COALESCE(coin_won, 0) + ?,
                  battle_played =
                    COALESCE(battle_played, 0) + 1
                WHERE id = ?
              `)
              .bind(
                prize,
                prize,
                winnerId
              )
              .run();

            }

          }

          const loserId =
            String(winnerId) ===
            String(battle.creator_id)
              ? battle.opponent_id
              : battle.creator_id;

          if (loserId) {

            await env.DB.prepare(`
              UPDATE customers
              SET
                battle_played =
                  COALESCE(battle_played, 0) + 1
              WHERE id = ?
            `)
            .bind(
              loserId
            )
            .run();

          }

        }

        const updated =
          await getBattle(
            env,
            battleId
          );

        return json({

          success:
            true,

          message:
            "Admin battle decision saved successfully",

          battle:
            battleResponse(
              updated
            )

        });

      }


      /* =====================================================
         ADMIN - CUSTOMER LIST
      ===================================================== */

      if (
        path === "/api/admin/customers" &&
        request.method === "GET"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        const result =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            ORDER BY created_at DESC
            LIMIT 500
          `)
          .all();

        return json({

          success:
            true,

          count:
            result.results?.length || 0,

          customers:
            (
              result.results || []
            ).map(
              customerResponse
            )

        });

      }


      /* =====================================================
         ADMIN - CUSTOMER ONE
      ===================================================== */

      if (
        path.startsWith("/api/admin/customer/") &&
        request.method === "GET"
      ) {

        if (!requireAdmin(request)) {

          return json({
            success: false,
            error:
              "Admin authentication required"
          }, 401);

        }

        const customerId =
          clean(
            path.replace(
              "/api/admin/customer/",
              ""
            )
          );

        if (!customerId) {

          return json({
            success: false,
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
            success: false,
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
         STATIC ASSETS
      ===================================================== */

      if (
        env.ASSETS
      ) {

        return env.ASSETS.fetch(
          request
        );

      }


      return new Response(
        "Balaji Ludo King Worker is running.",
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "text/plain; charset=UTF-8"
          }
        }
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
          "Internal Server Error"

      }, 500);

    }

  }

};
