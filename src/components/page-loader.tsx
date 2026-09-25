import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const LOADING_DURATION_MS = 3100;

function ConnectionMark() {
  return (
    <div className="connection-mark" aria-hidden="true">
      <div className="connection-mark__wire" />
      <div className="connection-mark__pieces">
        <div className="connection-mark__half connection-mark__half--left">
          <span className="connection-mark__body" />
          <span className="connection-mark__collar" />
        </div>
        <div className="connection-mark__half connection-mark__half--right">
          <span className="connection-mark__pins" />
          <span className="connection-mark__collar" />
          <span className="connection-mark__body" />
        </div>
      </div>
      <span className="connection-mark__bolt connection-mark__bolt--one" />
      <span className="connection-mark__bolt connection-mark__bolt--two" />
      <span className="connection-mark__bolt connection-mark__bolt--three" />
      <span className="connection-mark__bolt connection-mark__bolt--four" />
      <span className="connection-mark__dot connection-mark__dot--one" />
      <span className="connection-mark__dot connection-mark__dot--two" />
    </div>
  );
}

export function PageLoader() {
  const routeKey = useRouterState({ select: (state) => state.location.pathname });
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setVisible(true);
    setLeaving(false);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 450 : LOADING_DURATION_MS;
    const fadeTimer = window.setTimeout(() => setLeaving(true), duration - 250);
    const hideTimer = window.setTimeout(() => setVisible(false), duration);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [routeKey]);

  if (!visible) return null;

  return (
    <div className={`page-loader no-print ${leaving ? "page-loader--leaving" : ""}`} role="status" aria-label="Loading WattNow">
      <div key={routeKey} className="page-loader__content">
        <img src="/wattnow-logo.png" alt="WattNow" className="page-loader__logo" />
        <ConnectionMark />
        <p className="page-loader__status">Connecting to smarter energy</p>
      </div>
    </div>
  );
}