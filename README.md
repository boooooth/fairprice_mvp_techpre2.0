# FairPrice Rewards — Telegram Mini App & Web Portal

A full-stack digital loyalty membership and customer engagement platform built with Next.js 16, React 19, Prisma, and the Telegram WebApp SDK.

The platform provides a dual-channel experience:
1. **Telegram Mini App (TMA)**: Instant zero-click authentication via Telegram WebApp `initData`, native UI integration, and automated `/start` bot onboarding.
2. **Standalone Web Portal**: Responsive mobile-first web app with Phone & SMS OTP authentication (with built-in test code display).
3. **Retail QR Bridge (`/qr`)**: Instant native deep-link launcher designed for physical cashier stands and in-store printed displays.
4. **Admin & Marketing Console (`/admin`)**: Member CRM, broadcast engine with photo support, and automated recurring announcement scheduler.

---

## Key Features

### Digital Member Pass & Checkout
- **Instant Barcode & QR Code**: Generates dynamic customer checkout codes compatible with standard barcode and QR retail supermarket scanners.
- **Points Ledger & Tiers**: Live points balance, tier status, and transaction history.
- **Voucher Wallet**: Catalog of redeemable vouchers with discount codes and status tracking.

### Dual-Channel Authentication
- **Telegram Native Bypass**: Cryptographically validates Telegram's `initData` using HMAC-SHA-256 (`src/lib/telegram.ts`), automatically syncing user profiles and Telegram avatars.
- **Web Phone + SMS OTP**: Clean phone number verification flow. For local development and demonstration, generated OTP codes are displayed directly in the UI test pill.

### Operations & Broadcast Hub (`/admin`)
- **Customer CRM**: Real-time member registry with filtering by channel (Telegram vs. Web) and notification opt-ins.
- **Instant Broadcasts**: Send targeted push notifications to opted-in Telegram customers with optional image attachments.
- **Automated Announcement Scheduler**: Configure recurring marketing announcements (one-time, daily, or weekly) dispatched by a background runner.
- **Bot Configuration Panel**: View Telegram bot status, update public WebApp URLs, and sync the persistent chat menu button directly from the browser.

### Zero-Config Telegram Automation
- **Auto-Poller via Next.js Instrumentation**: Automatically starts a polling service in development (`src/instrumentation.ts` & `src/lib/telegramPoller.ts`) that listens for Telegram `/start` commands and replies with an instant pass button.
- **Production Webhook Support**: Ready endpoint at `/api/telegram/webhook` for high-throughput webhook deployment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router with Turbopack)](https://nextjs.org/) |
| **Frontend** | [React 19](https://react.dev/), Vanilla CSS |
| **Database & ORM** | [Prisma ORM](https://www.prisma.io/) with SQLite (switchable to PostgreSQL/MySQL) |
| **Barcode & QR** | [`qrcode`](https://www.npmjs.com/package/qrcode) & SVG barcode generator |
| **Telegram SDK** | Telegram WebApp SDK (`telegram-web-app.js`) & Telegram Bot API |
| **Runtime** | Node.js 18.18+ or Node.js 20+ |

---

## Repository Structure

```text
├── prisma/
│   ├── schema.prisma             # Database schema (User, OtpCode, AnnouncementSchedule)
│   └── dev.db                    # Local SQLite database (ignored by git)
├── public/
│   ├── fairprice-logo.webp       # FairPrice branding assets
│   ├── fairprice-qr-code.png     # In-store camera bridge QR code
│   └── promos/                   # Promotional voucher banner images
├── src/
│   ├── app/
│   │   ├── admin/page.tsx        # Admin CRM & broadcast management dashboard
│   │   ├── api/                  # Backend REST API routes
│   │   │   ├── admin/            # Schedules, broadcasts, user queries & bot setup
│   │   │   ├── auth/             # OTP dispatch & Telegram HMAC validation
│   │   │   ├── telegram/webhook/ # Telegram Webhook handler
│   │   │   └── user/             # User profile, photo & notification settings
│   │   ├── qr/page.tsx           # Camera QR deep-link bridge for physical signage
│   │   ├── globals.css           # Global theme variables & typography
│   │   ├── layout.tsx            # Root layout with Telegram SDK script injection
│   │   └── page.tsx              # Main entry point (auto-detects TMA vs Web)
│   ├── components/
│   │   ├── MemberApp/            # Main member pass, voucher wallet & profile views
│   │   ├── PhoneStep.tsx         # Web login: phone input
│   │   ├── OtpStep.tsx           # Web login: OTP verification
│   │   └── ProfileStep.tsx       # Profile onboarding
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── scheduleRunner.ts     # Automated announcement scheduler runner
│   │   ├── telegram.ts           # Telegram Bot API client & HMAC validation
│   │   ├── telegramPoller.ts     # Local development Telegram updates poller
│   │   └── telegramResponder.ts  # /start command auto-registration & pass sender
│   └── instrumentation.ts        # Next.js server hook to auto-boot background poller
├── .env.example                  # Environment variables template
├── .gitignore                    # Strict ignore rules for env, databases & binaries
└── package.json
```

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.18.0` or higher (`node -v`)
- **npm** or **pnpm** / **yarn**
- A **Telegram account** (for creating a bot via `@BotFather`)

### 2. Clone the Repository
```bash
git clone https://github.com/boooooth/fairprice_mvp_techpre2.0.git
cd fairprice_mvp_techpre2.0
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create your local `.env` file by copying the template:
```bash
cp .env.example .env
```

Open `.env` and fill in the required variables:
```env
DATABASE_URL="file:./dev.db"

# Telegram Bot Token from @BotFather
TELEGRAM_BOT_TOKEN="your_bot_token_here"

# Public HTTPS URL (required for Telegram Mini App)
TELEGRAM_WEBAPP_URL="https://your-public-url.com"
NEXT_PUBLIC_APP_URL="https://your-public-url.com"

# Optional Bot & App Configuration
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="FairPriceRewards_bot"
NEXT_PUBLIC_TELEGRAM_APP_NAME="myapp"
```

> [!NOTE]  
> If you are testing only the Web Application (with Phone + OTP), you can leave dummy values in `TELEGRAM_BOT_TOKEN`. To test Telegram Mini App features, configure a real bot token.

### 5. Initialize the Database
Initialize your local SQLite database using Prisma:
```bash
npx prisma generate
npx prisma db push
```

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Telegram Bot & Mini App Setup Guide

Telegram requires a **public HTTPS URL** to embed Mini Apps inside the messenger.

### Step 1: Create a Bot with @BotFather
1. Open Telegram and search for [`@BotFather`](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts to choose a display name and username (e.g. `FairPriceRewards_bot`).
3. Copy the **HTTP API Token** provided by BotFather into your `.env` as `TELEGRAM_BOT_TOKEN`.

### Step 2: Expose Your Local Server via HTTPS
During local development, use a tunneling tool such as Cloudflare Tunnel or ngrok:

```bash
# Using Cloudflare Tunnel:
cloudflared tunnel --url http://localhost:3000

# OR using ngrok:
ngrok http 3000
```

Copy the generated HTTPS URL (e.g. `https://xxxx.trycloudflare.com`) and paste it as `TELEGRAM_WEBAPP_URL` and `NEXT_PUBLIC_APP_URL` in your `.env`.

### Step 3: Register the Mini App in @BotFather
1. In `@BotFather`, send `/newapp`.
2. Select your bot.
3. Provide a title and description.
4. Upload an app icon (or use an image from `public/`).
5. When asked for the **Web App URL**, provide your public HTTPS URL:
   ```text
   https://xxxx.trycloudflare.com
   ```
6. Choose a short name for the app (e.g. `myapp`). This will generate your direct link:
   `https://t.me/YourBotUsername/myapp`

### Step 4: Configure the Bot Menu Button
You can configure the persistent menu button in two ways:
- **Automatic via Admin UI**: Open [http://localhost:3000/admin](http://localhost:3000/admin), locate the **Telegram Bot Configuration** card, verify your URL, and click **Sync Menu Button**.
- **Via BotFather**: Send `/setmenubutton` in `@BotFather`, select your bot, and enter your Web App URL.

---

## Testing the Experience

### 1. Telegram Mini App (TMA) Flow
- Open your bot in Telegram or tap your direct Mini App link: `https://t.me/YourBotUsername/myapp`
- Tap **Start** or tap the **Open Member Pass** menu button.
- The app automatically:
  1. Validates your Telegram cryptographic `initData`.
  2. Pre-registers you in the database.
  3. Displays your personalized member card, points, barcode, and vouchers without manual login steps.

### 2. Standalone Web Flow
- Open [http://localhost:3000](http://localhost:3000) directly in a standard browser.
- Enter any phone number (e.g., `81234567`).
- A 6-digit OTP will be generated. The verification code is displayed in the UI pill for instant testing.
- Enter the code to access your pass.

### 3. Retail Camera Bridge (`/qr`)
- Navigate to [http://localhost:3000/qr](http://localhost:3000/qr).
- When scanned from a mobile phone camera, this bridge page automatically attempts to trigger the `tg://resolve` deep-link to launch the Telegram app directly.

### 4. Admin Management Console (`/admin`)
- Navigate to [http://localhost:3000/admin](http://localhost:3000/admin).
- Manage registered users, inspect notification opt-ins, send manual broadcast messages, and set up automated schedules.

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Connection string for Prisma | `file:./dev.db` |
| `TELEGRAM_BOT_TOKEN` | Recommended | Token issued by `@BotFather` | `123456789:ABC...` |
| `TELEGRAM_WEBAPP_URL` | Recommended | Public HTTPS URL for the Mini App | `https://your-domain.com` |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public base URL used for client links | `https://your-domain.com` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Optional | Bot username for `/qr` deep-linking | `FairPriceRewards_bot` |
| `NEXT_PUBLIC_TELEGRAM_APP_NAME` | Optional | Mini App shortname for `/qr` deep-linking | `myapp` |
| `TELEGRAM_START_BUTTON_TEXT` | Optional | Label for the button sent on `/start` | `Open Member Pass` |
| `TELEGRAM_MENU_BUTTON_TEXT` | Optional | Label for the bottom chat menu button | `Open Member Pass` |
| `TELEGRAM_START_MESSAGE` | Optional | Welcome text on `/start` (supports HTML) | `Welcome, {firstName}!` |

---

## Database Management

To inspect and manage database records visually, use Prisma Studio:
```bash
npx prisma studio
```
This opens an interactive database browser at [http://localhost:5555](http://localhost:5555).

### Switching to PostgreSQL / MySQL for Production
To switch from SQLite to PostgreSQL or MySQL:
1. In [prisma/schema.prisma](file:///d:/techpre/demo/prisma/schema.prisma), change `provider = "sqlite"` to `provider = "postgresql"`.
2. Update `DATABASE_URL` in your production environment variables (e.g., `postgresql://user:password@host:5432/dbname`).
3. Run `npx prisma db push` or `npx prisma migrate dev`.

---

## Security & Git Hygiene

The repository is configured with a strict [.gitignore](file:///d:/techpre/demo/.gitignore) to ensure sensitive information is never pushed:
- `.env*` (API keys, bot tokens, secret URLs) are ignored; only [.env.example](file:///d:/techpre/demo/.env.example) is committed.
- SQLite database files (`dev.db`, `*.db`, `*.sqlite`) are ignored.
- Build artifacts (`.next/`, `*.tsbuildinfo`, `node_modules/`) are excluded.
- Tunnels and large binaries (`cloudflared*`, `*.exe`, `*.mp4`) are ignored.

Before pushing to a public repository, you can verify your staged files with:
```bash
git status
```

---

## License

This project is licensed under the MIT License.
