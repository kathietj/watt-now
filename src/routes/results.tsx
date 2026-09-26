import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Lightbulb,
  Loader2,
  Save,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DetectionOverlay } from "@/components/detection-overlay";
import { EstimateNotice, SiteFooter } from "@/components/site-chrome";
import { coachRoom } from "@/lib/analysis.functions";
import {
  TARIFF_CONFIG,
  computeRoomTotals,
  computeWattNowScore,
  formatKwhRange,
  formatPowerRange,
  formatRp,
  formatRpRange,
  isRunning,
  type Appliance,
} from "@/lib/energy";
import {
  saveCurrentToHistory,
  setTariff,
  updateAppliance,
  useScanStore,
} from "@/lib/scan-store";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your Room Energy Scan — WattNow" },
      {
        name: "description",
        content:
          "Estimated power, monthly kWh, Rupiah cost, WattNow score and personalised savings for the room you scanned.",
      },
      { property: "og:title", content: "Your Room Energy Scan — WattNow" },
      {
        property: "og:description",
        content: "Estimated electricity cost and savings opportunities for your scanned room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { current } = useScanStore();
  const coach = useServerFn(coachRoom);
  const [showBoxes, setShowBoxes] = useState(true);
  const [saved, setSaved] = useState(false);
  const baselineRef = useRef<Appliance[] | null>(null);

  const tariff = current?.tariff ?? TARIFF_CONFIG.defaultRpPerKwh;

  if (!baselineRef.current && current?.appliances.length) {
    baselineRef.current = current.appliances.map((a) => ({ ...a }));
  }

  const totals = useMemo(
    () => computeRoomTotals(current?.appliances ?? [], tariff),
    [current?.appliances, tariff],
  );
  const baselineTotals = useMemo(
    () => computeRoomTotals(baselineRef.current ?? [], tariff),
    [tariff, current?.appliances],
  );
  const score = useMemo(
    () =>
      computeWattNowScore(
        current?.appliances ?? [],
        totals,
        current?.roomType ?? "other",
        current?.occupants ?? 1,
      ),
    [current?.appliances, current?.roomType, current?.occupants, totals],
  );

  const coachSummary = useMemo(() => {
    if (!current) return null;
    return {
      roomType: current.roomType,
      occupants: current.occupants,
      tariffRpPerKwh: tariff,
      wattSightScore: score.score,
      totals: {
        monthlyKwhMin: Math.round(totals.monthlyKwhMin),
        monthlyKwhMax: Math.round(totals.monthlyKwhMax),
        monthlyCostMinRp: Math.round(totals.monthlyCostMin),
        monthlyCostMaxRp: Math.round(totals.monthlyCostMax),
      },
      devices: totals.breakdown.map((b) => ({
        name: b.appliance.name,
        quantity: b.appliance.quantity,
        powerMinWatts: b.appliance.powerMinWatts,
        powerMaxWatts: b.appliance.powerMaxWatts,
        hoursPerDay: b.appliance.hoursPerDay,
        status: b.appliance.status,
        sharePct: Math.round(b.sharePct),
        monthlyCostMinRp: Math.round(b.energy.monthlyCostMin),
        monthlyCostMaxRp: Math.round(b.energy.monthlyCostMax),
      })),
    };
    // Only recompute the AI brief when the scan identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const coaching = useQuery({
    queryKey: ["coach", current?.id],
    enabled: !!coachSummary,
    staleTime: Infinity,
    retry: false,
    queryFn: () => coach({ data: { summary: coachSummary } }),
  });

  if (!current) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">No scan to show yet</h1>
          <Link
            to="/scan"
            className="mt-6 inline-block rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Scan a Room
          </Link>
        </div>
      </div>
    );
  }

  const savingMonthly = {
    min: Math.max(0, baselineTotals.monthlyCostMin - totals.monthlyCostMin),
    max: Math.max(0, baselineTotals.monthlyCostMax - totals.monthlyCostMax),
  };
  const changed = savingMonthly.max > 1 || baselineTotals.monthlyCostMax < totals.monthlyCostMax;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            {current.demo ? "Demo mode · " : ""}WattNow report
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your Room Energy Scan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on the appliances detected and your estimated usage. All values are estimates.
          </p>
          <div className="no-print mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => {
                saveCurrentToHistory();
                setSaved(true);
                toast.success("Scan saved to this device.");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm hover:bg-accent"
            >
              <Save className="size-4" /> {saved ? "Saved" : "Save Scan"}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm hover:bg-accent"
            >
              <Download className="size-4" /> Download Report
            </button>
            <button
              onClick={async () => {
                const text = `WattNow Room Energy Report — estimated ${formatRpRange(totals.monthlyCostMin, totals.monthlyCostMax)}/month, WattNow score ${score.score}/100.`;
                if (navigator.share) await navigator.share({ title: "WattNow", text }).catch(() => undefined);
                else {
                  await navigator.clipboard.writeText(text);
                  toast.success("Summary copied to clipboard.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm hover:bg-accent"
            >
              <Share2 className="size-4" /> Share Result
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {/* Top cards */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Devices" value={`${totals.devices}`} sub={`${totals.units} units detected`} />
          <StatCard
            label="Estimated active power"
            value={formatPowerRange(totals.activePowerMin, totals.activePowerMax)}
            sub="While running"
            tone="watt"
          />
          <StatCard
            label="Estimated monthly energy"
            value={formatKwhRange(totals.monthlyKwhMin, totals.monthlyKwhMax)}
            sub="30 days"
          />
          <StatCard
            label="Estimated monthly cost"
            value={formatRpRange(totals.monthlyCostMin, totals.monthlyCostMax)}
            sub={`At Rp ${new Intl.NumberFormat("id-ID").format(tariff)}/kWh`}
            tone="primary"
          />
        </section>

        {/* Tariff */}
        <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Electricity rate</p>
            <p className="font-mono text-xl">
              Rp {new Intl.NumberFormat("id-ID").format(tariff)} / kWh
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{TARIFF_CONFIG.label}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={100}
              max={10000}
              step={1}
              value={tariff}
              onChange={(e) => setTariff(Math.max(100, Number(e.target.value) || 100))}
              className="w-32 rounded-xl border border-input bg-background px-3 py-2"
              aria-label="Electricity tariff in Rupiah per kWh"
            />
            {TARIFF_CONFIG.presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setTariff(p.value)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Image with detections */}
        {current.image && (
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Scanned room</h2>
              <button
                onClick={() => setShowBoxes((v) => !v)}
                className="no-print inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-accent"
                aria-pressed={showBoxes}
              >
                {showBoxes ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                Show detection {showBoxes ? "on" : "off"}
              </button>
            </div>
            <div className="relative">
              <img src={current.image} alt="Scanned room" className="w-full" loading="lazy" />
              {showBoxes && <DetectionOverlay boxes={current.boxes} compact />}
            </div>
          </section>
        )}

        {/* Breakdown */}
        <section>
          <h2 className="text-2xl font-bold">Biggest Energy Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by estimated monthly electricity consumption.
          </p>
          <div className="mt-5 space-y-3">
            {totals.breakdown.map(({ appliance: a, energy, sharePct }) => (
              <article key={a.id} className="panel p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">
                    {a.name}
                    {a.quantity > 1 && <span className="text-muted-foreground"> ×{a.quantity}</span>}
                  </h3>
                  <span className="font-mono text-sm text-muted-foreground">
                    {isRunning(a) ? `${Math.round(sharePct)}% of estimate` : "Not running"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-watt">
                  {formatPowerRange(a.powerMinWatts, a.powerMaxWatts)} · {a.hoursPerDay} h/day
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, sharePct)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm">
                  Estimated monthly cost:{" "}
                  <span className="font-semibold">
                    {formatRpRange(energy.monthlyCostMin, energy.monthlyCostMax)}
                  </span>
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Score */}
        <section className="panel p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <span
                className={`grid size-24 place-items-center rounded-full border-4 font-display text-3xl font-bold ${
                  score.bandTone === "good"
                    ? "border-primary text-primary"
                    : score.bandTone === "ok"
                      ? "border-watt text-watt"
                      : "border-warning text-warning"
                }`}
              >
                {score.score}
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  WattNow score
                </p>
                <p className="text-2xl font-bold">{score.band}</p>
                <p className="text-sm text-muted-foreground">{score.score} / 100</p>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm text-muted-foreground">
              {score.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <Gauge className="mt-0.5 size-4 shrink-0 text-primary" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* AI verdict + coach */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="size-5 text-primary" /> Energy verdict
          </h2>
          {coaching.isLoading && (
            <p className="panel flex items-center gap-2 p-5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Generating personalised insights…
            </p>
          )}
          {coaching.isError && (
            <p className="panel p-5 text-sm text-muted-foreground">
              Personalised coaching is unavailable right now. The estimates above still apply.
            </p>
          )}
          {coaching.data && (
            <>
              <p className="panel p-5 leading-relaxed">{coaching.data.verdict}</p>

              {coaching.data.blindSpot && (
                <div className="panel border-watt/40 bg-watt/10 p-5">
                  <p className="font-mono text-xs uppercase tracking-widest text-watt">
                    Your energy blind spot
                  </p>
                  <p className="mt-2 leading-relaxed">{coaching.data.blindSpot}</p>
                </div>
              )}

              {!!coaching.data.recommendations?.length && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Your Top 3 Opportunities</h3>
                  {coaching.data.recommendations.slice(0, 3).map((r, i) => (
                    <article key={r.title} className="panel p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold">
                          {i + 1}. {r.title}
                        </h4>
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                          Estimated impact: {r.impact}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    </article>
                  ))}
                </div>
              )}

              {!!coaching.data.warnings?.length && (
                <div className="panel border-warning/40 bg-warning/10 p-5">
                  <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-warning">
                    <AlertTriangle className="size-4" /> Possible unnecessary usage detected
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {coaching.data.warnings.map((w) => (
                      <li key={w}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        {/* What-if simulator */}
        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="size-5 text-primary" /> What if?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust usage hours or exclude a device to simulate the effect instantly.
          </p>

          <div className="mt-5 space-y-4">
            {current.appliances.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{a.name}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateAppliance(a.id, { included: true })}
                      aria-pressed={a.included !== false}
                      className={`rounded-lg border px-3 py-1 text-xs ${
                        a.included !== false
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      Include
                    </button>
                    <button
                      onClick={() => updateAppliance(a.id, { included: false })}
                      aria-pressed={a.included === false}
                      className={`rounded-lg border px-3 py-1 text-xs ${
                        a.included === false
                          ? "border-warning bg-warning/15 text-warning"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      Exclude
                    </button>
                  </div>
                </div>
                <label className="mt-3 block text-xs text-muted-foreground">
                  Usage: {a.hoursPerDay} h/day
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={0.5}
                    value={a.hoursPerDay}
                    onChange={(e) => updateAppliance(a.id, { hoursPerDay: Number(e.target.value) })}
                    className="mt-2 w-full accent-[var(--primary)]"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SimStat label="Before" value={formatRpRange(baselineTotals.monthlyCostMin, baselineTotals.monthlyCostMax)} />
            <SimStat label="After" value={formatRpRange(totals.monthlyCostMin, totals.monthlyCostMax)} />
            <SimStat
              label="You could save / month"
              value={changed ? formatRpRange(savingMonthly.min, savingMonthly.max) : "—"}
              highlight
            />
          </div>
          {changed && savingMonthly.max > 0 && (
            <p className="mt-3 text-sm text-primary">
              That is roughly {formatRpRange(savingMonthly.min * 12, savingMonthly.max * 12)} per year.
            </p>
          )}
        </section>

        {/* One change */}
        {coaching.data?.oneChange && (
          <section className="panel border-primary/40 bg-primary/10 p-6">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              <Lightbulb className="size-4" /> If you change only one thing…
            </p>
            <h2 className="mt-3 text-xl font-bold">{coaching.data.oneChange.title}</h2>
            <p className="mt-2 leading-relaxed">{coaching.data.oneChange.body}</p>
          </section>
        )}

        <div className="panel p-5">
          <EstimateNotice />
          <p className="mt-2 text-xs text-muted-foreground">
            Formula: (watts × quantity × hours) ÷ 1000 = kWh/day; × tariff = Rupiah/day; × 30 =
            monthly. See the{" "}
            <Link to="/methodology" className="text-primary underline">
              methodology page
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "primary" | "watt";
}) {
  return (
    <div className="panel p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          tone === "primary" ? "text-primary" : tone === "watt" ? "text-watt" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SimStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-primary bg-primary/10" : "border-border"}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

