"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import { classifyStandaloneLatex, decodeHtmlEntities, renderMathInHtml } from "@/lib/mathDelimiters";

/** Explanation redesign, stage 2 — production bug: a value that was
 * legitimately HTML-escaped once at import time (e.g. bulk-import content
 * containing a literal "&" or comparison operator) occasionally reaches
 * this component already escaped a SECOND time — "&amp;lt;" instead of
 * "&lt;" — most likely from a content author copy-pasting already-escaped
 * markup, or re-saving already-escaped text through a path that escapes
 * again. A double-escaped "&amp;lt;" only ever decodes ONE level through
 * normal HTML parsing, leaving the literal text "&lt;" visible to the
 * student. This collapses exactly one extra level of encoding for the five
 * standard entities — never a blind global string replace, and never
 * touching a genuinely single-escaped (i.e. correct) "&lt;", which this
 * regex cannot match at all since it requires the literal "&amp;" prefix. */
function collapseDoubleEncodedEntities(html) {
  if (!html) return html;
  return html.replace(/&amp;(lt|gt|amp|quot|apos|#39);/g, "&$1;");
}

/** GT3-7 §37 — question/option/explanation HTML comes from the admin
 * rich-text editor and the bulk-import pipeline (which can include
 * content from a lower-trust Teacher-role account, not only a full
 * Admin), and is rendered here via dangerouslySetInnerHTML for every
 * student who views that question — a real stored-XSS surface with no
 * sanitization in front of it before this fix. USE_PROFILES: mathMl/svg
 * (DOMPurify's own documented config for KaTeX-rendered output) plus an
 * explicit `style` allowance keeps every legitimate KaTeX/rich-text
 * rendering path working unchanged (KaTeX leans heavily on inline
 * `style` for layout) while stripping <script>, event-handler
 * attributes (onerror, onclick, ...), and javascript: URLs. */
function sanitizeRichHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_ATTR: ["style", "target"],
  });
}

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
 * a Word/Excel cell instead of using the admin's equation-editor button — the
 * import pipeline has no way to know that's math, so it lands in `text` as
 * literal characters. Production content uses a mix of TeX `$...$`/`$$...$$`
 * markers AND MathJax-style `\(...\)`/`\[...\]` delimiters (plus, on some
 * legacy rows, a malformed nested pair like `\(\[...\]\)`) — `renderMathInHtml`
 * (src/lib/mathDelimiters.js) recognises all four and normalises the
 * malformed nesting before handing each bare expression to KaTeX, so it
 * doesn't matter which delimiter style a given row happens to use. */
function renderInlineLatex(html) {
  if (!html) return html;
  return renderMathInHtml(html, (expr, { displayMode }) => {
    // decodeHtmlEntities BEFORE stripEmbeddedTags: an entity-encoded tag
    // ("&lt;strong&gt;...&lt;/strong&gt;") becomes a real tag first, so the
    // existing tag-stripping regex below catches it the same way it always
    // caught a literal <strong> — see decodeHtmlEntities's own docstring
    // in mathDelimiters.js for the production bug this closes (a real "<"/
    // ">" comparison operator inside a math expression, legitimately
    // HTML-escaped by the storage layer, must reach KaTeX as the literal
    // character it represents, not as unrendered entity text).
    const cleaned = stripEmbeddedTags(decodeHtmlEntities(expr)).trim();
    if (!cleaned) return null;
    try {
      return katex.renderToString(cleaned, { throwOnError: false, displayMode });
    } catch {
      return null;
    }
  });
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
  const renderedHtml = useMemo(
    () => sanitizeRichHtml(renderInlineLatex(collapseDoubleEncodedEntities(html))),
    [html]
  );

  const latexHtml = useMemo(() => {
    if (!latex?.trim()) return "";
    // The dedicated `latex` field normally holds a bare expression, but a
    // row imported by hand sometimes carries it wrapped in \(...\), \[...\]
    // or $...$ (or the same malformed nesting as inline content) — strip
    // and classify those the same way renderMathInHtml does, so this path
    // never shows raw delimiters either.
    const { expr, display } = classifyStandaloneLatex(latex);
    if (!expr) return "";
    try {
      // Same entity-decode this field's own explanation/option counterparts
      // get (see decodeHtmlEntities's docstring) — this dedicated field
      // isn't populated by the bulk-import pipeline today so it's lower
      // risk, but a hand-typed or copy-pasted value could still carry an
      // escaped "&lt;"/"&gt;", and decoding it here costs nothing.
      return sanitizeRichHtml(katex.renderToString(decodeHtmlEntities(expr), { throwOnError: false, displayMode: display }));
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
