# Project Overview: Burkina Secure (Faso Secure)
A comprehensive security and emergency assistance platform for Burkina Faso.

## Key Features
- **Emergency Contacts**: SOS alerts and managed emergency contact list.
- **Lockscreen Integration**: Generate emergency contact images for phone lockscreens.
- **Pharmacy Service**: Real-time tracking of pharmacies (24h/24, Day, Night) across 33 cities (135 pharmacies, 105 de garde).
- **OpenStreetMap Integration**: Sync and display 20,000+ points of interest (hospitals, police, etc.).
- **Official News Ticker**: Scrolling banner with government communications from Présidence du Faso, SIG, and AIB.
- **Signalements**: User-reported incidents and risk zones.
- **Weather Service**: Regional weather monitoring.
- **Offline Mode**: IndexedDB caching with automatic sync for low-bandwidth areas.
- **3D Visualization**: Ouaga in 3D (experimental).

## Technical Architecture
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Frontend**: React (Vite) with Tailwind CSS and Shadcn UI.
- **AI Integration**: Groq (llama-3.3-70b-versatile) for intelligent features.
- **Data Sources**: OpenStreetMap (OSM) via Overpass API.

## Recent Changes (Feb 18, 2026)
- **Mairies & Prefectures Page**: Complete directory of government institutions
  - 136 institutions: 57 Mairies + 17 Prefectures + 45 Hauts-Commissariats + 17 Gouvernorats across 51 cities
  - Types: Gouvernorat, Haut-Commissariat, Prefecture, Mairie (color-coded: red, purple, blue, green)
  - All 17 regional Gouvernorats, all 45 provincial Hauts-Commissariats
  - Major city Mairies including Ouagadougou arrondissements (1-6), Bobo-Dioulasso, all province capitals
  - Services: Etat civil, Urbanisme, Affaires foncieres, Mariages, Securite, Autorisations
  - Data file: server/mairiesPrefecturesData.ts (comprehensive static data)
  - Endpoint: GET /api/mairies-prefectures
  - Page: client/src/pages/MairiesPrefectures.tsx
  - Route: /mairies-prefectures
  - Added to HamburgerMenu under "Vie Quotidienne"
- **SONABEL & ONEA Page**: Complete directory of utility company agencies
  - 59 agencies: 34 SONABEL (electricity) + 25 ONEA (water/sanitation) across 29 cities
  - Types: Siege, Direction Regionale, Agence Commerciale, Centre, Antenne
  - Emergency hotline numbers: SONABEL 80 00 11 30, ONEA 80 00 11 11
  - Full contact details: phone, secondary phone, email, website, hours, services
  - Map with color-coded markers (amber=SONABEL, blue=ONEA)
  - Filters: societe, region, type, search, geolocation "Les plus proches"
  - Data file: server/sonabelOneaData.ts (comprehensive static data)
  - Endpoint: GET /api/sonabel-onea
  - Page: client/src/pages/SonabelOnea.tsx
  - Route: /sonabel-onea
  - Added to HamburgerMenu under "Vie Quotidienne"
- **Cimetieres Page**: Full cemetery directory from OpenStreetMap data
  - OSM queries: cemetery (landuse=cemetery) + grave_yard (amenity=grave_yard)
  - 322+ cemeteries across Burkina Faso with auto-sync on first load
  - Types: Municipal, Musulman, Chretien, Traditionnel, Prive, Religieux (auto-detected from OSM tags)
  - Map view with colored markers per type, search, region/type filters, geolocation "Les plus proches"
  - LocationValidator integration for community location verification
  - Endpoint: GET /api/cimetieres
  - Files: client/src/pages/Cimetieres.tsx, server/routes.ts (transformOsmToCimetiere), server/overpassService.ts
  - Added to HamburgerMenu under "Vie Quotidienne"
  - Route: /cimetieres

## Recent Changes (Feb 14, 2026)
- **Guide Utilisateur**: Comprehensive downloadable guide page with PDF export
  - Page: /guide (client/src/pages/Guide.tsx)
  - Visual PagePreview cards representing each app section with stat cards and data
  - Print-optimized CSS for clean PDF generation via window.print()
  - Covers all features: signalements, urgences, pharmacies, banques, stations, hotels, universites, transport, etc.
  - "Telecharger en PDF" button at top and bottom
  - Added to hamburger menu under "Informations & Engagement"
  - 4-step "How to use" guide section
  - Footer with generation date and attribution

## Recent Changes (Feb 9, 2026)
- **Image Blur Editor**: Canvas-based face/object blurring for signalement images
  - Users can draw rectangles over faces or objects to pixelate them before publishing
  - Two blur strengths: "Flou leger" (medium) and "Flou fort" (strong)
  - Touch and mouse support for mobile-first usage
  - Full resolution export (blur applied at original image resolution, not display size)
  - Undo/clear actions, bounds clamping for edge safety
  - Component: client/src/components/ImageBlurEditor.tsx
  - Integrated into: client/src/pages/Publier.tsx (EyeOff button on each image thumbnail)

- **Location Validator**: Community-driven location accuracy system on ALL place cards
  - Users can "Valider" (confirm) or "Signaler" (report) location accuracy
  - Reusable LocationValidator component: client/src/components/LocationValidator.tsx
  - Integrated into: PlaceCard, Hopitaux, Universites, StationsService, PharmaciesDuFaso, Banques, Marches, BoutiquesMarchés
  - Backend: /api/places/:id/confirm, /api/places/:id/report (persists to placeVerifications table)
  - Counts displayed as badges, duplicate prevention per user/IP
  - Transform functions updated to pass placeId, confirmations, reports from DB
- **Leaderboard Filter**: Only shows users with points > 0 (no more 0-point entries)
- **Navigation**: Added "Classement" (Trophy icon) to hamburger menu

## Improvements (Feb 9, 2026)
- **Lazy Loading**: All 30+ pages use React.lazy() + Suspense for code splitting
- **Bundle size**: Main bundle reduced from 1,726 kB to 422 kB (75% reduction)
- **Loading UX**: Spinner "Chargement..." shown while pages load on demand
- **Google Fonts**: Reduced from 25+ font families to only Inter + Open Sans (the only ones used)
- **Open Graph / SEO**: Added og:title, og:description, og:image, twitter:card meta tags for social sharing
- **Dynamic Page Titles**: All 30+ pages now have unique Helmet titles (e.g. "Pharmacies - Burkina Watch")
- **Admin Page**: Replaced hardcoded mock data with real database queries (signalements, stats)
- **Cinema Program**: AI-generated weekly cinema schedules (Groq/OpenAI) with auto-refresh every Wednesday
  - Endpoint: GET /api/cinema/program, POST /api/cinema/refresh
  - Files: server/cineService.ts, client/src/pages/Cine.tsx
  - 3 cinemas: Ciné Burkina, Ciné Neerwaya, CanalOlympia Yennenga
  - Fallback to static data if AI unavailable
- **Files**: client/index.html, client/src/App.tsx, client/src/pages/Admin.tsx, all page files

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

## Recent Changes (Feb 4, 2026)
- **Transport Departures Enhancement**: Expanded from 2 to 15 departure cities
  - New departure cities: Koudougou, Ouahigouya, Banfora, Fada N'Gourma, Kaya, Tenkodogo, Dori, Dedougou, Gaoua, Orodara, Ziniaré, Pô, Léo
  - 65 trajets with detailed schedules, prices, and company info
  - Geolocation "Ma position" button to find nearest departure city
  - Select dropdowns for departure/arrival cities instead of text inputs
  - International destinations: Abidjan, Bamako, Lomé, Cotonou, Niamey, Accra
  - Files: server/transportData.ts, client/src/pages/Gares.tsx
- **Universities & Institutes Enhancement**: Expanded to 384 educational institutions
  - Types: university, college, research_institute from OSM
  - Auto-sync on first load when < 10 establishments found
  - Enhanced transformation: type detection (Université, Institut, Grande École, Centre de Formation)
  - New fields: filieres, niveaux, capacite, anneeCreation, operateur
  - Sorted: universities first, then alphabetically
  - Endpoint: GET /api/universites
- **Restaurants OSM Integration**: Full restaurant data from OpenStreetMap (free, no API key required)
  - Auto-sync on first load: restaurants, fast_food, cafe, bar types
  - 2900+ restaurants across Burkina Faso
  - PlaceCard displays ratings, price levels, descriptions when available
  - Endpoint: GET /api/places?placeType=restaurant
- **17-Region Administrative Reform**: Updated to new Burkina Faso administrative division (July 2025 reform)
  - 17 new regions: Bankui, Djoro, Goulmou, Guiriko, Kadiogo, Kuilse, Liptako, Nakambe, Nando, Nazinon, Oubri, Sirba, Soum, Sourou, Tannounyan, Tapoa, Yaadga
  - 45 provinces with correct chef-lieux and communes
  - Files: client/src/lib/regions.ts (source of truth), server/overpassService.ts, PlacesListPage.tsx
  - OLD_TO_NEW_REGION_MAPPING for legacy data migration from 13-region to 17-region structure
  - Fixed Building2 import in StationsService.tsx

## Recent Changes (Jan 12, 2026)
- **Official News Ticker**: Added scrolling news banner with real-time government communications
  - Sources: presidencedufaso.bf, sig.gov.bf, aib.media
  - Files: NewsTicker.tsx, newsService.ts
  - Route: /api/news/official
  - Auto-refresh every 30 minutes with 15-minute cache
- **Pharmacy Data Fix**: Switched from OSM to local PHARMACIES_DATA for accurate guard status (135 pharmacies, 105 de garde)
- **Offline Sync**: Fixed French accents in OfflineIndicator component

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
