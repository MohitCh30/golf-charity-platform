# GolfGive Platform Flow Diagram

Generated: March 2026

## Authentication & Authorization Flow

```mermaid
flowchart TB
    subgraph Public Routes
        HOME["/ Homepage"]
        LOGIN["/auth/login"]
        SIGNUP["/auth/signup"]
        FORGOT["/auth/forgot-password"]
        WELCOME["/auth/welcome"]
    end

    subgraph Protected Routes
        DASHBOARD["/dashboard"]
        SUBSCRIBE["/dashboard/subscribe"]
        SCORES["/dashboard/scores"]
        ADMIN["/admin"]
        ADMIN_DRAWS["/admin/draws"]
    end

    subgraph Auth Step Routes
        STEP1["/auth/steps/step1 POST"]
        STEP2["/auth/steps/step2 POST"]
        STEP3["/auth/steps/step3 POST"]
    end

    subgraph Auth Actions
        LOGIN_ACT["/auth/login/action POST"]
        SIGNOUT["signout() action"]
        FORGOT_ACT["/auth/forgot-password/action POST"]
    end

    subgraph Decision Points
        IS_AUTH{"Is User Authenticated?"}
        HAS_SUB{"Has Active Subscription?"}
        IS_ADMIN{"Is Admin Role?"}
        VALID_SESSION{"Valid Signup Session?"}
    end

    %% Homepage
    HOME --> IS_AUTH

    %% Auth Routes
    IS_AUTH -->|No| LOGIN
    IS_AUTH -->|Yes| DASHBOARD
    
    LOGIN --> LOGIN_ACT
    LOGIN_ACT -->|Success + Sub| DASHBOARD
    LOGIN_ACT -->|Success + No Sub| SUBSCRIBE
    LOGIN_ACT -->|Error| LOGIN
    
    FORGOT --> FORGOT_ACT
    FORGOT_ACT -->|Success| FORGOT
    FORGOT_ACT -->|Error| FORGOT
    
    SIGNUP --> STEP1
    STEP1 -->|Valid| STEP2
    STEP1 -->|Invalid| SIGNUP
    
    STEP2 --> VALID_SESSION
    VALID_SESSION -->|Yes| STEP3
    VALID_SESSION -->|No| SIGNUP
    
    STEP3 -->|Success| WELCOME
    STEP3 -->|Error| SIGNUP
    
    WELCOME --> DASHBOARD

    %% Signout Flow
    SIGNOUT --> LOGIN

    %% Dashboard Routes
    DASHBOARD --> HAS_SUB
    HAS_SUB -->|Yes| DASHBOARD_FULL
    
    HAS_SUB -->|No| SUBSCRIBE
    SUBSCRIBE -->|"Choose a Plan"| SIGNUP
    SUBSCRIBE -->|"Explore First"| DASHBOARD_RESTRICTED
    
    DASHBOARD_FULL --> SCORES
    SCORES -->|Submit| SCORES
    SCORES -->|"Delete/Edit"| SCORES
    
    DASHBOARD_RESTRICTED -->|See Locked Content| DASHBOARD_RESTRICTED

    %% Admin Routes
    ADMIN --> IS_ADMIN
    IS_ADMIN -->|Yes| ADMIN_DASHBOARD
    IS_ADMIN -->|No| DASHBOARD
    
    ADMIN_DRAWS --> IS_ADMIN
    ADMIN_DRAWS -->|"Run Simulation"| SIMULATION
    ADMIN_DRAWS -->|"Publish"| PUBLISHED
```

## Signup Flow (3-Step Process)

```mermaid
sequenceDiagram
    participant U as User
    participant S1 as Step 1 Form
    participant S2 as Step 2 Form
    participant S3 as Step 3 Form
    participant W as Welcome Page
    participant D as Dashboard
    participant Sup as Supabase

    Note over U,W: SIGNUP FLOW

    U->>S1: Fill name, email, password
    S1->>Sup: POST /auth/steps/step1
    Sup-->>S1: Set signup_session cookie
    S1-->>U: Redirect to /auth/signup?step=2

    U->>S2: Select charity
    S2->>Sup: POST /auth/steps/step2
    Sup-->>S2: Update signup_session cookie
    S2-->>U: Redirect to /auth/signup?step=3

    U->>S3: Select plan (monthly/yearly)
    S3->>Sup: POST /auth/steps/step3
    Sup->>Sup: Create user account
    Sup->>Sup: Create profile
    Sup->>Sup: Create subscription
    Sup->>Sup: Delete signup_session cookie
    S3-->>U: Redirect to /auth/welcome

    U->>W: View confirmation
    W->>U: Show plan, charity, amount
    U->>W: Click "Go to My Dashboard"
    W->>D: Redirect to /dashboard
```

## Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Login Page
    participant LA as Login Action
    participant Sup as Supabase
    participant P as Profiles Table
    participant Sub as Subscriptions Table
    participant D as Dashboard
    participant SubP as Subscribe Page

    Note over U,SubP: LOGIN FLOW

    U->>L: Enter email, password
    L->>LA: Form POST
    LA->>Sup: signInWithPassword()
    Sup-->>LA: Authenticate user

    LA->>P: Fetch user profile
    P-->>LA: Return profile

    LA->>Sub: Check active subscriptions
    Sub-->>LA: Return subscriptions

    alt Has Active Subscription
        LA-->>D: Redirect to /dashboard
        D->>U: Show full dashboard
    else No Subscription
        LA-->>SubP: Redirect to /dashboard/subscribe
        SubP->>U: Show subscription options
    end
```

## Dashboard Access Control

```mermaid
flowchart LR
    subgraph Proxy Middleware
        CHECK["Route Protection"]
        AUTH["Check Auth"]
        SUB["Check Subscription"]
        ADMIN["Check Admin Role"]
    end

    subgraph Routes
        PUB["Public Routes<br/>/auth/*"]
        SUB_REQ["Subscription Required<br/>/dashboard/*"]
        ADMIN_REQ["Admin Required<br/>/admin/*"]
    end

    CHECK --> AUTH
    
    AUTH -->|Not Authenticated| PUB
    AUTH -->|Authenticated| SUB
    
    SUB -->|"No Subscription"| SUBSCRIBE_PAGE
    SUB -->|"Has Subscription"| FULL_DASHBOARD
    
    AUTH --> ADMIN
    ADMIN -->|"Not Admin"| DASHBOARD
    ADMIN -->|"Is Admin"| ADMIN_PANEL
```

## Score Management Flow

```mermaid
flowchart TB
    A["Add Score Form"]
    E["Edit Score Form"]
    D["Delete Score"]
    API["/dashboard/scores/action POST"]
    DB["Supabase Scores Table"]
    UI["Score List Display"]

    A -->|"score, date"| API
    E -->|"scoreId, score, date"| API
    D -->|"scoreId, action=delete"| API
    
    API --> DB
    
    alt Add Score
        DB -->|"Check count < 5"| INSERT
        DB -->|"Count >= 5"| REPLACE_OLDEST
        REPLACE_OLDEST --> DELETE_OLDEST
        DELETE_OLDEST --> INSERT
    end

    INSERT --> UI
    UI --> A
```

## Draw System Flow

```mermaid
flowchart TB
    ADMIN["Admin Dashboard"]
    DRAWS["Admin Draws Page"]
    SIM["Run Simulation"]
    PUB["Publish Results"]
    ENG["Draw Engine"]
    WIN["Create Winners"]
    ENT["Create Entries"]

    ADMIN --> DRAWS
    DRAWS --> SIM
    DRAWS --> PUB

    SIM --> ENG
    ENG -->|"Generate Numbers"| WINNING_NUMS
    WINNING_NUMS --> DISPLAY["Display Results"]

    PUB --> ENG
    ENG --> WIN
    ENG --> ENT
    WIN --> DB_W["Winners Table"]
    ENT --> DB_E["Draw Entries Table"]
```

## Route Summary

| Route | Auth Required | Subscription Required | Admin Only |
|-------|---------------|---------------------|------------|
| `/` | No | No | No |
| `/auth/login` | No | No | No |
| `/auth/signup` | No | No | No |
| `/auth/forgot-password` | No | No | No |
| `/auth/welcome` | No | No | No |
| `/auth/steps/*` | No | No | No |
| `/dashboard` | Yes | Yes | No |
| `/dashboard/subscribe` | Yes | No | No |
| `/dashboard/scores` | Yes | Yes | No |
| `/admin` | Yes | No | Yes |
| `/admin/draws` | Yes | No | Yes |

## Redirect Summary

| From | To | Condition |
|------|-----|-----------|
| `/auth/*` (authenticated) | `/dashboard` | User logged in |
| `/dashboard` (no subscription) | `/dashboard/subscribe` | No active subscription |
| `/admin` (not admin) | `/dashboard` | User is not admin |
| `/dashboard/*` (not authenticated) | `/auth/login?redirect=...` | Session expired |
| After signout | `/auth/login` | Always |

## Cookie Management

| Cookie | Purpose | HttpOnly | Secure |
|---------|---------|----------|--------|
| `signup_session` | Store signup flow data between steps | Yes | Production only |
| `sb-*` | Supabase auth tokens | Yes | Production only |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login/action` | POST | Authenticate user |
| `/auth/forgot-password/action` | POST | Send password reset email |
| `/auth/steps/step1` | POST | Save step 1 data, redirect to step 2 |
| `/auth/steps/step2` | POST | Save charity selection, redirect to step 3 |
| `/auth/steps/step3` | POST | Complete signup, create user/subscription |
| `/dashboard/scores/action` | POST | Add/Edit/Delete scores |
| `/dashboard/scores/data` | GET | Fetch user's scores |
| `/admin/draws/action` | POST | Run simulation or publish draw |
| `/admin/draws/data` | GET | Fetch draw history |

## Key Implementation Notes

1. **proxy.ts** handles all route protection middleware
2. **Route handlers** (not server actions) used for form submissions due to Turbopack caching issues
3. **signup_session** cookie stores intermediate signup data between steps
4. **Admin role check** queries profiles table, not auth metadata
5. **Restricted dashboard** shows charity info and platform overview without subscription features
