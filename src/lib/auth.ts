import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET environment variable is required");
  return secret;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function sign(value: string): Promise<string> {
  const secret = getSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );
  const sig = Buffer.from(signature).toString("hex");
  return `${value}.${sig}`;
}

async function verify(token: string): Promise<boolean> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;
  const value = token.substring(0, dotIndex);
  const expected = await sign(value);
  return safeCompare(token, expected);
}

export async function login(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required");
  }

  // Timing-safe comparison for both username and password
  const usernameMatch = safeCompare(
    Buffer.from(username).toString("base64"),
    Buffer.from(expectedUsername).toString("base64")
  );
  const passwordMatch = safeCompare(
    Buffer.from(password).toString("base64"),
    Buffer.from(expectedPassword).toString("base64")
  );

  if (!usernameMatch || !passwordMatch) return false;

  const token = await sign("admin");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return true;
}

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verify(token);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
