import type { Plugin } from "vite";
import { snapshotSpecial, MANIFEST_PATH } from "./publishing";
export function publicationManifest(): Plugin {
  let root = "";
  return {
    name: "special-publication-version",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async generateBundle() {
      const { digest } = await snapshotSpecial(root);
      this.emitFile({
        type: "asset",
        fileName: MANIFEST_PATH.slice(1),
        source: JSON.stringify({ version: 1, digest }),
      });
    },
  };
}
