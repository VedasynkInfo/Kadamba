# Development References: Phase-by-Phase Guide

## Brand Identity (canonical — follow in every phase)

**Kadamba's Designer Studio** (Kurnool) is a well-known local **boutique and tailoring** business specializing in **women's traditional and bridal wear**.

| Field | Value |
|-------|--------|
| Name | Kadamba's Designer Studio |
| Location | Kurnool |
| Category | Boutique + custom tailoring |
| Specialty | Women's traditional wear & bridal wear |
| Summary | Kadamba's Designer Studio in Kurnool is a well-known local boutique and tailoring business specializing in women's traditional and bridal wear. |

**Code source:** `frontend/src/pages/home/data.ts` → `brand`  
**Cursor rule:** `.cursor/rules/brand-content.mdc`

Do **not** position the site as an interior-design or home-studio brand in future phases.

## Document Structure Overview
This document serves as a comprehensive reference for the Kadamba Designer Studio website development, organized by phase for efficient token usage and progressive documentation.

## Quick Navigation
- [Phase 1: Project Foundation](#phase-1-project-foundation)
- [Phase 2: Design System](#phase-2-design-system)
- [Phase 3: Home Page](#phase-3-home-page)
- [And so on through Phase 15]

## Phase 1: Project Foundation
**Status:** ✅ Complete | **Duration:** 1-2 weeks

**⚠️ VERIFICATION NEEDED:** Phase 1 completion should be cross-referenced with active_chunk.md before proceeding to Phase 2 implementation.

### Core Architecture
- **Frontend:** React.js with Vite, TypeScript, Tailwind CSS
- **Backend:** Express.js with JWT, MongoDB, Cloudinary, Multer, Nodemailer
- **API Structure:** RESTful with validation, error handling, pagination

### Key Deliverables
- Working React frontend (Vite + TypeScript)
- Complete Express backend
- MongoDB database with Mongoose models
- JWT authentication system
- Cloudinary image integration
- Email notification system
- Environment configuration
- Complete API architecture

### Technology Stack
```json
{
  "frontend": {
    "framework": "React.js + Vite",
    "language": "TypeScript",
    "styling": "Tailwind CSS",
    "routing": "React Router v6",
    "http": "Axios"
  },
  "backend": {
    "runtime": "Node.js",
    "framework": "Express.js",
    "database": "MongoDB + Mongoose",
    "auth": "JWT",
    "upload": "Cloudinary + Multer",
    "email": "Nodemailer"
  },
  "development": {
    "linting": "ESLint",
    "formatting": "Prettier",
    "testing": "Jest + Vite",
    "version": "Git"
  }
}
```

## Phase 2: Design System
**Status:** ✅ Complete | **Duration:** 2-3 weeks

**Implemented:** `frontend/src/theme/designTokens.ts`, `frontend/src/index.css`, `frontend/src/components/ui/*`, preview at `/design-system`.

### Design Philosophy
- **Luxury Aesthetics:** Sophisticated black, gold, cream theme
- **Production Ready:** Enterprise-grade code quality
- **Modular Architecture:** Scalable and maintainable codebase

### Theme System
- **Colors:** Black (#000000), Gold (#FFD700), Cream (#FFFDD0)
- **Typography:** Playfair Display (headings), Inter (body), classic readable measure (~38rem lede)
- **Section intros:** Always use `SectionIntro` — never squeeze ledes with broken `max-w-sm|md|lg|xl`
- **Spacing tokens:** Use `--kadamba-space-*` — **never** redefine Tailwind `--spacing-sm|md|lg|xl` in `@theme` (collapses `max-w-*` prose)

### Typography Rules (mandatory)
1. One section title + one short lede; lede uses `.text-lede` / `SectionIntro`
2. Comfortable line-height (~1.65–1.7) and `text-wrap: pretty`
3. Prefer `max-w-2xl+`, `max-w-[36rem]`, or `.text-measure` for prose widths
4. Cursor rule: `.cursor/rules/typography-layout.mdc`

### Component Library
1. **Button Components**
   - Primary, secondary, ghost variants
   - Luxury hover effects and transitions
   - Accessibility compliant

2. **Card Layouts**
   - Image cards with overlay text
   - Pricing cards with featured styling
   - Service cards with icons

3. **Form Components**
   - Input fields with smooth focus states
   - Select menus with custom styling
   - Checkbox and radio button groups

4. **Navigation Components**
   - Navbar with scroll behavior
   - Breadcrumb navigation
   - Pagination controls

5. **Feedback Components**
   - Toast notification system
   - Loading spinners and progress bars
   - Modal dialogs with backdrop blur

### CSS Architecture
```css
/* Design Tokens */
:root {
  --color-black: #000000;
  --color-gold: #FFD700;
  --color-cream: #FFFDD0;
  --color-dark-bg: #000000;
  --color-light-bg: #FFFDD0;
  --color-primary-text: #FFFFFF;
  --color-secondary-text: #FFD700;
  
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --font-size-h1: 3rem;
  --font-size-h2: 2rem;
  --font-size-h3: 1.5rem;
  --font-size-body: 1rem;
  
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 4rem;
}
```

## Phase 3: Home Page
**Status:** ✅ Implemented (frontend) | **Duration:** 3-4 weeks

**Implemented:** `frontend/src/pages/home/*` — Hero through CTA + premium footer. Motion via `gsap` + `framer-motion`. Preview at `/`.

**Brand content:** Kurnool boutique & tailoring — women's traditional and bridal wear (see Brand Identity above). Not interior design.

### Hero Section
- **Fullscreen Background:** Dynamic artwork with GSAP animations
- **Luxury Typography:** Playfair Display with gradient text effects
- **Animated CTA:** Smooth scroll and hover interactions
- **Motion Design:** Framer Motion for micro-interactions

### Services Section
- **Animated Cards:** Hover effects with scale and rotation
- **Icon Integration:** Custom icons with gold accents
- **Image Gallery:** Responsive images with lazy loading

### Featured Collections
- **Masonry Grid:** Isotope or similar for brick layout
- **Filter System:** Category-based filtering with smooth transitions
- **Lightbox Viewer:** Image zoom with navigation

### Animated Marquee
- **Infinite Scroll:** Custom GSAP marquee animation
- **Hover Pause:** Interactive pause on mouse enter
- **Popup Preview:** Preview cards with smooth transitions

### Additional Sections
- **Testimonials:** Animated testimonial carousel
- **Why Choose Us:** Feature cards with icons
- **Process Timeline:** Step-by-step visual timeline
- **Statistics Counter:** Animated number counters
- **Latest Blogs:** Post listing with excerpt previews
- **CTA Banner:** Conversion-focused promotional section
- **Premium Footer:** Luxury footer with social links

## Phase 4: About Page
**Status:** ✅ Implemented (frontend) | **Duration:** 1-2 weeks

**Implemented:** `frontend/src/pages/about/*` — Hero through CTA. Motion via `gsap` + `framer-motion`. Preview at `/about`.

**Brand content:** Kurnool boutique & tailoring — women's traditional and bridal wear (see Brand Identity above). Not interior design.

### Brand framing
Tell the story of Kadamba's Designer Studio as a **Kurnool boutique and tailoring house** known for **women's traditional and bridal wear**.

### Content Architecture
- **Studio Story:** Local boutique heritage in Kurnool
- **Vision & Mission:** Craft, fit, and celebration-ready traditional/bridal wear
- **Values Grid:** Trust, craftsmanship, personal fitting
- **Timeline:** Milestones of the boutique
- **Team Section:** Tailors / stylists (as available)
- **Achievements:** Local recognition and client trust

## Phase 5: Services
**Status:** ✅ Implemented (frontend) | **Duration:** 2-3 weeks

### Service Detail Pages
- **Banner Section:** Service-specific hero image
- **Description:** Rich text with formatted content
- **Gallery:** Portfolio images for the service
- **Features List:** Icon-based feature grid
- **CTA Section:** Request service button

### Service Management
- **Categories:** Hierarchical organization
- **Search & Filter:** Quick service discovery
- **Booking System:** Online service request
- **Admin Interface:** CRUD operations for services

## Phase 6: Gallery
**Status:** ✅ Implemented (frontend) | **Duration:** 3-4 weeks

### Gallery Features
- **Lookbook Banner:** Editorial centered hero (outline brand mark + GSAP aperture) — distinct from About/Services
- **Masonry Layout:** CSS-column masonry grid
- **Category Filters:** Bridal / Traditional / Festive / Tailoring / Details with smooth transitions
- **Lazy Loading:** Native lazy images
- **Fullscreen Viewer:** Lightbox with ← → keyboard navigation
- **Video Support:** Video tiles + inline player in viewer
- **Cloudinary Integration:** Delivery-URL-ready shapes (upload API Phase 13)
- **Admin CRUD:** Deferred to Phase 12 — data shapes are CRUD-ready

## Phase 7: Portfolio
**Status:** ✅ Implemented (frontend) | **Duration:** 3-4 weeks

### Portfolio Categories
- **Bridal Collections:** Wedding dress showcases
- **Traditional Wear:** Cultural attire displays
- **Before/After:** Transformation galleries
- **Fashion Shows:** Event and runway content
- **Client Stories:** Testimonial portfolios

### Admin Features
- **Project Management:** CRUD for portfolio items
- **Category Organization:** Hierarchical categorization
- **Image Management:** Bulk upload and optimization

## Phase 8: Blogs
**Status:** Ready to start | **Duration:** 2-3 weeks

### Blog Features
- **Listing View:** Post preview with excerpts
- **Categories:** Hierarchical topic organization
- **Search Functionality:** Keyword-based discovery
- **Detail Pages:** Full article with related content
- **SEO Optimization:** Meta tags and structured data
- **Admin Interface:** Complete CRUD operations
- **Comments System:** User engagement features

## Phase 9: Contact
**Status:** ✅ Implemented | **Duration:** 1-2 weeks

**Implemented:** `frontend/src/pages/contact/*` — centered invitation banner, channels, form, WhatsApp banner, map, social. Backend: `POST /api/contact` with Nodemailer admin + auto-reply. Preview at `/contact`.

### Contact Elements
- **Information Display:** Contact details and hours
- **Google Maps Integration:** Interactive location mapping
- **WhatsApp Chat:** Direct messaging integration
- **Social Links:** Multiple platform connections
- **Contact Form:** Validation and email integration
- **Email Notifications:** Automated responses

## Phase 10: Request Service
**Status:** ✅ Implemented | **Duration:** 2-3 weeks

**Implemented:** `frontend/src/pages/request-service/*` — personal split invitation banner + multi-step form. Backend: `Lead` model + `POST /api/leads` (MongoDB, Nodemailer, optional Cloudinary inspiration uploads). Prefill via `?service=`. Preview at `/request-service`.

### Form Fields
- **Personal Information:** Name, Phone, Email, City
- **Service Details:** Service type, Occasion
- **Preferences:** Budget, Preferred date, Inspiration images
- **Communication:** Message field for special requests

### CRM Integration
- **MongoDB Storage:** Lead record creation
- **Email Notifications:** Admin alerts via Nodemailer
- **CRM Lead Creation:** Automated CRM system integration
- **Status Tracking:** Lead progression management

## Phase 11: Leads CRM
**Status:** ✅ Implemented (frontend CRM UI) | **Duration:** 3-4 weeks

### Dashboard Features
- **Analytics Overview:** Lead statistics and trends
- **Lead List:** Complete list with search and filters
- **Status Tracking:** Pipeline management (New, Contacted, Qualified, Appointment, Completed, Rejected)
- **Timeline View:** Lead history with interactions
- **Notes System:** Internal comments and tracking
- **Export Functionality:** CSV download

### Admin Features
- **Lead Assignment:** Staff member allocation
- **Role-based Access:** Different permission levels
- **Custom Fields:** Additional data tracking

## Phase 12: Admin Dashboard
**Status:** ✅ Implemented (frontend console + local CRUD) | **Duration:** 4-5 weeks

### Navigation Structure
- **Sidebar:** Collapsible navigation (`AdminLayout`)
- **Dashboard:** Horizon desk banner + pulse widgets + recent leads
- **Gallery / Services / Portfolio / Blogs:** Local seed CRUD drawers
- **Leads:** Phase 11 CRM under `/admin/leads` with horizon banners
- **Settings / Profile:** Website config + account desk
- **Login:** `/admin/login` JWT gate (`RequireAdmin`)

### Banner language
- **`AdminHorizonBanner`:** edge-to-edge filmstrip above ink workplane — distinct from public heroes and Phase 11 diagonal desk

### Dashboard Widgets
- **Total Leads:** Count with open pipeline hint
- **Gallery Images:** Published / total
- **Blogs:** Post count
- **Requests:** New enquiry count

### Security Features
- **JWT Protection:** Token-based authentication via existing auth API
- **Role check:** `admin` required for console routes
- **Dev unlock:** Offline demo admin only in `import.meta.env.DEV`
- **Audit / rate limiting:** Deferred with Phase 13–15 hardening

## Phase 13: Backend APIs
**Status:** ✅ Implemented | **Duration:** 3-4 weeks

**Implemented:** Mongo models + REST under `/api` for gallery, services, portfolio, blogs, settings; auth refresh/profile; leads admin CRM; Cloudinary upload; admin console + leads store wired to APIs.

### API Categories
- **Auth APIs:** Login, register, token refresh, profile
- **Gallery APIs:** CRUD, search, filtering, pagination
- **Services APIs:** Full CRUD operations
- **Portfolio APIs:** Project management and categorization
- **Blogs APIs:** Article management, comments, categories
- **Leads APIs:** Lead management, status updates
- **Upload APIs:** Multiple file types, Cloudinary integration
- **Settings APIs:** Website configuration management

### API Features
- **Validation:** Comprehensive input validation
- **Error Handling:** Structured error responses
- **Pagination:** Efficient data loading
- **Search & Filtering:** Advanced query capabilities
- **Rate Limiting:** Protection against abuse
- **Security Headers:** Helmet integration
- **CORS Configuration:** Cross-origin requests

## Phase 14: SEO & Performance
**Status:** ✅ Complete | **Duration:** 2-3 weeks

### SEO Optimization
- **Meta Tags:** Page-specific title and descriptions
- **OpenGraph:** Social media sharing optimization
- **Twitter Cards:** Twitter-specific metadata
- **Schema.org:** Structured data markup
- **Alt Text:** Accessibility for all images
- **Sitemap:** XML sitemap generation
- **Robots.txt:** Search engine directives
- **Canonical URLs:** Prevent duplicate content

### Performance Features
- **Lazy Loading:** Images and components
- **Code Splitting:** Bundle optimization
- **Image Optimization:** Cloudinary integration
- **Font Optimization:** Web font loading
- **Service Worker:** Offline capabilities

## Phase 15: Production
**Status:** ✅ Complete | **Duration:** 2-3 weeks

### Quality Assurance
- **Responsive Testing:** Cross-device compatibility
- **Security Hardening:** Comprehensive security measures
- **Helmet Implementation:** Security headers
- **Rate Limiting:** Abuse protection
- **Logging:** Comprehensive activity tracking
- **Deployment Configuration:** Environment setup
- **Environment Documentation:** Configuration guide

### Monitoring & Maintenance
- **Analytics Setup:** Performance monitoring
- **Backup Procedures:** Data protection
- **Recovery Plans:** Disaster recovery
- **Update Management:** Version control

## Development Workflow

### Phase Transition Process
1. **Complete Current Phase** - All deliverables completed and tested
2. **Architecture Review** - Evaluate design decisions
3. **Documentation** - Update references and create summaries
4. **Team Sync** - Progress communication

### Cursor Rules Implementation
1. **Plan Architecture First** - Always plan before coding
2. **Generate Reusable Code Only** - Avoid duplication
3. **Modular Components** - Keep everything modular
4. **TypeScript Patterns** - Use TypeScript-ready approaches
5. **Phase Sequential Completion** - Never start next phase until current is complete
6. **No Placeholder Code** - Unless explicitly marked as TODO

### Quality Assurance Framework
1. **Code Quality**
   - 100% linting compliance
   - >90% test coverage
   - Adherence to coding standards

2. **Security Standards**
   - Input validation
   - Authentication protection
   - Secure file handling

3. **Performance Targets**
   - Page load time < 3 seconds
   - Image optimization enabled
   - Mobile-first responsive design

4. **SEO Requirements**
   - Schema markup implementation
   - Alt text for all images
   - Proper heading hierarchy

## Boutique ERP Program (Phase 16+)

Website Phases 1–15 remain complete. The product now extends into a **Boutique ERP + CRM + Customer Portal** for Kadamba's Designer Studio (Kurnool) — bridal, maggam, designer blouses, custom women's tailoring.

### Canonical docs (keep in sync)

| File | Role |
|------|------|
| `documents/boutique_erp_prompts.md` | Master feature list + Cursor starter prompts |
| `documents/prd/00_INDEX.md` | PRD module map + implementation order |
| `documents/prd/01_Project_Overview.md` … `17_Future_Roadmap.md` | Per-module PRDs |
| `documents/prd/05_Measurement_System.md` | **Active** — measurements + ladies garment catalog |
| `documents/prompts_status.md` | PRD/dev status tracker |
| `active_chunk.md` | Current implementation brief (repo root) |
| `current_chunk.md` / `documents/current_chunk.md` | Short status mirrors |

### Module order

1. Measurement System ← **active**  
2. Product Catalog → Staff → Customers → Orders → Finance  
3. User Roles + Customer Portal → Notifications  
4. Admin Dashboard metrics → CMS/SEO/Settings polish → Reports  
5. Future roadmap (inventory, GST, attendance, etc.)

### Extend-not-rebuild rules

- Keep JWT auth, Mongo/Mongoose, Cloudinary, `{ success, message, data }` envelope  
- Extend `backend/src/{models,services,controllers,routes}` and `frontend/src/pages/admin/*`  
- Brand: women's boutique & tailoring — never interior design  
- Public site contact/address must sync from Settings (Module 14)

## Current Status Summary

**Active Development:** Boutique ERP — Module 05 Measurement System  
**Current Chunk:** `documents/current_chunk.md` + root `active_chunk.md`  
**Completed:** Website/CMS Phases 1–15  
**Next Module after Measurements:** Staff Management (09) / Product Catalog (06)  
**Project Health:** ✅ Production site foundation intact; ERP PRDs documented; measurements implementation active

**Immediate Action Items:**
1. Implement Measurement admin module per `documents/prd/05_Measurement_System.md`
2. Keep `prompts_status.md` updated as modules complete
3. Production deploy checklist still in `DEPLOYMENT.md` for the public site

This reference document enables efficient token usage by providing phase-specific guidance while maintaining comprehensive documentation for team onboarding and project continuity.