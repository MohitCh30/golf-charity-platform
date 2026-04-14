# Golf Charity Platform Flow (v2)

## User Flows

### Authentication Flow

```mermaid
flowchart TD
    Start([User]) --> HomePage[/"Homepage /"\]

    HomePage --> SignUp["Sign Up Button"]
    SignUp --> SignupStep1["Step 1: Account<br/>Email & Password"]
    SignupStep1 --> Submit1{Submit}
    Submit1 --> |"success"| SignupStep2["Step 2: Profile<br/>Full Name & Handicaps"]
    Submit1 --> |"error"| SignupStep1

    SignupStep2 --> Submit2{Submit}
    Submit2 --> |"success"| SignupStep3["Step 3: Charity<br/>Select Cause"]
    Submit2 --> |"error"| SignupStep2

    SignupStep3 --> Submit3{Submit}
    Submit3 --> |"success"| WelcomePage["Welcome Page<br/>Confirmation"]
    Submit3 --> |"error"| SignupStep3

    WelcomePage --> Login["Login Link"]
    Login --> LoginPage["/auth/login"]

    HomePage --> LoginHome["Login Button"]
    LoginHome --> LoginPage

    LoginPage --> Credentials{Enter Credentials}
    Credentials --> |"success"| Dashboard[/"Dashboard /dashboard"\]

    Credentials --> |"forgot password"| ForgotPW["/auth/forgot-password"]
    ForgotPW --> EmailSent["Email Sent<br/>Reset Link"]
    EmailSent --> LoginPage

    Credentials --> |"error"| LoginPage
```

### Subscription Flow

```mermaid
flowchart TD
    Dashboard["Dashboard<br/>(no subscription)"] --> Subscribe["Subscribe Button"]
    Subscribe --> SubscribePage["/dashboard/subscribe"]

    SubscribePage --> Choice1["Choose a Plan"]
    Choice1 --> UpgradePage["/dashboard/upgrade<br/>Plan Selection"]

    SubscribePage --> Choice2["Explore First"]
    Choice2 --> RestrictedDashboard["Restricted Dashboard<br/>Lock icons shown"]

    UpgradePage --> SelectPlan{Plan Selected}
    SelectPlan --> |"Monthly ₹9.99"| MockPayMonthly["Mock Payment<br/>Processing..."]
    SelectPlan --> |"Yearly ₹99.99"| MockPayYearly["Mock Payment<br/>Processing..."]

    MockPayMonthly --> Success1["Success<br/>upgraded=true"]
    MockPayYearly --> Success1

    Success1 --> Redirect1[/"Redirect to /dashboard"\]
    Redirect1 --> FullDashboard["Full Dashboard<br/>All features unlocked"]
```

### Score Management Flow

```mermaid
flowchart LR
    subgraph Dashboard
        ScoresCard["Scores Card<br/>Latest: 32 pts"]
        AddScoreBtn["Add Score Button"]
    end

    ScoresCard --> AddScoreBtn
    AddScoreBtn --> ScoresPage["/dashboard/scores"]

    ScoresPage --> EntryForm["Score Entry Form<br/>- Score (0-50)<br/>- Played Date<br/>- Course<br/>- Notes"]

    EntryForm --> Validate{Valid?}
    Validate --> |"yes"| Save["Save Score"]
    Validate --> |"no"| EntryForm
    Save --> Success["Success<br/>Score saved!"]
    Success --> BackToDashboard["Back to Dashboard"]
```

### Draw & Winnings Flow

```mermaid
flowchart TD
    subgraph Subscribed Dashboard
        DrawSection["Draw Participation<br/>Entries: 3, Wins: 1"]
        WinningsSection["Winnings<br/>₹15.00 pending"]
    end

    DrawSection --> DrawEntries["Draw Entry Cards<br/>Matched 3 numbers"]
    DrawEntries --> |"status=won"| Winner["Winner Record"]

    Winner --> PendingWin{Payment<br/>Pending?}
    PendingWin --> |"yes"| UploadProof["WinnerProofUpload<br/>Upload required!"]
    PendingWin --> |"no"| Verified["Verified ✓"]

    UploadProof --> SelectFile["Select File"]
    SelectFile --> Upload["Upload to Storage<br/>/dashboard/winners/action"]
    Upload --> PendingReview["Pending Review<br/>verification_status"]

    Verified --> Prize["Prize Paid<br/>₹15.00 credited"]
```

### Winner Proof Upload Flow

```mermaid
flowchart TD
    Start["User Wins Draw"] --> CheckPending{Check<br/>payment_status}
    CheckPending --> |"pending"| ShowUpload[Show WinnerProofUpload]
    CheckPending --> |"paid"| Done["No action needed"]

    ShowUpload --> FileSelect["Select Proof File"]
    FileSelect --> ValidateFile{Valid<br/>File?}
    ValidateFile --> |"no"| FileSelect
    ValidateFile --> |"yes"| UploadFile["POST /dashboard/winners/action"]

    UploadFile --> Storage["Upload to Supabase<br/>winner-proofs bucket"]
    Storage --> Update["Update winners table<br/>proof_url = URL<br/>verification_status = pending_review"]

    Update --> Success["Success Toast<br/>Reload page"]
    Success --> Done
```

### Admin Flow

```mermaid
flowchart TD
    AdminUser["Admin User"] --> LoginAdmin["Login at /auth/login"]
    LoginAdmin --> CheckAdmin{Admin<br/>Role?}
    CheckAdmin --> |"yes"| AdminDashboard["/admin<br/>Dashboard"]

    CheckAdmin --> |"no"| Proxy["/proxy middleware"]
    Proxy --> |"401 Unauthorized"| Denied["Access Denied"]

    AdminDashboard --> Draws["Draws Section"]
    Draws --> DrawsPage["/admin/draws"]

    DrawsPage --> CreateDraw["Create Draw Form<br/>- Draw Date<br/>- Prize Pool"]
    CreateDraw --> GenerateNumbers["Generate Lucky Numbers<br/>5 random numbers 1-35"]
    GenerateNumbers --> LinkEntries["Link User Entries<br/>Match 5-3-4 numbers"]
    LinkEntries --> Publish["Publish Draw<br/>status = published"]
```

### Public Pages Flow

```mermaid
flowchart LR
    Start([Visitor]) --> CharitiesPage["/charities<br/>All Active Charities"]

    CharitiesPage --> Search["Search Filter"]
    Search --> Filter["Filter by name/mission"]
    Filter --> Results["Charity Cards<br/>Name, Mission, Support Button"]

    Results --> SignUp["Sign Up Button"]
    SignUp --> SignupStep1["Step 1: Account"]
```

## Page Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Homepage | No |
| `/auth/signup` | 3-step signup | No |
| `/auth/login` | Login | No |
| `/auth/forgot-password` | Password reset | No |
| `/charities` | Public charity listing | No |
| `/dashboard` | User dashboard | Yes |
| `/dashboard/subscribe` | Subscribe options | Yes |
| `/dashboard/upgrade` | Plan selection | Yes (subscribed) |
| `/dashboard/scores` | Score management | Yes (subscribed) |
| `/dashboard/winners/action` | Proof upload API | Yes |
| `/admin` | Admin dashboard | Yes (admin) |
| `/admin/draws` | Draw management | Yes (admin) |

## API Routes (Route Handlers)

| Route | Method | Purpose |
|-------|--------|---------|
| `/auth/signup/action` | POST | Create account (step 1) |
| `/auth/callback` | GET | OAuth callback |
| `/dashboard/upgrade/action` | POST | Create subscription |
| `/dashboard/winners/action` | POST | Upload winner proof |

## Database Tables

- `profiles` - User profiles with charity selection
- `subscriptions` - Active subscriptions
- `scores` - User golf scores
- `charities` - Partner charities
- `draws` - Monthly draws
- `draw_entries` - User entries in draws
- `winners` - Winning records with proof_url
