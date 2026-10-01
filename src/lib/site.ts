const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const site = {
  name: "My Driver Aberdeen",
  tagline: "Private members' car service",
  slogan: "Your city. Your driver. Your time.",
  description:
    "Members-only private car hire in Aberdeen. Luxury vehicles, professional drivers, airport transfers and events. Membership from £100 a month. Call or text 07822 011848.",
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

export const standards = [
  {
    title: "Luxury vehicles",
    text: "Executive cars for members, in the city and just beyond it.",
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
    text: "Join and book by a call or a message. No app required.",
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

export type PlanId = (typeof plans)[number]["id"];

export function planById(id: string) {
  return plans.find((plan) => plan.id === id) ?? null;
}

export const questions = [
  {
    question: "Where does My Driver Aberdeen operate?",
    answer:
      "Membership covers journeys within Aberdeen and a 10-mile service area. That includes local trips, business travel, and Aberdeen Airport transfers.",
  },
  {
    question: "How does membership work?",
    answer:
      "There are two monthly memberships. Each includes up to five hires a month. Hires beyond that are available at member rates. Places are limited.",
  },
  {
    question: "What is the difference between Member and Priority Member?",
    answer:
      "Member is £100 a month and includes advance booking. Priority Member is £150 a month and adds priority booking, plus evenings, weekends and events. Both cover the same service area, with professional, reliable drivers.",
  },
  {
    question: "How do I join or book a car?",
    answer:
      "Join on this site, or call or text 07822 011848. Members request a hire from their account, with the date, time, and where they need to be. We email a copy of the request and confirm by phone or text.",
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
    : "Hello, I would like to join My Driver Aberdeen.";
  return `sms:${site.phoneTel}?body=${encodeURIComponent(body)}`;
}
