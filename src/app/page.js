import Image from "next/image";
import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import CoursesSection from "@/components/marketing/CoursesSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function getHomepageContent() {
  try {
    const res = await fetch(`${API_URL}/homepage/`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function Highlighted({ text, highlight, className = "text-[var(--color-marketing-accent)]" }) {
  if (!text) return null;
  if (!highlight) return text;
  const idx = text.indexOf(highlight);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className={className}>{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export default async function LandingPage() {
  const content = await getHomepageContent();
  const s = content?.settings;
  const features = content?.features || [];
  const courses = content?.courses || [];

  if (!s) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-bold text-[var(--color-text)]">Dr. Gutka</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Couldn&apos;t reach the server right now. Please make sure the backend is running and refresh.
        </p>
        <Link href="/login" className="mt-2 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)]">
      <MarketingNav links={content.nav_links} ctaText={s.nav_cta_text} appBadgeText={s.app_badge_text} />

      {/* Hero */}
      <section className="hm-hero-gradient px-4 pb-24 pt-14 text-center sm:px-6 sm:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <Image src="/central-logo.png" alt="Dr. Gutka" width={110} height={110} priority />
          <h1 className="mt-6 whitespace-pre-line text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {s.hero_headline}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">{s.hero_subtitle}</p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <Link
              href={s.hero_cta_primary_link}
              className="rounded-xl bg-[var(--color-marketing-accent)] px-10 py-3.5 text-sm font-bold text-white shadow-lg"
            >
              {s.hero_cta_primary_text}
            </Link>
            <a href={s.hero_cta_secondary_link} className="text-sm font-bold text-[var(--color-exam-card-deep)]">
              {s.hero_cta_secondary_text}
            </a>
          </div>

          <Link
            href={s.hero_badge_link}
            className="mt-10 flex w-full max-w-md items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[#dcf3f7] px-5 py-4 text-left shadow-lg"
          >
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-marketing-navy)]">{s.hero_badge_title}</span>
                {s.hero_badge_tag && (
                  <span className="rounded bg-yellow-300 px-1.5 py-0.5 text-[10px] font-bold text-yellow-900">
                    {s.hero_badge_tag}
                  </span>
                )}
              </span>
              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{s.hero_badge_subtitle}</span>
              <span className="mt-2 block text-xs font-bold text-[var(--color-marketing-accent)]">{s.hero_badge_cta_text}</span>
            </span>
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[var(--color-marketing-accent)] text-xl text-white shadow-inner">
              {s.hero_badge_icon}
            </span>
          </Link>
        </div>
      </section>

      {/* Stats / preview */}
      <section className="bg-[var(--color-surface-muted)] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div className="order-2 flex justify-center lg:order-1">
            <div className="w-full max-w-[300px] overflow-hidden rounded-[2rem] border-8 border-[var(--color-marketing-navy)] shadow-2xl">
              <Image
                src={s.stats_image || "/app-preview.png"}
                alt="Dr. Gutka app preview"
                width={480}
                height={1200}
                className="w-full"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-3xl">{s.stats_icon}</span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight text-[var(--color-text)] sm:text-3xl">
              <Highlighted text={s.stats_headline} highlight={s.stats_headline_highlight} />
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">{s.stats_body}</p>
            <Link href={s.stats_cta_link} className="mt-5 inline-block text-sm font-bold text-[var(--color-marketing-accent)]">
              {s.stats_cta_text}
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl">
            <Highlighted text={s.features_heading} highlight={s.features_heading_highlight} />
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.id}>
                <span className="text-sm font-extrabold text-[var(--color-marketing-accent)]">{f.number}</span>
                <h3 className="mt-1 text-lg font-bold text-[var(--color-text)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <CoursesSection s={s} courses={courses} />

      <MarketingFooter links={content.footer_links} copyright={s.footer_copyright} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Dr. Gutka",
            description:
              "QBank, mock tests and video lectures for CEE-PG, NMCLE and other medical entrance exams.",
          }),
        }}
      />
    </div>
  );
}
