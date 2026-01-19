export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Auth routes don't need dashboard layout - just render children
  // Root layout will handle html/body and AppProviders
  return <>{children}</>;
}
