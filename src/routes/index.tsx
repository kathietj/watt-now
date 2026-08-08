import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ScanLine, Cpu, PiggyBank, ShieldCheck, Smartphone, Zap } from "lucide-react";
import heroImage from "@/assets/hero-scan.jpg";
import { SiteHeader, SiteFooter, EstimateNotice } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WattSight — See Where Your Electricity Goes" },
      {
        name: "description",
        content:
          "Scan a room with your camera and let AI estimate the electricity consumption, cost in Rupiah, and possible energy waste around you. No hardware, no app download.",
      },
      { property: "og:title", content: "WattSight — See Where Your Electricity Goes" },
      {
        property: "og:description",
        content:
          "Point. Scan. Understand your electricity. Turn any camera into an instant visual energy audit.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: ScanLine,
    title: "Scan",
    body: "Open your camera and sweep the room. Electronics get boxed and labelled live.",
  },
  {
    icon: Cpu,
    title: "Analyze",
    body: "Capture one frame. AI identifies appliance types and estimates realistic wattage ranges.",
  },
  {
    icon: PiggyBank,
    title: "Save Energy",
    body: "See estimated Rupiah cost per month, and simulate what changes would actually save.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="grid-glow relative overflow-hidden border-b border-border/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
                <Zap className="size-3" /> Visual energy audit
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                See Where Your <span className="text-gradient-energy">Electricity</span> Goes.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Scan a room with your camera and let AI estimate the electricity consumption, cost,
                and possible energy waste around you.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  <Camera className="size-5" /> Scan a Room
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-3.5 text-base font-medium transition-colors hover:bg-accent"
                >
                  How It Works
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> No additional hardware required.
                </span>
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="size-4 text-primary" /> No app download required.
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
                <img
                  src={heroImage}
                  alt="Phone camera view of a living room with AI bounding boxes around an air conditioner, television and fan"
                  width={1280}
                  height={960}
                  className="w-full object-cover"
                />
              </div>
              <div className="panel absolute -bottom-6 left-4 right-4 p-4 shadow-xl sm:left-8 sm:right-auto sm:w-72">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Estimated monthly cost
                </p>
                <p className="mt-1 text-2xl font-bold text-gradient-energy">
                  Rp 374.000–Rp 629.000
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Estimate, not a measurement.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold sm:text-4xl">Point. Scan. Understand your electricity.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your bill tells you a total. WattSight turns any camera into an electricity-awareness
            interface so you can see which objects around you are responsible for it.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <article key={s.title} className="panel p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
            <div>
              <h2 className="text-2xl font-bold">Honest by design</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                A camera cannot measure electricity. WattSight always shows ranges, confidence
                levels, and lets you correct every detection before anything is calculated.
              </p>
              <Link to="/methodology" className="mt-4 inline-block text-sm font-medium text-primary">
                Read the methodology →
              </Link>
            </div>
            <div className="panel p-6 md:col-span-2">
              <p className="font-mono text-xs uppercase tracking-widest text-watt">Example output</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-lg font-semibold">Air Conditioner</p>
                  <p className="text-sm text-muted-foreground">Estimated power</p>
                  <p className="font-mono text-2xl text-watt">400–800 W</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confidence: medium · Operating status: unknown
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold">Television</p>
                  <p className="text-sm text-muted-foreground">Estimated power</p>
                  <p className="font-mono text-2xl text-watt">60–120 W</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confidence: medium · Operating status: likely off
                  </p>
                </div>
              </div>
              <EstimateNotice className="mt-6" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Turn any camera into an energy audit.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Works on Android Chrome, iPhone Safari, iPad, Windows laptops and MacBooks. No signup for
            your first scan.
          </p>
          <Link
            to="/scan"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Camera className="size-5" /> Scan a Room
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
