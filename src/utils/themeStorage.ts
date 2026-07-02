export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "web-builders-weekly:theme-preference:v1";
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function getBrowserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getThemePreferenceStorage() {
  return getBrowserStorage();
}

export function getThemePreferenceKey() {
  return THEME_STORAGE_KEY;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function canUseThemePreferenceStorage(storage: Storage | null = getBrowserStorage()) {
  if (!storage) {
    return false;
  }

  const probeKey = `${THEME_STORAGE_KEY}:probe`;

  try {
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);

    return true;
  } catch {
    return false;
  }
}

export function readThemePreference(
  storage: Storage | null = getBrowserStorage(),
): ThemePreference {
  if (!storage) {
    return "system";
  }

  try {
    const storedPreference = storage.getItem(THEME_STORAGE_KEY);

    return isThemePreference(storedPreference) ? storedPreference : "system";
  } catch {
    return "system";
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, preference);

    return true;
  } catch {
    return false;
  }
}

function getSystemTheme(): ResolvedTheme {
  if (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia(DARK_SCHEME_QUERY).matches
  ) {
    return "dark";
  }

  return "light";
}

export function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

export function getDarkSchemeQuery() {
  return DARK_SCHEME_QUERY;
}
