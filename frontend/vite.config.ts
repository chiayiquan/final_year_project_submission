import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginRewriteAll from "vite-plugin-rewrite-all";

// https://vitejs.dev/config/

// https://stackoverflow.com/questions/36923466/dot-and-hyphen-disallowed-react-router-url-parameters/52476492

export default defineConfig({
  plugins: [react(), pluginRewriteAll()],
});
