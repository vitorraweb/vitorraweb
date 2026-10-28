/* ─── Console appearance ──────────────────────────────────────────────────────
   Light, dark, or follow the computer. Stored per browser (a viewer's
   preference, not shared state); the layout resolves "system" through
   prefers-color-scheme and stamps the result on .admin-console.          */

export type ConsoleTheme = "light" | "dark" | "system";

const KEY = "vitorra_console_theme";
export const CONSOLE_THEME_EVENT = "vitorra:console-theme";

export function readConsoleTheme(): ConsoleTheme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function writeConsoleTheme(t: ConsoleTheme): void {
  try {
    if (t === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    /* private mode: the choice still applies to this page */
  }
  window.dispatchEvent(new CustomEvent<ConsoleTheme>(CONSOLE_THEME_EVENT, { detail: t }));
}

export function resolveTheme(t: ConsoleTheme): "light" | "dark" {
  if (t !== "system") return t;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
