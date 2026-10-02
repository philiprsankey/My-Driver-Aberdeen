import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { JoinBar } from "@/components/JoinBar";
import { Hero } from "@/components/Hero";
import { Journeys } from "@/components/Journeys";
import { Membership } from "@/components/Membership";
import { Prices } from "@/components/Prices";
import { Service } from "@/components/Service";
import { structuredData } from "@/lib/schema";

export default function Home() {
  const jsonLd = structuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="top">
        <Hero />
        <Prices />
        <Service />
        <Journeys />
        <Membership />
        <Faq />
      </main>
      <Footer />
      <JoinBar />
    </>
  );
}
