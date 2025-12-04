# Burkina Watch - Application Nationale de Veille Citoyenne

## Overview

Burkina Watch is a full-stack web application designed for civic engagement in Burkina Faso. It enables citizens to anonymously report incidents (accidents, corruption, infrastructure issues), request or offer help via an SOS feature, and visualize real-time reports on an interactive map. Public institutions can respond to these reports through a secure professional interface. The platform prioritizes reliability, simplicity, accessibility, and mobile responsiveness, even on low-bandwidth connections. Key capabilities include Google authentication, comprehensive profile protection, an urgency indicator system for reports, user-editable signalements, and clickable location points integrated with Google Maps.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

*   **Framework**: React 18 with TypeScript and Vite with React Helmet Async for SEO/Open Graph support.
*   **UI/UX**: Shadcn/ui components (Radix UI, Tailwind CSS - New York variant). Ecological and security-focused design with a primary green color palette (HSL 142° 65% 45% light, 142° 60% 55% dark) for nature, security, and environmental awareness. WCAG AA compliant contrast. The slogan "Voir. Agir. Protéger." uses national colors (Red, Yellow, Green) reflecting the Burkinabé flag. Urgency is indicated by a traffic light color system.
*   **Routing**: Wouter for client-side routing with protected routes and programmatic navigation.
*   **State Management**: TanStack Query for server state, React Context for theme, React hooks for local state.
*   **Key Pages**: Landing, Home, Feed (filterable), Interactive Map (signalements, SOS), Report Creation (`/publier`), SOS Publishing (`/sos/publier`), Signalement Detail (`/signalement/:id`), Notifications, User Profile, Admin, Contribution (`/contribuer`), About (`/a-propos`), Terms of Use (`/conditions`).
*   **Features**: Dynamic "Message du Jour" on homepage, interactive map with marker clustering and local statistics (SOS markers unclustered), clickable location points opening Google Maps, automatic image compression on upload (1200x1200px, 80% JPEG quality, max 20MB before compression), dynamic SOS filtering system (Urgences, Demandes d'aide, Personnes recherchées), professional hamburger navigation menu, detailed "About" and "Terms of Use" pages, and a "Contribution" page for mobile money donations. Social features include a **robust like system** with junction table, transaction-based toggling, and duplicate prevention, comment system, and share functionality. **Automatic Points System**: Users earn points automatically through platform engagement: +5 points when someone likes their signalement (removed when unliked), +10 points when a signalement is marked as "resolu". Points are awarded atomically within database transactions to ensure consistency. The system includes `syncUserPointsFromSignalements` helper function for point reconciliation from actual signalement data. Authorization ensures only authors and admins can change signalement status. User levels (Sentinelle, Veilleur de Proximité, Force de Sécurité) are recalculated automatically based on total points. **Live Location Tracking**: Users can start/stop real-time location tracking from their profile page; the system records GPS coordinates every 30 seconds to create a safety trajectory that can be used by emergency services to locate citizens in case of incidents or accidents. The tracking automatically resumes after page reload if a session is active, with synchronized point counter displaying the number of recorded positions. **Trajectory Visualization**: Each tracking session automatically generates a Google Maps link displaying the complete trajectory for investigation and search purposes. Users can copy the link or open it directly; the system intelligently samples waypoints (max 8) to respect Google Maps API limits while preserving route accuracy. **Full Article Detail Pages**: Each signalement has a dedicated shareable detail page with full content display, SEO meta tags via React Helmet Async, and Open Graph tags for optimal social sharing. Clickable titles throughout the app navigate to these detail pages. **Comprehensive Notification System**: All users receive real-time notifications for all platform activities including new posts, SOS alerts, likes, comments, shares, and modifications. The system uses async batch processing to efficiently broadcast notifications to all users without impacting request latency. Unread notification count displays in the header. **Location Email Delivery**: When users stop live location tracking, they automatically receive an email containing the reverse-geocoded address of their last position along with session statistics. The system uses Google Maps Geocoding API with Nominatim (OpenStreetMap) as fallback, includes in-memory caching for performance, and sends professionally formatted HTML emails via Resend. **AI Chatbot Assistant**: "Assistance Burkina Watch" is an intelligent chatbot powered by OpenAI (gpt-4o-mini) accessible from all pages via a floating button. The assistant helps users create signalements, provides safety advice, answers FAQs in French, and maintains conversation history per session. Features include persistent chat history in PostgreSQL, graceful error handling with differentiated messages for quota exhaustion vs technical errors, loading states, automatic scroll, and emergency contact reminders. The chatbot uses Replit AI Integrations for seamless API key management. **Real-time Online Users Count**: The homepage displays a live count of currently connected users through an elegant blue-themed stat card. The system uses automatic heartbeat tracking (every 2 minutes) via the useOnlineStatus hook to maintain accurate presence information in the onlineSessions database table. Users are marked online when they connect and automatically marked offline when they disconnect or close the browser, with proper cleanup through sendBeacon on page unload.

### Backend

*   **Runtime**: Node.js with Express.js.
*   **Language**: TypeScript with ES modules.
*   **API Design**: RESTful endpoints (`/api`) for authentication, reports, comments, and user profiles.
*   **Session Management**: Express sessions with PostgreSQL session store.

### Database

*   **ORM**: Drizzle ORM with PostgreSQL dialect via Neon serverless driver.
*   **Schema**: `users`, `signalements` (geolocation, category, status, media URLs, anonymous/SOS flags, urgency, likes counter), `signalement_likes` (junction table with unique constraint on user_id + signalement_id for atomic like toggling), `commentaires`, `sessions`, `trackingSessions` (live location tracking sessions), `locationPoints` (GPS coordinates with timestamps), `onlineSessions` (real-time user presence tracking with connected_at, disconnected_at timestamps), `notifications` (user notifications with types, read status, indexed for performance), `chatMessages` (AI chatbot conversation history with sessionId, userId, role, content, timestamps; indexed on sessionId and userId for performance).
*   **Migrations**: Schema-first approach with Drizzle Kit using `npm run db:push`.
*   **Performance Optimization**: Database indexes on notification queries (`user_id`, `read`, `created_at`) for fast notification retrieval. Unique composite index on `signalement_likes(user_id, signalement_id)` prevents duplicate likes and enables race-condition-free toggling.

### Authentication & Authorization

*   **Provider**: OpenID Connect (OIDC) via Replit Auth (Google, GitHub, X, Apple, email/password).
*   **Strategy**: Passport.js with `openid-client`.
*   **Session Storage**: PostgreSQL-backed sessions with 7-day TTL.
*   **User Flow**: Authentication required for reports, comments, profile; anonymous access for public content.
*   **Authorization**: Role-based access control; "citoyen" default, support for institutional roles.

### Security & Encryption

*   **Encryption Service**: Envelope encryption pattern with AES-256-GCM for field-level encryption of sensitive data. Master key wraps unique data keys (DEKs) for each encrypted field. Supports both local fallback (development) and Google Cloud KMS (production).
*   **Security Middlewares**: Helmet (CSP, HSTS, X-Frame-Options), express-rate-limit (API throttling), xss-clean (XSS sanitization), hpp (HTTP Parameter Pollution protection), CORS strict origin validation.
*   **Rate Limiting**: Per-endpoint rate limiting (general: 100 req/15min, login: 5 req/15min, signalements: 20 req/hour, chatbot: 15 req/5min). Brute-force protection with automatic lockout (5 failed attempts = 30min lockout).
*   **Refresh Token Security**: SHA-256 hashing with salt before database storage. Tokens never stored in plaintext.
*   **Audit Logging**: Comprehensive audit trail in `audit_logs` table tracking all sensitive operations (authentication, signalement CRUD, admin actions, security events) with user_id, IP address, user agent, severity levels.
*   **Database Schema**: Additional security tables: `audit_logs` (operation tracking), `refreshTokens` (secure token storage with revocation support).
*   **Testing**: Unit test suite using Node.js built-in `node:test` runner validating encryption round-trips, refresh token hashing, key rotation, error handling, and performance (18 tests covering all critical paths).
*   **Documentation**: Complete security documentation in `README_security.md` covering architecture, encryption procedures, key rotation, migration strategies, emergency procedures, and deployment checklist.

### Data Validation

*   **Schema Validation**: Zod schemas generated from Drizzle schemas (`drizzle-zod`).
*   **Error Handling**: `Zod-validation-error` for user-friendly messages.
*   **Form Validation**: React Hook Form with Zod resolver (client-side) and server-side request body validation.

### Styling System

*   **Framework**: Tailwind CSS with custom configuration.
*   **Theme**: Ecological and security-focused palette with dominant greens, using CSS custom properties for light/dark modes. WCAG AA compliance.
*   **Typography**: Inter font family from Google Fonts.

### Build and Deployment

*   **Development**: `npm run dev` (Express with Vite middleware, HMR).
*   **Production**: Vite for frontend, esbuild for Node.js server. Configured for autoscale deployment.
*   **Build Command**: `npm run build` (Vite build + esbuild server bundle).
*   **Start Command**: `npm run start` (Production Node.js server).
*   **Type Checking**: `npm run check`.
*   **Database Migrations**: `npm run db:push`.
*   **Deployment Status**: Ready for deployment. All i18n translations complete for 5 languages (French, English, Dioula, Moore, Fulfulde).

## External Dependencies

*   **Database**: Neon PostgreSQL
*   **Authentication**: Replit Auth (OIDC provider)
*   **UI Components**: Radix UI (headless), Lucide React (icons), Date-fns
*   **Development Tools (Replit Plugins)**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`
*   **Form Handling**: React Hook Form, Hookform Resolvers (Zod integration)
*   **Third-party Services**: Google Maps API (@googlemaps/markerclusterer for clustering, Geocoding API for reverse geocoding), Google Fonts, Unsplash (for placeholder images), Resend (transactional email service for location tracking), Nominatim/OpenStreetMap (geocoding fallback).
*   **SEO**: React Helmet Async for dynamic meta tags and Open Graph tags on signalement detail pages for improved social sharing and search engine optimization.