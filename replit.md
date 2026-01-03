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
