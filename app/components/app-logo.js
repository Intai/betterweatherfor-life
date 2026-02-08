export default function AppLogo({ className = 'w-6 h-6', ...props }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      data-testid="app-logo"
      {...props}
    >
      <circle cx="20" cy="20" r="8" fill="currentColor"/>
      <path d="M20 2v6M20 32v6M2 20h6M32 20h6M6.3 6.3l4.2 4.2M29.5 29.5l4.2 4.2M6.3 33.7l4.2-4.2M29.5 10.5l4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
