# Milestone 2.2A — News CMS Implementation Specification

## Overview

Milestone 2.2A delivers the first complete CMS module for the Oromia Agricultural Bureau platform: **Firestore-backed News & Press Releases Management**.

This module empowers staff members across the Bureau to draft, review, edit, preview, publish, unpublish, and archive official agricultural news bulletins across Afaan Oromo, Amharic, and English.

---

## 1. Architecture & Security Model

### Collections
- **Primary Collection**: `newsArticles/{newsSlug}`
- **Document ID**: Unique, URL-safe slug (e.g. `oromia-wheat-initiative-2026`).

### Security Rules (`firestore.rules`)
- **Public Read Access**: Unauthenticated visitors can only read articles where `status == 'published'`.
- **Staff Access**: Active staff users (`staffUsers/{uid}.active == true`) can query and list all status states (`draft`, `review`, `published`, `unpublished`, `archived`).
- **Creation (`content.create`)**: Allowed for `editor`, `contentAdmin`, and `superAdmin`.
- **Editing (`content.edit`)**: Allowed for `editor`, `contentAdmin`, and `superAdmin`.
- **Publishing & Unpublishing (`content.publish`)**: Restricted to `contentAdmin` and `superAdmin`. Editors cannot transition articles to `published`.

---

## 2. Multilingual Data Structure & Validation

### Field Breakdown
- `slug` (string, required): Lowercase, hyphen-separated unique identifier.
- `title` (`LocalizedText`, required): `om` required for publishing.
- `excerpt` (`LocalizedText`, required): `om` required for publishing.
- `content` (`NewsContentBlock[]`, required): Structured block array supporting:
  - `paragraph` (localized text)
  - `heading` (level 2 or 3, localized text)
  - `quote` (localized text + optional source)
  - `list` (ordered boolean + localized items array)
  - `highlight` (localized callout text)
- `category` (`news` | `training` | `event` | `tender` | `announcement`)
- `status` (`draft` | `review` | `published` | `unpublished` | `archived`)
- `featuredImage` (string, URL)
- `responsibleOffice` (`LocalizedText`)
- `authorName` (`LocalizedText`)
- `version` (number, auto-incremented on edit)

---

## 3. UI & Workflow Features

1. **News Directory (`/admin/news`)**: Real-time Firestore subscription with status filtering, category filtering, search, and action controls.
2. **Editor Form (`/admin/news/new` & `/admin/news/:slug/edit`)**: Multilingual inputs with Afaan Oromo, Amharic, and English tabs, auto-slug generation, content block builder, and unsaved changes warning.
3. **Draft Preview (`/admin/news/:slug/preview`)**: Full-screen staff preview mode with language testing toolbar.
4. **Public Integration (`/news` & `/news/:slug`)**: Fetches published articles from `newsService` with support for `VITE_PUBLIC_NEWS_SOURCE=mock` in development.

---

## 4. Test Verification Checklist

- [x] Create news draft in Afaan Oromo, Amharic, and English.
- [x] Edit existing draft and verify version incrementing (`v1` -> `v2`).
- [x] Verify status transitions (`draft` -> `review` -> `published` -> `unpublished` -> `archived`).
- [x] Validate permission enforcement (Editor cannot publish without `content.publish` permission).
- [x] Verify public website displays only `published` articles.
- [x] Verify Firestore rules block public access to `draft` and `archived` articles.
