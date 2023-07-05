import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [glsl(), dts()],
  build: {
    lib: {
      formats: ["es"],
      entry: "src/index.js",
      fileName: "index",
    },
  },
});
