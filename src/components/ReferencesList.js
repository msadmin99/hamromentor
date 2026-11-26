import { BookOpenIcon, DocumentIcon, LinkIcon, PlayIcon } from "./icons";
import { videoEmbedUrl } from "./RichContent";

const TYPE_META = {
  book: { Icon: BookOpenIcon, label: "Book" },
  paper: { Icon: DocumentIcon, label: "Research Paper" },
  video: { Icon: PlayIcon, label: "Video" },
  link: { Icon: LinkIcon, label: "Link" },
};

function websiteDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function ReferencesList({ references, className = "" }) {
  if (!references?.length) return null;

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">References</p>
      <ul className="flex flex-col gap-2">
        {references.map((ref, i) => {
          const meta = TYPE_META[ref.type] || TYPE_META.link;
          const embedUrl = ref.type === "video" ? videoEmbedUrl(ref.url) : null;

          return (
            <li key={i} className="text-xs text-[var(--color-text-muted)]">
              {embedUrl ? (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--color-text)]">
                    <meta.Icon className="h-3.5 w-3.5 flex-none" aria-hidden="true" /> {ref.label || meta.label}
                  </p>
                  <div className="aspect-video w-full max-w-sm overflow-hidden rounded-lg bg-black">
                    <iframe src={embedUrl} title={ref.label || "Reference video"} className="h-full w-full" allowFullScreen />
                  </div>
                </div>
              ) : ref.url ? (
                <a href={ref.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-blue">
                  <meta.Icon className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{ref.label || meta.label}</span>
                  {ref.type === "link" && websiteDomain(ref.url) && (
                    <span className="flex-none text-[10px] text-[var(--color-text-muted)]">({websiteDomain(ref.url)})</span>
                  )}
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <meta.Icon className="h-3.5 w-3.5 flex-none text-[var(--color-text-muted)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{ref.label || meta.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
