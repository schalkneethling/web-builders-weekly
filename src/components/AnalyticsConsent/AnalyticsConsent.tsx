import { useAnalyticsConsent } from "../../hooks/useAnalyticsConsent";

export function AnalyticsConsent() {
  const { acceptAnalytics, declineAnalytics, showBanner } = useAnalyticsConsent();

  if (!showBanner) {
    return null;
  }

  return (
    <aside aria-labelledby="analytics-consent-title" className="analytics-consent" role="dialog">
      <div className="analytics-consent__content">
        <p className="analytics-consent__text">
          <span className="analytics-consent__title" id="analytics-consent-title">
            Privacy-friendly analytics
          </span>
          We use cookieless, self-hosted analytics to understand aggregate site usage. No ad
          trackers or cross-site cookies.
        </p>
        <div className="analytics-consent__actions">
          <button
            className="analytics-consent__button analytics-consent__button--secondary"
            onClick={declineAnalytics}
            type="button"
          >
            No thanks
          </button>
          <button
            className="analytics-consent__button analytics-consent__button--primary"
            onClick={acceptAnalytics}
            type="button"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </aside>
  );
}
