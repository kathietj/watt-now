import type { BoxDetection } from "@/lib/energy";

/** Draws labelled bounding boxes over a camera preview or captured image. */
export function DetectionOverlay({
  boxes,
  className = "",
  compact = false,
}: {
  boxes: BoxDetection[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {boxes.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-lg border-2 border-primary shadow-[0_0_24px_-6px_var(--primary)] transition-all duration-200 ease-out"
          style={{
            left: `${b.x * 100}%`,
            top: `${b.y * 100}%`,
            width: `${b.w * 100}%`,
            height: `${b.h * 100}%`,
          }}
        >
          <span
            className={`absolute -top-px left-0 -translate-y-full whitespace-nowrap rounded-t-md bg-primary px-1.5 font-mono font-semibold uppercase tracking-wide text-primary-foreground ${
              compact ? "text-[9px]" : "text-[10px] sm:text-xs"
            }`}
          >
            {b.label} · {Math.round(b.score * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
