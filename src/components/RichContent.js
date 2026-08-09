"use client";

import { useMemo } from "react";
import katex from "katex";

export function videoEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** The docx/rich-text import pipeline splits a LaTeX command across separate
 * bold/italic runs when only part of it was styled in the source document —
 * e.g. "\vec{A}" with just "vec" bolded comes back as "\<strong>vec</strong>{A}",
 * which breaks the command and makes KaTeX render its own garbled error output
 * instead of throwing (throwOnError is off). LaTeX never legitimately contains
 * a literal "<letter" tag-shaped run, so stripping any embedded tags from
 * inside a captured math expression before handing it to KaTeX recovers the
 * original command cleanly. */
function stripEmbeddedTags(expr) {
  return expr.replace(/<\/?[a-zA-Z][^>]*>/g, "").replace(/&lt;\/?[a-zA-Z][^&]*?&gt;/g, "");
}

/** Bulk-imported questions sometimes carry raw LaTeX source typed straight into
 * a Word/Excel cell (e.g. "$\vec{a}+\vec{b}$") instead of using the admin's
 * equation-editor button — the import pipeline has no way to know that's math,
 * so it lands in `text` as literal characters. Render it here instead, so it
 * doesn't matter whether the LaTeX came in via the dedicated `latex` field or
 * as inline $...$/$$...$$ markers inside the HTML itself. */
function renderInlineLatex(html) {
  if (!html) return html;
  let out = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    const cleaned = stripEmbeddedTags(expr).trim();
    if (!cleaned) return match;
    try {
      return katex.renderToString(cleaned, { throwOnError: false, displayMode: true });
    } catch {
      return match;
    }
  });
  out = out.replace(/\$([^$\n]+?)\$/g, (match, expr) => {
    const cleaned = stripEmbeddedTags(expr).trim();
    if (!cleaned) return match;
    try {
      return katex.renderToString(cleaned, { throwOnError: false, displayMode: false });
    } catch {
      return match;
    }
  });
  return out;
}

/** Renders a question/option/explanation's rich content: HTML (from the admin's
 * rich-text editor, or plain legacy text — both render fine), optional LaTeX,
 * an optional image, and an optional embedded video. */
export default function RichContent({ html, latex, image, video, className = "" }) {
  const renderedHtml = useMemo(() => renderInlineLatex(html), [html]);

  const latexHtml = useMemo(() => {
    if (!latex?.trim()) return "";
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: false });
    } catch {
      return "";
    }
  }, [latex]);

  const embedUrl = useMemo(() => videoEmbedUrl(video), [video]);

  if (!renderedHtml && !latexHtml && !image && !embedUrl) return null;

  return (
    <div className={className}>
      {renderedHtml && <div className="hm-richtext-content" dangerouslySetInnerHTML={{ __html: renderedHtml }} />}
      {latexHtml && (
        <div className="mt-1.5 overflow-x-auto" dangerouslySetInnerHTML={{ __html: latexHtml }} />
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="mt-3 max-w-full rounded-lg" />
      )}
      {embedUrl && (
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={embedUrl}
            title="Explanation video"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
