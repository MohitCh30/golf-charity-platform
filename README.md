# GolfGive

A subscription-based golf performance tracking platform with monthly prize draws and integrated charity fundraising. Built with Next.js 16, Supabase, and TypeScript.

**Live:** [golf-charity-platform-lilac.vercel.app](https://golf-charity-platform-lilac.vercel.app)

---

## Screenshots

<img width="1530" height="623" alt="image" src="https://github.com/user-attachments/assets/59e28e81-6fae-4e29-b6e9-2bed9f810ee7" />

 Homepage 

<img width="1244" height="702" alt="image" src="https://github.com/user-attachments/assets/273c0faa-1c6e-4ce2-80dc-23dfba5cb381" />


Scores Page ·

<img width="1332" height="862" alt="image" src="https://github.com/user-attachments/assets/a838092b-3fb9-4324-a502-8666d355f0c3" />

Admin Dashboard · 

<img width="1349" height="605" alt="image" src="https://github.com/user-attachments/assets/71781483-44d0-437c-ae8b-88fe7e8496b7" />

Draw Management · 

<img width="440" height="701" alt="image" src="https://github.com/user-attachments/assets/1125f42f-2d4d-4578-ac7e-1492a402d936" />

Welcome Screen


## What It Does

Users subscribe monthly or yearly, log their golf scores in Stableford format, and automatically enter monthly prize draws. A portion of every subscription goes to a charity of the user's choice. Admins run draw simulations, publish results, and verify winners — all from a dedicated admin panel.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 — App Router, TypeScript |
| Styling | Tailwind CSS v4 + ShadCN UI (Radix) |
| Database + Auth | Supabase (PostgreSQL, row-level auth) |
| Payments | Mock payment service (Stripe is invite-only in India) |
| Deployment | Vercel |
| Testing | Playwright — 65 tests |

---

## Features

### User
- 3-step signup with charity selection and plan choice
- Monthly (₹9.99) and yearly (₹99.99) subscription plans
- Score entry in Stableford format (1–45), up to 5 scores retained on a rolling basis
- Scores displayed newest first, oldest auto-replaced on the 6th entry
- Dashboard showing subscription status, scores, charity contribution, draw participation, and winnings
- Winner proof upload

### Draw Engine
- Two draw modes: random lottery and algorithmic (weighted by score frequency across all users)
- Prize pool split: 5-match 40% (jackpot, rolls over), 4-match 35%, 3-match 25%
- Multiple winners in the same tier split the prize equally
- Admin runs simulation first, previews results, then publishes
- Draw history tracked per month

### Charity
- Select a charity at signup
- Minimum 10% of subscription fee directed to chosen charity
- Charity listing page with search and filter
- Individual charity profile pages
- Featured charities spotlight

### Admin Panel
- User management with subscription status
- Full draw management — simulate, preview, publish
- Winner verification — approve or reject submissions
- Charity management view
- Real-time data from Supabase

---

## Architecture

```
src/
  app/
    auth/           — Signup (3-step), login, forgot password
    dashboard/      — User dashboard, scores, subscription, winners
    admin/          — Admin dashboard, draw management, winner verification
    charities/      — Public charity listing and individual profiles
  lib/
    supabase/       — Server and client Supabase helpers
    draw-engine/    — Draw logic, prize pool calculation, winner checking
    payments/       — Mock payment service
  proxy.ts          — Route protection middleware (auth + subscription gating)
```

### Key Architectural Decisions

**`createAdminClient()` for all DB queries** — bypasses RLS using the service role key server-side. `createClient()` is used only for `supabase.auth.getUser()`. This pattern eliminates all RLS-related 500 errors.

**Route handlers over server actions** — Next.js 16 with Turbopack has known issues with server actions. All form submissions use `route.ts` handlers.

**`proxy.ts` not `middleware.ts`** — custom export name `proxy()` required by the project's Next.js 16 configuration.

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extended user data, role (subscriber/admin), charity selection |
| `subscriptions` | Plan, status, start/end dates, charity amount |
| `scores` | Up to 5 per user, rolling — oldest auto-replaced via DB trigger |
| `charities` | Charity listings, featured flag, active flag |
| `draws` | Monthly draw records, winning numbers, prize amounts, status |
| `draw_entries` | All participant records per draw |
| `winners` | Match type, prize amount, verification and payment status |

---

## Local Setup

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

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Subscriber | ankit@gmail.com | (set during signup) |
| Admin | Set `role = 'admin'` in profiles table for any user |

To create an admin: Supabase dashboard → Table Editor → profiles → find user row → set `role` to `admin`.

---

## Running Tests

```bash
npx playwright test
```

65 tests covering signup flow, login, score entry, subscription, admin panel, and journey audits.

---

## Environment Notes

- Email confirmation is disabled in Supabase — users are created and immediately signed in
- Stripe is invite-only in India — a mock payment service simulates subscription creation with an 800ms delay and 10% failure rate
- Built on Next.js 16.2.1 which launched the same day development began

---

## Future Scope

- Email notifications for draw results and winner alerts
- Mobile navigation hamburger menu
- Individual charity event pages (upcoming golf days)
- Admin UI for adding and editing charities directly
- Cancellation and renewal flows with user-facing controls
- Independent donation option not tied to subscription
- Multi-country support with currency switching

---

## Developer Notes

Built in 2 days as a full-stack challenge. Next.js 16.2.1 launched the same day development started. Stripe is invite-only in India so a mock payment service was implemented. All core flows — auth, scores, draws, charity selection, admin panel — are functional end to end.
