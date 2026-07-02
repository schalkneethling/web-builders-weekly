import { describe, expect, it } from "vite-plus/test";
import {
  canUseThemePreferenceStorage,
  getThemePreferenceKey,
  readThemePreference,
  writeThemePreference,
} from "../../src/utils/themeStorage";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

class BlockedStorage extends MemoryStorage {
  override setItem(_key: string, _value: string) {
    throw new Error("Storage is blocked.");
  }
}

describe("theme preference storage", () => {
  it("writes and reads an explicit theme preference", () => {
    const storage = new MemoryStorage();

    expect(writeThemePreference("dark", storage)).toBe(true);
    expect(readThemePreference(storage)).toBe("dark");
  });

  it("falls back to system when the saved value is invalid", () => {
    const storage = new MemoryStorage();

    storage.setItem(getThemePreferenceKey(), "sepia");

    expect(readThemePreference(storage)).toBe("system");
  });

  it("reports blocked storage", () => {
    const storage = new BlockedStorage();

    expect(canUseThemePreferenceStorage(storage)).toBe(false);
    expect(writeThemePreference("light", storage)).toBe(false);
    expect(readThemePreference(storage)).toBe("system");
  });
});
