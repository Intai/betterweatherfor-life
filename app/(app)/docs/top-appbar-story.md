As a user, I want a responsive top appbar that adapts to the current page and screen size — showing the app logo with a hamburger menu on /home (mobile/tablet), a back button with page title on /forecast (mobile/tablet), and just the page title on desktop — so that I always have clear navigation context.

## Requirements

- On mobile and tablet for /home, the top appbar is sticky and shows the app logo (sun icon), the app name "Better Weather for", and a hamburger menu button (right-aligned) that opens the sidebar drawer.
- On mobile and tablet for /forecast, the top appbar is sticky and shows a back button (left-aligned) that navigates to /home, and the page title "7-Day Forecast".
- On desktop for all pages, the top appbar is sticky in the main content area (next to the persistent sidebar) and shows only the current page title (e.g. "Home", "7-Day Forecast").
- The top appbar uses the primary gradient background (from-primary to-primary-light) with white text and shadow across all breakpoints.
- The top appbar applies to both the /home and /forecast routes via the shared (app) layout group.
- The page title on desktop is derived from the current route's navigation item label using i18n translations.
- The hamburger menu button reuses the existing SidebarTrigger from shadcn/ui.
- The app logo reuses the existing AppLogo component.
- The back button uses the Lucide ArrowLeft icon.

## Tasks

**Parallel tasks 1-3:**

1. Use frontend-developer subagent to create top appbar component @app/components/top-appbar.js. Build a responsive header component that renders different content per breakpoint and route:
  1. mobile/tablet on /home — sticky header with AppLogo, app name from `t('sidebar.appName')`, and SidebarTrigger hamburger button aligned right, hidden at md breakpoint (`md:hidden`);
  2. mobile/tablet on /forecast — sticky header with ArrowLeft back button (navigates to /home) and "7-Day Forecast" page title, hidden at md breakpoint (`md:hidden`);
  3. desktop on all pages — sticky header showing only the page title derived from the current pathname mapped to the nav item's i18n key, hidden below md breakpoint (`hidden md:flex`).

  All variants use `bg-linear-to-r from-primary to-primary-light text-white shadow-lg`. Reuse @app/components/app-logo.js for the logo. Reference @app/docs/home-ui-design.html line 162 (mobile header), line 743 (tablet header), and line 1622 (desktop header). Reference @app/docs/7-day-forecast-layout.md line 164 for forecast header spec.
2. Use frontend-developer subagent to add top appbar i18n translations @app/locales/en/translation.json. Add a `topAppbar` section with `openMenu` for hamburger button aria-label and `back` for back button aria-label. The page title on desktop reuses existing `sidebar.nav.*` translation keys.
3. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/top-appbar.feature.

**Sequential task 4 after task 1 completes:**

4. Use frontend-developer subagent to update app layout to use TopAppbar @app/(app)/layout.js. Replace the current inline `<header>` element (lines 9-11) with the new TopAppbar component. Keep SidebarProvider, AppSidebar, SidebarInset, and main structure unchanged.
