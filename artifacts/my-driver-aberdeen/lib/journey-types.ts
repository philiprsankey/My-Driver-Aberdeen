import type { Hour } from "@/lib/london";

export const FARES = [
  { destination: "Aberdeen Airport", amountPence: 2000 },
  { destination: "Banchory", amountPence: 4000 },
  { destination: "Turriff", amountPence: 6000 },
  { destination: "Peterhead", amountPence: 6000 },
  { destination: "Fraserburgh", amountPence: 8000 },
  { destination: "Edinburgh", amountPence: 20000 },
  { destination: "Edinburgh Airport", amountPence: 21000 },
  { destination: "Glasgow", amountPence: 22000 },
  { destination: "Glasgow Airport", amountPence: 23000 },
] as const;

export type Journey = {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  pickup: string;
  destination: string;
  pickupAt: string;
  status: string;
  paymentStatus: string;
  amountPence: number | null;
  driverId: string | null;
  driverName: string | null;
  useMembership: boolean;
  priority: boolean;
  durationMinutes: number | null;
  bufferMinutes: number;
  notes: string;
  fareDestination: string | null;
  holdUntil: string | null;
  createdAt: string;
};

export type MembershipView = {
  plan: "member" | "priority";
  periodStart: string;
  periodEnd: string;
  remainingHires: number;
  reservedHires: number;
  allowanceId: string;
};

export type Person = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  workingHours: Hour[];
};

export type TimeOff = {
  id: string;
  driverId: string;
  startAt: string;
  endAt: string;
  label: string;
};

export type Notice = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type PortalSettings = {
  configured: boolean;
  minimumNoticeHours: number | null;
  paymentHoldMinutes: number;
  workingHours: Hour[];
  priorityHours: Hour[];
};

export type PortalData = {
  user: Person;
  membership: MembershipView | null;
  journeys: Journey[];
  people: Person[];
  drivers: Person[];
  timeOff: TimeOff[];
  notices: Notice[];
  settings: PortalSettings;
  fares: typeof FARES;
  stripeTest: boolean;
};
