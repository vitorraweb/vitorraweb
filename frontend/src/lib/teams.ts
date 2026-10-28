/* ─── Microsoft Teams helpers ─────────────────────────────────────────────────
   Chat links use Microsoft's documented deep link
     https://teams.microsoft.com/l/chat/0/0?users=<email>[&topicName=…][&message=…]
   which opens a chat in the Teams app (or Teams on the web) without any
   Microsoft Graph permission. Every parameter is URL-encoded.

   Links open in a new tab/window so Vitorra stays where it was; inside the
   Vitorra tab in Teams they go through the Teams SDK (app.openLink), which
   opens the chat in Teams itself.

   The SDK is only initialised when the page is actually running inside a
   Teams/Microsoft 365 host (in an iframe, opened with ?inTeams=1).        */

export function teamsChatUrl(email: string, opts: { topic?: string; message?: string } = {}): string {
  const p = new URLSearchParams({ users: email.trim() });
  if (opts.topic) p.set("topicName", opts.topic.slice(0, 200));
  if (opts.message) p.set("message", opts.message.slice(0, 1000));
  return `https://teams.microsoft.com/l/chat/0/0?${p.toString()}`;
}

/** True only in a page framed by a host and opened from our Teams app manifest. */
export function looksLikeTeamsHost(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top && new URLSearchParams(window.location.search).get("inTeams") === "1";
  } catch {
    return true; // cross-origin parent: framed by someone
  }
}

let initialised: Promise<boolean> | null = null;

/** Initialise TeamsJS once; resolves false when not in a Teams host (or it times out). */
export function initTeams(timeoutMs = 4000): Promise<boolean> {
  if (!looksLikeTeamsHost()) return Promise.resolve(false);
  initialised ??= (async () => {
    try {
      const { app } = await import("@microsoft/teams-js");
      await Promise.race([app.initialize(), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))]);
      return true;
    } catch {
      return false;
    }
  })();
  return initialised;
}

/** Open a Teams deep link (chat, meeting) without leaving Vitorra. */
export async function openTeamsLink(url: string): Promise<void> {
  if (await initTeams(1500)) {
    try {
      const { app } = await import("@microsoft/teams-js");
      await app.openLink(url);
      return;
    } catch { /* fall through to a new window */ }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
