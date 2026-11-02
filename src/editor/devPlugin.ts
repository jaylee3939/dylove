import type { Plugin } from "vite";
export function privateEditor(enabled: boolean): Plugin {
  return {
    name: "local-content-editor",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (
          !pathname?.match(/^\/__editor\/?$/) &&
          !(enabled && pathname === "/")
        )
          return next();
        if (!enabled) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        const address = req.socket.remoteAddress;
        const host = req.headers.host ?? "";
        const localAddress =
          address === "127.0.0.1" ||
          address === "::1" ||
          address === "::ffff:127.0.0.1";
        const localHost = /^(127\.0\.0\.1|localhost|\[::1\]):5174$/.test(host);
        const origin = req.headers.origin;
        if (
          !localAddress ||
          !localHost ||
          (origin && origin !== `http://${host}`)
        ) {
          res.statusCode = 403;
          res.end("로컬 컴퓨터에서만 열 수 있어요.");
          return;
        }
        void server
          .transformIndexHtml(
            "/__editor",
            '<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>우리의 이야기 작업실 ♡</title></head><body><div id="root"></div><script type="module" src="/src/editor/main.tsx"></script></body></html>',
          )
          .then((html) => {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.setHeader("X-Frame-Options", "DENY");
            res.end(html);
          })
          .catch(next);
      });
    },
  };
}
