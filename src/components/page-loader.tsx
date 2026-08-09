import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouterState } from "@tanstack/react-router";

const LOADING_DURATION_MS = 3600;
const FADE_DURATION_MS = 260;
const CONNECTION_COMPLETE_MS = 2780;

const ENERGY_FACTS = [
  "Air conditioners work hardest when doors and windows are left open. Keep cooled rooms closed whenever possible.",
  "Using a fan together with AC can help a room feel comfortable at a higher AC temperature setting.",
  "Natural daylight can replace unnecessary lighting near windows during bright daytime hours.",
  "Chargers and electronics can still draw small amounts of power while plugged in, even when they are not actively charging.",
  "Cleaning an AC filter regularly helps airflow, so the system does not need to work as hard to cool the room.",
  "Turning a device fully off is more effective than leaving it running just because you might use it again later.",
  "The most useful energy-saving change is often reducing the operating time of the room's highest-power appliance.",
  "A smaller room generally needs less cooling than a much larger room, so choosing the right space can save electricity before anything is switched on.",
  "Screens that are brighter than necessary use more energy. Comfortable brightness is usually enough indoors.",
  "Timers and automatic sleep settings are useful because they save electricity even when people forget to switch devices off.",
  "Before replacing an appliance, check how many hours it runs each day. Runtime can matter as much as the wattage printed on the label.",
  "Energy saving does not always mean using fewer devices. Sometimes it means using the right device for a shorter, smarter period of time.",
];

const SPARKS = [
  { angle: -78, length: 24, delay: 0 },
  { angle: -43, length: 17, delay: 30 },
  { angle: -11, length: 22, delay: 55 },
  { angle: 24, length: 18, delay: 20 },
  { angle: 57, length: 26, delay: 70 },
  { angle: 92, length: 16, delay: 5 },
  { angle: 132, length: 21, delay: 45 },
  { angle: 165, length: 15, delay: 80 },
];

function pickFact(previous: number) {
  if (ENERGY_FACTS.length < 2) return 0;
  let next = Math.floor(Math.random() * ENERGY_FACTS.length);
  while (next === previous) next = Math.floor(Math.random() * ENERGY_FACTS.length);
  return next;
}

export function PageLoader() {
  const routeKey = useRouterState({ select: (state) => state.location.pathname });
  const previousFact = useRef(-1);
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * ENERGY_FACTS.length));

  useEffect(() => {
    const nextFact = pickFact(previousFact.current);
    previousFact.current = nextFact;
    setFactIndex(nextFact);
    setVisible(true);
    setLeaving(false);
    setConnected(false);

    const connectedTimer = window.setTimeout(() => setConnected(true), CONNECTION_COMPLETE_MS);
    const fadeTimer = window.setTimeout(() => setLeaving(true), LOADING_DURATION_MS - FADE_DURATION_MS);
    const hideTimer = window.setTimeout(() => setVisible(false), LOADING_DURATION_MS);

    return () => {
      window.clearTimeout(connectedTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [routeKey]);

  const fact = useMemo(() => ENERGY_FACTS[factIndex], [factIndex]);

  if (!visible) return null;

  return (
    <div
      className={`page-loader no-print ${leaving ? "page-loader--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading WattNow"
    >
      <div className="page-loader__grid" aria-hidden="true" />

      <div key={routeKey} className="page-loader__content">
        <div className="page-loader__brand">
          <img src="/wattnow-logo.png" alt="WattNow" className="page-loader__logo" />
        </div>

        <div className={`plug3d ${connected ? "plug3d--connected" : ""}`} aria-hidden="true">
          <div className="plug3d__studio-floor" />
          <div className="plug3d__ambient plug3d__ambient--gold" />
          <div className="plug3d__ambient plug3d__ambient--blue" />

          <div className="plug3d__socket-wrap">
            <div className="plug3d__socket-shadow" />
            <div className="plug3d__socket-plate">
              <span className="plug3d__socket-highlight" />
              <span className="plug3d__socket-bevel" />
              <div className="plug3d__socket-face">
                <span className="plug3d__socket-hole plug3d__socket-hole--top" />
                <span className="plug3d__socket-hole plug3d__socket-hole--bottom" />
                <span className="plug3d__socket-inner-shadow" />
              </div>
            </div>
          </div>

          <div className="plug3d__contact-glow" />

          <div className="plug3d__sparks">
            {SPARKS.map((spark, index) => (
              <span
                key={index}
                className={`plug3d__spark plug3d__spark--${index % 2 === 0 ? "gold" : "blue"}`}
                style={
                  {
                    "--spark-angle": `${spark.angle}deg`,
                    "--spark-length": `${spark.length}px`,
                    "--spark-delay": `${spark.delay}ms`,
                  } as CSSProperties
                }
              />
            ))}
            <span className="plug3d__spark-dot plug3d__spark-dot--one" />
            <span className="plug3d__spark-dot plug3d__spark-dot--two" />
            <span className="plug3d__spark-dot plug3d__spark-dot--three" />
          </div>

          <div className="plug3d__plug-wrap">
            <div className="plug3d__cable" />
            <div className="plug3d__plug-shadow" />
            <div className="plug3d__plug">
              <span className="plug3d__grip-line plug3d__grip-line--one" />
              <span className="plug3d__grip-line plug3d__grip-line--two" />
              <span className="plug3d__grip-line plug3d__grip-line--three" />
              <span className="plug3d__plug-highlight" />
              <span className="plug3d__plug-neck" />
              <span className="plug3d__prong plug3d__prong--top" />
              <span className="plug3d__prong plug3d__prong--bottom" />
            </div>
          </div>

          <div className="plug3d__socket-lip" />
        </div>

        <p className={`page-loader__status ${connected ? "page-loader__status--connected" : ""}`}>
          {connected ? "Connected — loading complete" : "Connecting to smarter energy..."}
        </p>

        <div className="page-loader__fact">
          <p className="page-loader__fact-label">WATT TIP</p>
          <p>{fact}</p>
        </div>

        <div className="page-loader__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
