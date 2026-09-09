# Burkina Watch - Design Guidelines

## Design Approach

**Selected Framework:** Material Design System adapted for civic infrastructure with ecological sensibility and national identity integration.

**Rationale:** Burkina Watch requires institutional credibility balanced with warmth and environmental consciousness. The national colors (Red, Yellow, Green) form the foundation of a visual language that communicates both governmental authority and community-driven environmental stewardship.

**Core Principles:**
1. **National Identity:** Red (urgency/attention), Yellow (optimism/action), Green (nature/environment) as primary palette
2. **Ecological Trust:** Natural textures, organic shapes, sustainable aesthetic
3. **Warm Professionalism:** Approachable institutional design with rounded elements
4. **Accessibility First:** WCAG AA compliance, low-bandwidth optimization

## Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts via CDN)
- Fallback: system-ui, sans-serif

**Type Scale:**
- Mega Headers: text-4xl font-bold (36px) - Landing hero
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-semibold (18px)
- Body: text-base (16px, line-height 1.625)
- Labels: text-sm font-medium (14px)
- Captions: text-xs (12px)

**Hierarchy:**
- Emergency content: font-bold, tracking-wide
- Institutional: font-semibold, subtle uppercase
- Community content: font-normal, relaxed spacing

## Layout System

**Spacing Primitives:** 2, 4, 6, 8, 12, 16
- Element spacing: space-2, space-4
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Page margins: px-4 (mobile), px-6 (tablet), px-8 (desktop)

**Grid System:**
- Mobile: Single column, px-4 margins
- Tablet: 2-column grid (md:grid-cols-2 gap-6)
- Desktop: 3-column grid (lg:grid-cols-3 gap-8)
- Dashboard: Fixed sidebar w-64 + fluid content

**Containers:**
- Full-width sections: w-full with inner max-w-7xl mx-auto
- Content sections: max-w-6xl mx-auto
- Forms: max-w-2xl mx-auto
- Map views: Full viewport height minus header (h-[calc(100vh-64px)])

## Color Strategy

**National Palette Integration:**
- **Green (Primary):** Nature, environment, success states, primary actions
- **Yellow (Secondary):** Optimism, warnings, highlights, active states
- **Red (Accent):** Urgency, SOS alerts, critical actions, errors

**Application:**
- Background: Warm off-white with subtle green undertone
- Surface cards: White with soft shadows, green accent borders for active states
- Text: Charcoal gray (not pure black) for warmth
- Institutional elements: Deep green headers with yellow accents
- SOS components: Red with yellow warning highlights
- Success states: Rich green
- Category badges: Color-coded using national palette variations

**Ecological Textures:**
- Subtle paper-like texture overlays on backgrounds
- Organic gradient transitions (green to yellow)
- Natural shadow colors (green-tinged rather than pure gray)

## Component Library

### Navigation & Header
**Main Header:**
- Height: h-16, deep green background with yellow accent strip (h-1) at bottom
- Logo left with "République du Burkina Faso" emblem (h-10)
- Navigation text in warm white
- Profile/menu right with rounded avatars
- Shadow with green tint

**Bottom Navigation (Mobile):**
- 5 icons: Accueil, Carte, Publier (+), SOS, Profil
- Active state: Green background pill, yellow icon
- Inactive: Gray icons
- Central publish button: Larger, yellow circular button with green icon, shadow-xl

**Desktop Navigation:**
- Horizontal menu with text labels
- Hover: Yellow underline animation
- Active: Green background pill

### Report Cards
**Standard Card:**
- White background, rounded-xl borders
- Green accent border-l-4 on hover
- Image: w-full h-48 object-cover rounded-t-xl
- Category badge: Top-right overlay, rounded-full, color-coded (Green/Yellow/Red categories)
- Content padding: p-6
- Shadow: Natural green-tinted shadow-md on hover
- Status dot: Small circular indicator (green/yellow/red) with text

**Card Elements:**
- Title: text-lg font-semibold, line-clamp-2, charcoal gray
- Location: text-sm with green pin icon
- Date: text-xs, warm gray
- Action bar: Icon buttons (like, comment, share) in green with yellow hover states
- Engagement metrics: Small text with icons

### SOS Components
**SOS Alert Card:**
- Red border-2 with yellow glow effect
- Pulsing red indicator dot (animate-pulse)
- Larger image: h-64
- Urgent badge: Red background, yellow text, rounded-full
- Action buttons: Red primary, yellow secondary

**SOS Floating Button:**
- Position: Fixed bottom-right (bottom-20 right-6)
- Size: w-16 h-16, circular
- Red background gradient (red to darker red)
- Yellow "SOS" text or icon
- Pulse animation, shadow-2xl with red glow

### Map Interface
**Map Container:**
- Full height minus header/nav
- Natural-colored markers (green for routine, yellow for pending, red for emergencies)
- Cluster markers: Rounded with number, green background
- Filter panel: Floating glass-morphism card (backdrop-blur-md, bg-white/95, green border-l-4)

**Map Controls:**
- Floating cards with rounded-xl, natural shadows
- Filter chips: Horizontal scroll (mobile), rounded-full pills
- Active filter: Green background, yellow text
- Inactive: White with green border

### Forms
**Publication Form:**
- max-w-2xl, single column
- Section spacing: space-y-6
- Labels: text-sm font-medium, deep green
- Inputs: h-12, rounded-lg, border-gray-300, focus:border-green-500 focus:ring-green-200
- Textareas: h-32, rounded-lg
- Upload area: Dashed green border, rounded-xl, center icon (green), drag-drop zone

**Category Selection Grid:**
- grid-cols-2 (mobile), md:grid-cols-3 gap-4
- Cards: rounded-xl, p-6, icon top (green), label below
- Selected state: Green background, yellow icon, border-2 green
- Hover: Subtle green shadow

**Anonymous Toggle:**
- Large switch component with green/yellow states
- Helper text in warm gray

### Dashboard (Institutional)
**Layout:**
- Fixed sidebar: w-64, deep green background, white text
- Navigation items: Rounded-lg on hover (yellow background)
- Main content: White background with subtle texture
- Stats cards: grid-cols-1 md:grid-cols-4 gap-6

**Stats Cards:**
- p-6, rounded-xl, white background
- Top border accent (green/yellow/red based on metric)
- Large number: text-3xl font-bold, colored
- Label: text-sm, warm gray
- Small icon: Colored background circle

**Action Buttons:**
- Primary: Green background, white text, rounded-lg, shadow-md
- Secondary: White background, green border, green text
- Danger: Red background, yellow text
- All buttons: h-12, px-6, font-semibold

### Notifications
**Notification Cards:**
- Compact: p-4, rounded-lg
- Left border (border-l-4): Color-coded (green/yellow/red)
- Icon left circle (green/yellow/red background)
- Content middle, timestamp right
- Unread: Subtle yellow background tint
- Dismiss: X button (warm gray, hover:red)

### User Profile
**Profile Header:**
- Avatar: w-24 h-24, rounded-full, green border-4
- Username: text-xl font-semibold
- Stats row: 3 metrics with green icons
- Edit button: Yellow background, green text, rounded-lg

**History Timeline:**
- Vertical line (green dashed)
- Condensed cards with thumbnails (w-16 h-16 rounded-lg)
- Date markers: Yellow circular badges

## Visual Treatments

**Elevation:**
- Level 1: shadow-sm with green tint
- Level 2: shadow-md with warm shadow
- Level 3: shadow-lg for modals
- Level 4: shadow-2xl with colored glow for SOS

**Borders & Corners:**
- Standard: rounded-xl (12px) for warmth
- Pills: rounded-full
- Buttons: rounded-lg (8px)
- Sharp corners avoided (too institutional)

**Interactive States:**
- Hover: Green shadow increase, slight scale-105
- Active: Deeper shadow, scale-98
- Disabled: opacity-60, grayscale
- Focus: ring-2 ring-green-500 ring-offset-2

**Loading States:**
- Skeleton: Animate-pulse with green tint
- Spinner: Green circular loader
- Progress: Green bar with yellow fill

## Images

**Hero Image Strategy:**
Landing/About pages include full-width hero section:
- Size: h-[70vh], object-cover
- Subject: Citizens using phones in Burkina Faso landscapes (green fields, community gatherings)
- Treatment: Dark gradient overlay (from-black/50 via-green-900/30 to-transparent)
- Buttons on hero: Backdrop-blur-md background, no additional hover effects

**In-App Images:**
- Report thumbnails: User photos (w-full h-48 object-cover rounded-t-xl)
- Category illustrations: Simple green-tinted icons (Heroicons via CDN)
- Profile avatars: Circular with green borders
- Empty states: Friendly illustrations (nature themes) with green/yellow accents
- Success/error graphics: Simple icons with appropriate colors

**Image Overlays:**
- Text on images: backdrop-blur-sm, bg-white/90 or bg-green-900/80
- Buttons on images: backdrop-blur-md, no hover background changes
- WCAG AA contrast maintained

## Accessibility

- French labels throughout
- Color never sole indicator (icons + text always paired)
- Touch targets: Minimum 44x44px
- Focus indicators: Clear ring-2 ring-green-500 ring-offset-2
- Alt text mandatory
- ARIA labels for icon buttons
- Semantic HTML
- Screen reader friendly navigation

## Responsive Breakpoints
- Mobile: <768px (base)
- Tablet: 768px-1024px (md:)
- Desktop: >1024px (lg:)