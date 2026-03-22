# PRD — Golf Charity Subscription Platform
> Issued by Digital Heroes · digitalheroes.co.in
> Version 1.0 · March 2026

## 01 Project Overview
A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine. Design Direction: Emotion-driven, modern. NOT a traditional golf website.

## 02 User Roles
- Public Visitor: view platform, explore charities, initiate subscription
- Registered Subscriber: manage profile, enter scores, select charity, view winnings
- Administrator: manage users, configure draws, manage charities, verify winners

## 03 Subscription & Payment System
- Plans: Monthly and Yearly (discounted)
- Gateway: Mock payment service (Stripe unavailable in India)
- Access Control: Non-subscribers get restricted access
- Lifecycle: renewal, cancellation, lapsed states
- Real-time subscription status check on every authenticated request

## 04 Score Management
- Users enter last 5 golf scores in Stableford format
- Score range: 1-45
- Each score requires a date
- Only latest 5 scores retained — new score auto-replaces oldest
- Display in reverse chronological order

## 05 Draw & Reward System
- Draw types: 5-Number Match, 4-Number Match, 3-Number Match
- Draw logic: Random (lottery) or Algorithmic (weighted by score frequency)
- Monthly cadence
- Admin controls publishing
- Simulation mode before official publish
- Jackpot rollover if no 5-match winner

## 06 Prize Pool Logic
- 5-Number Match: 40% of pool — JACKPOT — rolls over if unclaimed
- 4-Number Match: 35% of pool — no rollover
- 3-Number Match: 25% of pool — no rollover
- Auto-calculated from active subscriber count
- Multiple winners in same tier split prize equally

## 07 Charity System
- Users select charity at signup
- Minimum contribution: 10% of subscription fee
- Users can increase percentage voluntarily
- Independent donation option
- Charity listing with search and filter
- Individual charity profiles with description, images, events
- Featured charity section on homepage

## 08 Winner Verification
- Proof upload: screenshot of scores
- Admin review: Approve or Reject
- Payment states: Pending → Paid

## 09 User Dashboard
- Subscription status (active/inactive/renewal date)
- Score entry and edit interface
- Selected charity and contribution percentage
- Participation summary (draws entered, upcoming draws)
- Winnings overview: total won and payment status

## 10 Admin Dashboard
- User Management: view/edit profiles, edit scores, manage subscriptions
- Draw Management: configure logic, run simulations, publish results
- Charity Management: add/edit/delete charities, manage media
- Winners Management: view list, verify submissions, mark payouts
- Reports: total users, prize pool, charity totals, draw statistics

## 11 Technical Requirements
- Mobile-first, fully responsive
- Next.js 16 App Router, TypeScript
- Supabase for auth and database
- ShadCN Nova preset, Tailwind CSS v4
- Secure authentication, HTTPS
- Email notifications for draw results and winner alerts

## 12 Design Direction
- NOT a golf website — no fairways, no plaid, no club imagery
- Emotion-driven — lead with charitable impact
- Feel: modern fintech/charity app (Monzo, Every.org energy)
- Subtle animations and micro-interactions
- Mobile-first responsive
- CTA: subscribe button must be prominent and persuasive

## 13 Database Tables Required
- profiles: user data, role (subscriber/admin)
- subscriptions: plan type, status, renewal dates
- scores: max 5 per user, rolling
- charities: listings with content and media
- draws: monthly draw records, status, published flag
- draw_entries: user participation per draw
- winners: match type, prize amount, verification status

## 14 Mandatory Deliverables
- Live deployed URL on Vercel (new account)
- Supabase backend (new project)
- User panel with test credentials
- Admin panel with admin credentials
- Clean well-commented codebase
