import { NextRequest, NextResponse } from "next/server";

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.microlink.io; connect-src 'self'; font-src 'self'; frame-ancestors 'none';"
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and login API
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return addSecurityHeaders(NextResponse.next());
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("admin_session")?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );
      }
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url))
      );
    }

    // CSRF protection for state-changing requests
    if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return addSecurityHeaders(
            NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
          );
        }
      }
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|logo-white.svg).*)",
  ],
};
