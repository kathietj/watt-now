import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center rounded-xl px-1.5 py-1 transition-transform hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      aria-label="WattNow home"
      title="WattNow home"
    >
      <img
        src="/wattnow-logo.png"
        alt="WattNow"
        className="h-9 w-auto object-contain sm:h-10"
      />
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/history"
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:block"
            activeProps={{ className: "text-foreground" }}
          >
            History
          </Link>
          <Link
            to="/methodology"
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:block"
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
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_auto] md:items-start">
          <div>
            <Logo className="-ml-1" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              WattNow estimates electricity use from images. It never presents camera-based estimates as measured electricity consumption.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Developed by</p>
            <div className="mt-3 space-y-1.5 text-sm text-foreground/90">
              <p>Jocelyne Rivera Lasse</p>
              <p>Kathie Victoria Tjia</p>
              <p>Tamariska Ruth Vinsensius</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 text-sm text-muted-foreground md:items-end">
            <Link to="/methodology" className="hover:text-foreground">Methodology</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/history" className="hover:text-foreground">My scans</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-border/50 pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} WattNow · Visual Energy Audit
        </div>
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
