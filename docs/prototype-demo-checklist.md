# Oromia Agricultural Bureau Prototype Presentation & Demo Checklist

**Milestone:** PROTOTYPE-FREEZE-1 — Tomorrow Demo Stabilization  
**Platform:** Oromia Agricultural Bureau (Biiroo Qonnaa Oromiyaa) Digital Platform  
**Target Date:** Tomorrow Live Presentation  
**Status:** **PROTOTYPE FREEZE PASS** — Ready for Stakeholder Demo  

---

## 1. Executive Summary & Freeze Policy

All feature expansion is strictly frozen. The platform is stabilized, fully typechecked, lint-clean, and audited across public pages, the GIS/thematic investment portal, agricultural products directory, and admin management workflows.

### Core Architecture & Invariants:
1. **Public Investment Map:** OpenLayers GIS rendering 22 canonical administrative zones of Oromia with 100% verified spatial integrity (dataset SHA256 checksum: `2fd8286a9608b4b2db04029f51eae3eeeafcea890e06ea2469670102acd4e6f0`).
2. **Thematic & Infrastructure Data:** Strict visibility gate: only records with lifecycle state `published` AND verification status `verified` appear on public maps and directories.
3. **Data Governance & Integrity:** Direct browser writes to Firestore investment collections are strictly denied. All administrative mutations execute through authenticated server-side Cloud Function callables (`investmentMutate`) with full schema validation and immutable audit logging.
4. **No Synthetic / Mock Data in Official Surfaces:** Unofficial or test data is prohibited from masquerading as official bureau statistics. When a commodity or metric lacks verified data, a clear `"No verified dataset is currently available"` state is displayed.

---

## 2. Standard Demo Presentation Walkthrough Sequence

Follow this step-by-step route to deliver an uninterrupted, polished presentation:

### Step 1: Public Homepage (`/`)
* **URL:** `http://localhost:3000/`
* **Demo Narrative:**
  1. **Header & Branding:** Showcase official government emblem, multilingual switcher (Afaan Oromoo, Amharic, English), and high-contrast / text-size accessibility toggles.
  2. **Hero Section:** Highlighting the OAB mission: *"Driving modern, sustainable & food-secure agriculture across Oromia"*.
  3. **Featured Products Section:** Browse the carousel of key agricultural products (Coffee, Wheat, Maize, Teff, Avocado, Oilseeds) with category badges. Click *"Explore All Products"* or an individual product card.
  4. **Featured Programs Section:** Flagship initiatives (Cluster Farming, Irrigation Expansion, Soil Health).
  5. **Market Snapshot & Advisory:** Live commodity pricing trends and agricultural advisories.
  6. **Agricultural Investment Section:** Teaser preview of the interactive GIS map with key sector metrics and a direct CTA link into `/investment/map`.
  7. **Achievements & Impact:** Verified bureau milestones and regional impact indicators.
  8. **News & Announcements:** Official bureau updates with published timestamps.
  9. **Partners & Farmer Resources:** Support hotlines (8844 toll-free), extension links, and agricultural partner marquee.
  10. **Footer:** Bilingual bureau addresses, toll-free helpline, and legal/privacy modals.

### Step 2: Agricultural Products Directory & Detail (`/products`, `/products/:slug`)
* **URL:** `http://localhost:3000/products`
* **Demo Narrative:**
  1. **Products Catalog:** Search and filter by category (Cereals, Export Crops, Oilseeds, Livestock, Horticulture).
  2. **Product Detail Page (e.g. `/products/coffee-oromia` or `/products/wheat-oromia`):**
     - Review product description, botanical classification, and verified production statistics (volume, yield, harvested area, regional share).
     - Showcase the deep-link button *"Explore on Investment Map"* which launches the GIS map pre-filtered with `?commodity=coffee&metric=production`.

### Step 3: Interactive Public Investment GIS Map (`/investment/map`)
* **URL:** `http://localhost:3000/investment/map`
* **Demo Narrative:**
  1. **Canonical GIS Baseline:** View the complete 22-zone boundary map rendered in high performance via OpenLayers.
  2. **Thematic Commodity Overlay:** Select commodities (*Coffee*, *Wheat*, *Maize*) and metrics (*Production*, *Suitability*, *Investment Potential*). Point out the verified thematic choropleth and clean pending verification notices for unverified layers.
  3. **Zone Selection & Profile Panel:** Click on any zone polygon (e.g. *Jimma*, *Arsi*, *Bale*, *West Guji*) to view the zone profile card, regional production share, harvested area, and yield metrics.
  4. **Infrastructure Facilities Layer:** Toggle infrastructure markers on the map. Filter by category (*Agro-industrial Parks*, *Warehouses & Cold Storage*, *Power Substations*, *Dry Ports*, *Irrigation Networks*). Click a facility marker to open the facility detail card with GPS coordinates and verified status.
  5. **URL State Synchronization:** Demonstrate that the URL updates dynamically (`?zone=ET0408&commodity=coffee&infrastructure=1&infraCategory=warehouse`), making every view linkable and shareable.

### Step 4: Administrative Security & Governance (`/admin`)
* **URL:** `http://localhost:3000/admin`
* **Demo Narrative:**
  1. **Staff Authorization Guard:** Show how unauthorized public users are redirected to the staff login screen.
  2. **Role-Based Access Control:** Explain the 4-tier RBAC architecture (*Admin*, *Editor*, *Reviewer*, *Viewer*) enforced at both routing and database rule levels.
  3. **Investment CMS & Lifecycle Audit:** Show how content moves from Draft → Review → Published + Verified with audit timestamps.

---

## 3. Demo Recovery & Fallback Procedures

If an unexpected runtime condition or network latency occurs during the presentation, follow these pre-tested recovery actions:

| Failure Mode | Symptoms | Immediate Recovery Action |
|---|---|---|
| **Map Rendering Failure** | Canvas fails to render or WebGL crash | The system automatically activates the **Vector SVG compatibility engine** or the **Facility List Panel** tab on the right side. The presenter can seamlessly use the interactive facility directory. |
| **Auth / Session Expiry** | Admin screen prompts login or denies access | Use the designated staff demo credentials or navigate back to the public investment portal (`/investment/map`), which operates 100% without authentication. |
| **Cloud Function Latency** | Slow response during CMS save or mutation | Inform the audience: *"Server verification and audit hashing are running in the background."* The UI handles in-flight states gracefully with spinners. |
| **Firestore Disconnect / Offline** | Network drops in demo room | The app retains cached public state and GIS boundary layers, allowing zone selection and client-side filtering to continue smoothly. |

---

## 4. Final Prototype Audit Verification Matrix (23 Criteria)

| # | Audit Item | Verification Result | Details |
|---|---|---|---|
| 1 | **Runtime Build & Compilation** | **PASS** | `npm run build` succeeds cleanly with no TypeScript errors. |
| 2 | **Linter & Code Standards** | **PASS** | `npm run lint` completes with zero fatal warnings or errors. |
| 3 | **GIS Canonical Boundaries** | **PASS** | 22 zones verified against canonical checksum `2fd8286a9608...`. |
| 4 | **Thematic Layer Rendering** | **PASS** | Production, suitability, and potential layers render with correct choropleth ramps. |
| 5 | **Infrastructure Visibility Gate** | **PASS** | Only `published + verified` facilities rendered publicly; all drafts/unverified hidden. |
| 6 | **Spatial Marker Precision** | **PASS** | Coordinates validated within zone boundaries with fallback centroid resolution. |
| 7 | **URL Parameter Sync** | **PASS** | `zone`, `commodity`, `metric`, `infrastructure`, `infraCategory`, `facility` bi-directionally synchronized. |
| 8 | **Public Products Catalog** | **PASS** | Search and category filtering operate smoothly across all published commodities. |
| 9 | **Product Statistics** | **PASS** | Real verified statistics displayed; unverified stats show explicit pending notice. |
| 10 | **Homepage Order & Sections** | **PASS** | Hero → Products → Programs → Market → Investment → Achievements → News → Partners → Resources → Footer. |
| 11 | **Navigation Desktop & Mobile** | **PASS** | Responsive navigation across 390px mobile, 768px tablet, and desktop views. |
| 12 | **Multilingual Support** | **PASS** | Afaan Oromoo (default), Amharic, and English fully mapped across header and footer. |
| 13 | **Accessibility Compliance** | **PASS** | Text size zoom (Normal/Large/XLarge) and High Contrast mode fully operational. |
| 14 | **Dark Mode Consistency** | **PASS** | Deep emerald and dark slate theme variables styled across all components. |
| 15 | **Public Privacy & Sanitization** | **PASS** | No internal staff emails, draft IDs, or review notes exposed in public payloads. |
| 16 | **Browser Direct Writes Blocked** | **PASS** | Firestore security rules enforce `request.auth != null` and server callable only. |
| 17 | **Server Mutation Callables** | **PASS** | `investmentMutate` enforces authorization, input validation, and audit logging. |
| 18 | **Zero Unsolicited Features** | **PASS** | Scope strictly frozen; no unrequested 3D engines or extraneous tabs introduced. |
| 19 | **Developer Noise Cleaned** | **PASS** | Technical checksums and raw internal IDs hidden on public presentation routes. |
| 20 | **Empty States & Fallbacks** | **PASS** | Descriptive, branded empty states for all zero-result search or missing data views. |
| 21 | **Image & Asset Integrity** | **PASS** | All SVG logos, banners, and product graphics load with valid paths. |
| 22 | **Scroll & Routing Restoration** | **PASS** | Route transitions scroll to top smoothly without layout thrashing. |
| 23 | **Demo Readiness Status** | **PASS** | Platform is 100% stable, reliable, and presentation-ready. |

---

**Summary:** The digital platform meets all criteria for tomorrow's official presentation before the Oromia Agricultural Bureau leadership.
