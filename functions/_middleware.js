const BLOCKED_EXACT = ["/CLAUDE.md", "/docs", "/docs/", "/.claude", "/.claude/"];
const BLOCKED_PREFIXES = ["/docs/", "/.claude/"];

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

  const isBlocked =
    BLOCKED_EXACT.includes(pathname) ||
    BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isBlocked) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, noarchive, nosnippet",
        "Cache-Control": "no-store",
      },
    });
  }

  return context.next();
}
