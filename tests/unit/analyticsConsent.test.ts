import { describe, expect, it } from "vite-plus/test";
import { UMAMI_SCRIPT_ID } from "../../src/config/analytics";
import {
  getAnalyticsConsentKey,
  loadUmamiAnalytics,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "../../src/utils/analyticsConsent";

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

describe("analytics consent storage", () => {
  it("writes and reads an explicit consent choice", () => {
    const storage = new MemoryStorage();

    expect(writeAnalyticsConsent("granted", storage)).toBe(true);
    expect(readAnalyticsConsent(storage)).toBe("granted");
  });

  it("ignores invalid stored values", () => {
    const storage = new MemoryStorage();

    storage.setItem(getAnalyticsConsentKey(), "maybe");

    expect(readAnalyticsConsent(storage)).toBeNull();
  });
});

describe("loadUmamiAnalytics", () => {
  it("adds the analytics script only once", () => {
    const scripts = new Map<string, Element>();

    const documentRef = {
      createElement(tagName: string) {
        if (tagName !== "script") {
          throw new Error(`Unexpected element: ${tagName}`);
        }

        return {
          dataset: {},
          defer: false,
          id: "",
          src: "",
        };
      },
      getElementById(id: string) {
        return scripts.get(id) ?? null;
      },
      head: {
        appendChild(element: { id: string }) {
          scripts.set(element.id, element as Element);
        },
      },
      querySelectorAll(selector: string) {
        const id = selector.replace("#", "");

        return scripts.has(id) ? [scripts.get(id)!] : [];
      },
    } as unknown as Document;

    loadUmamiAnalytics(documentRef);
    loadUmamiAnalytics(documentRef);

    expect(documentRef.getElementById(UMAMI_SCRIPT_ID)).not.toBeNull();
    expect(documentRef.querySelectorAll(`#${UMAMI_SCRIPT_ID}`)).toHaveLength(1);
  });
});
