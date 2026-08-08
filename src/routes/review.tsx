import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, Trash2, Info } from "lucide-react";
import { DetectionOverlay } from "@/components/detection-overlay";
import { EstimateNotice } from "@/components/site-chrome";
import {
  APPLIANCE_CATALOG,
  CATALOG_KEYS,
  makeAppliance,
} from "@/lib/appliance-catalog";
import {
  ROOM_TYPES,
  STATUS_LABEL,
  formatPowerRange,
  type ApplianceStatus,
  type RoomType,
} from "@/lib/energy";
import {
  addAppliance,
  removeAppliance,
  updateAppliance,
  updateCurrent,
  useScanStore,
} from "@/lib/scan-store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Detected Devices — WattSight" },
      {
        name: "description",
        content:
          "Correct the AI's detections, set operating status and daily usage hours before WattSight estimates your electricity cost.",
      },
      { property: "og:title", content: "Review Detected Devices — WattSight" },
      {
        property: "og:description",
        content: "AI detection is not always right. Fix the room before the numbers are calculated.",
      },
    ],
  }),
  component: ReviewPage,
});

const STATUS_OPTIONS: ApplianceStatus[] = ["active", "off", "unknown"];
const HOUR_PRESETS = [1, 2, 4, 8, 12, 24];

function ReviewPage() {
  const { current } = useScanStore();
  const navigate = useNavigate();
  const [newDevice, setNewDevice] = useState(CATALOG_KEYS[0] ?? "air_conditioner");

  if (!current) {
    return (
      <EmptyState />
    );
  }

  const appliances = current.appliances;

  return (
    <div className="min-h-screen pb-32">
      <header className="border-b border-border/60 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Step 1 of 2</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            We Found {appliances.length} Device{appliances.length === 1 ? "" : "s"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            AI detection is not always correct. Confirm what is really in this room, whether each
            device is running, and how long you normally use it.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {current.image && (
          <section className="panel overflow-hidden">
            <div className="relative">
              <img
                src={current.image}
                alt="Captured room"
                className="w-full object-cover"
                loading="lazy"
              />
              <DetectionOverlay boxes={current.boxes} compact />
            </div>
            {current.demo && (
              <p className="bg-watt/15 px-4 py-2 font-mono text-xs uppercase tracking-widest text-watt">
                Demo mode — prepared sample room
              </p>
            )}
          </section>
        )}

        {/* Room context */}
        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Room context</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This makes the WattSight score fair — a classroom is not a bedroom.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Room type</span>
              <select
                value={current.roomType}
                onChange={(e) => updateCurrent({ roomType: e.target.value as RoomType })}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5"
              >
                {ROOM_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">How many people normally use this room?</span>
              <input
                type="number"
                min={1}
                max={200}
                value={current.occupants}
                onChange={(e) => updateCurrent({ occupants: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5"
              />
            </label>
          </div>
        </section>

        {/* Devices */}
        <section className="space-y-4">
          {appliances.map((a) => (
            <article key={a.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.category} ·{" "}
                    {a.detectionConfidence
                      ? `Detected: ${Math.round(a.detectionConfidence * 100)}%`
                      : "AI estimate"}{" "}
                    · Confidence: {a.confidence}
                  </p>
                  <p className="mt-2 font-mono text-sm text-watt">
                    Estimated power: {formatPowerRange(a.powerMinWatts, a.powerMaxWatts)}
                  </p>
                  {a.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => removeAppliance(a.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Operating status — currently: {STATUS_LABEL[a.status]}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => {
                      const selected =
                        a.status === s ||
                        (s === "active" && a.status === "likely_active") ||
                        (s === "off" && a.status === "likely_off");
                      return (
                        <button
                          key={s}
                          onClick={() => updateAppliance(a.id, { status: s })}
                          aria-pressed={selected}
                          className={`rounded-xl border px-3 py-1.5 text-sm ${
                            selected
                              ? "border-primary bg-primary/15 font-semibold text-primary"
                              : "border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Stepper
                      value={a.quantity}
                      min={1}
                      max={99}
                      step={1}
                      onChange={(v) => updateAppliance(a.id, { quantity: v })}
                      suffix="unit"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  How long do you normally use it?
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Stepper
                    value={a.hoursPerDay}
                    min={0}
                    max={24}
                    step={0.5}
                    onChange={(v) => updateAppliance(a.id, { hoursPerDay: v })}
                    suffix="hours/day"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {HOUR_PRESETS.map((h) => (
                      <button
                        key={h}
                        onClick={() => updateAppliance(a.id, { hoursPerDay: h })}
                        className={`rounded-lg border px-2.5 py-1 text-xs ${
                          a.hoursPerDay === h
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {appliances.length === 0 && (
            <p className="panel p-6 text-sm text-muted-foreground">
              No devices yet. Add the electronics you can see in this room below.
            </p>
          )}
        </section>

        {/* Add missing */}
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Plus className="size-4 text-primary" /> Add Missing Device
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Some appliances — air conditioners, sockets, routers, ceiling lights — are easy for a
            camera to miss.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={newDevice}
              onChange={(e) => setNewDevice(e.target.value)}
              className="min-w-56 flex-1 rounded-xl border border-input bg-background px-3 py-2.5"
              aria-label="Device to add"
            >
              {CATALOG_KEYS.map((k) => (
                <option key={k} value={k}>
                  {APPLIANCE_CATALOG[k]?.name}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                addAppliance(makeAppliance(newDevice.replace(/_/g, " "), { source: "user_added" }))
              }
              className="rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground"
            >
              Add device
            </button>
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-surface/50 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <EstimateNotice />
        </div>
      </main>

      <div className="no-print fixed inset-x-0 bottom-0 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link to="/scan" className="text-sm text-muted-foreground hover:text-foreground">
            Rescan
          </Link>
          <button
            onClick={() => void navigate({ to: "/results" })}
            disabled={appliances.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-40"
          >
            Calculate energy use <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 2) / 2));
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background p-1">
      <button
        aria-label={`Decrease ${suffix}`}
        onClick={() => onChange(clamp(value - step))}
        className="size-8 rounded-lg text-lg hover:bg-accent"
      >
        –
      </button>
      <span className="min-w-24 text-center font-mono text-sm">
        {value} {suffix}
      </span>
      <button
        aria-label={`Increase ${suffix}`}
        onClick={() => onChange(clamp(value + step))}
        className="size-8 rounded-lg text-lg hover:bg-accent"
      >
        +
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold">No scan in progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan a room or try demo mode to see estimated electricity use.
        </p>
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
