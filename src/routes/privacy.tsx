import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — WattNow" },
      {
        name: "description",
        content:
          "How WattNow handles your camera feed: live detection runs locally, and only a captured still image is sent for deeper AI analysis.",
      },
      { property: "og:title", content: "Privacy — WattNow" },
      { property: "og:description", content: "Your camera feed stays private." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your camera feed stays private. WattNow only analyzes frames necessary for device
          detection. Captured images are not publicly shared.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Live detection is local</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            While the camera is open, object detection runs inside your browser using an on-device
            model. Those video frames are never uploaded.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Captured images</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When you press "Capture &amp; Analyze", one still image is sent to the AI vision service
            so it can identify appliances the live detector missed. It is used only to analyze that
            room, is not stored permanently by WattNow, and is not published anywhere.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Saved scans</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Saved scans live in your own browser storage on this device. No account is required, and
            you can delete any scan from the History page at any time.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Permissions</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Camera access is requested only when you start a scan and stops as soon as you leave the
            scanner. You can always use "Upload Photo Instead" or Demo Mode without granting camera
            access.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
