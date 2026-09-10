import type { Express } from "express";

import {
  activateAuth,
  loginAuth,
  logoutAuth,
  meAuth,
  registerAuth,
} from "../controllers/auth.controller";

import { authenticateToken } from "../middleware/auth";

export function registerAuthRoutes(app: Express): void {
  // Public authentication endpoints
  app.post("/api/register", registerAuth);
  app.get("/api/activate/:token", activateAuth);
  app.post("/api/login", loginAuth);

  // Authenticated session endpoint
  app.get("/api/me", authenticateToken, meAuth);

  // Logout clears the HttpOnly authentication cookie
  app.post("/api/logout", logoutAuth);
}
