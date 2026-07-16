import { useEffect, useState } from "react";
import type { AnalyticsConsent } from "../utils/analyticsConsent";
import {
  loadUmamiAnalytics,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "../utils/analyticsConsent";

export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => readAnalyticsConsent());

  useEffect(() => {
    if (consent === "granted") {
      loadUmamiAnalytics();
    }
  }, [consent]);

  function acceptAnalytics() {
    if (writeAnalyticsConsent("granted")) {
      setConsent("granted");
      return;
    }

    setConsent("granted");
    loadUmamiAnalytics();
  }

  function declineAnalytics() {
    writeAnalyticsConsent("denied");
    setConsent("denied");
  }

  return {
    acceptAnalytics,
    declineAnalytics,
    showBanner: consent === null,
  };
}
