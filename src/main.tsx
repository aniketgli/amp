// ============================================================
// WII ACCESS MANAGEMENT PORTAL
// FILE: src/main.tsx
//
// PURPOSE:
// ------------------------------------------------------------
// Application ka main entry point.
//
// IMPORTANT:
// BrowserRouter yahan lagaya gaya hai taaki:
//   /
//   /profile
//   /requests
//   /admin
//   /helpdesk
//
// jaise URLs React application ke andar properly handle ho saken.
//
// Iske baad page/component change hone par browser URL bhi change
// hoga aur Back / Forward buttons bhi kaam karenge.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import "./index.css";

// ------------------------------------------------------------
// React application ko BrowserRouter ke andar wrap kar rahe hain.
//
// BrowserRouter browser ke History API ko use karta hai.
//
// Example:
//
// navigate("/profile")
//
// Browser URL:
// http://192.168.205.75:5000/profile
//
// ------------------------------------------------------------

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
