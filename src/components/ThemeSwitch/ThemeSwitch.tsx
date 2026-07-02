import type { CSSProperties } from "react";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { useThemePreference } from "../../hooks/useThemePreference";
import type { ThemePreference } from "../../utils/themeStorage";

const themeOptions: Array<{
  icon: typeof Sun;
  label: string;
  title: string;
  value: ThemePreference;
}> = [
  {
    icon: MonitorCog,
    label: "System",
    title: "Use system theme",
    value: "system",
  },
  {
    icon: Sun,
    label: "Light",
    title: "Use light theme",
    value: "light",
  },
  {
    icon: Moon,
    label: "Dark",
    title: "Use dark theme",
    value: "dark",
  },
];

function getThemeIndex(preference: ThemePreference) {
  return themeOptions.findIndex((option) => option.value === preference);
}

export function ThemeSwitch() {
  const { actions, canPersistTheme, preference, resolvedTheme } = useThemePreference();
  const themeIndex = Math.max(getThemeIndex(preference), 0);
  const storageNoteId = canPersistTheme ? undefined : "theme-switch-storage-note";

  return (
    <fieldset
      className="theme-switch"
      aria-describedby={storageNoteId}
      style={{ "--theme-index": themeIndex } as CSSProperties}
    >
      <legend className="theme-switch__legend visually-hidden">Color theme</legend>
      <div className="theme-switch__track">
        <span className="theme-switch__thumb" aria-hidden="true">
          <Sun className="theme-switch__thumb-icon theme-switch__thumb-icon--sun" size={18} />
          <Moon className="theme-switch__thumb-icon theme-switch__thumb-icon--moon" size={18} />
        </span>
        {themeOptions.map((option) => {
          const Icon = option.icon;

          return (
            <label className="theme-switch__option" key={option.value} title={option.title}>
              <input
                checked={preference === option.value}
                className="theme-switch__input visually-hidden"
                name="theme-preference"
                onChange={() => actions.setPreference(option.value)}
                type="radio"
                value={option.value}
              />
              <span className="theme-switch__option-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={2.25} />
              </span>
              <span className="visually-hidden">
                {option.label}
                {option.value === "system" ? `, currently ${resolvedTheme}` : ""}
              </span>
            </label>
          );
        })}
      </div>
      {!canPersistTheme && (
        <p className="theme-switch__note" id={storageNoteId}>
          Theme choice cannot be saved in this browser.
        </p>
      )}
    </fieldset>
  );
}
