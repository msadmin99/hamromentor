import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { CourseProvider } from "@/lib/course-context";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_TITLE = "Dr. Gutka - CEE-PG & Medical Exam Prep";
const SITE_DESCRIPTION = "QBank, mock tests and video lectures for CEE-PG, NMCLE and other medical entrance exams.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Dr. Gutka",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Dr. Gutka" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Lets env(safe-area-inset-*) resolve to the real notch/home-indicator
  // insets instead of 0 — needed since this is an installable standalone
  // PWA (see manifest.js) where that area is real content space, not just
  // browser chrome. No effect on desktop, where the insets are already 0.
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-surface-muted)]">
        <AuthProvider>
          <CourseProvider>{children}</CourseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
