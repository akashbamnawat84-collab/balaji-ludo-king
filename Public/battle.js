// ==========================================
// BALAJI LUDO KING - BATTLE SYSTEM
// DEMO COINS MODE
// ==========================================

const API_BASE = "";

const MIN_BET = 50;
const MAX_BET = 10000;

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


// ==========================================
// PLAYER DATA
// ==========================================

function getPlayerName() {

  return (
    localStorage.getItem("balajiPlayerName") ||
    localStorage.getItem("playerName") ||
    localStorage.getItem("name") ||
    "Customer"
  );
}


function getCustomerId() {

  return (
    localStorage.getItem("balajiCustomerId") ||
    localStorage.getItem("customerId") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("balaji_customer_id") ||
    ""
  );
}


function getMobile() {

  return (
    localStorage.getItem("balajiMobile") ||
    localStorage.getItem("mobileNumber") ||
    localStorage.getItem("mobile") ||
    localStorage.getItem("customerMobile") ||
    ""
  );
}


function getToken() {

  return (
    localStorage.getItem("balajiToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}


// ==========================================
// API REQUEST
// ==========================================

async function apiRequest(url, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    "X-Balaji-Mobile": getMobile(),
    ...(options.headers || {})
  };


  const token = getToken();

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response = await fetch(
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
      `Server request failed (${response.status})`
    );
  }


  return data;
}


// ==========================================
// NORMALIZE BATTLE
// ==========================================

function normalizeBattle(battle) {

  if (!battle) {
    return null;
  }


  const id =
    battle.id ??
    battle.battle_id ??
    battle.battleId ??
    "";


  const entry =
    Number(
      battle.entry_amount ??
      battle.entry_fee ??
      battle.entryAmount ??
      battle.entry ??
      0
    );


  const prize =
    Number(
      battle.winning_prize ??
      battle.prize_amount ??
      battle.winningPrize ??
      battle.prize ??
      Math.round(entry * 1.95)
    );


  const player1 =
    battle.creator_name ||
    battle.creatorName ||
    battle.player1 ||
    battle.player_one_name ||
    "Player 1";


  const player2 =
    battle.opponent_name ||
    battle.opponentName ||
    battle.joiner_name ||
    battle.joinerName ||
    battle.player2 ||
    battle.player_two_name ||
    "";


  const roomCode =
    battle.room_code ||
    battle.roomCode ||
    battle.room ||
    "";


  const status =
    String(
      battle.status ||
      battle.battle_status ||
      battle.match_status ||
      "OPEN"
    ).toUpperCase();


  return {

    id: String(id),

    player1,

    player2,

    entry,

    prize,

    roomCode,

    status,

    creatorId:
      battle.creator_id ||
      battle.creatorId ||
      "",

    opponentId:
      battle.opponent_id ||
      battle.joiner_id ||
      battle.opponentId ||
      "",

    resultStatus:
      battle.result_status ||
      "",

    createdAt:
      battle.created_at ||
      battle.createdAt ||
      Date.now(),

    raw: battle

  };
}


// ==========================================
// SAVE CURRENT BATTLE
// ==========================================

function saveCurrentBattle(battle) {

  const normalized =
    normalizeBattle(battle);


  if (!normalized || !normalized.id) {
    return false;
  }


  localStorage.setItem(
    "balajiCurrentBattle",
    JSON.stringify(normalized)
  );


  localStorage.setItem(
    "balajiBattleId",
    String(normalized.id)
  );


  /*
    Room page के लिए selected battle भी save
  */

  localStorage.setItem(
    "balajiSelectedBattle",
    JSON.stringify(normalized)
  );


  if (normalized.roomCode) {

    localStorage.setItem(
      "balajiRoomCode",
      String(normalized.roomCode)
    );
  }


  return true;
}


// ==========================================
// OPEN ROOM PAGE
// ==========================================

function openRoomPage(battle) {

  const normalized =
    normalizeBattle(battle);


  if (!normalized || !normalized.id) {

    alert(
      "Battle ID नहीं मिला। कृपया दोबारा try करें।"
    );

    return;
  }


  saveCurrentBattle(normalized);


  /*
    IMPORTANT:
    Battle ID URL में भेजी जाएगी।
  */

  window.location.href =
    `room.html?id=${encodeURIComponent(
      normalized.id
    )}`;
}


// ==========================================
// CREATE BATTLE
// ==========================================

async function createBattle() {

  const amount =
    Number(amountInput?.value || 0);


  // ----------------------------------------
  // LOGIN CHECK
  // ----------------------------------------

  const customerId =
    getCustomerId();


  if (!customerId) {

    alert(
      "कृपया पहले Login करें।"
    );

    window.location.href =
      "login/";

    return;
  }


  // ----------------------------------------
  // AMOUNT VALIDATION
  // ----------------------------------------

  if (!amount) {

    showMessage(
      "कृपया Entry Amount डालें।",
      true
    );

    amountInput?.focus();

    return;
  }


  if (amount < MIN_BET) {

    showMessage(
      `Minimum Entry Amount ₹${MIN_BET} है।`,
      true
    );

    return;
  }


  if (amount > MAX_BET) {

    showMessage(
      `Maximum Entry Amount ₹${MAX_BET} है।`,
      true
    );

    return;
  }


  if (amount % 50 !== 0) {

    showMessage(
      "Amount ₹50 के multiple में होना चाहिए।",
      true
    );

    return;
  }


  // ----------------------------------------
  // BUTTON STATE
  // ----------------------------------------

  const oldButtonText =
    setBattleBtn?.textContent ||
    "Set Battle";


  if (setBattleBtn) {

    setBattleBtn.disabled = true;

    setBattleBtn.textContent =
      "Creating Battle...";
  }


  showMessage(
    "Battle create हो रही है...",
    false
  );


  try {

    const result =
      await apiRequest(
        "/api/battles/create",
        {
          method: "POST",

          body: JSON.stringify({

            customer_id:
              customerId,

            creator_id:
              customerId,

            creator_name:
              getPlayerName(),

            entry_amount:
              amount,

            entry_fee:
              amount

          })
        }
      );


    console.log(
      "Create Battle Response:",
      result
    );


    const battle =
      result.battle ||
      result.data ||
      result;


    const normalized =
      normalizeBattle(battle);


    if (
      !normalized ||
      !normalized.id
    ) {

      throw new Error(
        "Battle create हुई लेकिन Battle ID नहीं मिला।"
      );
    }


    // --------------------------------------
    // SAVE BATTLE ID
    // --------------------------------------

    saveCurrentBattle(
      normalized
    );


    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    if (amountInput) {
      amountInput.value = "";
    }


    showMessage(
      `✅ Battle Created! Entry ₹${amount}`,
      false
    );


    await loadBattles();


    /*
      थोड़ी देर बाद Room page खोलें।
      इससे user को battle create होने का
      confirmation भी दिखाई देता है।
    */

    setTimeout(() => {

      openRoomPage(
        normalized
      );

    }, 700);


  } catch (error) {

    console.error(
      "Create battle error:",
      error
    );


    showMessage(
      error.message ||
      "Battle create नहीं हो सकी।",
      true
    );


  } finally {

    if (setBattleBtn) {

      setBattleBtn.disabled =
        false;

      setBattleBtn.textContent =
        oldButtonText;
    }
  }
}


// ==========================================
// LOAD BATTLES
// ==========================================

async function loadBattles() {

  // ----------------------------------------
  // OPEN BATTLES
  // ----------------------------------------

  try {

    const result =
      await apiRequest(
        "/api/battles/open"
      );


    const list =
      result.battles ||
      result.data ||
      result ||
      [];


    const battles =
      Array.isArray(list)
        ? list
            .map(normalizeBattle)
            .filter(Boolean)
        : [];


    renderOpenBattles(
      battles
    );


  } catch (error) {

    console.error(
      "Open battles error:",
      error
    );


    renderOpenBattles([]);
  }


  // ----------------------------------------
  // MY BATTLES
  // ----------------------------------------

  const customerId =
    getCustomerId();


  if (!customerId) {

    renderRunningBattles([]);

    return;
  }


  try {

    const result =
      await apiRequest(
        `/api/battles/my?customer_id=${encodeURIComponent(
          customerId
        )}`
      );


    const list =
      result.battles ||
      result.data ||
      result ||
      [];


    const battles =
      Array.isArray(list)
        ? list
            .map(normalizeBattle)
            .filter(Boolean)
        : [];


    const activeBattles =
      battles.filter(
        battle =>
          [
            "JOINED",
            "READY",
            "ROOM_READY",
            "RUNNING",
            "RESULT_SUBMITTED"
          ].includes(
            battle.status
          )
      );


    renderRunningBattles(
      activeBattles
    );


  } catch (error) {

    console.error(
      "My battles error:",
      error
    );


    renderRunningBattles([]);
  }
}


// ==========================================
// OPEN BATTLES UI
// ==========================================

function renderOpenBattles(
  battles
) {

  if (!openBattlesContainer) {
    return;
  }


  if (!battles.length) {

    openBattlesContainer.innerHTML = `

      <div class="fair-card">

        <div class="shield">
          🛡️
        </div>

        <div>

          <strong>
            No open battles
          </strong>

          <p>
            Create a battle to appear here.
          </p>

        </div>

      </div>

    `;

    return;
  }


  openBattlesContainer.innerHTML =
    battles.map(
      battle => `

        <div class="battle-card">

          <div class="battle-details">

            <div>
              <strong>
                ${escapeHTML(
                  battle.player1
                )}
              </strong>
            </div>

            <div>
              Entry Fee
              <b>
                ₹${battle.entry}
              </b>
            </div>

            <div>
              Winning Prize
              <b>
                ₹${battle.prize}
              </b>
            </div>

          </div>

          <button
            type="button"
            class="play-battle-btn"
            data-battle-id="${escapeHTML(
              battle.id
            )}">

            🎮 Play

          </button>

        </div>

      `
    ).join("");


  /*
    Join buttons
  */

  openBattlesContainer
    .querySelectorAll(
      ".play-battle-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.battleId;

          joinBattle(id);
        }
      );

    });
}


// ==========================================
// JOIN BATTLE
// ==========================================

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
      "कृपया पहले Login करें।"
    );

    window.location.href =
      "login/";

    return;
  }


  try {

    const result =
      await apiRequest(
        "/api/battles/join",
        {
          method: "POST",

          body: JSON.stringify({

            battle_id:
              battleId,

            customer_id:
              customerId,

            opponent_id:
              customerId,

            opponent_name:
              getPlayerName(),

            joiner_id:
              customerId,

            joiner_name:
              getPlayerName()

          })
        }
      );


    console.log(
      "Join Battle Response:",
      result
    );


    const battle =
      result.battle ||
      result.data ||
      result;


    /*
      अगर API पूरा battle object
      नहीं भेजती तो current open
      battle से ID बचाएँ।
    */

    let normalized =
      normalizeBattle(
        battle
      );


    if (
      !normalized ||
      !normalized.id
    ) {

      normalized = {

        id: String(
          battleId
        ),

        player1:
          "Player 1",

        player2:
          getPlayerName(),

        entry: 0,

        prize: 0,

        roomCode: "",

        status: "JOINED"

      };
    }


    saveCurrentBattle(
      normalized
    );


    /*
      सबसे जरूरी:
      Room page को Battle ID URL में भेजना।
    */

    window.location.href =
      `room.html?id=${encodeURIComponent(
        normalized.id
      )}`;


  } catch (error) {

    console.error(
      "Join battle error:",
      error
    );


    alert(
      error.message ||
      "Battle join नहीं हो सकी।"
    );


    loadBattles();
  }
}


// ==========================================
// RUNNING BATTLES UI
// ==========================================

function renderRunningBattles(
  battles
) {

  if (!runningBattlesContainer) {
    return;
  }


  if (!battles.length) {

    runningBattlesContainer.innerHTML = `

      <div class="fair-card">

        <div class="shield">
          🎮
        </div>

        <div>

          <strong>
            No active battle
          </strong>

          <p>
            Your created or joined battles
            will appear here.
          </p>

        </div>

      </div>

    `;

    return;
  }


  runningBattlesContainer.innerHTML =
    battles.map(
      battle => `

        <div class="battle-card">

          <div class="battle-details">

            <div>
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
                  "Waiting..."
                )}
              </strong>
            </div>

            <div>
              Entry Fee
              <b>
                ₹${battle.entry}
              </b>
            </div>

            <div>
              Winning Prize
              <b>
                ₹${battle.prize}
              </b>
            </div>

            <div>
              Status
              <b>
                ${escapeHTML(
                  battle.status
                )}
              </b>
            </div>

          </div>


          <button
            type="button"
            class="play-battle-btn"
            data-battle-id="${escapeHTML(
              battle.id
            )}">

            ${battle.roomCode
              ? "🎮 Open Room"
              : "⏳ View Battle"}

          </button>

        </div>

      `
    ).join("");


  runningBattlesContainer
    .querySelectorAll(
      ".play-battle-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.battleId;

          const battle =
            battles.find(
              item =>
                String(item.id) ===
                String(id)
            );


          if (battle) {
            openRoomPage(
              battle
            );
          }

        }
      );

    });
}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(
  message,
  error = false
) {

  if (!amountMessage) {
    return;
  }


  amountMessage.textContent =
    message;


  amountMessage.classList.toggle(
    "error",
    Boolean(error)
  );
}


// ==========================================
// RULES MODAL
// ==========================================

if (rulesBtn && rulesModal) {

  rulesBtn.addEventListener(
    "click",
    () => {

      rulesModal.classList.add(
        "show"
      );

    }
  );
}


if (closeRulesBtn && rulesModal) {

  closeRulesBtn.addEventListener(
    "click",
    () => {

      rulesModal.classList.remove(
        "show"
      );

    }
  );
}


if (understandBtn && rulesModal) {

  understandBtn.addEventListener(
    "click",
    () => {

      rulesModal.classList.remove(
        "show"
      );

    }
  );
}


if (rulesModal) {

  rulesModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        rulesModal
      ) {

        rulesModal.classList.remove(
          "show"
        );
      }

    }
  );
}


// ==========================================
// CREATE BUTTON
// ==========================================

if (setBattleBtn) {

  setBattleBtn.addEventListener(
    "click",
    createBattle
  );
}


// ==========================================
// ENTER KEY
// ==========================================

if (amountInput) {

  amountInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        createBattle();
      }

    }
  );
}


// ==========================================
// ESCAPE HTML
// ==========================================

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


// ==========================================
// INITIAL LOAD
// ==========================================

loadBattles();


// ==========================================
// AUTO REFRESH
// ==========================================

setInterval(
  () => {

    if (!document.hidden) {
      loadBattles();
    }

  },
  5000
);
