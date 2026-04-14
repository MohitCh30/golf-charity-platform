# Golf Charity Subscription Platform

A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: ShadCN Nova preset, Tailwind CSS v4

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

Run migrations in Supabase dashboard or via CLI. Required tables:

- `profiles` - User profiles with role field
- `subscriptions` - Subscription records
- `scores` - Golf scores (max 5 per user)
- `charities` - Partner charities
- `draws` - Monthly draw records
- `draw_entries` - User participation
- `winners` - Winning records

## User Roles

### Registered Subscribers
- Manage profile and scores
- Select charity (10% minimum contribution)
- Enter scores and participate in draws
- View winnings and upload proof

### Administrators
- Manage users, draws, and charities
- Verify winner submissions
- View reports and statistics

## Admin Account Creation

Admin accounts are created directly in Supabase:

1. Go to Supabase Dashboard > Table Editor > profiles
2. Find or create a user profile
3. Set `role` to `'admin'`
4. The user will have admin access on next login

```sql
-- Example: Set existing user as admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-uuid-here';
```

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage |
| `/auth/signup` | 3-step signup flow |
| `/auth/login` | Login |
| `/charities` | Public charity listing |
| `/dashboard` | User dashboard |
| `/dashboard/scores` | Score management |
| `/dashboard/upgrade` | Plan selection |
| `/admin` | Admin dashboard |
| `/admin/draws` | Draw management |

## Testing

```bash
# TypeScript check
npx tsc --noEmit

# Run journey audit
npx playwright test tests/journey-audit.spec.ts
```

## Features

- Score tracking (Stableford format, max 5 scores)
- Monthly prize draws (5/4/3 number matching)
- Prize distribution (40%/35%/25%)
- Winner verification with proof upload
- Charity selection at signup
- Subscription management
