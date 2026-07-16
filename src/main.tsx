import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsConsent } from "./components/AnalyticsConsent/AnalyticsConsent";
import { App } from "./App";

createRoot(document.querySelector<HTMLDivElement>("#app")!).render(
  <StrictMode>
    <App />
    <AnalyticsConsent />
  </StrictMode>,
);
