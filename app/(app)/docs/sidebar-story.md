As a user, I want a navigation system that shows a hamburger menu on mobile/tablet and a persistent sidebar on desktop so that I can easily navigate between Home, 7-Day Forecast, Settings, and About pages from any screen size.

## Requirements

- Initialise shadcn/ui and setup theme CSS custom properties from the style guide colour palette, including sidebar-specific tokens (--sidebar-primary, --sidebar-accent, etc.).
- Use the shadcn/ui Sidebar component which provides a persistent sidebar on desktop and a Sheet-based drawer on mobile/tablet.
- Use SidebarTrigger as the hamburger button instead of a custom implementation.
- The sidebar contains navigation links: Home, 7-Day Forecast, Settings, About, each with a Lucide icon.
- The active route is highlighted using the built-in isActive prop on SidebarMenuButton.
- The sidebar header shows the app logo and name with the primary gradient background.
- The sidebar footer shows the build version read from the BUILD environment variable via `config.get('build')`.
- On mobile/tablet, the sidebar behaves as a Sheet overlay that closes on backdrop tap or close button.
- On desktop, the sidebar is always visible with the main content in a SidebarInset wrapper.
- Navigation between pages uses Next.js Link for client-side routing.

## Tasks

**Parallel tasks 1-2:**

1. Use frontend-developer subagent to initialise shadcn/ui @components.json. Run shadcn init, configure for JavaScript (not TypeScript), setup component alias paths. Reference @app/docs/style-guide.html for the design system.
2. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/sidebar.feature.

**Parallel after task 1 completes:**

3. Use frontend-developer subagent to setup theme CSS custom properties @app/globals.css. Define primary, accent, and sidebar colour tokens from the style guide palette (ocean, sky, sunset, earth, forest, conditions). Map sidebar-specific variables (--sidebar-background, --sidebar-foreground, --sidebar-primary, --sidebar-accent, etc.) to the ocean/sky palette. Reference @app/docs/style-guide.html lines 20-93 for the full colour palette.
4. Use frontend-developer subagent to add shadcn/ui Sidebar component via CLI. This installs the Sidebar and its sub-components (SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset).

**Sequential tasks 5-6 after task 4 completes:**

5. Use frontend-developer subagent to create app sidebar component @app/components/app-sidebar.js. Compose SidebarHeader (app logo and name with gradient), SidebarContent with SidebarMenu (Home, 7-Day Forecast, Settings, About items using Lucide icons and Next.js Link), and SidebarFooter (build version from `config.get('build')` sourced from the BUILD environment variable). Use isActive prop on SidebarMenuButton to highlight the current route via usePathname. Reference @app/docs/home-ui-design.html State 4 (line 670) for mobile drawer and State 8 (line 1566) for desktop sidebar.
6. Use frontend-developer subagent to update app layout to use SidebarProvider @app/(app)/layout.js. Wrap children with SidebarProvider, render AppSidebar, and wrap main content in SidebarInset with a sticky header containing SidebarTrigger. Reference @app/docs/home-layout.md lines 142-144 for header spec and @app/docs/home-ui-design.html State 8 (line 1566) for desktop layout.
