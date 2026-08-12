import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Presensi App",
    short_name: "Presensi",
    description: "Sistem Presensi Karyawan",
    start_url: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#123c8c",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/presensi-icon-192.png?v=creativemu-white-bg-2",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/presensi-icon-512.png?v=creativemu-white-bg-2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
