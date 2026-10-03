import Image from "next/image";
import { getCurrentAccount } from "@/lib/auth";
import EnquiryForm from "./trip-enquiry";
import SiteHeader from "./site-header";
import AccountLink from "./auth/account-link";

const fares = [
  ["Aberdeen Airport", "£20"],
  ["Banchory", "£40"],
  ["Turriff", "£60"],
  ["Peterhead", "£60"],
  ["Fraserburgh", "£80"],
  ["Edinburgh", "£200"],
  ["Edinburgh Airport", "£210"],
  ["Glasgow", "£220"],
  ["Glasgow Airport", "£230"],
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "TaxiService"],
  name: "My Driver Aberdeen",
  url: "https://www.mydriver-aberdeen.co.uk/",
  image: "https://www.mydriver-aberdeen.co.uk/images/aberdeen-airport-chauffeur.webp",
  telephone: "+447822011848",
  email: "info@mydriver-aberdeen.co.uk",
  description: "Private-hire and private-members’ chauffeur service based in Aberdeen, Scotland.",
  areaServed: [
    { "@type": "City", name: "Aberdeen" },
    { "@type": "AdministrativeArea", name: "Scotland" },
  ],
  priceRange: "£20–£230",
};

export default async function Home() {
  const signedIn = Boolean(await getCurrentAccount());
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader signedIn={signedIn} />
      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <Image className="hero-photo" src="/images/aberdeen-airport-chauffeur.webp" alt="Chauffeur cars ready outside Aberdeen Airport beneath a sunset sky" fill priority sizes="100vw" />
          <div className="hero-content">
            <p className="eyebrow">Aberdeen, Scotland · Private hire</p>
            <h1 id="hero-title"><span className="sr-only">Aberdeen private hire. </span>Your city.<br />Your driver.<br /><em>Your time.</em></h1>
            <p className="hero-copy">A personal, dependable driver for airport arrivals, everyday journeys and the longer road ahead. Local to Aberdeen. Thoughtful by design.</p>
            <div className="hero-actions">
              <a className="button button-gold" href="tel:+447822011848">Call or text 07822 011848 <span aria-hidden="true">↗</span></a>
              <a className="button button-outline" href="#fares">Explore fixed fares</a>
            </div>
            <p className="hero-note"><strong>Travel, without the guesswork.</strong><br />Clear fares · Professional service · Advance booking</p>
          </div>
          <span className="hero-index">The North-east, in good hands</span>
        </section>

        <section className="section">
          <div className="section-inner intro">
            <div>
              <p className="section-kicker">A local point of view</p>
              <h2>Aberdeen is our home ground.</h2>
            </div>
            <div className="intro-text">
              <p>My Driver Aberdeen brings a more considered approach to private hire. Book ahead, know your fare and travel with a professional driver who knows the city and the roads beyond it.</p>
              <p>From the first airport pick-up to a regular trip across town, the details matter: a clear plan, a calm journey and a direct line to your driver.</p>
              <a className="text-link" href="#enquire">Plan a journey <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <div className="service-strip" aria-label="Service highlights">
          <div className="service-strip-inner">
            <span className="strip-item">Airport transfers</span><span className="strip-item">Business travel</span>
            <span className="strip-item">Events & evenings</span><span className="strip-item">Longer Scotland journeys</span>
          </div>
        </div>

        <section className="section fares-section" id="fares" aria-labelledby="fares-title">
          <div className="section-inner">
            <div className="fares-top">
              <div><p className="section-kicker">Straightforward from the start</p><h2 id="fares-title">The fare, up front.</h2></div>
              <p>Fixed fares from Aberdeen for some of the journeys we’re asked about most. For another destination, get in touch and tell us where you’re headed.</p>
            </div>
            <div className="fare-list">
              {fares.map(([place, price]) => <div className="fare-row" key={place}><span className="fare-name">{place}</span><span className="fare-price">{price}</span></div>)}
            </div>
            <p className="fare-foot">Fares shown are for journeys from Aberdeen. Contact us to discuss your trip and arrange a booking.</p>
          </div>
        </section>

        <section className="membership" id="membership" aria-labelledby="membership-title">
          <div className="membership-photo">
            <Image src="/images/chauffeurs-marischal-college.webp" alt="Two chauffeurs with black cars outside Marischal College in Aberdeen" fill loading="eager" sizes="(max-width: 760px) 100vw, 50vw" />
            <span className="photo-caption">A familiar face. A smoother routine.</span>
          </div>
          <div className="membership-content">
            <p className="section-kicker">For life on the move</p>
            <h2 id="membership-title">Make room for a regular.</h2>
            <p>Private membership makes local travel simpler, with included monthly hires and member rates on additional journeys.</p>
            <div className="member-cards">
              <article className="member-card">
                <p className="member-name">Member</p><p className="member-price">£100<small> / month</small></p>
                <p className="member-includes">Up to 5 hires each month<br />Aberdeen + 10-mile service area<br />Advance booking</p><AccountLink signedIn={signedIn} className="text-link member-link" accountPath="/account/#membership">Choose Member <span aria-hidden="true">↗</span></AccountLink>
              </article>
              <article className="member-card priority">
                <p className="member-name">Priority Member</p><p className="member-price">£150<small> / month</small></p>
                <p className="member-includes">Everything in Member<br />Priority booking<br />Evenings, weekends & events</p><AccountLink signedIn={signedIn} className="text-link member-link" accountPath="/account/#membership" style={{ color: "inherit" }}>Choose Priority <span aria-hidden="true">↗</span></AccountLink>
              </article>
            </div>
            <p className="member-more"><strong>Both memberships include</strong> professional, reliable service and member rates on additional hires.</p>
            <AccountLink signedIn={signedIn} className="text-link member-link" accountPath="/account/#membership">Join in your account <span aria-hidden="true">↗</span></AccountLink>
          </div>
        </section>

        <section className="section journeys" id="journeys" aria-labelledby="journeys-title">
          <div className="section-inner">
            <div className="journeys-heading">
              <div><p className="section-kicker">Wherever the day takes you</p><h2 id="journeys-title">One good journey<br />at a time.</h2></div>
              <p>Some days call for a quick trip across town. Others start at the terminal or take you south for a meeting. Tell us what the day needs.</p>
            </div>
            <div className="journey-grid">
              <article className="journey-item"><span className="journey-number">01</span><h3>Airport transfers</h3><p>Arrivals and departures, planned in advance and handled with care.</p></article>
              <article className="journey-item"><span className="journey-number">02</span><h3>Business travel</h3><p>A composed, professional ride between the office, hotel and meeting.</p></article>
              <article className="journey-item"><span className="journey-number">03</span><h3>Events & everyday</h3><p>Reliable transport for the plans that make up a week, or a special night.</p></article>
              <article className="journey-item"><span className="journey-number">04</span><h3>Across Scotland</h3><p>Longer journeys from Aberdeen, with a little more room to settle in.</p></article>
            </div>
          </div>
        </section>

        <section className="section enquiry" id="enquire" aria-labelledby="enquiry-title">
          <div className="section-inner enquiry-grid">
            <div className="enquiry-copy">
              <p className="section-kicker">Let’s get you moving</p>
              <h2 id="enquiry-title">Tell us about your trip.</h2>
              <p>Create an account to request a one-way or return journey, follow its approval and pay securely. A request is not a confirmed booking until your driver approves it. You can still call, text or email us.</p>
              <div className="contact-lines">
                <div className="contact-line"><span>Call or text</span><a href="tel:+447822011848">07822 011848</a></div>
                <div className="contact-line"><span>Send a text</span><a href="sms:+447822011848">Text your trip details</a></div>
                <div className="contact-line"><span>Email</span><a href="mailto:info@mydriver-aberdeen.co.uk">info@mydriver-aberdeen.co.uk</a></div>
              </div>
            </div>
            <EnquiryForm signedIn={signedIn} />
          </div>
        </section>

        <section className="closing">
          <div className="closing-inner">
            <h2>Good journeys start with a <em>conversation.</em></h2>
            <a className="button button-gold" href="tel:+447822011848">Call or text us <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <a className="footer-brand" href="#top"><Image src="/images/my-driver-aberdeen-logo.svg" alt="" width={1536} height={1024} /><span>Private hire, with a personal touch.</span></a>
          <nav className="footer-links" aria-label="Footer navigation"><a href="#fares">Fares</a><a href="#membership">Membership</a><a href="#enquire">Contact</a><a href="mailto:info@mydriver-aberdeen.co.uk">Email</a></nav>
          <span>© {new Date().getFullYear()} My Driver Aberdeen</span>
        </div>
      </footer>
    </>
  );
}