import { SITE_LINKS } from "../../config/siteLinks";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__text">
        Made with love and digital robots by <a href={SITE_LINKS.author}>Schalk Neethling</a>
        <span aria-hidden="true"> | </span>
        <a href={SITE_LINKS.reportIssue} rel="noopener noreferrer" target="_blank">
          Report an issue
        </a>
        <span aria-hidden="true"> | </span>
        <a href={SITE_LINKS.suggestClue} rel="noopener noreferrer" target="_blank">
          Suggest a clue
        </a>
      </p>
    </footer>
  );
}
