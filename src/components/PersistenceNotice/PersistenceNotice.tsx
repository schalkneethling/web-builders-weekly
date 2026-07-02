interface PersistenceNoticeProps {
  canPersistProgress: boolean;
}

export function PersistenceNotice({ canPersistProgress }: PersistenceNoticeProps) {
  if (canPersistProgress) {
    return null;
  }

  return (
    <section className="persistence-notice" aria-labelledby="persistence-notice-title">
      <h2 className="persistence-notice__title" id="persistence-notice-title">
        Progress cannot be saved
      </h2>
      <p>
        Local storage is unavailable in this browser. Your entries and selected clue will only last
        until the page is refreshed or closed.
      </p>
    </section>
  );
}
