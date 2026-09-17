// ==========================================
// BALAJI LUDO KING - BATTLE SYSTEM
// CLOUDflare API VERSION
// DEMO COINS ONLY
// ==========================================

const API_BASE = "";

const MIN_BET = 50;
const MAX_BET = 10000;

// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const amountInput =
  document.getElementById("amountInput");

const setBattleBtn =
  document.getElementById("setBattleBtn");

const amountMessage =
  document.getElementById("amountMessage");

const openBattlesContainer =
  document.getElementById("openBattles");

const runningBattlesContainer =
  document.getElementById("runningBattles");

const rulesBtn =
  document.getElementById("rulesBtn");

const rulesModal =
  document.getElementById("rulesModal");

const closeRulesBtn =
  document.getElementById("closeRulesBtn");

const understandBtn =
  document.getElementById("understandBtn");


// ------------------------------------------
// PLAYER
// ------------------------------------------

function getPlayerName() {

  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    "Customer"
  );

}


// ------------------------------------------
// CUSTOMER ID
// ------------------------------------------

function getCustomerId() {

  return (
    localStorage.getItem("balajiCustomerId") ||
    localStorage.getItem("customerId") ||
    localStorage.getItem("balaji_customer_id") ||
    ""
  );

}


// ------------------------------------------
// MOBILE
// ------------------------------------------

function getMobile() {

  return (
    localStorage.getItem("balajiMobile") ||
    localStorage.getItem("mobile") ||
    localStorage.getItem("customerMobile") ||
    ""
  );

}


// ------------------------------------------
// API HELPER
// ------------------------------------------

async function apiRequest(
  url,
  options = {}
) {

  const headers = {
    "Content-Type": "application/json",
    "X-Balaji-Mobile": getMobile(),
    ...(options.headers || {})
  };

  const response =
    await fetch(
      API_BASE + url,
      {
        ...options,
        headers
      }
    );

  let data = {};

  try {

    data = await response.json();

  } catch (error) {

    data = {};

  }

  if (!response.ok) {

    throw new Error(
      data.message ||
      data.error ||
      "Server request failed"
    );

  }

  return data;

}


// ------------------------------------------
// NORMALIZE BATTLE
// ------------------------------------------

function normalizeBattle(battle) {

  if (!battle) return null;

  const entry =
    Number(
      battle.entry_amount ??
      battle.entry_fee ??
      battle.entry ??
      0
    );

  const prize =
    Number(
      battle.winning_prize ??
      battle.prize_amount ??
      battle.prize ??
      Math.round(entry * 1.9)
    );

  const player1 =
    battle.creator_name ||
    battle.player1 ||
    battle.creatorName ||
    "Player 1";

  const player2 =
    battle.opponent_name ||
    battle.player2 ||
    battle.opponentName ||
    "";

  const roomCode =
    battle.room_code ||
    battle.roomCode ||
    "";

  const status =
    String(
      battle.status ||
      "OPEN"
    ).toUpperCase();

  return {

    id:
      battle.id,

    player1:
      player1,

    player2:
      player2,

    entry:
      entry,

    prize:
      prize,

    roomCode:
      roomCode,

    status:
      status,

    creatorId:
      battle.creator_id ||
      "",

    opponentId:
      battle.opponent_id ||
      battle.joiner_id ||
      "",

    resultStatus:
      battle.result_status ||
      "",

    createdAt:
      battle.created_at ||
      battle.createdAt ||
      Date.now(),

    raw:
      battle

  };

}


// ------------------------------------------
// CREATE BATTLE
// ------------------------------------------

if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    async function () {

      const amount =
        Number(
          amountInput
            ? amountInput.value
            : 0
        );

      if (!amount) {

        showMessage(
          "कृपया Battle Amount डालें।",
          true
        );

        return;

      }

      if (amount < MIN_BET) {

        showMessage(
          "Minimum Battle 50 Demo Coins है।",
          true
        );

        return;

      }

      if (amount > MAX_BET) {

        showMessage(
          "Maximum Battle 10,000 Demo Coins है।",
          true
        );

        return;

      }

      if (amount % 50 !== 0) {

        showMessage(
          "Amount 50, 100, 150, 200... में होना चाहिए।",
          true
        );

        return;

      }


      setBattleBtn.disabled = true;

      setBattleBtn.textContent =
        "Creating Battle...";


      try {

        const data =
          await apiRequest(
            "/api/battles/create",
            {
              method: "POST",

              body:
                JSON.stringify({

                  customer_id:
                    getCustomerId(),

                  creator_id:
                    getCustomerId(),

                  creator_name:
                    getPlayerName(),

                  entry_amount:
                    amount,

                  entry_fee:
                    amount

                })

            }
          );


        const battle =
          normalizeBattle(
            data.battle ||
            data
          );


        if (battle) {

          localStorage.setItem(
            "balajiCurrentBattle",
            JSON.stringify(battle)
          );

        }


        if (amountInput) {

          amountInput.value = "";

        }


        showMessage(
          `${amount} Demo Coins की Battle successfully create हो गई।`
        );


        await loadBattles();


      } catch (error) {

        console.error(
          "CREATE BATTLE ERROR:",
          error
        );

        showMessage(
          error.message ||
          "Battle create नहीं हो सकी।",
          true
        );

      }


      setBattleBtn.disabled = false;

      setBattleBtn.textContent =
        "Set Battle";

    }
  );

}


// ------------------------------------------
// LOAD OPEN + RUNNING BATTLES
// ------------------------------------------

async function loadBattles() {

  try {

    const openData =
      await apiRequest(
        "/api/battles/open"
      );


    const openList =
      Array.isArray(
        openData.battles
      )
        ? openData.battles
        : Array.isArray(openData)
          ? openData
          : [];


    const normalizedOpen =
      openList
        .map(normalizeBattle)
        .filter(Boolean);


    renderOpenBattles(
      normalizedOpen
    );


  } catch (error) {

    console.error(
      "OPEN BATTLES ERROR:",
      error
    );

    renderOpenBattles([]);

  }


  try {

    const myData =
      await apiRequest(
        "/api/battles/my?customer_id=" +
        encodeURIComponent(
          getCustomerId()
        )
      );


    const myList =
      Array.isArray(
        myData.battles
      )
        ? myData.battles
        : Array.isArray(myData)
          ? myData
          : [];


    const normalizedRunning =
      myList
        .map(normalizeBattle)
        .filter(function (battle) {

          return (
            battle.status === "JOINED" ||
            battle.status === "READY" ||
            battle.status === "RUNNING" ||
            battle.status === "RESULT_SUBMITTED"
          );

        });


    renderRunningBattles(
      normalizedRunning
    );


  } catch (error) {

    console.error(
      "MY BATTLES ERROR:",
      error
    );

    renderRunningBattles([]);

  }

}


// ------------------------------------------
// RENDER OPEN BATTLES
// ------------------------------------------

function renderOpenBattles(
  battles = []
) {

  if (!openBattlesContainer)
    return;


  openBattlesContainer.innerHTML =
    "";


  if (
    !battles.length
  ) {

    openBattlesContainer.innerHTML = `
      <div class="empty-battle">
        अभी कोई Open Battle नहीं है।
      </div>
    `;

    return;

  }


  battles.forEach(
    function (battle) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "battle-card";


      card.innerHTML = `

        <div class="battle-title">
          Challenge From
        </div>

        <div class="challenger-name">
          ${escapeHTML(
            battle.player1
          )}
        </div>

        <div class="battle-info">

          <div>
            <span>ENTRY FEE</span>

            <strong>
              ${battle.entry}
              Demo Coins
            </strong>
          </div>

          <div>
            <span>PRIZE</span>

            <strong>
              ${battle.prize}
              Demo Coins
            </strong>
          </div>

        </div>

        <button
          type="button"
          class="play-battle-btn"
          data-battle-id="${escapeHTML(
            battle.id
          )}"
        >
          Play
        </button>

      `;


      const playButton =
        card.querySelector(
          ".play-battle-btn"
        );


      if (playButton) {

        playButton.addEventListener(
          "click",
          function () {

            joinBattle(
              battle.id
            );

          }
        );

      }


      openBattlesContainer
        .appendChild(card);

    }
  );

}


// ------------------------------------------
// JOIN BATTLE
// ------------------------------------------

async function joinBattle(
  battleId
) {

  if (!battleId) {

    alert(
      "Battle ID नहीं मिला।"
    );

    return;

  }


  const customerId =
    getCustomerId();


  if (!customerId) {

    alert(
      "पहले Login करें।"
    );

    window.location.href =
      "login/";

    return;

  }


  try {

    const data =
      await apiRequest(
        "/api/battles/join",
        {

          method: "POST",

          body:
            JSON.stringify({

              battle_id:
                battleId,

              customer_id:
                customerId,

              opponent_id:
                customerId,

              opponent_name:
                getPlayerName(),

              joiner_id:
                customerId

            })

        }
      );


    const battle =
      normalizeBattle(
        data.battle ||
        data
      );


    if (!battle) {

      throw new Error(
        "Battle data नहीं मिला।"
      );

    }


    localStorage.setItem(
      "balajiCurrentBattle",
      JSON.stringify(battle)
    );


    if (battle.roomCode) {

      localStorage.setItem(
        "balajiRoomCode",
        battle.roomCode
      );

    }


    // --------------------------------------
    // OPEN BATTLE ROOM
    // --------------------------------------

    window.location.href =
      "room.html";


  } catch (error) {

    console.error(
      "JOIN BATTLE ERROR:",
      error
    );


    alert(
      error.message ||
      "Battle join नहीं हो सकी।"
    );


    await loadBattles();

  }

}


// ------------------------------------------
// RENDER RUNNING BATTLES
// ------------------------------------------

function renderRunningBattles(
  battles = []
) {

  if (!runningBattlesContainer)
    return;


  runningBattlesContainer.innerHTML =
    "";


  if (!battles.length) {

    runningBattlesContainer.innerHTML = `
      <div class="empty-battle">
        अभी कोई Running Battle नहीं है।
      </div>
    `;

    return;

  }


  battles.forEach(
    function (battle) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "battle-card running";


      const room =
        battle.roomCode
          ? battle.roomCode
          : "Waiting";


      card.innerHTML = `

        <div class="battle-title">
          Running Battle
        </div>

        <div class="players">

          <strong>
            ${escapeHTML(
              battle.player1
            )}
          </strong>

          <span>
            VS
          </span>

          <strong>
            ${escapeHTML(
              battle.player2 ||
              "Waiting"
            )}
          </strong>

        </div>

        <div class="battle-info">

          <div>

            <span>
              ENTRY FEE
            </span>

            <strong>
              ${battle.entry}
              Demo Coins
            </strong>

          </div>

          <div>

            <span>
              PRIZE
            </span>

            <strong>
              ${battle.prize}
              Demo Coins
            </strong>

          </div>

        </div>

        <div class="room-small">

          Room Code:
          <strong>
            ${escapeHTML(room)}
          </strong>

        </div>

        <div class="room-status">

          Status:
          <strong>
            ${escapeHTML(
              battle.status
            )}
          </strong>

        </div>

      `;


      runningBattlesContainer
        .appendChild(card);

    }
  );

}


// ------------------------------------------
// MESSAGE
// ------------------------------------------

function showMessage(
  message,
  isError = false
) {

  if (!amountMessage) {

    if (isError)
      console.error(message);

    return;

  }


  amountMessage.textContent =
    message;


  amountMessage.classList.toggle(
    "error",
    isError
  );


  amountMessage.style.display =
    "block";

}


// ------------------------------------------
// RULES MODAL
// ------------------------------------------

if (
  rulesBtn &&
  rulesModal
) {

  rulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display =
        "flex";

    }
  );

}


if (
  closeRulesBtn &&
  rulesModal
) {

  closeRulesBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display =
        "none";

    }
  );

}


if (
  understandBtn &&
  rulesModal
) {

  understandBtn.addEventListener(
    "click",
    function () {

      rulesModal.style.display =
        "none";

    }
  );

}


if (rulesModal) {

  rulesModal.addEventListener(
    "click",
    function (event) {

      if (
        event.target ===
        rulesModal
      ) {

        rulesModal.style.display =
          "none";

      }

    }
  );

}


// ------------------------------------------
// ESCAPE HTML
// ------------------------------------------

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ------------------------------------------
// AUTO REFRESH
// ------------------------------------------

// हर 5 सेकंड में server से
// latest battle status लिया जाएगा.

setInterval(
  function () {

    loadBattles();

  },
  5000
);


// ------------------------------------------
// START
// ------------------------------------------

loadBattles();
