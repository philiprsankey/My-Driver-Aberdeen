"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth-actions";
import type { ActionResult } from "@/lib/journey-actions";
import {
  addTimeOffAction,
  approveJourneyAction,
  cancelJourneyAction,
  completeJourneyAction,
  declineJourneyAction,
  markNoticesReadAction,
  removeTimeOffAction,
  requestJourneyAction,
  saveHoursAction,
  saveProfileAction,
  saveRoleAction,
} from "@/lib/journey-actions";
import type { Hour } from "@/lib/london";
import { DAYS, formatWhen, money } from "@/lib/london";
import type { Journey, PortalData } from "@/lib/journey-types";

const CUSTOM = "__custom";
const STATUS: Record<string, string> = {
  requested: "Awaiting approval",
  awaiting_payment: "Awaiting payment",
  payment_expired: "Payment window closed",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  no_show: "No show",
};

type Tab = "journeys" | "request" | "membership" | "hours" | "access" | "alerts" | "profile";

function keepForm(handler: (form: FormData) => void | Promise<void>) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handler(new FormData(event.currentTarget));
  };
}

function sameHours(left: Hour[], right: Hour[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function AccountDesk({ portal, notice = "" }: { portal: PortalData; notice?: string }) {
  const role = portal.user.role;
  const unread = portal.notices.filter((notice) => !notice.read).length;
  const tabs: { id: Tab; label: string }[] = [
    { id: "journeys", label: role === "customer" ? "Journeys" : "Diary" },
    ...(role === "customer" ? [{ id: "request" as const, label: "Request" }, { id: "membership" as const, label: "Membership" }] : []),
    ...(role === "admin" || role === "driver" ? [{ id: "hours" as const, label: "Hours" }] : []),
    ...(role === "admin" ? [{ id: "access" as const, label: "Access" }] : []),
    { id: "alerts", label: unread ? `Alerts ${unread}` : "Alerts" },
    { id: "profile", label: "Profile" },
  ];
  const [tab, setTab] = useState<Tab>("journeys");
  const active = tabs.some((item) => item.id === tab) ? tab : "journeys";
  const roleLabel = role === "admin" ? "Owner" : role === "driver" ? "Driver" : "Member";

  return (
    <div className="acct-wrap">
      <div className="acct-hero">
        <div>
          <p className="section-kicker">{roleLabel}</p>
          <h1>Hello, {portal.user.name.split(" ")[0] || "there"}.</h1>
        </div>
        <form action={signOutAction}>
          <button className="btn-line" type="submit">Sign out</button>
        </form>
      </div>
      {!portal.settings.configured && role === "admin" && (
        <p className="fb fb-warn" role="status">Online requests stay closed until you set the working week.</p>
      )}
      {notice === "pay" && <p className="fb fb-err" role="alert">The payment page could not be opened. Please try again.</p>}
      {notice === "billing" && <p className="fb fb-err" role="alert">Billing could not be opened. Please try again.</p>}
      <div className="desk">
        <nav className="desk-nav" aria-label="Account sections">
          {tabs.map((item) => (
            <button key={item.id} className={active === item.id ? "on" : ""} aria-current={active === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="desk-main">
          {active === "journeys" && <JourneyList portal={portal} />}
          {active === "request" && <RequestForm portal={portal} onDone={() => setTab("journeys")} />}
          {active === "membership" && <MembershipPanel portal={portal} />}
          {active === "hours" && <HoursPanel portal={portal} />}
          {active === "access" && <AccessPanel portal={portal} />}
          {active === "alerts" && <Alerts notices={portal.notices} />}
          {active === "profile" && <Profile user={portal.user} />}
        </div>
      </div>
    </div>
  );
}

function JourneyList({ portal }: { portal: PortalData }) {
  const [view, setView] = useState<"upcoming" | "history">("upcoming");
  const live = ["requested", "awaiting_payment", "confirmed"];
  const upcoming = portal.journeys.filter((item) => live.includes(item.status));
  const history = portal.journeys.filter((item) => !live.includes(item.status)).slice().reverse();
  const list = view === "upcoming" ? upcoming : history;
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Diary</p>
          <h2>{portal.user.role === "customer" ? "Your journeys" : "Journeys"}</h2>
        </div>
        <div className="seg" role="tablist">
          <button className={view === "upcoming" ? "on" : ""} onClick={() => setView("upcoming")}>Upcoming {upcoming.length}</button>
          <button className={view === "history" ? "on" : ""} onClick={() => setView("history")}>History {history.length}</button>
        </div>
      </div>
      <p className="note">{portal.user.role === "customer"
        ? "Times are Europe/London. A request is confirmed only after your driver approves it. Cancel at least 24 hours before pickup to restore an included hire."
        : "Times are Europe/London. Approve a request when the journey and the travel buffer fit the working week. A cancellation at least 24 hours before pickup restores an included hire."}</p>
      {list.length === 0 ? (
        <div className="empty"><i className="empty-mark" /><h3>{view === "upcoming" ? "Nothing in the diary" : "No earlier journeys"}</h3><p>{view === "upcoming" ? (portal.user.role === "customer" ? "A new request will appear here while it waits for approval." : "Passenger requests will appear here for approval.") : "Completed, declined and cancelled journeys appear here."}</p></div>
      ) : (
        <div className="stack">{list.map((item) => <JourneyCard key={item.id} journey={item} portal={portal} />)}</div>
      )}
    </section>
  );
}

function JourneyCard({ journey, portal }: { journey: Journey; portal: PortalData }) {
  const staff = portal.user.role === "admin" || (portal.user.role === "driver" && journey.driverId === portal.user.id);
  const canCancel = ["requested", "awaiting_payment", "confirmed", "payment_expired"].includes(journey.status)
    && (journey.customerId === portal.user.id || staff);
  const canApprove = staff && ["requested", "payment_expired"].includes(journey.status);
  const canComplete = staff && journey.status === "confirmed" && new Date(journey.pickupAt) <= new Date();
  return (
    <article className="trip">
      <div className="trip-top">
        <p className="bk-when">{formatWhen(journey.pickupAt)}{journey.priority ? <small> · Priority</small> : null}</p>
        <span className={`chip st-${journey.status}`}>{STATUS[journey.status] ?? journey.status}</span>
      </div>
      <div className="route">
        <div><span>Pickup</span><strong>{journey.pickup}</strong></div>
        <div><span>Destination</span><strong>{journey.destination}</strong></div>
      </div>
      <dl className="bk-meta">
        <div className="span-row"><dt>Fare</dt><dd>{journey.useMembership ? "Included hire" : money(journey.amountPence)}</dd></div>
        <div><dt>Passenger</dt><dd>{journey.customerName}</dd></div>
        <div><dt>Phone</dt><dd>{journey.phone}</dd></div>
        <div className="span-row"><dt>Driver</dt><dd>{journey.driverName || "Not assigned"}</dd></div>
        {journey.notes ? <div className="wide"><dt>Notes</dt><dd>{journey.notes}</dd></div> : null}
      </dl>
      {journey.status === "awaiting_payment" && journey.customerId === portal.user.id && journey.holdUntil && new Date(journey.holdUntil) > new Date() && (
        <p className="note">Approved. Pay {money(journey.amountPence)} before {formatWhen(journey.holdUntil)} to confirm this journey.</p>
      )}
      {journey.status === "awaiting_payment" && journey.customerId !== portal.user.id && (
        <p className="note">Approved. Waiting for the passenger to pay by card.</p>
      )}
      {canApprove && <ApproveForm journey={journey} portal={portal} />}
      <div className="actions">
        {journey.status === "awaiting_payment" && journey.customerId === portal.user.id && journey.holdUntil && new Date(journey.holdUntil) > new Date() && (
          <a className="button button-gold sm" href={`/account/pay/${journey.id}/`}>Pay {money(journey.amountPence)}</a>
        )}
        {canCancel && <ConfirmButton label="Cancel journey" action={() => cancelJourneyAction(journey.id)} />}
        {canComplete && <ConfirmButton label="Mark complete" action={() => completeJourneyAction(journey.id)} />}
      </div>
    </article>
  );
}

function ApproveForm({ journey, portal }: { journey: Journey; portal: PortalData }) {
  const refresh = useRefresh();
  const [message, setMessage] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const drivers = portal.drivers.filter((driver) => driver.active);
  async function onSubmit(form: FormData) {
    setPending(true);
    const pounds = String(form.get("pounds") ?? "");
    const result = await approveJourneyAction({
      id: journey.id,
      driverId: String(form.get("driverId") ?? ""),
      durationMinutes: Number(form.get("duration")),
      bufferMinutes: Number(form.get("buffer")),
      membershipEligible: form.get("eligible") === "on",
      amountPounds: pounds === "" ? null : Number(pounds),
    });
    setMessage(result);
    setPending(false);
    if (result.ok) refresh();
  }
  async function decline(form: FormData) {
    setPending(true);
    const result = await declineJourneyAction(journey.id, String(form.get("reason") ?? ""));
    setMessage(result);
    setPending(false);
    if (result.ok) refresh();
  }
  return (
    <div className="approve">
      <form onSubmit={keepForm(onSubmit)} className="form-grid">
        {portal.user.role === "admin" && (
          <div className="field"><label htmlFor={`driver-${journey.id}`}>Driver</label>
            <select id={`driver-${journey.id}`} name="driverId" defaultValue={journey.driverId ?? portal.user.id}>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
          </div>
        )}
        <div className="field pair"><label htmlFor={`dur-${journey.id}`}>Journey length (minutes)</label><input id={`dur-${journey.id}`} name="duration" type="number" min={10} max={720} required defaultValue={60} /></div>
        <div className="field pair"><label htmlFor={`buf-${journey.id}`}>Travel buffer (minutes)</label><input id={`buf-${journey.id}`} name="buffer" type="number" min={0} max={180} required defaultValue={30} /></div>
        {journey.useMembership ? (
          <label className="check wide"><input name="eligible" type="checkbox" /> This journey is inside Aberdeen and the 10-mile membership area.</label>
        ) : journey.fareDestination ? (
          <p className="summary wide">Fixed fare {money(journey.amountPence)}.</p>
        ) : (
          <div className="field"><label htmlFor={`fare-${journey.id}`}>Agreed fare (£)</label><input id={`fare-${journey.id}`} name="pounds" type="number" min="1" step="0.01" required /></div>
        )}
        <div className="wide"><button className="button button-gold sm" disabled={pending}>{pending ? "Saving…" : "Approve"}</button></div>
      </form>
      <div className="approve-side">
        <form onSubmit={keepForm(decline)} className="inline-row">
          <input name="reason" placeholder="Reason, if you wish" maxLength={200} aria-label="Reason for declining" />
          <button className="btn-danger" disabled={pending}>Decline</button>
        </form>
      </div>
      <Feedback result={message} />
    </div>
  );
}

function RequestForm({ portal, onDone }: { portal: PortalData; onDone: () => void }) {
  const refresh = useRefresh();
  const [trip, setTrip] = useState<"one" | "return">("one");
  const [fare, setFare] = useState<string>(portal.fares[0]?.destination ?? CUSTOM);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const member = portal.membership;
  const chosen = portal.fares.find((item) => item.destination === fare);
  async function onSubmit(form: FormData) {
    setPending(true);
    setResult(null);
    const destination = fare === CUSTOM ? String(form.get("destination") ?? "") : fare;
    const response = await requestJourneyAction({
      pickup: String(form.get("pickup") ?? ""),
      destination,
      when: String(form.get("when") ?? ""),
      returnWhen: trip === "return" ? String(form.get("returnWhen") ?? "") : "",
      phone: String(form.get("phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
      fareDestination: fare === CUSTOM ? "" : fare,
      useMembership: form.get("useMembership") === "on",
    });
    setResult(response);
    setPending(false);
    if (response.ok) refresh();
  }
  return (
    <section className="panel">
      <div className="panel-head"><div><p className="section-kicker">Book</p><h2>Request a journey</h2></div></div>
      {!portal.settings.configured && <p className="fb fb-warn">Online requests are closed until working hours are set. Call or text 07822 011848.</p>}
      <p className="note">Enter the pickup in London time. A request is not a confirmed booking. Your driver reviews it first.{portal.settings.minimumNoticeHours ? ` Minimum notice is ${portal.settings.minimumNoticeHours} hours.` : ""}</p>
      <form onSubmit={keepForm(onSubmit)} className="form-grid">
        <div className="field wide"><label>Journey</label>
          <div className="seg"><button type="button" className={trip === "one" ? "on" : ""} onClick={() => setTrip("one")}>One way</button><button type="button" className={trip === "return" ? "on" : ""} onClick={() => setTrip("return")}>Return</button></div>
        </div>
        <div className="field"><label htmlFor="pickup">Pickup</label><input id="pickup" name="pickup" required minLength={3} maxLength={300} defaultValue="Aberdeen" /></div>
        <div className="field"><label htmlFor="fare">Destination</label>
          <select id="fare" value={fare} onChange={(event) => setFare(event.target.value)}>
            {portal.fares.map((item) => <option key={item.destination} value={item.destination}>{item.destination} — {money(item.amountPence)}</option>)}
            <option value={CUSTOM}>Somewhere else</option>
          </select>
        </div>
        {fare === CUSTOM && <div className="field wide"><label htmlFor="destination">Destination address</label><input id="destination" name="destination" required minLength={3} maxLength={300} /></div>}
        <div className="field"><label htmlFor="when">Pickup</label><input id="when" name="when" type="datetime-local" required /></div>
        {trip === "return" && <div className="field"><label htmlFor="returnWhen">Return pickup</label><input id="returnWhen" name="returnWhen" type="datetime-local" required /></div>}
        <div className="field"><label htmlFor="phone">Contact number</label><input id="phone" name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={portal.user.phone} /></div>
        <div className="field wide"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" maxLength={2000} placeholder="Flight number, passengers, luggage" /></div>
        {member && (
          <label className="check wide"><input name="useMembership" type="checkbox" />
            Use an included hire. {member.remainingHires} of 5 left this period. A return uses 2. Unused hires do not roll over.
          </label>
        )}
        <p className="summary wide">{chosen ? `${money(chosen.amountPence)} each way.` : "The fare for another destination is agreed when the driver approves it."}{trip === "return" ? " A return is two separate requests." : ""}</p>
        <div className="wide"><button className="button button-gold" disabled={pending || !portal.settings.configured}>{pending ? "Sending…" : "Send request"}</button></div>
        <div className="wide"><Feedback result={result} />{result?.ok && <button type="button" className="text-link" onClick={onDone}>View the diary <span>↗</span></button>}</div>
      </form>
    </section>
  );
}

function MembershipPanel({ portal }: { portal: PortalData }) {
  const membership = portal.membership;
  const plans = [
    { id: "member", name: "Member", price: "£100", detail: "Up to 5 hires each month, in Aberdeen and the 10-mile area." },
    { id: "priority", name: "Priority Member", price: "£150", detail: "Up to 5 hires each month, with priority for evenings, weekends and events." },
  ];
  return (
    <section className="panel">
      <div className="panel-head"><div><p className="section-kicker">Private members</p><h2>Membership</h2></div></div>
      {portal.stripeTest && <p className="fb fb-warn" role="status">Stripe test mode. Use card 4242 4242 4242 4242, any future date, and any security code. Do not use a real card.</p>}
      {membership ? (
        <div className="mem-now">
          <p className="section-kicker">This period</p>
          <h3>{membership.plan === "priority" ? "Priority Member" : "Member"}</h3>
          <div className="stats">
            <div><b>{membership.remainingHires}</b><span>hires left of 5</span></div>
            <div><b>{membership.reservedHires}</b><span>held on upcoming journeys</span></div>
            <div><b>{formatWhen(membership.periodEnd)}</b><span>period ends</span></div>
          </div>
          <p className="note">A one-way journey uses 1 hire and a return uses 2. Unused hires expire at the end of the period. Cancel at least 24 hours ahead and the hire is restored.</p>
          <a className="button button-gold sm" href="/account/billing/">Manage billing</a>
        </div>
      ) : (
        <>
          <p className="note">Membership is five included hires in each paid month. A one-way journey uses 1 hire and a return uses 2. Unused hires do not roll over.</p>
          <div className="plans">
            {plans.map((plan) => (
              <article key={plan.id} className={plan.id === "priority" ? "plan priority" : "plan"}>
                <p className="member-name">{plan.name}</p>
                <p className="member-price">{plan.price}<small> / month</small></p>
                <p className="member-includes">{plan.detail}<br />Allowance renews monthly. No rollover.</p>
                <a className="button button-gold sm" href={`/account/join/${plan.id}/`}>Join {plan.name}</a>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HoursPanel({ portal }: { portal: PortalData }) {
  const [scope, setScope] = useState(portal.user.role === "admin" ? "company" : "driver");
  return (
    <section className="panel">
      <div className="panel-head"><div><p className="section-kicker">Working week</p><h2>Hours</h2></div></div>
      {portal.user.role === "admin" && (
        <div className="seg" style={{ marginBottom: 18 }}>
          <button className={scope === "company" ? "on" : ""} onClick={() => setScope("company")}>Company</button>
          <button className={scope === "priority" ? "on" : ""} onClick={() => setScope("priority")}>Priority</button>
          <button className={scope === "driver" ? "on" : ""} onClick={() => setScope("driver")}>A driver</button>
          <button className={scope === "off" ? "on" : ""} onClick={() => setScope("off")}>Time off</button>
        </div>
      )}
      {scope === "company" && portal.user.role === "admin" && <HoursForm scope="company" hours={portal.settings.workingHours} notice={portal.settings.minimumNoticeHours} hold={portal.settings.paymentHoldMinutes} />}
      {scope === "priority" && portal.user.role === "admin" && <HoursForm scope="priority" hours={portal.settings.priorityHours} />}
      {(scope === "driver" || portal.user.role === "driver") && scope !== "off" && scope !== "company" && scope !== "priority" && (
        <DriverHours portal={portal} />
      )}
      {portal.user.role === "driver" && <TimeOffForm portal={portal} />}
      {scope === "off" && <TimeOffForm portal={portal} />}
    </section>
  );
}

function HoursForm({ scope, hours, notice, hold }: { scope: "company" | "priority"; hours: Hour[]; notice?: number | null; hold?: number }) {
  const refresh = useRefresh();
  const [rows, setRows] = useState<Hour[]>(hours);
  const [savedHours, setSavedHours] = useState(hours);
  if (!sameHours(savedHours, hours)) {
    setSavedHours(hours);
    setRows(hours);
  }
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(form: FormData) {
    setPending(true);
    const response = await saveHoursAction({
      scope,
      hours: rows,
      minimumNoticeHours: scope === "company" ? Number(form.get("notice")) : undefined,
      paymentHoldMinutes: scope === "company" ? Number(form.get("hold")) : undefined,
    });
    setResult(response);
    setPending(false);
    if (response.ok) refresh();
  }
  return (
    <form onSubmit={keepForm(onSubmit)} className="form-grid">
      {scope === "company" ? (
        <p className="note wide">These are the hours a journey is allowed to run. Add at least one period, then save. Until that is saved, members cannot send an online request.</p>
      ) : (
        <p className="note wide">Optional extra hours for a Priority member using an included hire. They are added to the company week. Leave this empty if Priority members use the same hours as everyone else.</p>
      )}
      {scope === "company" && (
        <>
          <div className="field">
            <label htmlFor="notice">Minimum notice (hours)</label>
            <input id="notice" name="notice" type="number" min={1} max={168} required defaultValue={notice ?? 2} />
            <p className="field-hint">How far ahead a pickup must be. With 2, a request made at 10:00 can be for 12:00 or later.</p>
          </div>
          <div className="field">
            <label htmlFor="hold">Payment hold (minutes)</label>
            <input id="hold" name="hold" type="number" min={30} max={1440} required defaultValue={hold ?? 60} />
            <p className="field-hint">After a card fare is approved, this is how long the member has to pay. An included membership hire does not use this timer.</p>
          </div>
        </>
      )}
      <p className="note wide">Each row is one day, from a start time to a finish time, in London time. The pickup, the journey, and the travel buffer must sit inside that period.</p>
      <div className="wide"><HourRows rows={rows} onChange={setRows} /></div>
      <div className="wide"><button className="button button-gold sm" disabled={pending}>{pending ? "Saving…" : "Save hours"}</button></div>
      <div className="wide"><Feedback result={result} /></div>
    </form>
  );
}

function DriverHours({ portal }: { portal: PortalData }) {
  const refresh = useRefresh();
  const choices = portal.user.role === "admin" ? portal.drivers : [portal.user];
  const [driverId, setDriverId] = useState(choices[0]?.id ?? "");
  const selected = choices.find((driver) => driver.id === driverId) ?? choices[0];
  const serverRows = selected?.workingHours ?? [];
  const [rows, setRows] = useState<Hour[]>(serverRows);
  const [savedRows, setSavedRows] = useState(serverRows);
  if (!sameHours(savedRows, serverRows)) {
    setSavedRows(serverRows);
    setRows(serverRows);
  }
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit() {
    setPending(true);
    const response = await saveHoursAction({ scope: "driver", driverId, hours: rows });
    setResult(response);
    setPending(false);
    if (response.ok) refresh();
  }
  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      {portal.user.role === "admin" && (
        <div className="field wide"><label htmlFor="who">Driver</label>
          <select id="who" value={driverId} onChange={(event) => {
            const next = event.target.value;
            setDriverId(next);
            setRows(choices.find((driver) => driver.id === next)?.workingHours ?? []);
          }}>
            {choices.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
          </select>
        </div>
      )}
      <p className="note wide">Personal hours for one driver. Leave this empty and that driver follows the company week.</p>
      <p className="note wide">Each row is one day, from a start time to a finish time, in London time. The pickup, the journey, and the travel buffer must sit inside that period.</p>
      <div className="wide"><HourRows rows={rows} onChange={setRows} /></div>
      <div className="wide"><button className="button button-gold sm" disabled={pending}>{pending ? "Saving…" : "Save driver hours"}</button></div>
      <div className="wide"><Feedback result={result} /></div>
    </form>
  );
}

function HourRows({ rows, onChange }: { rows: Hour[]; onChange: (rows: Hour[]) => void }) {
  return (
    <div className="hour-editor">
      {rows.map((row, index) => (
        <div className="hours-row" key={`${row.day}-${index}`}>
          <select aria-label="Day" value={row.day} onChange={(event) => onChange(rows.map((item, i) => i === index ? { ...item, day: Number(event.target.value) } : item))}>
            {DAYS.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}
          </select>
          <input aria-label="Start" type="time" value={row.start} onChange={(event) => onChange(rows.map((item, i) => i === index ? { ...item, start: event.target.value } : item))} />
          <input aria-label="Finish" type="time" value={row.end} onChange={(event) => onChange(rows.map((item, i) => i === index ? { ...item, end: event.target.value } : item))} />
          <button type="button" className="mini" onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className="mini mini-add" onClick={() => onChange([...rows, { day: 1, start: "08:00", end: "18:00" }])}>Add a period</button>
    </div>
  );
}

function AccessPanel({ portal }: { portal: PortalData }) {
  return (
    <section className="panel">
      <div className="panel-head"><div><p className="section-kicker">Accounts</p><h2>Access</h2></div></div>
      <p className="note">Choose Driver only for someone you employ to drive. Customers stay as passengers.</p>
      <People portal={portal} />
    </section>
  );
}

function PersonAccess({ person }: { person: PortalData["people"][number] }) {
  const refresh = useRefresh();
  const serverRole = person.role === "driver" ? "driver" : "customer";
  const [role, setRole] = useState<"customer" | "driver">(serverRole);
  const [active, setActive] = useState(person.active);
  const [seen, setSeen] = useState(`${serverRole}:${person.active}`);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<ActionResult | null>(null);
  const next = `${serverRole}:${person.active}`;
  if (seen !== next) {
    setSeen(next);
    setRole(serverRole);
    setActive(person.active);
  }
  return (
    <form className="staff" onSubmit={keepForm(async () => {
      setPending(true);
      setNote(null);
      const response = await saveRoleAction(person.id, role, active);
      setNote(response);
      setPending(false);
      if (response.ok) refresh();
    })}>
      <div className="staff-top">
        <div><h3>{person.name}</h3><p>{person.email}</p></div>
        <div className="staff-ctl">
          <select name="role" value={role} aria-label={`Access for ${person.name}`} onChange={(event) => { setRole(event.target.value === "driver" ? "driver" : "customer"); setNote(null); }}>
            <option value="customer">Passenger</option>
            <option value="driver">Driver</option>
          </select>
          <label className="check"><input name="active" type="checkbox" checked={active} onChange={(event) => { setActive(event.target.checked); setNote(null); }} /> Active</label>
          <button className="mini" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        </div>
      </div>
      <Feedback result={note} />
    </form>
  );
}

function People({ portal }: { portal: PortalData }) {
  const others = portal.people.filter((person) => person.id !== portal.user.id && person.role !== "admin");
  return (
    <div className="stack">
      {others.length === 0 && <p className="note">No other accounts yet. Someone can sign up, and you can then give them driver access.</p>}
      {others.map((person) => (
        <PersonAccess key={person.id} person={person} />
      ))}
    </div>
  );
}

function TimeOffForm({ portal }: { portal: PortalData }) {
  const refresh = useRefresh();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const drivers = portal.user.role === "admin" ? portal.drivers : [portal.user];
  return (
    <div className="time-off">
      <h3 className="sub">Time off</h3>
      <p className="note">Blocks that driver even when the time falls inside the working week.</p>
      <form className="form-grid" onSubmit={keepForm(async (form) => {
        setPending(true);
        const response = await addTimeOffAction({
          driverId: String(form.get("driverId") ?? portal.user.id),
          start: String(form.get("start") ?? ""),
          end: String(form.get("end") ?? ""),
          label: String(form.get("label") ?? ""),
        });
        setResult(response);
        setPending(false);
        if (response.ok) refresh();
      })}>
        {portal.user.role === "admin" && (
          <div className="field"><label htmlFor="off-driver">Driver</label>
            <select id="off-driver" name="driverId" defaultValue={portal.user.id}>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select>
          </div>
        )}
        <div className="field"><label htmlFor="off-start">From</label><input id="off-start" name="start" type="datetime-local" required /></div>
        <div className="field"><label htmlFor="off-end">Until</label><input id="off-end" name="end" type="datetime-local" required /></div>
        <div className="field"><label htmlFor="off-label">Label</label><input id="off-label" name="label" required minLength={2} maxLength={80} placeholder="Holiday" /></div>
        <div className="wide"><button className="button button-gold sm" disabled={pending}>{pending ? "Saving…" : "Add time off"}</button></div>
      </form>
      <div className="stack" style={{ marginTop: 16 }}>
        {portal.timeOff.map((block) => (
          <div key={block.id} className="slot block">
            <time>{formatWhen(block.startAt)} – {formatWhen(block.endAt)}</time>
            <span>{block.label}</span>
            <button className="mini" onClick={async () => { const response = await removeTimeOffAction(block.id); setResult(response); if (response.ok) refresh(); }}>Remove</button>
          </div>
        ))}
      </div>
      <Feedback result={result} />
    </div>
  );
}

function Alerts({ notices }: { notices: PortalData["notices"] }) {
  const refresh = useRefresh();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <section className="panel">
      <div className="panel-head">
        <div><p className="section-kicker">Inbox</p><h2>Alerts</h2></div>
        {notices.some((notice) => !notice.read) && <button className="mini" onClick={async () => { const response = await markNoticesReadAction(); setResult(response); if (response.ok) refresh(); }}>Mark read</button>}
      </div>
      {notices.length === 0 ? <div className="empty"><i className="empty-mark" /><h3>No alerts</h3><p>Approvals, cancellations and new requests appear here.</p></div> : (
        <ul className="notes">{notices.map((notice) => <li key={notice.id} className={notice.read ? "" : "unread"}><p>{notice.message}</p><time>{formatWhen(notice.createdAt)}</time></li>)}</ul>
      )}
      <Feedback result={result} />
    </section>
  );
}

function Profile({ user }: { user: PortalData["user"] }) {
  const refresh = useRefresh();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <section className="panel">
      <div className="panel-head"><div><p className="section-kicker">Your details</p><h2>Profile</h2></div></div>
      <form className="form-grid" onSubmit={keepForm(async (form) => {
        setPending(true);
        const response = await saveProfileAction(String(form.get("name") ?? ""), String(form.get("phone") ?? ""));
        setResult(response);
        setPending(false);
        if (response.ok) refresh();
      })}>
        <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} /></div>
        <div className="field"><label htmlFor="profile-phone">Phone</label><input id="profile-phone" name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={user.phone} /></div>
        <div className="field wide"><label>Email</label><input value={user.email} disabled /></div>
        <div className="wide"><button className="button button-gold sm" disabled={pending}>{pending ? "Saving…" : "Save details"}</button></div>
        <div className="wide"><Feedback result={result} /></div>
      </form>
    </section>
  );
}

function ConfirmButton({ label, action }: { label: string; action: () => Promise<ActionResult> }) {
  const refresh = useRefresh();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div>
      <button className="btn-line" disabled={pending} onClick={async () => {
        setPending(true);
        const response = await action();
        setResult(response);
        setPending(false);
        if (response.ok) refresh();
      }}>{pending ? "Saving…" : label}</button>
      <Feedback result={result} />
    </div>
  );
}

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return <p className={result.ok ? "fb fb-ok" : "fb fb-err"} role={result.ok ? "status" : "alert"}>{result.ok ? result.message : result.error}</p>;
}

function useRefresh() {
  const router = useRouter();
  return () => router.refresh();
}
