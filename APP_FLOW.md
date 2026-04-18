# APP_FLOW.md — GolfGive (golf-charity-platform)
> **Source of truth: actual repository state (master branch) + README implementation notes.**
> This is NOT an idealized PRD. Every section describes what is built, not what was planned.
> Use this as the verification checklist for OpenCode + browser MCP audit.

---

## 0. ARCHITECTURE DECISIONS THAT AFFECT EVERY FLOW

These are load-bearing facts. Every flow below assumes them.

- **`proxy.ts` not `middleware.ts`** — route protection is exported as `proxy()`. If Next.js isn't picking it up, auth gating silently breaks.
- **`createAdminClient()` for all DB queries** — uses service role key, bypasses RLS. `createClient()` is ONLY used for `supabase.auth.getUser()`. Any route that uses `createClient()` for a DB query will fail or return empty.
- **Route handlers (`route.ts`) not server actions** — all form submissions go through API routes. No `'use server'` actions.
- **Email confirmation disabled in Supabase** — signup immediately creates a session. No verify-email step.
- **Mock payment service** — not Stripe. 800ms artificial delay, 10% random failure rate built in.
- **Turbopack root issue** — stray `~/package-lock.json` causes Next.js to misdetect project root. Must be removed before build works.
- **Broken import** — `src/app/auth/callback/route.ts` imports from `@/utils/supabase/server` but the file lives at `src/lib/supabase/server`. Fix: `sed -i 's|@/utils/supabase/server|@/lib/supabase/server|g' src/app/auth/callback/route.ts`

---

## 1. ENTRY POINTS

| Entry | URL | Auth Required | Notes |
|---|---|---|---|
| Homepage | `/` | No | Public landing page, CTA to subscribe |
| Direct login | `/auth/login` | No | Email + password |
| Direct signup | `/auth/signup` | No | 3-step flow |
| OAuth callback | `/auth/callback` | No | Supabase auth redirect handler — **BROKEN IMPORT, fix first** |
| Forgot password | `/auth/forgot-password` | No | Email reset |
| Charity listing | `/charities` | No | Public browse |
| Individual charity | `/charities/[id]` | No | Public profile |
| User dashboard | `/dashboard` | Yes (subscriber) | Gated by proxy.ts |
| Admin dashboard | `/admin` | Yes (admin role) | Gated by proxy.ts — requires `role = 'admin'` in profiles table |

---

## 2. CORE USER FLOWS

---

### 2.1 SIGNUP (3-Step Flow)

**Route:** `/auth/signup`

#### Happy Path

**Step 1 — Account Details**
- Fields: email, password
- Validation: email format, password minimum length (check source for exact rule)
- Action: user fills form, clicks Next
- System: no DB write yet, state held client-side between steps
- Next: Step 2

**Step 2 — Charity Selection**
- UI: list of charities fetched from `charities` table (active + featured first likely)
- Action: user selects one charity
- Validation: selection required, cannot proceed without it
- Next: Step 3

**Step 3 — Plan Selection**
- Options: Monthly (₹9.99) or Yearly (₹99.99)
- Action: user selects plan, clicks Subscribe / Complete
- System:
  1. Calls mock payment service (800ms delay, 10% failure)
  2. On payment success: calls Supabase `auth.signUp()` → creates user
  3. Writes to `profiles` table (charity_id, role = 'subscriber')
  4. Writes to `subscriptions` table (plan, status = active, start/end dates)
  5. Redirects to `/dashboard`
- Email confirmation: DISABLED — session is live immediately

#### Error States
- Payment fails (10% rate): show error, allow retry from Step 3. State should not be lost.
- Email already registered: Supabase returns error, show "account exists, login instead"
- Charity fetch fails: Step 2 renders empty — **verify this has a fallback UI**

#### Edge Cases
- User goes back from Step 3 to Step 2: charity selection should persist
- User refreshes mid-flow: likely resets to Step 1 (client state, not persisted)
- Session already exists when hitting `/auth/signup`: proxy.ts should redirect to `/dashboard` — **verify this redirect is implemented**

---

### 2.2 LOGIN

**Route:** `/auth/login`

#### Happy Path
- Fields: email, password
- Action: submit
- System: calls `supabase.auth.signInWithPassword()`
- On success: redirects to `/dashboard`
- Session: managed by Supabase cookies

#### Error States
- Wrong credentials: Supabase error → show "Invalid email or password"
- Account doesn't exist: same error message (don't leak which)
- Supabase unreachable: show generic server error

#### Decision Point
```
IF user.role === 'admin'
  THEN after login, can access /admin/*
  ELSE /admin/* returns 403 / redirect
```

---

### 2.3 AUTH CALLBACK

**Route:** `/auth/callback`

- Handles Supabase OAuth redirect (PKCE flow)
- **Currently broken** — imports from wrong path
- Fix: `@/utils/supabase/server` → `@/lib/supabase/server`
- After fix: exchanges code for session, redirects to `/dashboard`

---

### 2.4 SCORE ENTRY

**Route:** `/dashboard` (score section) or `/dashboard/scores`

#### Happy Path
- UI: form with score input (1–45 Stableford) + date picker
- User enters score + date, submits
- System calls route handler (POST `/api/scores` or similar)
- Route handler uses `createAdminClient()` to write to `scores` table
- DB trigger fires: if user already has 5 scores, oldest is auto-deleted
- UI refreshes score list (newest first)

#### Validation Rules
- Score: integer, 1–45 inclusive. Reject anything outside.
- Date: required, must be a valid date. Future dates — **verify if allowed or blocked**
- Max 5 scores enforced at DB level via trigger, not just UI

#### Error States
- Score out of range: client-side validation should catch before submit
- DB write fails: show error, do not clear the form
- User has no active subscription: proxy.ts should have blocked this route entirely

#### State Variants
- 0 scores: empty state UI — **verify this exists and isn't a blank div**
- 1–4 scores: normal list
- 5 scores: list shows all 5, next entry will replace oldest (should UI warn about this?)

---

### 2.5 USER DASHBOARD

**Route:** `/dashboard`

Access: authenticated + active subscription (enforced by proxy.ts)

#### Modules present (per PRD checklist, verify each renders):
- Subscription status: active/inactive, renewal date — pulled from `subscriptions` table
- Score entry + list — see 2.4
- Charity contribution: selected charity name, contribution % (min 10%)
- Draw participation: draws entered, upcoming draw info — from `draw_entries` table
- Winnings overview: total won, payment status — from `winners` table
- Winner proof upload: upload UI visible if user is a winner with pending verification

#### Decision Points
```
IF subscription.status !== 'active'
  THEN show "subscription inactive" state, restrict score entry
IF user is in winners table for current/recent draw
  THEN show proof upload UI
IF user has no scores
  THEN show empty state for score section
```

---

### 2.6 DRAW SYSTEM (Admin)

**Route:** `/admin` → Draw Management section

#### Admin Draw Flow
1. Admin navigates to Draw Management
2. Configures draw: random lottery OR algorithmic (weighted by score frequency)
3. Runs **simulation** — previews winner results without publishing
4. Reviews simulated results
5. Publishes draw — writes to `draws` table (status = published), writes winners to `winners` table, writes all participants to `draw_entries`

#### Prize Pool Logic (enforced in `src/lib/draw-engine/`)
- 5-match: 40% of pool (jackpot — rolls over if no winner)
- 4-match: 35%
- 3-match: 25%
- Multiple winners in same tier: split equally
- Jackpot rollover: if no 5-match, 40% carries to next month's pool

#### Draw Types
- **Random**: standard lottery number generation
- **Algorithmic**: weighted by most/least frequent scores across all users (pulls from `scores` table)

#### Error States
- No active subscribers: draw engine should handle zero-participant edge case
- Simulation vs publish confusion: UI must clearly differentiate — publishing is irreversible

---

### 2.7 WINNER VERIFICATION (Admin)

**Route:** `/admin` → Winners section

#### Flow
1. Draw published → winners notified (email notifications listed as future scope — **currently no email**)
2. Winner uploads proof (screenshot of scores) via dashboard upload UI
3. Admin views pending verifications
4. Admin: Approve → payment status moves to Pending → Paid
5. Admin: Reject → winner notified? (**no email system = no notification, verify if there's UI feedback**)

#### Payment States
```
winner created → status: pending_verification
admin approves → status: pending_payment
admin marks paid → status: paid
admin rejects → status: rejected
```

---

### 2.8 FORGOT PASSWORD

**Route:** `/auth/forgot-password`

- User enters email
- Supabase sends reset email (note: email sending works even with confirmation disabled — different flow)
- User clicks link in email → lands on reset page
- User sets new password
- Redirect to login

**Verify:** reset redirect URL is configured in Supabase dashboard to point to your domain, not localhost.

---

## 3. NAVIGATION MAP

```
/ (public)
├── /auth/login
├── /auth/signup
├── /auth/forgot-password
├── /auth/callback              ← BROKEN, fix import first
├── /charities                  ← public
│   └── /charities/[id]         ← public
│
├── /dashboard                  ← auth + active subscription
│   ├── scores section
│   ├── subscription section
│   ├── charity section
│   ├── draws section
│   └── winners/proof upload section
│
└── /admin                      ← auth + role === 'admin'
    ├── users management
    ├── draw management
    │   ├── simulate
    │   └── publish
    ├── charity management
    └── winners / verification
```

---

## 4. SCREEN INVENTORY

| Route | Access | Purpose | Key Actions |
|---|---|---|---|
| `/` | Public | Landing, CTA | → `/auth/signup` |
| `/auth/signup` | Public (redirect if authed) | 3-step registration | charity select, plan select, mock payment |
| `/auth/login` | Public (redirect if authed) | Login | → `/dashboard` |
| `/auth/forgot-password` | Public | Password reset | sends Supabase reset email |
| `/auth/callback` | Public | OAuth code exchange | → `/dashboard` (**fix import**) |
| `/charities` | Public | Browse charities | filter, search, → `/charities/[id]` |
| `/charities/[id]` | Public | Charity profile | description, featured content |
| `/dashboard` | Auth + active sub | User hub | score entry, view draws, upload proof |
| `/admin` | Auth + admin role | Admin hub | user mgmt, draw mgmt, winner verify |

---

## 5. DECISION POINTS (proxy.ts logic)

```
REQUEST COMES IN
│
├── route is /admin/*
│   ├── no session → redirect /auth/login
│   ├── session exists, role !== 'admin' → redirect /dashboard (or 403)
│   └── session exists, role === 'admin' → allow
│
├── route is /dashboard/*
│   ├── no session → redirect /auth/login
│   ├── session exists, subscription.status !== 'active' → redirect /auth/signup or show upgrade page
│   └── session exists, subscription active → allow
│
├── route is /auth/login or /auth/signup
│   ├── session already exists → redirect /dashboard
│   └── no session → allow
│
└── all other routes → allow (public)
```

**Critical:** proxy.ts must call `createClient()` (not admin) for `getUser()` — this is the one place `createClient()` is correct.

---

## 6. ERROR HANDLING

| Scenario | Current behavior | Verify |
|---|---|---|
| `/auth/callback` module not found | Build fails entirely | Fix import, redeploy |
| Mock payment 10% failure | Should show error + allow retry | Check signup Step 3 error state |
| Score out of range submitted | Client validation + server validation | Confirm server also validates, not just client |
| DB trigger fails on 6th score | Score write fails silently or errors | Verify trigger exists in Supabase |
| Admin tries to publish draw twice | Should be blocked | Verify draw status check before publish |
| No session, hits /dashboard | proxy.ts redirects to /auth/login | Verify redirect works after proxy.ts fix |
| Supabase service role key missing | createAdminClient() throws | Verify SUPABASE_SERVICE_ROLE_KEY in Vercel env vars |

---

## 7. DATABASE SCHEMA (actual tables)

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | user_id, role, charity_id | role: 'subscriber' or 'admin' |
| `subscriptions` | user_id, plan, status, start_date, end_date, charity_amount | status: active/inactive/lapsed |
| `scores` | user_id, score (1–45), played_date | max 5 per user, DB trigger deletes oldest on 6th insert |
| `charities` | id, name, description, featured (bool), active (bool) | |
| `draws` | id, month, draw_type, winning_numbers, prize_amounts, status | status: simulated/published |
| `draw_entries` | draw_id, user_id | all participants per draw |
| `winners` | draw_id, user_id, match_type, prize_amount, verification_status, payment_status | |

**Known past bug (fixed):** `score_date` vs `played_date` column name mismatch caused 500 errors. Verify column name is consistent between schema and all query code.

---

## 8. ENVIRONMENT VARIABLES REQUIRED

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          ← required for createAdminClient(), must exist in Vercel
NEXT_PUBLIC_APP_URL=                ← used for Supabase redirect URLs
MOCK_MONTHLY_PRICE_ID=mock_monthly_001
MOCK_YEARLY_PRICE_ID=mock_yearly_001
MOCK_MONTHLY_AMOUNT=999
MOCK_YEARLY_AMOUNT=9999
```

Missing `SUPABASE_SERVICE_ROLE_KEY` in Vercel = every DB query returns empty or 500.

---
