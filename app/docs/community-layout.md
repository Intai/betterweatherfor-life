# Sidebar Community Links Layout

Community and support links positioned at the bottom of the sidebar content area, above the version footer. These links are positioned at the bottom of the sidebar content area.

## Desktop Sidebar (w-72)

### Current Structure with Community Links

```
+--------------------------------------------+
| [logo] Better Weather for Life        [X]  |
+--------------------------------------------+
|                                            |
|  [Home]         Home                       |
|  [Calendar]     7-Day Forecast             |
|  [Globe]        Cities             [>]     |
|                                            |
|                                            |
|                                            |
|  [Kofi]         Buy me a coffee            |
|  [Discord]      Join our Discord           |
+--------------------------------------------+
| v0.1.0                                     |
+--------------------------------------------+
```

### Notes
- Community links live in a separate SidebarGroup with `mt-auto` to push them to the bottom of the scrollable SidebarContent area.
- They sit above the `SidebarFooter` which contains only the version text and the border-t separator.
- Icons use official Ko-fi and Discord SVG logos (not lucide icons). No explicit size class needed — `SidebarMenuButton` applies `[&>svg]:size-4` automatically, matching all other sidebar icons.
- Links open in new tabs (`target="_blank" rel="noopener noreferrer"`).

## Mobile Drawer (320px minimum)

```
+----------------------------------+
| [logo] Better Weather       [X]  |
+----------------------------------+
|                                  |
|  [Home]      Home                |
|  [Calendar]  7-Day Forecast      |
|  [Globe]     Cities        [>]   |
|                                  |
|                                  |
|                                  |
|  [Kofi]     Buy me a coffee      |
|  [Discord]  Join our Discord     |
+----------------------------------+
| v0.1.0                           |
+----------------------------------+
```

### Notes
- Layout is identical to desktop; only the sidebar container changes (overlay drawer vs. persistent panel).
- Tapping either link opens the URL in a new tab. Does NOT close the drawer (external link, not in-app navigation).
- Touch targets maintain minimum 44px height via `py-3`.

## Component Mapping

| Layout Element       | shadcn/ui Component                  | Props / Notes                                    |
|----------------------|--------------------------------------|--------------------------------------------------|
| Links container      | SidebarGroup                         | `mt-auto` to push to bottom of SidebarContent    |
| Links list           | SidebarGroupContent + SidebarMenu    | Standard menu wrapper                            |
| Link item            | SidebarMenuItem + SidebarMenuButton  | `asChild` wrapping `<a>`                         |
| Ko-fi icon           | KofiLogo (custom SVG component)      | Sized by SidebarMenuButton (`size-4`), follows app-logo.jsx pattern |
| Discord icon         | DiscordLogo (custom SVG component)   | Sized by SidebarMenuButton (`size-4`), follows app-logo.jsx pattern |

## Interaction Summary

| Action                     | Result                                           |
|----------------------------|--------------------------------------------------|
| Click "Buy me a coffee"    | Opens https://ko-fi.com/P5P414B69G in new tab    |
| Click "Join our Discord"   | Opens https://discord.gg/Ve3TeBqZQ7 in new tab    |
| Hover (desktop)            | Standard SidebarMenuButton hover state           |
