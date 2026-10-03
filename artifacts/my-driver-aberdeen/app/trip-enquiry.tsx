import AccountLink from "./auth/account-link";

export default function EnquiryForm({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="book-cta">
      <p className="section-kicker">Book online</p>
      <h3>Request your journey in minutes.</h3>
      <ul>
        <li>One-way or return, with fixed fares to nine destinations</li>
        <li>Your driver approves, then you pay securely or use membership</li>
        <li>Track requests, receipts and updates in one place</li>
      </ul>
      <div className="hero-actions">
        <AccountLink signedIn={signedIn} className="button button-gold" accountPath="/account/#book">Book a journey <span aria-hidden="true">↗</span></AccountLink>
        <a className="button" style={{ borderColor: "#aeb4b0", color: "var(--ink)" }} href="/sign-up/">Create account</a>
      </div>
      <p className="form-disclaimer">Prefer a person? Call or text 07822 011848, or email info@mydriver-aberdeen.co.uk. Booking times are Europe/London.</p>
    </div>
  );
}
