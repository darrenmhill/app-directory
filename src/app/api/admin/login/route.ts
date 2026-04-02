import { login } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting: track failed attempts per IP
const attempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const record = attempts.get(ip);
  if (!record) return false;

  // Reset if window has passed
  if (Date.now() - record.lastAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const record = attempts.get(ip);
  if (record && Date.now() - record.lastAttempt < WINDOW_MS) {
    record.count++;
    record.lastAttempt = Date.now();
  } else {
    attempts.set(ip, { count: 1, lastAttempt: Date.now() });
  }
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const { username, password } = await request.json();

  const success = await login(username, password);
  if (!success) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  clearAttempts(ip);
  return NextResponse.json({ ok: true });
}
