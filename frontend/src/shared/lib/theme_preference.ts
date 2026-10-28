const THEME_KEY = "snap-link:theme";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserProfileStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function isExplicit(value: unknown): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

export function readThemePreference(storage: StorageLike | undefined = browserProfileStorage()): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_KEY);
    return isExplicit(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: StorageLike | undefined = browserProfileStorage(),
): void {
  try {
    if (preference === "system") storage?.removeItem(THEME_KEY);
    else storage?.setItem(THEME_KEY, preference);
  } catch {
    // The choice still applies to this page; it just will not be remembered.
  }
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference !== "system") return preference;
  return prefersDark ? "dark" : "light";
}

// Runs in <head> before first paint so a stored choice never flashes the other theme.
export const themeBootScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
