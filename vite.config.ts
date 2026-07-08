import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // PORT is assigned by the preview harness (autoPort); 4600 is the fallback
  server: { port: Number(process.env.PORT) || 4600, host: true },
});
