// ======================================================
// BALAJI LUDO KING - CLOUDFLARE WORKER
// DEMO WALLET VERSION
// ======================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // -----------------------------------------------
      // HOME PAGE
      // -----------------------------------------------
      if (
        url.pathname === "/" ||
        url.pathname === ""
      ) {
        if (env.ASSETS) {
          return env.ASSETS.fetch(
            new Request(
              `${url.origin}/index.html`,
              request
            )
          );
        }
      }

      // -----------------------------------------------
      // ADMIN
      // -----------------------------------------------
      if (url.pathname === "/admin") {
        if (env.ASSETS) {
          return env.ASSETS.fetch(
            new Request(
              `${url.origin}/admin.html`,
              request
            )
          );
        }
      }

      // -----------------------------------------------
      // ADMIN LOGIN
      // -----------------------------------------------
      if (url.pathname === "/admin-login") {
        if (env.ASSETS) {
          return env.ASSETS.fetch(
            new Request(
              `${url.origin}/admin-login.html`,
              request
            )
          );
        }
      }

      // -----------------------------------------------
      // STATIC FILES
      // -----------------------------------------------
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      // -----------------------------------------------
      // FALLBACK
      // -----------------------------------------------
      return new Response(
        "Balaji Ludo King is running.",
        {
          status: 200,
          headers: {
            "Content-Type":
              "text/plain; charset=UTF-8"
          }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server error",
          error: String(
            error?.message || error
          )
        }),
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
