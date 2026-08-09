export default function manifest() {
  return {
    name: "Dr. Gutka",
    short_name: "Dr. Gutka",
    description: "QBank, mock tests and video lectures for CEE-PG, NMCLE and other medical entrance exams.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1f2e",
    theme_color: "#0c1f2e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
