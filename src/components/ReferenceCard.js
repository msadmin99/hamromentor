export default function ReferenceCard({ bookName, edition, chapter, page, url, className = "" }) {
  if (!bookName) return null;

  const body = (
    <>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Reference</p>
      <p className="text-sm font-semibold text-[var(--color-text)]">{bookName}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
        {[edition && `${edition} Edition`, chapter && `Chapter: ${chapter}`, page && `Page: ${page}`]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </>
  );

  return (
    <div className={`rounded-xl border border-[var(--color-border)] p-3 ${className}`}>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}
