# GolfGive — Golf Charity Subscription Platform

A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine. Users subscribe monthly or yearly, log golf scores in Stableford format, automatically enter monthly prize draws, and direct a portion of their subscription to a charity of their choice. Admins run draw simulations, publish results, and verify winners from a dedicated admin panel.

**Live:** https://golf-charity-platform-lilac.vercel.app

Note: Hosted on Supabase free tier — the database pauses after ~1 week of inactivity. If the live site shows a connection error, go to supabase.com/dashboard and hit "Restore project". Takes ~2 minutes.

---

## PRD Compliance Summary

| Feature | PRD Required | Built | Notes |
|---|---|---|---|
| Subscription engine | Monthly + yearly plans, payment gateway, access control | ✅ Built | Mock payment service (Stripe invite-only in India). 800ms delay, 10% random failure rate. Real Stripe can be swapped in. |
| Score management | 1–45 Stableford, 5-score rolling limit, date required, newest first | ✅ Built | Rolling limit enforced in route handler (deletes oldest before insert). Scores displayed newest first. |
| Draw engine | Random + algorithmic draw, simulation mode, monthly cadence | ✅ Built | Algorithmic draw weighted by score frequency. Simulation runs without publishing. |
| Prize pool logic | 40% jackpot (rollover), 35% four-match, 25% three-match, split on ties | ✅ Built | Enforced in `src/lib/draw-engine/index.ts`. Jackpot rollover implemented. |
| Charity system | Charity selection at signup, 10% minimum contribution, listing + profiles | ✅ Built | Charity listing with search/filter. Individual profiles. Featured section. Contribution % fixed at 10% — user cannot adjust. |
| Winner verification | Proof upload, admin approve/reject, pending → paid states | ✅ Built | Upload UI on dashboard. Admin verification list. Payment state tracked. |
| User dashboard | Subscription status, score entry, charity info, draw participation, winnings | ✅ Built | All modules present. |
| Admin dashboard | User management, draw management, charity management, winner verification | ✅ Partial | User management and draw management fully built. Charity management is read-only — no add/edit/delete UI for charities in admin panel. |
| Auth | Secure login, signup, forgot password, session gating | ✅ Built | Email/password. OAuth routes exist (Google/GitHub) but not enabled by default. Email confirmation disabled. |
| UI/UX | Modern, emotion-driven, not a traditional golf site, mobile-first | ✅ Built | Amber + slate palette, ShadCN Nova, Tailwind v4. Avoids golf clichés. |
| Email notifications | Draw results, winner alerts, system updates | ❌ Not built | Listed as future scope. |
| Independent donations | Donation not tied to subscription | ❌ Not built | Listed as future scope. |
| Charity % editing | User can increase contribution above 10% | ❌ Not built | Fixed at 10%. |
| Subscription cancellation/renewal UI | User-facing cancel and renewal controls | ❌ Not built | Status visible but no self-service cancel flow. |
| Mobile hamburger nav | Responsive navigation menu | ❌ Not built | Layout is responsive but no hamburger menu component. |
| Reports & analytics | Total users, prize pool, charity totals, draw stats | ❌ Partial | Basic counts visible in admin. No dedicated analytics page. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 — App Router, TypeScript |
| Styling | Tailwind CSS v4 + ShadCN UI (Nova preset) |
| Database + Auth | Supabase (PostgreSQL, Row Level Security, Auth) |
| Payments | Mock payment service (Stripe-compatible interface) |
| Deployment | Vercel |
| Testing | Playwright — 65 tests |

---

## Live Demo

<img width="440" height="701" alt="Screenshot From 2026-03-22 15-04-17" src="https://github.com/user-attachments/assets/3052b09a-b465-4f26-8297-7d911816e348" /> 

<img width="1920" height="883" alt="Screenshot From 2026-03-22 15-30-41" src="https://github.com/user-attachments/assets/222bf7d6-e6e7-4450-a28a-ec661f201a4f" /> 

<img width="1358" height="742" alt="Screenshot From 2026-03-22 15-31-23" src="https://github.com/user-attachments/assets/f2606e78-696b-44d5-aeca-dd737d8918d7" />

<img width="1349" height="605" alt="Screenshot From 2026-03-22 22-51-32" src="https://github.com/user-attachments/assets/b5732e81-d1d7-4ee1-a0a1-e7e9e2d17ae2" />

<img width="1920" height="932" alt="Screenshot From 2026-03-22 22-59-57" src="https://github.com/user-attachments/assets/249d5b63-aec2-456e-ad3b-c147edb6fd03" />

## Architecture Decisions

**`proxy.ts` not `middleware.ts`** — Route protection is exported as `proxy()`. Next.js 16 with Turbopack has issues with the standard `middleware.ts` export name. All auth, admin, and subscription gating runs through this file.

**`createAdminClient()` for all DB queries** — Uses the service role key, bypasses RLS entirely. `createClient()` is used only for `supabase.auth.getUser()` and session operations. This pattern eliminates all RLS-related 500 errors on server-side queries.

**Route handlers not server actions (mostly)** — All form submissions use `route.ts` handlers. `src/app/auth/actions.ts` exists with `'use server'` for some auth operations but the primary data paths use route handlers due to known Next.js 16 Turbopack instability with server actions.

**Mock payment service** — `src/lib/payments/mock-payment.ts` implements `createPaymentIntent` and `confirmPayment` with an 800ms artificial delay and 10% random failure rate. Signup step 3 handles payment failures and redirects with `error=payment_failed`.

**Email confirmation disabled** — Users are created in Supabase and immediately signed in. No verify-email step in the flow.

**5-score rolling limit in route handler** — Score entry route deletes the oldest score before inserting when the user already has 5, rather than relying solely on a DB trigger.

**Same-month republish guard** — Draw publish route returns 409 if a draw has already been published for the current month.

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page, CTA to subscribe |
| `/auth/signup` | Public | 3-step signup (account → charity → plan + payment) |
| `/auth/login` | Public | Email/password login |
| `/auth/forgot-password` | Public | Password reset via Supabase email |
| `/auth/callback` | Public | Supabase OAuth code exchange |
| `/auth/welcome` | Public | Post-signup welcome screen |
| `/charities` | Public | Charity listing with search and filter |
| `/charities/[id]` | Public | Individual charity profile |
| `/dashboard` | Auth + active subscription | User hub — scores, draws, charity, winnings |
| `/dashboard/scores` | Auth + active subscription | Score entry and management |
| `/dashboard/upgrade` | Auth | Plan selection / upgrade |
| `/admin` | Auth + admin role | Admin hub — users, draws, winner verification |
| `/admin/draws` | Auth + admin role | Draw simulation and publish |

---

## Setup

```bash
git clone https://github.com/MohitCh30/golf-charity-platform
cd golf-charity-platform
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
MOCK_MONTHLY_PRICE_ID=mock_monthly_001
MOCK_YEARLY_PRICE_ID=mock_yearly_001
MOCK_MONTHLY_AMOUNT=999
MOCK_YEARLY_AMOUNT=9999
```

```bash
npm run dev
```

To create an admin account: Supabase dashboard → Table Editor → profiles → set `role` to `'admin'` for the user.

---

## Testing

```bash
npx playwright test
```

65 tests covering signup flow, login, score entry, subscription, admin panel, and end-to-end journey audits.

```bash
npx tsc --noEmit
```

---

## Known Gaps

PRD items that are not built:

- Email notifications (draw results, winner alerts, system updates)
- Independent donation option not tied to subscription
- User-adjustable charity contribution percentage (fixed at 10%)
- Subscription cancellation and renewal UI
- Mobile hamburger navigation menu
- Admin UI for adding, editing, and deleting charities
- Individual charity event pages (upcoming golf days)
- Dedicated reports and analytics page
- Multi-country and currency support

---

## Built In

2 days. Next.js 16.2.1 launched the same day development started — no AI training data existed for the new patterns at the time of development.
