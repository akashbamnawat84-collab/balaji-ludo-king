const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const ROOM_WAIT_MS = 5 * 60 * 1000;

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

  return !Number.isFinite(time) ||
    Date.now() - time >= ROOM_WAIT_MS;
}


// =========================
// GET ROOM
// =========================

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


// =========================
// DELETE ROOM
// =========================

async function deleteRoom(env, roomCode) {

  await env.DB.prepare(
    "DELETE FROM rooms WHERE room_code = ?"
  )
    .bind(roomCode)
    .run();
}


// =========================
// CUSTOMER RESPONSE
// =========================

function customerResponse(customer) {

  return {

    id: customer.id,

    customer_id: customer.id,

    mobile: customer.mobile,

    phone: customer.mobile,

    name: customer.name,

    wallet_balance:
      Number(customer.wallet_balance || 0),

    bonus_balance:
      Number(customer.bonus_balance || 0),

    battle_played:
      Number(customer.battle_played || 0),

    coin_won:
      Number(customer.coin_won || 0),

    referral_code:
      customer.referral_code || "",

    referral_count:
      Number(customer.referral_count || 0),

    referral_earned:
      Number(customer.referral_earned || 0),

    withdrawal_amount:
      Number(customer.withdrawal_amount || 0),

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


// =========================
// WORKER
// =========================

export default {

  async fetch(request, env) {

    // =========================
    // CORS
    // =========================

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });

    }

    const url = new URL(request.url);

    const path = url.pathname;


    try {


      // =========================
      // LOGIN
      // =========================

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


        if (!validMobile(mobile)) {

          return json({
            success: false,
            error:
              "Valid 10-digit mobile number required"
          }, 400);

        }


        // =========================
        // OTP VERIFY
        // =========================

        if (otp) {

          if (!/^\d{6}$/.test(otp)) {

            return json({
              success: false,
              error:
                "Valid 6-digit OTP required"
            }, 400);

          }


          /*
            REAL OTP VERIFICATION
            ---------------------
            यहाँ अभी fake OTP नहीं बनाया गया है।
            Real SMS OTP provider यहाँ connect होगा।
          */


          const customer =
            await env.DB.prepare(
              "SELECT * FROM customers WHERE mobile = ?"
            )
              .bind(mobile)
              .first();


          if (!customer) {

            return json({
              success: false,
              error:
                "Mobile number not registered"
            }, 404);

          }


          return json({

            success: true,

            existing: true,

            customer:
              customerResponse(customer)

          });

        }


        // =========================
        // SEND OTP REQUEST
        // =========================

        const existing =
          await env.DB.prepare(
            "SELECT * FROM customers WHERE mobile = ?"
          )
            .bind(mobile)
            .first();


        if (existing) {

          return json({

            success: true,

            existing: true,

            message:
              "OTP request accepted",

            customer:
              customerResponse(existing)

          });

        }


        // =========================
        // NEW CUSTOMER
        // =========================

        const customerId =
          "CUS" +
          crypto.randomUUID()
            .replace(/-/g, "")
            .slice(0, 10)
            .toUpperCase();


        const referralCode =
          mobile.slice(-6);


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

            ?,
            ?,
            'Player',
            0,
            0,
            0,
            0,
            ?,
            0,
            0,
            0,
            '',
            'Pending',
            'ACTIVE',
            ?

          )

        `)
          .bind(
            customerId,
            mobile,
            referralCode,
            createdAt
          )
          .run();


        const customer =
          await env.DB.prepare(
            "SELECT * FROM customers WHERE id = ?"
          )
            .bind(customerId)
            .first();


        return json({

          success: true,

          existing: false,

          message:
            "OTP request accepted",

          customer:
            customerResponse(customer)

        });

      }


      // =========================
      // GET CUSTOMER
      // =========================

      if (
        path.startsWith("/api/customer/") &&
        request.method === "GET"
      ) {

        const customerId =
          clean(
            path.replace(
              "/api/customer/",
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
          await env.DB.prepare(
            "SELECT * FROM customers WHERE id = ?"
          )
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

          success: true,

          customer:
            customerResponse(customer)

        });

      }


      // =========================
      // UPDATE CUSTOMER
      // =========================

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
          await env.DB.prepare(
            "SELECT * FROM customers WHERE id = ?"
          )
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

          SET
            name = ?,
            email = ?

          WHERE id = ?

        `)
          .bind(
            name || customer.name || "Player",
            email,
            customerId
          )
          .run();


        const updated =
          await env.DB.prepare(
            "SELECT * FROM customers WHERE id = ?"
          )
            .bind(customerId)
            .first();


        return json({

          success: true,

          customer:
            customerResponse(updated)

        });

      }


      // ==================================================
      // REFERRAL - ACTIVATE
      // ==================================================

      if (
        path === "/api/referral/activate" &&
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
            body.referralCode
          );


        if (
          !customerId ||
          !referralCode
        ) {

          return json({

            success: false,

            error:
              "Customer ID and referral code required"

          }, 400);

        }


        // =========================
        // REFERRED CUSTOMER
        // =========================

        const referredCustomer =
          await env.DB.prepare(`

            SELECT *
            FROM customers
            WHERE id = ?

          `)
            .bind(customerId)
            .first();


        if (!referredCustomer) {

          return json({

            success: false,

            error:
              "Customer not found"

          }, 404);

        }


        // =========================
        // REFERRER
        // =========================

        const referrer =
          await env.DB.prepare(`

            SELECT *
            FROM customers
            WHERE referral_code = ?

          `)
            .bind(referralCode)
            .first();


        if (!referrer) {

          return json({

            success: false,

            error:
              "Invalid referral code"

          }, 404);

        }


        // =========================
        // SELF REFERRAL
        // =========================

        if (
          referrer.id ===
          referredCustomer.id
        ) {

          return json({

            success: false,

            error:
              "You cannot use your own referral code"

          }, 400);

        }


        // =========================
        // ALREADY REFERRED
        // =========================

        const alreadyReferred =
          await env.DB.prepare(`

            SELECT *
            FROM referrals
            WHERE referred_id = ?

          `)
            .bind(customerId)
            .first();


        if (alreadyReferred) {

          return json({

            success: true,

            already_active: true,

            message:
              "Referral already activated"

          });

        }


        // =========================
        // SAVE REFERRAL
        // =========================

        const createdAt =
          Date.now();


        await env.DB.prepare(`

          INSERT INTO referrals (

            referrer_id,
            referred_id,
            referral_code,
            commission_earned,
            created_at

          )

          VALUES (

            ?,
            ?,
            ?,
            0,
            ?

          )

        `)
          .bind(
            referrer.id,
            referredCustomer.id,
            referralCode,
            createdAt
          )
          .run();


        // =========================
        // INCREASE REFERRAL COUNT
        // =========================

        await env.DB.prepare(`

          UPDATE customers

          SET
            referral_count =
              COALESCE(referral_count, 0) + 1

          WHERE id = ?

        `)
          .bind(referrer.id)
          .run();


        return json({

          success: true,

          message:
            "Referral activated successfully",

          referral: {

            referrer_id:
              referrer.id,

            referred_id:
              referredCustomer.id,

            referral_code:
              referralCode,

            commission_rate:
              3

          }

        });

      }


      // ==================================================
      // REFERRAL - GET DATA
      // ==================================================

      if (
        path.startsWith("/api/referral/") &&
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


        // =========================
        // CUSTOMER REFERRAL DATA
        // =========================

        const customer =
          await env.DB.prepare(`

            SELECT

              id,
              referral_code,
              referral_count,
              referral_earned

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


        // =========================
        // REFERRAL HISTORY
        // =========================

        const referrals =
          await env.DB.prepare(`

            SELECT

              r.id,
              r.referred_id,
              r.referral_code,
              r.commission_earned,
              r.created_at,

              c.name,
              c.mobile

            FROM referrals r

            LEFT JOIN customers c

              ON c.id = r.referred_id

            WHERE r.referrer_id = ?

            ORDER BY r.created_at DESC

          `)
            .bind(customerId)
            .all();


        return json({

          success: true,

          referral_code:
            customer.referral_code || "",

          total_referral:
            Number(
              customer.referral_count || 0
            ),

          total_earned:
            Number(
              customer.referral_earned || 0
            ),

          commission_rate:
            3,

          referrals:
            referrals.results || []

        });

      }


      // =========================
      // CREATE ROOM
      // =========================

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

            ?,
            ?,
            ?,
            NULL,
            NULL,
            'WAITING',
            ?

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

          success: true,

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


      // =========================
      // JOIN ROOM
      // =========================

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


        // Same player check

        if (
          room.player1_id === playerId
        ) {

          return json({

            success: false,

            error:
              "Player 1 और Player 2 के लिए अलग mobile number इस्तेमाल करें।"

          }, 409);

        }


        // Room full

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

          `)
            .bind(
              playerId,
              playerName,
              roomCode
            )
            .run();


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


      // =========================
      // GET ROOM
      // =========================

      if (
        path.startsWith("/api/rooms/") &&
        request.method === "GET"
      ) {

        const roomCode =
          path
            .replace(
              "/api/rooms/",
              ""
            )
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

          room:
            room

        });

      }


      // =========================
      // CANCEL ROOM
      // =========================

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


        await deleteRoom(
          env,
          roomCode
        );


        return json({

          success: true

        });

      }


      // =========================
      // RESULT
      // =========================

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

        `)
          .bind(
            screenshot,
            playerId,
            roomCode
          )
          .run();


        return json({

          success: true,

          message:
            "Screenshot submitted successfully"

        });

      }


      // =========================
      // NOT FOUND
      // =========================

      return new Response(

        "Not Found",

        {
          status: 404,
          headers: corsHeaders
        }

      );


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
