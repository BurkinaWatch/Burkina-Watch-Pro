# Burkina Watch - Application Nationale de Veille Citoyenne

## Overview

Burkina Watch is a full-stack web application for civic engagement in Burkina Faso. It enables citizens to anonymously report incidents, request/offer help via an SOS feature, and visualize real-time reports on an interactive map. Public institutions can respond through a secure interface. The platform emphasizes reliability, simplicity, accessibility, and mobile responsiveness, even on low-bandwidth connections. Key features include Google authentication, comprehensive profile protection, an urgency indicator system, user-editable signalements, clickable location points integrated with Google Maps, and an AI-powered chatbot assistant. The project aims to improve citizen safety and engagement, foster transparency, and support community resilience in Burkina Faso.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend uses React 18 with TypeScript and Vite, featuring Shadcn/ui components (Radix UI, Tailwind CSS - New York variant). It employs an ecological and security-focused design with a primary green color palette (HSL 142° 65% 45% light, 142° 60% 55% dark) and WCAG AA compliant contrast. The slogan "Voir. Agir. Protéger." incorporates national colors, and urgency is indicated by a traffic light system.

### Technical Implementations
*   **Frontend**: React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state, React Context for themes. Key pages include Landing, Home, Feed, Interactive Map, Report Creation, SOS Publishing, Signalement Detail, User Profile, Admin, and specialized pages for Gas Stations, Pharmacies, and news. Features include dynamic "Message du Jour," interactive map with marker clustering, automatic image compression, dynamic SOS filtering, a robust like system, comment system, share functionality, and an automatic points system with user levels. Live location tracking and trajectory visualization are available for safety. Full article detail pages with SEO via React Helmet Async, a comprehensive real-time notification system, and location email delivery upon stopping tracking are implemented. An AI Chatbot Assistant powered by OpenAI (gpt-4o-mini) provides assistance and FAQs, maintaining persistent chat history. Real-time online user count is displayed.
*   **Backend**: Node.js with Express.js and TypeScript. It provides RESTful endpoints for authentication, reports, comments, and user profiles. Session management uses Express sessions with a PostgreSQL store.
*   **Database**: Drizzle ORM with PostgreSQL (Neon serverless driver). Schema includes `users`, `signalements`, `signalement_likes`, `commentaires`, `sessions`, `trackingSessions`, `locationPoints`, `onlineSessions`, `notifications`, `chatMessages`, and `streetviewPoints`. Migrations are handled with Drizzle Kit. Performance is optimized with database indexes.
*   **Authentication & Authorization**: OpenID Connect (OIDC) via Replit Auth (Google, GitHub, X, Apple, email/password) using Passport.js. Role-based access control (default "citoyen") and PostgreSQL-backed sessions with a 7-day TTL are implemented.
*   **Security & Encryption**: Envelope encryption with AES-256-GCM for sensitive data, using Google Cloud KMS in production. Security middlewares include Helmet, express-rate-limit, xss-clean, hpp, and strict CORS. Rate limiting is applied per-endpoint, with brute-force protection. Refresh tokens are secured with SHA-256 hashing. Comprehensive audit logging tracks sensitive operations.
*   **Data Validation**: Zod schemas generated from Drizzle schemas, with `Zod-validation-error` for user-friendly messages. React Hook Form with Zod resolver is used for client-side and server-side validation.
*   **Styling**: Tailwind CSS with a custom ecological theme and WCAG AA compliance. Inter font family is used.
*   **Build and Deployment**: Development uses `npm run dev` (Express with Vite middleware), and production uses Vite for frontend and esbuild for Node.js server. UUIDs are generated using `gen_random_uuid()` in PostgreSQL. Content refresh for dynamic pages is handled via visibility and focus event listeners. The application is ready for deployment with i18n translations for 5 languages and Resend integration.

## External Dependencies

*   **Database**: Neon PostgreSQL
*   **Authentication**: Replit Auth (OIDC provider)
*   **UI Components**: Radix UI, Lucide React, Date-fns
*   **Development Tools**: Replit Vite plugins (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`)
*   **Form Handling**: React Hook Form, Hookform Resolvers (Zod integration)
*   **Third-party Services**: Google Maps API (MarkerClusterer, Geocoding API), Google Fonts, Unsplash, Resend (transactional email), Nominatim/OpenStreetMap (geocoding fallback), OpenAI (gpt-4o-mini for chatbot).
*   **Mapping & Geolocation**: Leaflet.js (with react-leaflet for StreetView), Mapillary (for street-level panoramas), Overpass API (for OSM places data).
*   **SEO**: React Helmet Async
*   **RSS Aggregation**: Various Burkina Faso news sources (Lefaso.net, Sidwaya, Fasozine) and international news feeds (BBC Africa, Reuters, Bloomberg) for AI-powered event detection.