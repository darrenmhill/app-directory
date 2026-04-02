import { login } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting with exponential backoff
const attempts = new Map<
  string,
  { count: number; lastAttempt: number; lockedUntil: number }
>();
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 60 * 1000; // 1 minute base
const MAX_LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes max

function getClientIp(request: NextRequest): string {
  // Only trust x-forwarded-for from Railway/reverse proxy
  // Railway always sets this header
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { limited: boolean; retryAfter?: number } {
  const record = attempts.get(ip);
  if (!record) return { limited: false };

  if (record.lockedUntil > Date.now()) {
    return {
      limited: true,
      retryAfter: Math.ceil((record.lockedUntil - Date.now()) / 1000),
    };
  }

  // Reset if lock has expired
  if (record.count >= MAX_ATTEMPTS && record.lockedUntil <= Date.now()) {
    attempts.delete(ip);
    return { limited: false };
  }

  return { limited: false };
}

function recordFailedAttempt(ip: string) {
  const record = attempts.get(ip);
  const now = Date.now();

  if (record) {
    record.count++;
    record.lastAttempt = now;

    if (record.count >= MAX_ATTEMPTS) {
      // Exponential backoff: 1min, 2min, 4min, 8min... up to 30min
      const lockoutMs = Math.min(
        BASE_LOCKOUT_MS * Math.pow(2, Math.floor(record.count / MAX_ATTEMPTS) - 1),
        MAX_LOCKOUT_MS
      );
      record.lockedUntil = now + lockoutMs;
      console.warn(
        `[SECURITY] Login locked for IP ${ip} - ${record.count} failed attempts, locked for ${lockoutMs / 1000}s`
      );
    }
  } else {
    attempts.set(ip, { count: 1, lastAttempt: now, lockedUntil: 0 });
  }

  console.warn(`[SECURITY] Failed login attempt from IP ${ip}`);
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const rateCheck = checkRateLimit(ip);
  if (rateCheck.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfter) },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const success = await login(username, password);
  if (!success) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  clearAttempts(ip);
  return NextResponse.json({ ok: true });
}
