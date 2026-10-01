import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Outfit } from "next/font/google";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const title = "Luxury Private Car Hire in Aberdeen | My Driver";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: "%s | My Driver Aberdeen",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "private car hire Aberdeen",
    "luxury car hire Aberdeen",
    "private driver Aberdeen",
    "airport transfer Aberdeen",
    "chauffeur Aberdeen",
    "members car service Aberdeen",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
    images: [
      {
        url: "/brand/hero.jpg",
        width: 1672,
        height: 941,
        alt: "My Driver Aberdeen cars and drivers outside Marischal College",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/brand/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "transportation",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${outfit.variable} ${cormorant.variable} ${script.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-ivory">
        <a
          href="#service"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:bg-gold focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <Header />
        {children}
      </body>
    </html>
  );
}
