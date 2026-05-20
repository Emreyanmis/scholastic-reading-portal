import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import "./index.css";

// Warm the Render backend during idle time so the first real API call is faster.
function pingBackend() {
  fetch("/api/health", { credentials: "include" }).catch(() => {});
}
if (typeof requestIdleCallback === "function") {
  requestIdleCallback(pingBackend, { timeout: 2500 });
} else {
  setTimeout(pingBackend, 1500);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
