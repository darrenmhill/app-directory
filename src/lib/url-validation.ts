const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",
];

const BLOCKED_PREFIXES = [
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
  "169.254.",
  "fc00:",
  "fe80:",
];

export function isValidPublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) return false;

    // Block known private/internal hostnames
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return false;

    // Block private IP ranges
    for (const prefix of BLOCKED_PREFIXES) {
      if (hostname.startsWith(prefix)) return false;
    }

    // Block .internal and .local domains
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;

    return true;
  } catch {
    return false;
  }
}
