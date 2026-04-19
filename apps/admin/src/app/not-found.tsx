import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">404 — Page Not Found</h2>
      <p className="text-muted-foreground text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
