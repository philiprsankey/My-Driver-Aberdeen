# My Driver Aberdeen

Landing page for My Driver Aberdeen, a private members' car service.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create an account at [http://localhost:3000/sign-up](http://localhost:3000/sign-up). Sign-up emails a 6-digit code. Put `RESEND_API_KEY` and `DATABASE_URL` in `.env.local`. Accounts are stored in Postgres. On Vercel, Neon provides `DATABASE_URL`.

Card payment uses Stripe. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local`. The webhook address is `/api/stripe/webhook`.

An active member can request a hire from their account. The member and info@mydriver-aberdeen.co.uk both receive an email. Text alerts are not sent yet.

## Search

Set `NEXT_PUBLIC_SITE_URL` to the live domain before launch. Titles, the canonical URL, the sitemap, and structured data all use it. Until then they use `http://localhost:3000`.
