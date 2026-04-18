import Link from "next/link";
import { Button } from "@buildbase/ui/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">404 — Page Not Found</h2>
      <p className="text-muted-foreground text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
