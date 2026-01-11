# Project Overview: Burkina Secure (Faso Secure)
A comprehensive security and emergency assistance platform for Burkina Faso.

## Key Features
- **Emergency Contacts**: SOS alerts and managed emergency contact list.
- **Lockscreen Integration**: Generate emergency contact images for phone lockscreens.
- **Pharmacy Service**: Real-time tracking of pharmacies (24h/24, Day, Night) across multiple cities.
- **OpenStreetMap Integration**: Sync and display 11,000+ points of interest (hospitals, police, etc.).
- **Signalements**: User-reported incidents and risk zones.
- **Weather Service**: Regional weather monitoring.
- **3D Visualization**: Ouaga in 3D (experimental).

## Technical Architecture
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Frontend**: React (Vite) with Tailwind CSS and Shadcn UI.
- **AI Integration**: Groq (llama-3.3-70b-versatile) for intelligent features.
- **Data Sources**: OpenStreetMap (OSM) via Overpass API.

## Hybrid OTP Authentication (Jan 11, 2026)
- **Email OTP**: Passwordless authentication with 6-digit codes via SMTP (Nodemailer)
- **Email Config Options** (priority order):
  1. SMTP_USER + SMTP_PASS (+ optional SMTP_HOST, SMTP_PORT, SMTP_FROM_EMAIL, SMTP_FROM_NAME)
  2. GMAIL_USER + GMAIL_APP_PASSWORD (defaults to smtp.gmail.com:587)
- **Gmail Setup**: Create app password at myaccount.google.com/apppasswords (free, 500 emails/day)
- **SMS OTP**: Disabled (no free SMS service available)
- **Security**: 10-minute expiry, 5 attempt limit, identifier normalization
- **Guest Mode**: Visitors can browse the app without account; login required for posting/commenting/liking
- **Files**: hybridAuthService.ts, emailService.ts, Connexion.tsx, otp_codes table in schema.ts, replitAuth.ts
- **Routes**: /api/auth/send-otp, /api/auth/verify-otp, /api/auth/check-sms-availability, /api/auth/logout
- **Login Page**: /connexion (accessible via Login button in header)

## Recent Changes (Jan 11, 2026 - Production Audit)
- **Authentication Fix**: Fixed critical 500 errors on protected routes (user.claims.sub undefined) by wrapping user objects with claims structure in replitAuth.ts
- **VoiceSearchButton Fix**: Fixed "onResultRef.current is not a function" error by adding onQueryChange prop alias with optional chaining
- **Resend Email Refactor**: Completely refactored resend.ts - removed module-level state, added TypeScript types, supports RESEND_API_KEY/RESEND_FROM_EMAIL env vars for Railway deployment
- **Railway Compatibility**: Added nixpacks.toml for Railway deployment
- **Domain Handling**: Updated routes.ts to use RAILWAY_PUBLIC_DOMAIN/APP_DOMAIN environment variables
- **Database Improvements**: Added connection pool configuration with error handling in db.ts

## Recent Changes (Dec 31, 2025)
- Fixed `tsx` dependency issues.
- Updated Groq model to `llama-3.3-70b-versatile`.
- Extended OSM sync to include 80+ new categories.
- Initialized PostgreSQL database and pushed schema.
- Added lockscreen image generation for emergency contacts.

## User Preferences
- **Language**: French (UI default).
- **Style**: Modern, mobile-first design using Shadcn/Tailwind.
- **Naming**: Consistent use of `data-testid` for testing.
