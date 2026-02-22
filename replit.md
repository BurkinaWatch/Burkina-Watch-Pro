# Project Overview: Burkina Secure (Faso Secure)

Burkina Secure is a comprehensive security and emergency assistance platform for Burkina Faso. Its primary purpose is to provide citizens with critical information and tools during emergencies and for daily life, enhancing safety and preparedness across the nation. The platform integrates various data sources to offer real-time updates and essential services, aiming to become a vital public utility.

## Overview
The project aims to empower citizens of Burkina Faso with a robust, mobile-first platform for safety and information. Key capabilities include:
- **Emergency Management**: SOS alerts, emergency contact management, and lockscreen integration for critical information.
- **Location-Based Services**: Real-time tracking and display of essential services like pharmacies, hospitals, police stations, government institutions, utilities (SONABEL, ONEA), mobile agencies, religious places, and cemeteries, leveraging OpenStreetMap data.
- **Information Dissemination**: Official news ticker for government communications, regional weather monitoring, and a user-generated incident reporting system (Signalements).
- **Offline Capability**: Ensures access to critical information even in low-bandwidth environments through IndexedDB caching.
- **Community-Driven Data Validation**: A system for users to confirm or report the accuracy of location data for various points of interest.
- **AI Integration**: Utilizes AI for intelligent features, such as generating cinema schedules.
- **Comprehensive Directories**: Extensive databases of Mairies & Prefectures, Ministeres, Agences Telephonie Mobile, SONABEL & ONEA agencies, Lieux de Culte (churches & mosques), Cimetieres, and educational institutions.
- **Transport Information**: Detailed schedules and company information for inter-city and international transport routes.
- **Pharmacy Guard System**: Weekly rotation system covering 5 cities (Ouagadougou, Bobo-Dioulasso, Koudougou, Ouahigouya, Fada N'Gourma) with variable group counts per city (4 groups for Ouaga/Bobo, 3 groups for smaller cities). Rotation runs Saturday noon to Saturday noon. Data sourced from Orange BF, infossante.net, UbiPharm, and MAADO.

## User Preferences
- **Language**: French (UI default).
- **Style**: Modern, mobile-first design using Shadcn/Tailwind.
- **Naming**: Consistent use of `data-testid` for testing.

## System Architecture
The platform follows a modern full-stack architecture designed for scalability, performance, and a rich user experience.
-   **Frontend**: Developed with React (Vite) for a fast and interactive user interface, styled with Tailwind CSS and UI components from Shadcn UI, emphasizing a mobile-first design approach.
-   **Backend**: Built using Express.js with TypeScript, providing a robust and type-safe API layer.
-   **Database**: PostgreSQL is used as the primary data store, managed with Drizzle ORM for efficient data interaction.
-   **AI Integration**: Leverages Groq (llama-3.3-70b-versatile) for advanced AI capabilities, including dynamic content generation.
-   **Data Synchronization**: Extensive use of OpenStreetMap (OSM) via the Overpass API for sourcing and displaying points of interest, with local caching and auto-sync mechanisms.
-   **Authentication**: Implements a hybrid OTP (One-Time Password) system for passwordless authentication via email, supporting secure user access for interactive features.
-   **Offline Mode**: Features IndexedDB caching with automatic synchronization to ensure application functionality in areas with limited internet connectivity.
-   **Image Processing**: Includes a canvas-based image blur editor for user-uploaded content, allowing privacy-conscious sharing of incident reports.
-   **Performance Optimizations**: Incorporates lazy loading for all pages using React.lazy() and Suspense, significantly reducing bundle size and improving initial load times.
-   **UI/UX Decisions**:
    -   Consistent use of Shadcn UI components and Tailwind CSS for a unified and modern aesthetic.
    -   Dynamic page titles and Open Graph/SEO meta tags for improved discoverability and social sharing.
    -   Color-coding is applied to map markers and directory entries for easy visual identification of different types of institutions or services (e.g., religious sites, utility companies, government bodies).
    -   Implementation of "PlaceCard" components for displaying detailed information about various locations, including contact details, services, and community validation status.
-   **System Design Choices**:
    -   Centralized `regions.ts` file as the source of truth for administrative divisions following Burkina Faso's 17-region reform.
    -   Service-oriented architecture for backend functionalities (e.g., `newsService.ts`, `cineService.ts`, `overpassService.ts`).
    -   Comprehensive static data management for critical directories (e.g., `mairiesPrefecturesData.ts`, `ministeresData.ts`) alongside dynamic OSM integration.
    -   Community-driven location validation system to enhance data accuracy across all place cards.

## External Dependencies
-   **OpenStreetMap (OSM)**: Primary source for geographical data and points of interest, accessed via Overpass API.
-   **Groq**: AI service provider, specifically using the `llama-3.3-70b-versatile` model for intelligent features.
-   **Nodemailer**: Used for sending email OTPs for authentication.
-   **PostgreSQL**: Relational database for storing application data.
-   **Vite**: Frontend build tool.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **Shadcn UI**: React UI component library.
-   **Présidence du Faso, SIG (Service d'Information du Gouvernement), AIB (Agence d'Information du Burkina)**: Official sources for the news ticker.