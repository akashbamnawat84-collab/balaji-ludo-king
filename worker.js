// ======================================================
// BALAJI LUDO KING
// 2 PLAYER - ROOM CODE JOIN
// ======================================================

const HOME = -1;
const FINISH = 56;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/ws") {

        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("WebSocket connection required.", {
            status: 426
          });
        }

        const room =
          (url.searchParams.get("room") || "")
            .replace(/\D/g, "")
            .slice(0, 6);

        const name =
          (url.searchParams.get("name") || "Player")
            .trim()
            .slice(0, 20);

        if (!/^\d{6}$/.test(room)) {
          return new Response("Invalid Room Code.", {
            status: 400
          });
        }

        if (!env.LUDO_ROOM) {
          return new Response("LUDO_ROOM binding missing.", {
            status: 500
          });
        }

        const id =
          env.LUDO_ROOM.idFromName(room);

        const stub =
