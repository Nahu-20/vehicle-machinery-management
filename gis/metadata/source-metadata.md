# Oromia Administrative Boundary GIS Source Metadata — Provenance & Verification (M1.5A)

## 1. Primary Authoritative Source Identification
- **Dataset Title**: `Ethiopia - Subnational Administrative Boundaries`
- **Dataset Name / Slug**: `cod-ab-eth`
- **HDX Dataset ID**: `cb58fa1f-687d-4cac-81a7-655ab1efb2d0`
- **HDX Resource ID**: `0518da1b-42d1-4624-ad64-768cb69f9d40`
- **Original Source File**: `eth_admin_boundaries.geojson.zip` -> `eth_admin2.geojson`
- **Direct Download URL**: `https://data.humdata.org/dataset/cb58fa1f-687d-4cac-81a7-655ab1efb2d0/resource/0518da1b-42d1-4624-ad64-768cb69f9d40/download/eth_admin_boundaries.geojson.zip`
- **Dataset Maintainer / Source Organizations**: `United Nations Office for the Coordination of Humanitarian Affairs (OCHA) Field Information Services (FIS)` in coordination with `Ethiopia Central Statistics Agency (CSA)` and `Regional Bureau of Finance and Economic Development (BoFED)`
- **Dataset Version**: `v04` (Valid on: `2025-01-01`, HDX update: April 17, 2026)
- **Downloaded Date**: `2026-08-12`

## 2. Dataset Classification & Provenance Distinction
- **Classification**: **Official UN-OCHA COD-AB Ethiopia Dataset (`cod-ab-eth`)**
- **Distinction from geoBoundaries**:
  - The primary dataset is downloaded directly from HDX (`cod-ab-eth` v04, 2025/2026 release).
  - The legacy `geoBoundaries-ETH-ADM2-gbHumanitarian.geojson` (build 2021) is preserved in `gis/source/legacy_geoBoundaries_gbHumanitarian_2021.geojson` for historical auditing.
  - The production candidate is derived strictly from the official `cod-ab-eth` v04 resource (`eth_admin2.geojson`).

## 3. National Dataset Version Scope
- **Admin-0 Units**: `1` (Ethiopia, `ET`)
- **Admin-1 Units**: `15` Regions / Charter Cities (`adm1_pcode`)
- **Admin-2 Units**: `107` Zones / Special Administrative Units (`adm2_pcode`)
- **Admin-3 Units**: `1,080+` Woredas (`adm3_pcode`)

## 4. Oromia Region Selection & PCODE Filtering
- **Oromia Region ADM1 PCODE**: `ET04`
- **Filtering Logic**: `feature.properties.adm1_pcode === 'ET04'`
- **Returned ADM2 Feature Count**: `22` Administrative Units (`ET0401` through `ET0422`)
- **Administrative Evolution Notes**:
  - `ET0420`: Formally designated as `Shager City` (previously `Finfine Special Zone` in 2021 builds).
  - `ET0422`: Formally designated as `East Borena` (newly established administrative zone split from Borena/Bale border regions).

## 5. PCODE & Uniqueness Verification
- **PCODE Uniqueness**: `PASS` (22 unique PCODEs, 0 duplicates).
- **Canonical `zone_id` Uniqueness**: `PASS` (22 unique string keys, 0 collisions).
- **Mapping Consistency**: 1 PCODE maps to exactly 1 `zone_id` (1:1 bijection).

## 6. Multilingual Name Provenance
- **English Names (`name_en`)**: Source-provided directly from UN-OCHA CSA dataset (`adm2_name`).
- **Afaan Oromo Names (`name_om`)**: Mapped using official Oromia Regional Government spelling conventions. Verification status: `pending_bureau_signoff`.
- **Amharic Names (`name_am`)**: Mapped using official Federal Ethiopian spelling conventions. Verification status: `pending_bureau_signoff`.

## 7. Administrative Reality Caveat
> **Formal Administrative Caveat:**
> "Candidate administrative boundary dataset derived from UN-OCHA FIS / Ethiopia CSA COD-AB (v04, 2025), pending formal Oromia Planning & Development Commission / Bureau GIS acceptance. Administrative boundaries and names shown do not imply official endorsement or legal recognition."

## 8. Map Attribution & Disclaimer (For M2 Map Lab)
- **Attribution Text**: `Base Boundaries: UN-OCHA FIS / Ethiopia CSA COD-AB (v04, 2025) via HDX`
- **Lab Disclaimer**: `Candidate GIS Dataset — For Technical Laboratory & Planning Evaluation Only`

## 9. License Verification
- **License Title**: `Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO)`
- **License ID**: `cc-by-igo`
- **Attribution Requirement**: Mandatory attribution to UN-OCHA FIS and Ethiopia CSA.

## 10. Immutable Checksum Chain (SHA-256)
1. **Downloaded Archive** (`gis/source/eth_admin_boundaries.geojson.zip`):  
   `62db6c6ef2bb205b430e5ae3406fb8f94b30ac77106db1aec5a1ad5e81244e7a`
2. **Extracted Source ADM2** (`gis/source/eth_admin2_cod_ab_v04.geojson`):  
   `a9e8f4d2265e7222666a0672040a1c9fea78f8144e1e62ea25e6e09aa3271ff4`
3. **High-Resolution Source GIS Baseline (82,590 coordinate tuples / 7,782,230 bytes)**:  
   `edfe7b6427c70d3b17250b9d9adf35a218dc9697b47a43599e4d8f86719a2088`
4. **Web-Optimized Derivative GIS Asset (16,527 coordinate tuples / 322,055 bytes)**:  
   `2fd8286a9608b4b2db04029f51eae3eeeafcea890e06ea2469670102acd4e6f0`
   - Files: `gis/processed/oromia-zones-candidate.geojson`, `public/data/gis/oromia-zones-candidate.geojson`, `dist/data/gis/oromia-zones-candidate.geojson`, `src/features/investment-map/data/embeddedOromiaGeoJson.ts`
5. **Legacy 2021 File** (`gis/source/legacy_geoBoundaries_gbHumanitarian_2021.geojson`):  
   `b7fe415893dcc4e9e42be28abb5c9a333ae4909515bdf8f00532189483d4a230`

## 11. Milestone M4R-A & P4A-2A GIS Architecture Reconciliation Record
- **highResolutionSourceChecksum**: `edfe7b6427c70d3b17250b9d9adf35a218dc9697b47a43599e4d8f86719a2088`
- **highResolutionTupleCount**: 82,590 tuples (82,565 unique vertices)
- **highResolutionByteSize**: 7,782,230 bytes
- **webOptimizedCandidateChecksum**: `2fd8286a9608b4b2db04029f51eae3eeeafcea890e06ea2469670102acd4e6f0`
- **webOptimizedTupleCount**: 16,527 tuples
- **webOptimizedByteSize**: 322,055 bytes
- **simplificationMethod**: 5-decimal coordinate quantization (~1.1 meter ground precision) + Douglas-Peucker point filtering with strict topology preservation
- **geometryInventory**: 22 Features (21 Polygon, 1 MultiPolygon `west_wellega`, 23 parts, 25 rings including 2 interior enclave hole rings for Harar and Addis Ababa)
- **relationship**: Web-optimized derivative is a client-side delivery artifact derived directly from the high-resolution source with 100% topological integrity, 0 unintended overlaps, 0 feature loss, and 100% zone adjacency preservation.
- **sourceArchiveChecksum**: `62db6c6ef2bb205b430e5ae3406fb8f94b30ac77106db1aec5a1ad5e81244e7a`
- **sourceADM2Checksum**: `a9e8f4d2265e7222666a0672040a1c9fea78f8144e1e62ea25e6e09aa3271ff4`

