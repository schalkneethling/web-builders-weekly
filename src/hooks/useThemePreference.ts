import { useEffect, useMemo, useState } from "react";
import {
  canUseThemePreferenceStorage,
  getDarkSchemeQuery,
  getThemePreferenceKey,
  getThemePreferenceStorage,
  isThemePreference,
  readThemePreference,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
  writeThemePreference,
} from "../utils/themeStorage";

function applyTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;

  root.dataset.themePreference = preference;
  root.dataset.theme = resolvedTheme;
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveThemePreference(preference),
  );
  const [canPersistTheme, setCanPersistTheme] = useState(() =>
    canUseThemePreferenceStorage(getThemePreferenceStorage()),
  );

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia?.(getDarkSchemeQuery());

    function syncResolvedTheme(nextPreference = preference) {
      const nextResolvedTheme = resolveThemePreference(nextPreference);

      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextPreference, nextResolvedTheme);
    }

    syncResolvedTheme();

    if (!mediaQuery) {
      return;
    }

    const syncSystemTheme = () => syncResolvedTheme();

    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, [preference]);

  useEffect(() => {
    function syncStoredPreference(event: StorageEvent) {
      if (event.key !== getThemePreferenceKey()) {
        return;
      }

      setPreferenceState(isThemePreference(event.newValue) ? event.newValue : "system");
    }

    globalThis.addEventListener?.("storage", syncStoredPreference);

    return () => {
      globalThis.removeEventListener?.("storage", syncStoredPreference);
    };
  }, []);

  const actions = useMemo(
    () => ({
      setPreference: (nextPreference: ThemePreference) => {
        setPreferenceState(nextPreference);
        setCanPersistTheme(writeThemePreference(nextPreference));
      },
    }),
    [],
  );

  return {
    actions,
    canPersistTheme,
    preference,
    resolvedTheme,
  };
}
