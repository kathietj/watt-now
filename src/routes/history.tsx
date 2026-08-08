import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { SiteHeader, SiteFooter, EstimateNotice } from "@/components/site-chrome";
import { computeRoomTotals, formatRpRange, ROOM_TYPES } from "@/lib/energy";
import { deleteScan, useScanStore } from "@/lib/scan-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "My Energy Scans — WattSight" },
      {
        name: "description",
        content:
          "Compare rooms you have scanned before and track whether your estimated electricity cost is going down.",
      },
      { property: "og:title", content: "My Energy Scans — WattSight" },
      { property: "og:description", content: "Track estimated room electricity cost over time." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history } = useScanStore();

  const rows = history.map((scan) => ({
    scan,
    totals: computeRoomTotals(scan.appliances, scan.tariff),
  }));

  const byRoom = new Map<string, typeof rows>();
  rows.forEach((r) => {
    const list = byRoom.get(r.scan.roomType) ?? [];
    list.push(r);
    byRoom.set(r.scan.roomType, list);
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">My Energy Scans</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saved on this device only — no account needed. Delete any scan at any time.
        </p>

        {rows.length === 0 ? (
          <div className="panel mt-8 p-8 text-center">
            <p className="text-muted-foreground">No saved scans yet.</p>
            <Link
              to="/scan"
              className="mt-5 inline-block rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              Scan a Room
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {rows.map(({ scan, totals }) => (
              <article key={scan.id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="font-semibold">
                    {ROOM_TYPES.find((r) => r.value === scan.roomType)?.label ?? scan.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(scan.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {scan.appliances.length} devices
                  </p>
                  <p className="mt-2 font-mono text-sm text-watt">
                    {formatRpRange(totals.monthlyCostMin, totals.monthlyCostMax)} / month (estimated)
                  </p>
                </div>
                <button
                  onClick={() => deleteScan(scan.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Delete scan
                </button>
              </article>
            ))}
          </div>
        )}

        {/* Before vs after per room type */}
        {[...byRoom.entries()]
          .filter(([, list]) => list.length >= 2)
          .map(([room, list]) => {
            const sorted = [...list].sort((a, b) => b.scan.createdAt - a.scan.createdAt);
            const currentRow = sorted[0]!;
            const previousRow = sorted[1]!;
            const cur = (currentRow.totals.monthlyCostMin + currentRow.totals.monthlyCostMax) / 2;
            const prev = (previousRow.totals.monthlyCostMin + previousRow.totals.monthlyCostMax) / 2;
            const diff = prev - cur;
            const pct = prev > 0 ? (diff / prev) * 100 : 0;
            const improved = diff > 0;
            return (
              <section key={room} className="panel mt-8 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-primary">Energy progress</p>
                <h2 className="mt-2 text-xl font-bold">
                  {ROOM_TYPES.find((r) => r.value === room)?.label}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <p className="text-lg font-semibold">
                      {formatRpRange(previousRow.totals.monthlyCostMin, previousRow.totals.monthlyCostMax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-semibold">
                      {formatRpRange(currentRow.totals.monthlyCostMin, currentRow.totals.monthlyCostMax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Difference</p>
                    <p
                      className={`inline-flex items-center gap-1.5 text-lg font-semibold ${
                        improved ? "text-primary" : "text-warning"
                      }`}
                    >
                      {improved ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
                      {Math.abs(pct).toFixed(1)}% {improved ? "lower" : "higher"}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}

        <div className="panel mt-8 p-5">
          <EstimateNotice />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
