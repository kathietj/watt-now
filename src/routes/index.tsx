import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ScanLine, Cpu, PiggyBank, ShieldCheck, Smartphone, Zap, Activity, Gauge, Sparkles, Copy, Check, ExternalLink, Boxes } from "lucide-react";
import heroImage from "@/assets/hero-scan.jpg";
import botchainLogo from "@/assets/botchain-logo.jpg.asset.json";
import { SiteHeader, SiteFooter, EstimateNotice } from "@/components/site-chrome";

const MAINNET_CONTRACT = "0x4934e47a285EC8AFb1A56BBB247C8091913F3BEC";
const MAINNET_EXPLORER = "https://scan.botchain.ai/address/0x4934e47a285EC8AFb1A56BBB247C8091913F3BEC";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WattNow — Visual Energy Audit" },
      {
        name: "description",
        content:
          "Scan a room with your camera and let AI estimate the electricity consumption, cost in Rupiah, and possible energy waste around you. No hardware, no app download.",
      },
      { property: "og:title", content: "WattNow — Visual Energy Audit" },
      {
        property: "og:description",
        content:
          "Point. Scan. Understand your electricity. Turn any camera into an instant visual energy audit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

function HeroEnergyScene() {
  return (
    <div
      className="energy-scene"
      onPointerMove={(event) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const element = event.currentTarget;
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.setProperty("--tilt-y", `${x * 10}deg`);
        element.style.setProperty("--tilt-x", `${y * -8}deg`);
        element.style.setProperty("--glow-x", `${50 + x * 22}%`);
        element.style.setProperty("--glow-y", `${45 + y * 18}%`);
      }}
      onPointerLeave={(event) => {
        const element = event.currentTarget;
        element.style.setProperty("--tilt-y", "-5deg");
        element.style.setProperty("--tilt-x", "4deg");
        element.style.setProperty("--glow-x", "50%");
        element.style.setProperty("--glow-y", "45%");
      }}
      aria-label="Interactive 3D preview of WattNow identifying electronics in a room"
    >
      <div className="energy-scene__halo" aria-hidden="true" />
      <div className="energy-scene__orbit energy-scene__orbit--one" aria-hidden="true" />
      <div className="energy-scene__orbit energy-scene__orbit--two" aria-hidden="true" />

      <div className="energy-scene__stage">
        <div className="energy-scene__camera-card">
          <div className="energy-scene__camera-topbar">
            <span className="energy-scene__live"><i /> LIVE SCAN</span>
            <span className="font-mono text-[10px] text-white/55">6 DEVICES</span>
          </div>
          <img
            src={heroImage}
            alt="Room camera preview with electronic devices"
            width={1280}
            height={960}
            className="energy-scene__image"
          />
          <div className="energy-scene__scanline" aria-hidden="true" />
          <div className="energy-box energy-box--ac"><span>AC</span><small>94%</small></div>
          <div className="energy-box energy-box--tv"><span>TV</span><small>88%</small></div>
          <div className="energy-box energy-box--fan"><span>FAN</span><small>82%</small></div>
          <div className="energy-scene__camera-footer">
            <span>AI VISUAL ENERGY AUDIT</span>
            <span>WATTNOW</span>
          </div>
        </div>

        <div className="energy-float energy-float--power">
          <span className="energy-float__icon"><Gauge className="size-4" /></span>
          <div><small>EST. ACTIVE POWER</small><strong>1.2–2.1 kW</strong></div>
        </div>

        <div className="energy-float energy-float--cost">
          <span className="energy-float__icon energy-float__icon--amber">Rp</span>
          <div><small>MONTHLY RANGE</small><strong>Rp 374k–629k</strong></div>
        </div>

        <div className="energy-float energy-float--insight">
          <span className="energy-float__icon"><Activity className="size-4" /></span>
          <div><small>ENERGY BLIND SPOT</small><strong>Air Conditioner · 54%</strong></div>
        </div>

        <div className="energy-scene__spark energy-scene__spark--a"><Sparkles className="size-4" /></div>
        <div className="energy-scene__spark energy-scene__spark--b"><Zap className="size-4" /></div>
      </div>
    </div>
  );
}


function NeonGraffiti() {
  return (
    <div className="neon-graffiti" aria-hidden="true">
      <svg className="neon-graffiti__doodle neon-graffiti__doodle--one" viewBox="0 0 180 140">
        <path d="M18 87 C42 52 65 112 93 75 C116 45 130 58 159 23" />
        <path d="M118 18 L106 50 L128 47 L109 85" />
        <circle cx="52" cy="39" r="18" />
        <path d="M41 38 Q52 25 63 38 M43 47 Q52 55 62 47" />
      </svg>
      <svg className="neon-graffiti__doodle neon-graffiti__doodle--two" viewBox="0 0 210 170">
        <path d="M18 133 Q38 81 73 119 T130 91 T190 55" />
        <path d="M44 38 L57 55 L42 64 L62 82" />
        <path d="M145 22 L149 37 L165 38 L153 48 L157 64 L144 54 L131 64 L136 48 L124 38 L140 37 Z" />
        <circle cx="102" cy="62" r="27" />
        <path d="M90 62 C97 50 109 50 116 62 C109 74 97 74 90 62" />
      </svg>
      <svg className="neon-graffiti__doodle neon-graffiti__doodle--three" viewBox="0 0 190 130">
        <path d="M14 62 C32 39 51 38 68 60 S102 84 121 58 S155 36 177 55" />
        <path d="M29 96 L48 75 L61 97 L79 75 L91 96" />
        <path d="M132 92 C141 74 158 75 165 92 C156 103 141 104 132 92 Z" />
      </svg>
      <span className="neon-graffiti__word neon-graffiti__word--zap">ZAP!</span>
      <span className="neon-graffiti__word neon-graffiti__word--save">SAVE</span>
      <span className="neon-graffiti__cross neon-graffiti__cross--a">×</span>
      <span className="neon-graffiti__cross neon-graffiti__cross--b">+</span>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="grid-glow home-hero relative overflow-hidden border-b border-border/60">
          <NeonGraffiti />
          <div className="hero-ambient hero-ambient--one" aria-hidden="true" />
          <div className="hero-ambient hero-ambient--two" aria-hidden="true" />
          <div className="home-hero__grid mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-24">
            <div className="hero-copy relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
                <Zap className="size-3" /> Visual energy audit
              </span>
              <p className="hero-intro-copy mt-6 max-w-xl text-lg text-muted-foreground">
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

            <HeroEnergyScene />
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold sm:text-4xl">Point. Scan. Understand your electricity.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your bill tells you a total. WattNow turns any camera into an electricity-awareness
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
                A camera cannot measure electricity. WattNow always shows ranges, confidence
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
