import { defineConfig } from "vite";
import { publicationManifest } from "./src/editor/publicationManifest";
import react from "@vitejs/plugin-react";
import { privateEditor } from "./src/editor/devPlugin";
export default defineConfig(({ mode }) => ({
  plugins: [react(), privateEditor(mode === "editor"), publicationManifest()],
  ...(mode === "editor"
    ? {
        server: {
          host: "127.0.0.1",
          port: 5174,
          strictPort: true,
          cors: false,
          allowedHosts: ["localhost"],
        },
      }
    : {}),
  build: { chunkSizeWarningLimit: 1500 },
}));
