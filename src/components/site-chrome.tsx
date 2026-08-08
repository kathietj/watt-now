import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display text-lg font-bold ${className}`}>
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Zap className="size-4" />
      </span>
      WattSight
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/history"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            History
          </Link>
          <Link
            to="/methodology"
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
            activeProps={{ className: "text-foreground" }}
          >
            Methodology
          </Link>
          <Link
            to="/scan"
            className="ml-1 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Scan a Room
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>WattSight estimates electricity use from images. It never measures it.</p>
        <nav className="flex gap-4">
          <Link to="/methodology" className="hover:text-foreground">
            Methodology
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/history" className="hover:text-foreground">
            My scans
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function EstimateNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className}`}>
      All figures are <strong className="text-foreground">estimates</strong> based on typical
      appliance ranges, your stated usage hours and your electricity tariff. They are not measured
      values.
    </p>
  );
}
