import { publishSpecial, checkDeployment, snapshotSpecial } from "./publishing";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultEpisode } from "../episodes/1111/defaults";
import { validateSpecial, safePath } from "../episodes/1111/schema";
import type { Plugin } from "vite";
export function privateEditor(enabled: boolean): Plugin {
  return {
    name: "local-content-editor",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (
          [
            "/__special/apply",
            "/__special/publish",
            "/__special/publish/status",
          ].includes(pathname ?? "")
        ) {
          const host = req.headers.host ?? "";
          const address = req.socket.remoteAddress;
          if (
            !enabled ||
            req.method !== "POST" ||
            !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "") ||
            !/^(127\.0\.0\.1|localhost|\[::1\]):5174$/.test(host) ||
            (req.headers.origin !== undefined &&
              req.headers.origin !== `http://${host}`) ||
            req.headers["x-local-editor"] !== "1111" ||
            !req.headers["content-type"]?.startsWith("application/json")
          ) {
            res.statusCode = 403;
            res.end('{"error":"로컬 편집기에서만 반영할 수 있어요."}');
            return;
          }
          void (async () => {
            try {
              req.setEncoding("utf8");
              let raw = "";
              for await (const chunk of req) {
                raw += chunk;
                if (Buffer.byteLength(raw) > 40 * 1024 * 1024)
                  throw Error("사진 묶음이 너무 커요.");
              }
              const body = JSON.parse(raw);
              if (pathname === "/__special/publish") {
                if (!/^[a-f0-9]{64}$/.test(body.expectedDigest ?? ""))
                  throw Error("먼저 현재 수정본을 반영해 주세요.");
                const result = await publishSpecial({
                  source: server.config.root,
                  expectedDigest: body.expectedDigest,
                });
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
                return;
              }
              if (pathname === "/__special/publish/status") {
                const result = await checkDeployment(body.digest);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
                return;
              }
              const content = validateSpecial(body.content, defaultEpisode);
              const allowed = new Set(
                content.chapters.flatMap((c) =>
                  [...c.photos.map((p) => p.src), c.background].filter(Boolean),
                ),
              );
              const images: [string, Buffer][] = [];
              for (const [name, data] of Object.entries(body.images ?? {})) {
                if (
                  !safePath(name) ||
                  !allowed.has(name) ||
                  typeof data !== "string"
                )
                  throw Error("잘못된 사진 경로예요.");
                const bytes = Buffer.from(data, "base64");
                const magic = bytes.subarray(0, 12);
                if (
                  bytes.length > 3 * 1024 * 1024 ||
                  !(
                    magic.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
                    magic
                      .subarray(0, 8)
                      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
                    (magic.toString("ascii", 0, 4) === "RIFF" &&
                      magic.toString("ascii", 8, 12) === "WEBP")
                  )
                )
                  throw Error("지원하지 않는 사진이에요.");
                const target = path.join(server.config.root, "public", name);
                try {
                  const old = await fs.readFile(target);
                  if (!old.equals(bytes))
                    throw Error(
                      "기존 사진과 이름이 겹쳐요. 다시 업로드해 주세요.",
                    );
                } catch (e) {
                  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
                }
                images.push([target, bytes]);
              }
              for (const name of allowed)
                if (
                  !images.some(
                    ([target]) =>
                      target === path.join(server.config.root, "public", name!),
                  )
                )
                  await fs.access(
                    path.join(server.config.root, "public", name!),
                  );
              for (const [target, bytes] of images) {
                await fs.mkdir(path.dirname(target), { recursive: true });
                await fs.writeFile(target, bytes, { flag: "wx" }).catch((e) => {
                  if (e.code !== "EEXIST") throw e;
                });
              }
              const target = path.join(
                server.config.root,
                "src/episodes/1111/published.json",
              );
              await fs.writeFile(
                target + ".tmp",
                JSON.stringify(content, null, 2) + "\n",
              );
              await fs.rename(target + ".tmp", target);
              res.setHeader("Content-Type", "application/json");
              const { digest } = await snapshotSpecial(server.config.root);
              res.end(JSON.stringify({ ok: true, digest }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: e instanceof Error ? e.message : "반영 실패",
                }),
              );
            }
          })();
          return;
        }
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
