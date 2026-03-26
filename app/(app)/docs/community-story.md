As a user, I want to see Ko-fi and Discord community links in the sidebar so that I can support the project and join the community.

## Requirements

- Display a "Buy me a coffee" link with Ko-fi logo icon in the sidebar, opening https://ko-fi.com/P5P414B69G in a new tab.
- Display a "Join our Discord" link with Discord logo icon in the sidebar, opening https://discord.gg/Ve3TeBqZQ7 in a new tab.
- Community links are positioned at the bottom of the SidebarContent area (above the version footer) using a separate SidebarGroup with `mt-auto`.
- Icons use custom SVG components (KofiLogo, DiscordLogo) following the app-logo.jsx component structure (default export, `className` prop, spread props).
- Links open in new tabs (`target="_blank" rel="noopener noreferrer"`).
- On mobile, tapping a community link opens the URL in a new tab without closing the drawer.
- Touch targets maintain minimum 44px height via `py-3`.
- Link labels are localised via i18next.

## Tasks

**Parallel tasks 1-4:**

1. Use frontend-developer subagent to create KofiLogo SVG component @app/components/ko-fi-logo.jsx. Follow the app-logo.jsx component structure (default export, `className` prop, spread props) but use `viewBox="0 0 24 24"` with `fill="currentColor"` as specified in the UI design, include the Ko-fi cup SVG path from the UI design @app/docs/community-ui-design.html.
2. Use frontend-developer subagent to create DiscordLogo SVG component @app/components/discord-logo.jsx. Follow the app-logo.jsx component structure (default export, `className` prop, spread props) but use `viewBox="0 0 24 24"` with `fill="currentColor"` as specified in the UI design, include the Discord Clyde SVG path from the UI design @app/docs/community-ui-design.html.
3. Use frontend-developer subagent to add i18n translation keys for community link labels @app/locales/en/translation.json. Add keys for "Buy me a coffee" and "Join our Discord" under a sidebar community namespace.
4. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/community.feature.

**Sequential task 5 after tasks 1-2 complete:**

5. Use frontend-developer subagent to add community links section to the sidebar @app/components/app-sidebar.jsx. Add a new SidebarGroup with `className="mt-auto"` inside SidebarContent, below the existing primary navigation SidebarGroup. Render Ko-fi and Discord links as SidebarMenuItem > SidebarMenuButton (`asChild`) wrapping `<a>` tags with `target="_blank" rel="noopener noreferrer"`. Use KofiLogo and DiscordLogo components for icons. Use `className="h-auto px-4 py-3"` on SidebarMenuButton for touch targets. On mobile, ensure tapping a community link opens the URL in a new tab without closing the sidebar drawer (external `<a>` tags should not trigger drawer close, but verify and prevent if needed). Reference layout spec @app/docs/community-layout.md and UI design @app/docs/community-ui-design.html.
