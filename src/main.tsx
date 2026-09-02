// ============================================================
// WII ACCESS MANAGEMENT PORTAL
// FILE: src/main.tsx
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Install the centralized authenticated API transport before any
// application component starts making API requests.
import "./api/apiClient";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
