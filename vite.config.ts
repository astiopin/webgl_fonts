import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [glsl(), dts()],
  build: {
    copyPublicDir: false,
    lib: {
      formats: ["es"],
      entry: "src/index.ts",
      fileName: "index",
    },
  },
});
