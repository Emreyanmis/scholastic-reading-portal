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
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
          // The browser sees a same-origin request (to the Vite host), but
          // by default Vite forwards the original Origin header on to the
          // backend, which then runs CORS against it. Strip it so the
          // backend treats this like a normal server-to-server call.
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
            });
          },
        },
      },
    },
  };
});
