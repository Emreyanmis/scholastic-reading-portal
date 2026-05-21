import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import "./index.css";

import { wakeBackend } from "./lib/api";

// Start waking Render as soon as the app loads (non-blocking).
if (typeof requestIdleCallback === "function") {
  requestIdleCallback(() => wakeBackend().catch(() => {}), { timeout: 500 });
} else {
  setTimeout(() => wakeBackend().catch(() => {}), 500);
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
