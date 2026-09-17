* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  min-height: 100%;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, .25), transparent 35%),
    linear-gradient(180deg, #100b18 0%, #191025 45%, #0d0913 100%);
  color: #ffffff;
  padding-bottom: 90px;
}

/* =========================
   HEADER
========================= */

.room-header {
  background: rgba(20, 12, 31, .96);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  padding: 14px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.back-btn {
  text-decoration: none;
  color: #fff;
  background: rgba(255, 255, 255, .10);
  border: 1px solid rgba(255, 255, 255, .08);
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
}

.brand {
  min-width: 0;
}

.brand h1 {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: .2px;
}

.brand p {
  margin-top: 3px;
  color: #b9aec7;
  font-size: 10px;
}

/* =========================
   MAIN
========================= */

.room-container {
  width: 100%;
  max-width: 520px;
  margin: auto;
  padding: 15px;
}

.game-title {
  margin-bottom: 13px;
}

.game-title h2 {
  font-size: 21px;
  font-weight: 800;
}

.game-title p {
  margin-top: 4px;
  color: #aaa0b5;
  font-size: 11px;
}

/* =========================
   APP NOTICE
========================= */

.app-notice {
  background: linear-gradient(135deg, #39205b, #25143c);
  border: 1px solid rgba(185, 137, 255, .22);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 14px;
}

.app-notice strong {
  display: block;
  font-size: 13px;
}

.app-notice p {
  margin-top: 6px;
  color: #cfc3dc;
  font-size: 11px;
  line-height: 1.55;
}

/* =========================
   CARD
========================= */

.card {
  background: rgba(255, 255, 255, .055);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, .20);
}

.card-title {
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 14px;
}

/* =========================
   BATTLE INFORMATION
========================= */

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.info-box {
  background: rgba(0, 0, 0, .18);
  border-radius: 12px;
  padding: 11px 8px;
  text-align: center;
}

.info-box small {
  display: block;
  color: #9f94aa;
  font-size: 9px;
  margin-bottom: 5px;
}

.info-box strong {
  display: block;
  color: #fff;
  font-size: 13px;
}

/* =========================
   PLAYERS
========================= */

.players {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 9px;
}

.player-box {
  background: rgba(0, 0, 0, .18);
  border-radius: 13px;
  padding: 12px 9px;
  text-align: center;
  min-width: 0;
}

.player-icon {
  font-size: 23px;
  margin-bottom: 5px;
}

.player-name {
  display: block;
  font-size: 12px;
  font-weight: 800;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.player-status {
  display: block;
  margin-top: 4px;
  color: #aaa0b5;
  font-size: 9px;
}

.vs {
  font-size: 11px;
  color: #a99caf;
  font-weight: 800;
}

/* =========================
   ROOM CODE
========================= */

.room-code-card {
  background:
    linear-gradient(135deg, rgba(109, 40, 217, .25), rgba(67, 32, 107, .18));
}

.room-code-label {
  color: #aaa0b5;
  font-size: 10px;
  margin-bottom: 8px;
}

.room-code-input-row {
  display: flex;
  gap: 8px;
}

#roomCodeInput {
  flex: 1;
  min-width: 0;
  height: 46px;
  border: 1px solid rgba(255, 255, 255, .13);
  border-radius: 11px;
  background: rgba(0, 0, 0, .22);
  color: #fff;
  outline: none;
  padding: 0 12px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 3px;
  text-align: center;
}

#roomCodeInput::placeholder {
  color: #777080;
  letter-spacing: 1px;
}

#roomCodeInput:focus {
  border-color: #8b5cf6;
}

#setRoomCodeBtn {
  height: 46px;
  border: none;
  border-radius: 11px;
  padding: 0 14px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

#setRoomCodeBtn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.room-code-message {
  min-height: 15px;
  margin-top: 7px;
  text-align: center;
  font-size: 10px;
  color: #cfc3dc;
}

.current-code {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, .08);
  text-align: center;
}

.current-code small {
  display: block;
  color: #9990a3;
  font-size: 9px;
  margin-bottom: 6px;
}

#roomCode {
  display: block;
  font-size: 27px;
  font-weight: 900;
  letter-spacing: 5px;
  color: #fff;
  margin-bottom: 10px;
}

#copyCodeBtn {
  border: 1px solid rgba(255, 255, 255, .12);
  background: rgba(255, 255, 255, .08);
  color: #fff;
  border-radius: 9px;
  padding: 9px 15px;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

/* =========================
   WAITING CARD
========================= */

.waiting-card {
  text-align: center;
  background: rgba(255, 255, 255, .045);
}

.waiting-icon {
  font-size: 30px;
  margin-bottom: 7px;
}

.waiting-card h3 {
  font-size: 15px;
}

.waiting-card p {
  margin-top: 5px;
  color: #aaa0b5;
  font-size: 10px;
  line-height: 1.5;
}

/* =========================
   APP PLAY CARD
========================= */

.app-play-card {
  background: linear-gradient(135deg, #241238, #351c50);
  border: 1px solid rgba(168, 85, 247, .25);
}

.app-play-card h3 {
  font-size: 16px;
}

.app-play-card p {
  margin-top: 6px;
  color: #c6bacf;
  font-size: 10px;
  line-height: 1.55;
}

.ludo-app-note {
  margin-top: 11px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, .18);
  color: #e5dbea;
  font-size: 10px;
  text-align: center;
}

/* =========================
   RESULT
========================= */

.result-card h3 {
  font-size: 16px;
  margin-bottom: 6px;
}

.result-card > p {
  color: #aaa0b5;
  font-size: 10px;
  line-height: 1.5;
  margin-bottom: 13px;
}

.result-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.result-btn {
  min-height: 44px;
  border: none;
  border-radius: 11px;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.won-btn {
  background: linear-gradient(135deg, #16a34a, #15803d);
}

.lost-btn {
  background: linear-gradient(135deg, #dc2626, #991b1b);
}

.cancel-result-btn {
  background: linear-gradient(135deg, #6b7280, #374151);
}

.result-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* =========================
   CANCEL
========================= */

.cancel-match-btn {
  width: 100%;
  height: 45px;
  border: 1px solid rgba(239, 68, 68, .28);
  border-radius: 11px;
  background: rgba(127, 29, 29, .18);
  color: #fca5a5;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.cancel-match-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

/* =========================
   BOTTOM NAV
========================= */

.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 70px;
  background: rgba(18, 11, 27, .98);
  border-top: 1px solid rgba(255, 255, 255, .09);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  z-index: 100;
  backdrop-filter: blur(12px);
}

.nav-item {
  text-decoration: none;
  color: #8f8598;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 19px;
}

.nav-item small {
  font-size: 9px;
}

.nav-item.active {
  color: #a78bfa;
}

/* =========================
   HIDDEN
========================= */

.hidden {
  display: none !important;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 380px) {

  .room-container {
    padding: 12px;
  }

  .info-grid {
    gap: 6px;
  }

  .info-box {
    padding: 10px 5px;
  }

  .info-box strong {
    font-size: 12px;
  }

  #setRoomCodeBtn {
    padding: 0 10px;
  }

  .result-buttons {
    gap: 6px;
  }

  .result-btn {
    font-size: 9px;
  }
}
