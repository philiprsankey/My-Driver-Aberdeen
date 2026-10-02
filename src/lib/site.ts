const rawUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const site = {
  name: "My Driver Aberdeen",
  tagline: "Private members' car service",
  slogan: "Your city. Your driver. Your time.",
  description:
    "Private car hire in Aberdeen. One-off journeys at fixed prices from Aberdeen, and membership from £100 a month. Call or text 07822 011848.",
  url: rawUrl.replace(/\/$/, ""),
  phoneDisplay: "07822 011848",
  phoneTel: "+447822011848",
  email: "info@mydriver-aberdeen.co.uk",
  locale: "en_GB",
  city: "Aberdeen",
  region: "Scotland",
  country: "GB",
  serviceArea: "Aberdeen and a 10-mile service area",
} as const;

export function originFrom(headerList: { get(name: string): string | null }) {
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "").split(",")[0].trim();
  if (!host) return site.url;
  const forwarded = headerList.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwarded || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export const standards = [
  {
    title: "Luxury vehicles",
    text: "Executive cars for the city, and for longer journeys from Aberdeen.",
  },
  {
    title: "Professional drivers",
    text: "Suited, punctual drivers who keep the journey private.",
  },
  {
    title: "Safe and discreet",
    text: "A calm way to travel, without fuss at either end.",
  },
  {
    title: "Phone or text",
    text: "Book a journey, or join, by a call or a message. No app required.",
  },
] as const;

export const journeys = [
  {
    title: "Local journeys",
    text: "Across Aberdeen, and anywhere inside the 10-mile service area.",
  },
  {
    title: "Business travel",
    text: "A quiet car for meetings, site visits, and days that have to run on time.",
  },
  {
    title: "Airport transfers",
    text: "Aberdeen Airport pick-ups and drop-offs, arranged around your flight.",
  },
  {
    title: "Dinners and events",
    text: "Evening arrivals for dinner, occasions, and nights you would rather not drive.",
  },
  {
    title: "Everyday travel",
    text: "Appointments, errands, and ordinary journeys that are easier with a driver.",
  },
] as const;

export const plans = [
  {
    id: "member",
    name: "Member",
    price: 100,
    summary: "Up to 5 hires per month",
    featured: false,
    includes: [
      "Within Aberdeen and 10 mile service area",
      "Advance booking",
      "Professional, reliable service",
      "Member rates for additional hires",
    ],
  },
  {
    id: "priority",
    name: "Priority Member",
    price: 150,
    summary: "Up to 5 hires per month",
    featured: true,
    includes: [
      "Within Aberdeen and 10 mile service area",
      "Priority booking",
      "Evenings, weekends and events",
      "Professional, reliable service",
      "Member rates for additional hires",
    ],
  },
] as const;

export const fares = [
  { place: "Aberdeen Airport", price: 20 },
  { place: "Banchory", price: 40 },
  { place: "Turriff", price: 60 },
  { place: "Peterhead", price: 60 },
  { place: "Fraserburgh", price: 80 },
  { place: "Edinburgh", price: 200 },
  { place: "Edinburgh Airport", price: 210 },
  { place: "Glasgow", price: 220 },
  { place: "Glasgow Airport", price: 230 },
] as const;

export type PlanId = (typeof plans)[number]["id"];

export function planById(id: string) {
  return plans.find((plan) => plan.id === id) ?? null;
}

export const questions = [
  {
    question: "Where does My Driver Aberdeen operate?",
    answer:
      "One-off prices on this page are fixed fares from Aberdeen. Membership covers journeys within Aberdeen and a 10-mile service area.",
  },
  {
    question: "How does membership work?",
    answer:
      "Membership is the privilege for regular travel. There are two monthly plans. Each includes up to five hires a month. Hires beyond that are available at member rates.",
  },
  {
    question: "What is the difference between Member and Priority Member?",
    answer:
      "Member is £100 a month and includes advance booking. Priority Member is £150 a month and adds priority booking, plus evenings, weekends and events. Both cover the same service area, with professional, reliable drivers.",
  },
  {
    question: "How do I join or book a car?",
    answer:
      "For a one-off journey, call or text 07822 011848. To become a member, join on this site, or call or text. Members request a hire from their account, with the date, time, and where they need to be. We email a copy of the request and confirm by phone or text.",
  },
  {
    question: "What journeys can I book?",
    answer:
      "Local journeys, business travel, airport transfers, dinners and events, and everyday travel.",
  },
] as const;

export function telHref() {
  return `tel:${site.phoneTel}`;
}

export function smsHref(planName?: string) {
  const body = planName
    ? `Hello, I would like to join My Driver Aberdeen as a ${planName}.`
    : "Hello, I would like to book a car with My Driver Aberdeen.";
  return `sms:${site.phoneTel}?body=${encodeURIComponent(body)}`;
}
