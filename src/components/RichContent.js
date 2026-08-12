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

/** Builds `srcset`/fallback-src for a media_library `image_data` object
 * ({url, variants: {"480_webp": url, "768_avif": url, ...}, width, height}).
 * Returns null if there's nothing renderable. */
function buildResponsiveImage(imageData) {
  if (!imageData) return null;
  const variants = imageData.variants || {};
  const byFormat = { webp: [], avif: [] };
  for (const [key, url] of Object.entries(variants)) {
    const match = key.match(/^(\d+)_(webp|avif)$/);
    if (!match) continue;
    byFormat[match[2]].push({ width: Number(match[1]), url });
  }
  byFormat.webp.sort((a, b) => a.width - b.width);
  byFormat.avif.sort((a, b) => a.width - b.width);

  const webpSrcSet = byFormat.webp.map((v) => `${v.url} ${v.width}w`).join(", ");
  const avifSrcSet = byFormat.avif.map((v) => `${v.url} ${v.width}w`).join(", ");
  const fallbackSrc = imageData.url || byFormat.webp[byFormat.webp.length - 1]?.url;
  if (!fallbackSrc) return null;

  return { webpSrcSet, avifSrcSet, fallbackSrc, width: imageData.width, height: imageData.height };
}

/** Renders a question/option/explanation's rich content: HTML (from the admin's
 * rich-text editor, or plain legacy text — both render fine), optional LaTeX,
 * an optional image, and an optional embedded video.
 *
 * `imageData` (preferred) is the {url, variants, width, height} shape the
 * backend returns once an image has gone through the media_library
 * optimization pipeline — renders a responsive <picture> with AVIF/WebP
 * srcset so the browser only downloads a size appropriate to its viewport.
 * `image` (legacy) is a plain URL string, still supported as a fallback for
 * images that predate that pipeline.
 *
 * `priority`: set true for the single above-the-fold/LCP image on a page
 * (e.g. the current question during a test) to skip lazy-loading — every
 * other image (option images, images in a scrollable question list, etc.)
 * should leave this false so the browser doesn't fetch dozens of images
 * that are never scrolled into view. */
export default function RichContent({ html, latex, image, imageData, video, className = "", priority = false }) {
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
  const responsive = useMemo(() => buildResponsiveImage(imageData), [imageData]);

  if (!renderedHtml && !latexHtml && !image && !responsive && !embedUrl) return null;

  return (
    <div className={className}>
      {renderedHtml && <div className="hm-richtext-content" dangerouslySetInnerHTML={{ __html: renderedHtml }} />}
      {latexHtml && (
        <div className="mt-1.5 overflow-x-auto" dangerouslySetInnerHTML={{ __html: latexHtml }} />
      )}
      {responsive ? (
        <picture>
          {responsive.avifSrcSet && <source type="image/avif" srcSet={responsive.avifSrcSet} sizes="(max-width: 640px) 100vw, 640px" />}
          {responsive.webpSrcSet && <source type="image/webp" srcSet={responsive.webpSrcSet} sizes="(max-width: 640px) 100vw, 640px" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={responsive.fallbackSrc}
            alt=""
            width={responsive.width || undefined}
            height={responsive.height || undefined}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="mt-3 max-w-full rounded-lg"
          />
        </picture>
      ) : (
        image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading={priority ? "eager" : "lazy"} className="mt-3 max-w-full rounded-lg" />
        )
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
