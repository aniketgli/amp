import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT || 3000);

export const EMAIL_USER = process.env.EMAIL_USER || "";
export const EMAIL_PASS = process.env.EMAIL_PASS || "";

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export const CLIENT_URL = process.env.CLIENT_URL || "";
