# Cities Sidebar Layout

The Cities section lives inside the single SidebarGroup, positioned between "7-Day Forecast" and "Settings". It uses a two-level collapsible pattern: the outer level toggles the entire cities list, and the inner level uses accordion behavior so only one city is expanded at a time.

## 1. Cities Collapsed (Default)

All navigation items visible in a single flat list. The Cities item shows a ChevronRight icon pointing right to indicate it can be expanded.

```
+--------------------------------------------+
| [logo] Better Weather for Life        [X]  |
+--------------------------------------------+
|                                            |
|  [Home]         Home                       |
|  [Calendar]     7-Day Forecast             |
|  [Globe]        Cities             [>]     |
|  [Settings]     Settings                   |
|  [Info]         About                      |
|                                            |
+--------------------------------------------+
| v0.1.0                                     |
+--------------------------------------------+
```

### Notes
- `[>]` is ChevronRight, rotates 90deg clockwise when open.
- Cities trigger uses a Globe icon (from lucide-react) as its left icon, distinct from MapPin used on individual cities.
- All items use `h-auto px-4 py-3` for consistent row height.

## 2. Cities Expanded, No City Selected

Clicking "Cities" opens the sub-section. City items appear indented under Cities via SidebarMenuSub. Each city shows a MapPin icon and its name. No city is expanded yet.

```
+--------------------------------------------+
| [logo] Better Weather for Life        [X]  |
+--------------------------------------------+
|                                            |
|  [Home]         Home                       |
|  [Calendar]     7-Day Forecast             |
|  [Globe]        Cities             [v]     |
|     [MapPin]  Auckland             [>]     |
|     [MapPin]  Sydney               [>]     |
|  [Settings]     Settings                   |
|  [Info]         About                      |
|                                            |
+--------------------------------------------+
| v0.1.0                                     |
+--------------------------------------------+
```

### Notes
- `[v]` is ChevronRight rotated 90deg (now pointing down).
- City items are indented via SidebarMenuSub and use default `py-3` padding.
- Cities behave as an accordion: clicking one city collapses any previously open city.

## 3. Cities Expanded, Auckland Open (Sydney Collapsed)

Clicking "Auckland" expands it to reveal sub-navigation links (Overview, 7-Day Forecast). Sydney remains collapsed. Only one city can be open at a time.

```
+--------------------------------------------+
| [logo] Better Weather for Life        [X]  |
+--------------------------------------------+
|                                            |
|  [Home]         Home                       |
|  [Calendar]     7-Day Forecast             |
|  [Globe]        Cities             [v]     |
|     [MapPin]  Auckland             [v]     |
|        Overview                            |
|        7-Day Forecast                      |
|     [MapPin]  Sydney               [>]     |
|  [Settings]     Settings                   |
|  [Info]         About                      |
|                                            |
+--------------------------------------------+
| v0.1.0                                     |
+--------------------------------------------+
```

### Notes
- Auckland shows its own `[v]` chevron to indicate expanded state.
- Sydney shows `[>]` chevron to indicate collapsed state.
- City sub-nav items (Overview, 7-Day Forecast) are further indented and use `py-3` padding.
- City sub-nav items have no icons, just text labels.

## 4. Active State: User on /auckland/forecast

The active page is highlighted. The breadcrumb of open states reflects the current route: Cities is expanded, Auckland is expanded, and "7-Day Forecast" under Auckland is active.

```
+--------------------------------------------+
| [logo] Better Weather for Life        [X]  |
+--------------------------------------------+
|                                            |
|  [Home]         Home                       |
|  [Calendar]     7-Day Forecast             |
|  [Globe]        Cities             [v]     |
|     [MapPin]  Auckland             [v]     |
|        Overview                            |
|       *7-Day Forecast*                     |
|     [MapPin]  Sydney               [>]     |
|  [Settings]     Settings                   |
|  [Info]         About                      |
|                                            |
+--------------------------------------------+
| v0.1.0                                     |
+--------------------------------------------+
```

### Active State Styling
- `*7-Day Forecast*` denotes the active item.
- Uses existing `isActive` prop on SidebarMenuButton, which applies `data-[active=true]:bg-sidebar-accent` and `data-[active=true]:text-sidebar-accent-foreground` via CVA variants.
- No additional styling needed — the theme tokens (`--sidebar-accent`, `--sidebar-accent-foreground`) handle light/dark mode automatically.

## 5. Mobile Considerations

### Drawer Behavior
- Sidebar renders as a slide-out drawer on mobile (existing behavior).
- Clicking any city sub-nav link (e.g., Auckland > Overview) closes the drawer via `toggleSidebar`.
- Collapsing/expanding Cities or individual cities does NOT close the drawer.

### Touch Targets
- All items maintain minimum 44px touch target height via `py-3`.
- City sub-nav items at `py-3` match all other menu items.

### Mobile Wireframe (320px minimum)

```
+----------------------------------+
| [logo] Better Weather       [X]  |
+----------------------------------+
|                                  |
|  [Home]      Home                |
|  [Calendar]  7-Day Forecast      |
|  [Globe]   Cities         [v]    |
|    [MapPin] Auckland      [v]    |
|       Overview                   |
|      *7-Day Forecast*            |
|    [MapPin] Sydney        [>]    |
|  [Settings]  Settings            |
|  [Info]      About               |
|                                  |
+----------------------------------+
| v0.1.0                           |
+----------------------------------+
```

### Notes
- Layout is identical to desktop; only the sidebar container changes (overlay drawer vs. persistent panel).
- The close button `[X]` is hidden on `xl:` breakpoint and above (existing behavior).

## 6. Interaction Summary

| Action                        | Result                                            |
|-------------------------------|---------------------------------------------------|
| Click "Cities" (collapsed)    | Expand cities list, show all city items           |
| Click "Cities" (expanded)     | Collapse cities list, hide all city items         |
| Click city name (collapsed)   | Expand that city, collapse any other open city    |
| Click city name (expanded)    | Collapse that city                                |
| Click city sub-nav link       | Navigate to route; close drawer on mobile         |
| Navigate to /auckland/home    | Auto-expand Cities + Auckland, highlight Overview |
| Navigate to /sydney/forecast  | Auto-expand Cities + Sydney, highlight Forecast   |
| Navigate to /home             | Collapse cities (optional, preserve last state)   |

## 7. Data Structure

```js
// Cities derived from the `locations` table (db/schema/locations.js),
// grouped by `city_slug` and filtered to `source = 'curated'`.
// Each unique city_slug maps to a slug used in routing.

const cityNavItems = [
  {
    name: 'Auckland',       // deslugified from city_slug
    slug: 'auckland',       // locations.city_slug
    subNav: [
      { titleKey: 'sidebar.nav.overview', href: '/auckland/home', icon: null },
      { titleKey: 'sidebar.nav.forecast', href: '/auckland/forecast', icon: null },
    ],
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    subNav: [
      { titleKey: 'sidebar.nav.overview', href: '/sydney/home', icon: null },
      { titleKey: 'sidebar.nav.forecast', href: '/sydney/forecast', icon: null },
    ],
  },
]
```

### Component Mapping

| Layout Element          | shadcn/ui Component                  | Props / Notes                              |
|-------------------------|--------------------------------------|--------------------------------------------|
| Outer collapse (Cities) | Collapsible + SidebarMenuItem        | `open` state, ChevronRight icon rotates    |
| Cities trigger button   | SidebarMenuButton                    | `h-auto px-4 py-3`, Globe icon             |
| City list container     | CollapsibleContent + SidebarMenuSub  | Wraps all city accordion items             |
| City accordion          | Collapsible (accordion via state)    | Only one open at a time (controlled state) |
| City item               | SidebarMenuSubItem + SidebarMenuSubButton | MapPin icon + city name               |
| City sub-nav container  | CollapsibleContent + SidebarMenuSub  | Nested sub-menu                            |
| City sub-nav link       | SidebarMenuSubItem + SidebarMenuSubButton | `py-3`, text only, `asChild` with Link |
