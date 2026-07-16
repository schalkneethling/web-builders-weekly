import { UMAMI_ANALYTICS_URL, UMAMI_SCRIPT_ID, UMAMI_WEBSITE_ID } from "../config/analytics";

export type AnalyticsConsent = "granted" | "denied";

const ANALYTICS_CONSENT_STORAGE_KEY = "web-builders-weekly:analytics-consent:v1";

function getBrowserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getAnalyticsConsentKey() {
  return ANALYTICS_CONSENT_STORAGE_KEY;
}

export function isAnalyticsConsent(value: unknown): value is AnalyticsConsent {
  return value === "granted" || value === "denied";
}

export function readAnalyticsConsent(
  storage: Storage | null = getBrowserStorage(),
): AnalyticsConsent | null {
  if (!storage) {
    return null;
  }

  try {
    const storedConsent = storage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);

    return isAnalyticsConsent(storedConsent) ? storedConsent : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(
  consent: AnalyticsConsent,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);

    return true;
  } catch {
    return false;
  }
}

export function loadUmamiAnalytics(documentRef: Document = document) {
  if (documentRef.getElementById(UMAMI_SCRIPT_ID)) {
    return;
  }

  const script = documentRef.createElement("script");

  script.defer = true;
  script.id = UMAMI_SCRIPT_ID;
  script.src = UMAMI_ANALYTICS_URL;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  documentRef.head.appendChild(script);
}
