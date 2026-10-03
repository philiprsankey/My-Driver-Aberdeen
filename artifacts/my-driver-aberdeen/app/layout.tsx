import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://www.mydriver-aberdeen.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "My Driver Aberdeen | Private Hire & Chauffeur Service",
  description: "Private-hire and private-members’ chauffeur service in Aberdeen. Clear fixed fares, airport transfers, business travel and journeys across Scotland. Call 07822 011848.",
  alternates: { canonical: "/" },
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" } },
  openGraph: {
    title: "My Driver Aberdeen | Private Hire & Chauffeur Service",
    description: "A considered way to travel in Aberdeen. Private hire, airport transfers and membership journeys, with clear fares.",
    url: siteUrl,
    siteName: "My Driver Aberdeen",
    type: "website",
    images: [{ url: "/images/aberdeen-airport-chauffeur.webp", width: 1536, height: 1024, alt: "Private chauffeur cars outside Aberdeen Airport at dusk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Driver Aberdeen | Private Hire & Chauffeur Service",
    description: "Private-hire and private-members’ chauffeur service in Aberdeen. Call or text 07822 011848.",
    images: ["/images/aberdeen-airport-chauffeur.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}