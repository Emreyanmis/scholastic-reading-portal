import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// During development, /api/* is proxied to the Spring Boot backend so the
// browser and server share an origin from the cookie's perspective. In
// production, set VITE_API_BASE to the deployed backend URL.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_DEV_BACKEND || "http://localhost:8081";
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  };
});
