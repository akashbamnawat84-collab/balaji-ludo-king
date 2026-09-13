// ======================================================
// BALAJI LUDO KING
// CLOUDFLARE WORKER
// DEMO WALLET + GAME
// ======================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // ==================================================
      // WEBSOCKET / FUTURE ONLINE GAME
      // ==================================================

      if (url.pathname === "/ws") {
        return new Response(
          "Online game connection is not enabled yet.",
          {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      // ==================================================
      // HOME PAGE
      // ==================================================

      if (url.pathname === "/" || url.pathname === "") {
        if (env.ASSETS) {
          return env.ASSETS.fetch(
            new Request(
              `${url.origin}/index.html`,
              request
            )
          );
        }

        return new Response(
          "Balaji Ludo King - Assets binding not configured.",
          {
            status: 500,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      // ==================================================
      // ADMIN PAGE
      // ==================================================

      if (url.pathname === "/admin") {
        if (env.ASSETS) {
          return env.ASSETS.fetch(
            new Request(
              `${url.origin}/admin.html`,
              request
            )
          );
        }

        return new Response(
          "Admin page is not available.",
          {
            status: 404,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      // ==================================================
      // ADMIN LOGIN
      // ==================================================

      if (url.pathname === "/admin-login") {
        if (env.ASSETS) {
          return env.ASSETS.fetch(
            new Request(
              `${url.origin}/admin-login.html`,
              request
            )
          );
        }

        return new Response(
          "Admin login page is not available.",
          {
            status: 404,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      // ==================================================
      // STATIC FILES
      // ==================================================

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      // ==================================================
      // ASSETS ERROR
      // ==================================================

      return new Response(
        "Balaji Ludo King is running, but Cloudflare Assets binding is missing.",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8"
          }
        }
      );

    } catch (error) {

      // ==================================================
      // ERROR HANDLER
      // ==================================================

      return new Response(
        JSON.stringify(
          {
            success: false,
            message: "Balaji Ludo King server error",
            error: String(
              error?.message || error
            )
          },
          null,
          2
        ),
        {
          status: 500,
          headers: {
            "Content-Type":
              "application/json; charset=UTF-8"
          }
        }
      );
    }
  }
};
