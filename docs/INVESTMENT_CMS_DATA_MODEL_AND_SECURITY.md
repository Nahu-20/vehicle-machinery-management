# Agricultural Investment CMS — Data Model, Security Foundation & Architecture (Milestone A1)

## Executive Overview
Milestone A1 transitions the Oromia Agricultural Bureau (OAB) digital portal from synthetic thematic map prototypes (M6A) to a secure, enterprise-grade, managed **Agricultural Investment CMS Foundation**.

This architecture decouples heavy GIS geometry assets from fast-moving editorial and statistical domain records while ensuring that all investment statistics, zone profiles, and opportunity listings are strictly verified, source-attributed, and protected by role-based access controls (RBAC) before public display.

---

## 1. Domain Separation Architecture

To avoid monolithic documents and maintain clean separation of concerns, eight distinct collection domains are established:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GIS GEOGRAPHY (FROZEN)                           │
│  - Controlled ADM2 Boundary Geometry Assets (22 Zones)                     │
│  - Web Mercator EPSG:3857 & WGS84 GeoJSON / Vector Tiles                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         Canonical Join Key: zone_id (string)
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│  ZONE EDITORIAL PROFILES│ │  AGRICULTURAL DATASETS  │ │  INVESTMENT OPPORTUNITIES│
│  investmentZoneProfiles │ │   investmentDatasets    │ │ investmentOpportunities │
└─────────────────────────┘ └──────────┬──────────────┘ └─────────────────────────┘
                                       │
                                Subcollection: /values/{zoneId}
                                       │
                                       ▼
                            ┌─────────────────────────┐
                            │    DATA SOURCES & CIT.  │
                            │    investmentSources    │
                            └─────────────────────────┘
```

### Domain Mapping & Collections

| Domain Domain | Collection Path | Key / ID Format | Scope & Purpose |
|---|---|---|---|
| **GIS Geography** | Static Asset / GeoJSON Asset | `zone_id` (e.g., `jimma`, `arsi`) | Spatial geometry and boundaries. **Never stored in normal CMS documents.** |
| **Zone Editorial Profiles** | `/investmentZoneProfiles/{zoneId}` | `zone_id` | Slow-changing zone descriptions, responsible offices, featured commodities. |
| **Agricultural Datasets** | `/investmentDatasets/{datasetId}` | `datasetId` | Statistical metadata, metric, unit, reference period, publication status. |
| **Dataset Zone Values** | `/investmentDatasets/{datasetId}/values/{zoneId}` | `zone_id` | Harvested area, volume, yield, suitability scores per zone. |
| **Data Sources** | `/investmentSources/{sourceId}` | `sourceId` | Official provenance, publisher, verification status. |
| **Methodologies** | `/investmentMethodologies/{methodologyId}` | `methodologyId` | Calculation formulas for suitability & investment potential models. |
| **Investment Opportunities** | `/investmentOpportunities/{opportunityId}` | `opportunityId` | Verified pipeline projects, land availability, sector tags. |
| **Infrastructure Assets** | `/investmentInfrastructure/{recordId}` | `recordId` | Infrastructure availability (roads, power, cold storage). |
| **Public Map Config** | `/investmentMapConfig/default` | `default` | Pointers to active published datasets for the public map portal. |
| **Audit Logs** | `/investmentAuditLogs/{logId}` | `logId` | Immutable audit trail for administrative mutations. |

---

## 2. Canonical Join Key Specification

All investment information linked to geography **MUST** use the canonical frozen ADM2 `zone_id` identifier.
- **Allowed Canonical Zone IDs (22)**:
  `west_wellega`, `east_wellega`, `ilu_aba_bora`, `jimma`, `west_shewa`, `north_shewa`, `east_shewa`, `arsi`, `west_hararghe`, `east_hararghe`, `bale`, `borena`, `south_west_shewa`, `guji`, `west_guji`, `buno_bedele`, `west_arsi`, `kelem_wellega`, `horo_gudru_wellega`, `shager_city`, `east_bale`, `east_borena`

- **Rules**:
  1. Never join by display names (e.g., "Jimma Zone", "Dhiha Walaggaa").
  2. Display names are localization strings only.
  3. Security rules reject records where `zoneId` is not in the canonical list.

---

## 3. Authorization Matrix & Security Boundaries

Firestore Security Rules (`firestore.rules`) enforce role-based access control (RBAC).

| Permission String | superAdmin | contentAdmin | editor | marketOfficer | advisoryOfficer |
|---|:---:|:---:|:---:|:---:|:---:|
| `investment.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `investment.edit` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `investment.publish` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `investment.datasets.manage` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `investment.sources.manage` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `investment.opportunities.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `investment.config.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `gis.manage` | ✅ | ❌ | ❌ | ❌ | ❌ |

### Key Rule Restrictions
1. **Anonymous Write Denial**: Unauthenticated users cannot create, update, or delete any record in any investment collection.
2. **Active Staff Enforcement**: Users must be active (`active == true`) in `staffUsers` collection.
3. **Audit Log Immutability**: `investmentAuditLogs` allows `create` by active staff, but `update` and `delete` are strictly `false`.
4. **GIS Geometry Boundary**: Browser code cannot write GIS geometry. `gis.manage` is restricted strictly to `superAdmin`.

---

## 4. Lifecycle & Verification Rules

Every mutable CMS entity separates **Publication Lifecycle** from **Verification Status**:

### Lifecycle Statuses
- `draft`: Initial draft created by editors or officers.
- `review`: Submitted for administrative verification and review.
- `published`: Visible to public clients via public DTOs.
- `unpublished`: Temporarily hidden from public clients.
- `archived`: Preserved historical record, excluded from default queries.

### Verification Statuses
- `unverified`: Default state for unvetted user entries.
- `pending`: Pending bureau review.
- `verified`: Formally verified by authorized Content Admin / SuperAdmin.
- `rejected`: Rejected during review with recorded reasons.

### Publication Mandates
- **Source Citation Requirement**: A dataset **CANNOT** be set to `published` unless `sourceIds.length >= 1`.
- **Methodology Requirement**: A `suitability` or `investmentPotential` dataset **CANNOT** be published without a linked, verified `methodologyId`.
- **Score Limits**: Suitability and Investment Potential scores **MUST** be bounded between `0` and `100`.
- **Volume Non-Negativity**: Production volume, harvested area, and yield values **MUST** be non-negative (`>= 0`). Value `0` is accepted (e.g. zero harvest). Negative values are rejected.

---

## 5. Optimistic Concurrency Control (OCC)

To prevent lost updates in multi-user government editorial workflows:
1. Every mutable CMS document includes a numeric `version` field (starts at `1`).
2. Update operations require passing `expectedVersion`.
3. If `currentVersion != expectedVersion`, update fails with a `VersionConflict` error.
4. On successful update, `version` is incremented to `existing.version + 1`.

---

## 6. Public DTO Transformation Architecture

Public frontend consumers **NEVER** receive raw CMS internal documents. All public requests use `publicInvestmentService` which transforms entities into sanitized DTOs (`PublicInvestmentZoneProfile`, `PublicInvestmentDataset`, etc.):

- Strips internal administrative metadata (`createdBy`, `updatedBy`, `internalNotes`, `auditLogs`).
- Converts internal status flags into a single public status.
- Dynamically derives `regionalRank` and `regionalSharePercent` across all 22 zones for public map rendering.
- Returns `null` if the entity is not `published` and `verified`.

---

## 7. Public Map Prototype Isolation (M6A Continuity)

As mandated by Milestone M6A/A1 guidelines:
- The public thematic map renderer (`/investment/map-lab`) continues using isolated, labeled demo fixtures (`DEMO DATA — NOT OFFICIAL OAB DATA`).
- The public map will **NOT** be connected to Firestore until CMS dataset population and verification passes are completed in subsequent milestones.
