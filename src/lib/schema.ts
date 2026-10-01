import { plans, questions, site } from "@/lib/site";

export function structuredData() {
  const businessId = `${site.url}/#business`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "TaxiService"],
        "@id": businessId,
        name: site.name,
        slogan: site.slogan,
        description: site.description,
        url: site.url,
        telephone: site.phoneTel,
        email: site.email,
        image: `${site.url}/brand/hero.jpg`,
        logo: `${site.url}/brand/my_driver_aberdeen_master.svg`,
        currenciesAccepted: "GBP",
        priceRange: "£££",
        address: {
          "@type": "PostalAddress",
          addressLocality: site.city,
          addressRegion: site.region,
          addressCountry: site.country,
        },
        areaServed: {
          "@type": "GeoCircle",
          geoMidpoint: {
            "@type": "GeoCoordinates",
            latitude: 57.1497,
            longitude: -2.0943,
          },
          geoRadius: 16093,
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Memberships",
          itemListElement: plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            description: `${plan.summary}. ${plan.includes.join(". ")}.`,
            url: `${site.url}/#membership`,
            priceCurrency: "GBP",
            price: plan.price,
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: plan.price,
              priceCurrency: "GBP",
              unitText: "MONTH",
              referenceQuantity: {
                "@type": "QuantitativeValue",
                value: 1,
                unitCode: "MON",
              },
            },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/#questions`,
        url: `${site.url}/#questions`,
        isPartOf: { "@id": businessId },
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
