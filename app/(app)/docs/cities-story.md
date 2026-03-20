As a user, I want to see cities listed in the sidebar so that I can quickly navigate to city-specific overview and forecast pages.

## Requirements

- Display a "Cities" collapsible menu item between "7-Day Forecast" and "Settings" in the sidebar, using a Globe icon and a ChevronRight that rotates 90deg when expanded.
- When Cities is expanded, show city items indented via SidebarMenuSub, each with a MapPin icon, city name, and a ChevronRight chevron.
- Cities behave as an accordion: only one city can be expanded at a time, revealing sub-nav links (Overview, 7-Day Forecast) with no icons.
- Highlight the active sub-nav link using the existing isActive prop on SidebarMenuSubButton.
- Auto-expand Cities and the matching city when the current route is a city route (e.g. /auckland/forecast expands Cities + Auckland and highlights 7-Day Forecast).
- Clicking a city sub-nav link navigates to the route and closes the sidebar drawer on mobile.
- Expanding/collapsing Cities or individual cities does NOT close the mobile drawer.
- All items maintain minimum 44px touch target height via py-3.
- City data is derived from the locations table, grouped by distinct city_slug where source = 'curated', with names deslugified from city_slug.

## Tasks

**Parallel tasks 1-5:**

1. Use backend-developer subagent to add a `getCitySlugs` query that returns distinct city slugs from the locations table filtered by source = 'curated' @db/queries/locations.js. Return an array of city_slug strings sorted alphabetically.
2. Use frontend-developer subagent to create a cities Zustand store @app/(app)/stores/cities-store.js following the pattern in @app/(app)/stores/forecast-store.js. Define a `createCitiesStore(initialState)` factory with `{ citySlugs: [] }` base state. Export `CitiesStoreProvider({ children, initialState })` using `createContext` and `useState(() => createCitiesStore(initialState))`. Export `useCitiesStore(selector)` hook with context null-guard.
3. Use frontend-developer subagent to install the shadcn/ui Collapsible component @shadcn/components/ui/collapsible.jsx. Run the shadcn CLI to add the collapsible primitive.
4. Use frontend-developer subagent to add i18n keys for cities navigation @app/locales/en/translation.json. Add `sidebar.nav.cities` ("Cities") and `sidebar.nav.overview` ("Overview") under the existing sidebar.nav namespace.
5. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/cities.feature.

**Parallel after tasks 1-3 complete:**

6. Use frontend-developer subagent to create an AppSidebarCity component @app/components/app-sidebar-city.jsx that renders a single city's collapsible accordion item with MapPin icon, city name (via `deslugify` from @app/utils/string.js), ChevronRight, and sub-nav links (Overview → /{slug}/home, 7-Day Forecast → /{slug}/forecast). Accept city slug, isOpen, and onToggle as props. Use `usePathname()` from `next/navigation` for the current route. Use SidebarMenuSubItem, SidebarMenuSubButton with asChild wrapping Link. Highlight active sub-nav via isActive. Close mobile drawer on sub-nav link click via toggleSidebar. Keep styling consistent with existing @app/components/app-sidebar.jsx (e.g. h-auto px-4 py-3 on SidebarMenuButton, asChild pattern). Reference layout spec @app/docs/cities-layout.md and UI design @app/docs/cities-ui-design.html.
7. Use frontend-developer subagent to add CitiesStoreProvider to the app layout @app/(app)/layout.jsx. Fetch city slugs server-side using `getCitySlugs` from @db/queries/locations.js and pass `{ citySlugs }` as initialState. Wrap children with CitiesStoreProvider inside the existing SidebarProvider.

**Sequential task 8 after task 6 completes:**

8. Use frontend-developer subagent to create an AppSidebarCities component @app/components/app-sidebar-cities.jsx that renders the outer Collapsible for the Cities section and maps over city slugs to render AppSidebarCity items. Use `usePathname()` from `next/navigation` for the current route. Read `citySlugs` from `useCitiesStore`. Use `deslugify` from @app/utils/string.js to convert city slugs to display names. Use Globe icon, ChevronRight with rotation, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub. Manage accordion state with a local `openCitySlug` state (initialized from pathname on mount). Pass `isOpen={openCitySlug === slug}` and `onToggle={() => setOpenCitySlug(prev => prev === slug ? null : slug)}` to each AppSidebarCity. Auto-expand when pathname matches a city route. Keep styling consistent with existing @app/components/app-sidebar.jsx (e.g. h-auto px-4 py-3 on SidebarMenuButton, asChild pattern). Reference layout spec @app/docs/cities-layout.md and UI design @app/docs/cities-ui-design.html.

**Sequential task 9 after task 8 completes:**

9. Use frontend-developer subagent to integrate AppSidebarCities into the sidebar @app/components/app-sidebar.jsx. Split navItems into items before Cities (Home, 7-Day Forecast) and after Cities (Settings, About), rendering AppSidebarCities between them. No server-side data fetching needed in app-sidebar — cities come from the store. Keep app-sidebar.jsx lean by delegating cities logic to the new components.
