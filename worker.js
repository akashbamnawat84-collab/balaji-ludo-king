const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const ROOM_WAIT_MS = 5 * 60 * 1000;
const REFERRAL_PERCENT = 3;


/* =========================================================
   COMMON
========================================================= */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
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
   CUSTOMER RESPONSE
========================================================= */

function customerResponse(customer) {
  return {
    id: customer.id,
    customer_id: customer.id,
    mobile: customer.mobile,
    phone: customer.mobile,
    name: customer.name,
    wallet_balance: Number(customer.wallet_balance || 0),
    bonus_balance: Number(customer.bonus_balance || 0),
    battle_played: Number(customer.battle_played || 0),
    coin_won: Number(customer.coin_won || 0),
    referral_code: customer.referral_code || "",
    referral_count: Number(customer.referral_count || 0),
    referral_earned: Number(customer.referral_earned || 0),
    withdrawal_amount: Number(customer.withdrawal_amount || 0),
    email: customer.email || "",
    kyc_status: customer.kyc_status || "Pending",
    account_status: customer.account_status || "ACTIVE",
    created_at: customer.created_at
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
  `).bind(roomCode).first();
}

async function deleteRoom(env, roomCode) {
  await env.DB.prepare(
    "DELETE FROM rooms WHERE room_code = ?"
  ).bind(roomCode).run();
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
  `).run();
}


/* =========================================================
   UNIQUE REFERRAL CODE
========================================================= */

async function generateUniqueReferralCode(env) {
  for (let attempt = 0; attempt < 20; attempt++) {

    const code = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    const existing = await env.DB.prepare(`
      SELECT id
      FROM customers
      WHERE referral_code = ?
      LIMIT 1
    `).bind(code).first();

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

async function getReferralSummary(env, customerId) {
  await ensureReferralTable(env);

  const customer = await env.DB.prepare(`
    SELECT *
    FROM customers
    WHERE id = ?
  `).bind(customerId).first();

  if (!customer) {
    return null;
  }

  const referrals = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM referral_links
    WHERE referrer_id = ?
    AND status = 'ACTIVE'
  `).bind(customerId).first();

  return {
    customer_id: customer.id,
    referral_code: customer.referral_code || "",
    total_referral: Number(
      referrals?.total || 0
    ),
    total_earned: Number(
      customer.referral_earned || 0
    ),
    commission_percent: REFERRAL_PERCENT
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
  `).run();
}


/* =========================================================
   MAIN WORKER
========================================================= */

export default {

  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {


      /* =====================================================
         LOGIN
      ===================================================== */

      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        const mobile = clean(body.mobile);
        const otp = clean(body.otp);

        if (!validMobile(mobile)) {

          return json({
            success: false,
            error:
              "Valid 10-digit mobile number required"
          }, 400);

        }


        if (otp) {

          if (!/^\d{6}$/.test(otp)) {

            return json({
              success: false,
              error:
                "Valid 6-digit OTP required"
            }, 400);

          }


          let customer =
            await env.DB.prepare(`
              SELECT *
              FROM customers
              WHERE mobile = ?
            `).bind(mobile).first();


          if (!customer) {

            return json({
              success: false,
              error:
                "Mobile number not registered"
            }, 404);

          }


          if (!customer.referral_code) {

            const newCode =
              await generateUniqueReferralCode(env);

            await env.DB.prepare(`
              UPDATE customers
              SET referral_code = ?
              WHERE id = ?
            `).bind(
              newCode,
              customer.id
            ).run();


            customer =
              await env.DB.prepare(`
                SELECT *
                FROM customers
                WHERE id = ?
              `).bind(customer.id).first();

          }


          return json({
            success: true,
            existing: true,
            customer:
              customerResponse(customer)
          });

        }


        let existing =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE mobile = ?
          `).bind(mobile).first();


        if (existing) {

          if (!existing.referral_code) {

            const newCode =
              await generateUniqueReferralCode(env);

            await env.DB.prepare(`
              UPDATE customers
              SET referral_code = ?
              WHERE id = ?
            `).bind(
              newCode,
              existing.id
            ).run();


            existing =
              await env.DB.prepare(`
                SELECT *
                FROM customers
                WHERE id = ?
              `).bind(existing.id).first();

          }


          return json({
            success: true,
            existing: true,
            message:
              "OTP request accepted",
            customer:
              customerResponse(existing)
          });

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
        `).bind(
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
        ).run();


        const customer =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `).bind(customerId).first();


        return json({
          success: true,
          existing: false,
          message:
            "OTP request accepted",
          customer:
            customerResponse(customer)
        });

      }


      /* =====================================================
         GET CUSTOMER
      ===================================================== */

      if (
        path.startsWith("/api/customer/") &&
        request.method === "GET"
      ) {

        const customerId =
          clean(
            path.replace("/api/customer/", "")
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
          `).bind(customerId).first();


        if (!customer) {

          return json({
            success: false,
            error:
              "Customer not found"
          }, 404);

        }


        return json({
          success: true,
          customer:
            customerResponse(customer)
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
          clean(body.customer_id);


        const name =
          clean(body.name);


        const email =
          clean(body.email);


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
          `).bind(customerId).first();


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
        `).bind(
          name || customer.name || "Player",
          email,
          customerId
        ).run();


        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `).bind(customerId).first();


        return json({
          success: true,
          customer:
            customerResponse(updated)
        });

      }


      /* =====================================================
         REFERRAL SUMMARY
      ===================================================== */

      if (
        path.startsWith("/api/referral/") &&
        request.method === "GET"
      ) {

        const customerId =
          clean(
            path.replace("/api/referral/", "")
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
          success: true,
          referral: summary
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


        if (!/^\d{6}$/.test(referralCode)) {

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
          `).bind(customerId).first();


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
          `).bind(referralCode).first();


        if (!referrer) {

          return json({
            success: false,
            error:
              "Referral code not found"
          }, 404);

        }


        if (referrer.id === customer.id) {

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
          `).bind(customer.id).first();


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
        `).bind(
          referrer.id,
          customer.id,
          referralCode,
          Date.now()
        ).run();


        await env.DB.prepare(`
          UPDATE customers
          SET referral_count =
            COALESCE(referral_count, 0) + 1
          WHERE id = ?
        `).bind(referrer.id).run();


        return json({
          success: true,
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
          Number(body.amount);


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
          `).bind(referrerId).first();


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
        `).bind(
          commission,
          referrerId
        ).run();


        const updated =
          await env.DB.prepare(`
            SELECT *
            FROM customers
            WHERE id = ?
          `).bind(referrerId).first();


        return json({
          success: true,
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
            success: false,
            error:
              "Player login required"
          }, 400);

        }


        if (!validRoomCode(roomCode)) {

          return json({
            success: false,
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
            isExpired(existing.created_at)
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
            ?, ?, ?, NULL, NULL, 'WAITING', ?
          )
        `).bind(
          roomCode,
          playerId,
          playerName,
          createdAt
        ).run();


        return json({
          success: true,
          room: {
            room_code: roomCode,
            player1_id: playerId,
            player1_name: playerName,
            player2_id: null,
            player2_name: null,
            status: "WAITING",
            created_at: createdAt
          }
        });

      }


      /* =====================================================
         GET WAITING ROOM
         PLAYER 2 AUTO DISPLAY
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
          `).first();


        if (!room) {

          return json({
            success: true,
            room: null
          });

        }


        if (
          isExpired(room.created_at)
        ) {

          await deleteRoom(
            env,
            room.room_code
          );


          return json({
            success: true,
            room: null
          });

        }


        return json({
          success: true,
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
            success: false,
            error:
              "Player login required"
          }, 400);

        }


        if (!validRoomCode(roomCode)) {

          return json({
            success: false,
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
            success: false,
            error:
              "Room Code नहीं मिला।"
          }, 404);

        }


        if (
          room.status === "WAITING" &&
          isExpired(room.created_at)
        ) {

          await deleteRoom(
            env,
            roomCode
          );


          return json({
            success: false,
            error:
              "⏰ यह Room 5 मिनट बाद expire हो गया।"
          }, 410);

        }


        if (
          room.player1_id === playerId
        ) {

          return json({
            success: false,
            error:
              "Player 1 और Player 2 के लिए अलग mobile number इस्तेमाल करें।"
          }, 409);

        }


        if (room.player2_id) {

          return json({
            success: false,
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
          `).bind(
            playerId,
            playerName,
            roomCode
          ).run();


        if (!result.success) {

          return json({
            success: false,
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
            success: false,
            error:
              "Player 2 database में save नहीं हुआ।"
          }, 500);

        }


        return json({
          success: true,
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
        path.startsWith("/api/rooms/") &&
        request.method === "GET"
      ) {

        const roomCode =
          path
            .replace("/api/rooms/", "")
            .trim();


        if (!validRoomCode(roomCode)) {

          return json({
            success: false,
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
            success: false,
            error:
              "Room not found"
          }, 404);

        }


        if (
          room.status === "WAITING" &&
          isExpired(room.created_at)
        ) {

          await deleteRoom(
            env,
            roomCode
          );


          return json({
            success: false,
            error:
              "Room expired"
          }, 410);

        }


        return json({
          success: true,
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
          !validRoomCode(roomCode)
        ) {

          return json({
            success: false,
            error:
              "Player and valid Room Code required"
          }, 400);

        }


        if (
          !validReasons.includes(reason)
        ) {

          return json({
            success: false,
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
            success: false,
            error:
              "Room not found"
          }, 404);

        }


        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {

          return json({
            success: false,
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
        `).bind(
          roomCode,
          playerId,
          reason,
          Date.now()
        ).run();


        await deleteRoom(
          env,
          roomCode
        );


        return json({
          success: true,
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
          !validRoomCode(roomCode) ||
          !screenshot
        ) {

          return json({
            success: false,
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
            success: false,
            error:
              "Room not found"
          }, 404);

        }


        if (
          room.player1_id !== playerId &&
          room.player2_id !== playerId
        ) {

          return json({
            success: false,
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
        `).bind(
          screenshot,
          playerId,
          roomCode
        ).run();


        return json({
          success: true,
          message:
            "Screenshot submitted successfully"
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

      return env.ASSETS.fetch(request);


    } catch (error) {

      console.error(
        "Worker Error:",
        error
      );


      return json({
        success: false,
        error:
          error?.message ||
          "Server Error"
      }, 500);

    }

  }

};
