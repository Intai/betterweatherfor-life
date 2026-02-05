# App Folder Structure

## Overview

Set up the Next.js app folder structure with route groups for SEO-optimized marketing pages and client-side app pages.

## Requirements

- `sitemap.js` - Dynamic sitemap with all pre-defined cities and locations
- `robots.js` - Allow city routes, block app routes (`/home`, `/forecast`, `/location/`)
- `manifest.js` - PWA manifest for app installability
- `(marketing)/` - Server-side rendered pages for SEO
  - Marketing landing page at `/`
  - Static pages (`/about`, `/privacy`)
  - City-scoped routes for pre-defined locations:
    | Route Pattern | Example | Purpose |
    |---------------|---------|---------|
    | `/[city]/home` | `/sydney/home` | Ranked locations for city |
    | `/[city]/forecast` | `/sydney/forecast` | 7-day forecast for city |
    | `/[city]/location/[geolocation]` | `/sydney/location/-33.89,151.27` | Location detail |
- `(app)/` - Client-side rendered pages for the app
  - App shell layout with navigation
  - User-facing app routes:
    | Route | Purpose |
    |-------|---------|
    | `/home` | User's saved locations from Dexie (in the future stories) |
    | `/forecast` | User's 7-day forecast view |
    | `/location/[geolocation]` | Location detail (geolocation format: `lat,lng`) |
- All files are empty for now.

## Tasks

**Parallel tasks 1-4:**

1. Use frontend-developer agent to create base app structure:
   ```
   app/
   ├── layout.js   # Root layout with global metadata
   ├── sitemap.js  # Generates entries for marketing routes
   ├── robots.js   # Blocks `/home`, `/forecast`, `/location/` routes
   ├── manifest.js
   └── opengraph-image.png
   ```
2. Use frontend-developer agent to create marketing route group:
   ```
   app/(marketing)/
   ├── page.js              # Landing page (/)
   ├── about/
   │   └── page.js          # /about
   ├── privacy/
   │   └── page.js          # /privacy
   └── [city]/
       ├── home/
       │   └── page.js      # /[city]/home
       ├── forecast/
       │   └── page.js      # /[city]/forecast
       └── location/
           └── [geolocation]/
               └── page.js  # /[city]/location/[geolocation]
   ```
3. Use frontend-developer agent to create app route group:
   ```
   app/(app)/
   ├── layout.js        # App shell layout
   ├── home/
   │   └── page.js      # /home
   ├── forecast/
   │   └── page.js      # /forecast
   └── location/
       └── [geolocation]/
           └── page.js  # /location/[geolocation]
   ```
4. Use qa-tester agent to plan test scenarios in @app/docs/app-folder-structure.feature.
