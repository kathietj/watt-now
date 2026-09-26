import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { TARIFF_CONFIG } from "@/lib/energy";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "How WattNow Estimates Electricity — Methodology" },
      {
        name: "description",
        content:
          "WattNow does not measure electricity. Here is exactly how appliance detection, typical wattage ranges, usage hours and tariffs turn into an estimate.",
      },
      { property: "og:title", content: "How WattNow Estimates Electricity" },
      {
        property: "og:description",
        content: "The assumptions, formulas and limitations behind every WattNow number.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">About &amp; Methodology</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          WattNow does not measure electricity directly. It estimates it.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">What WattNow actually uses</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• The appliance types visually detected in your photo.</li>
            <li>• Typical wattage ranges for comparable appliances available in Indonesia.</li>
            <li>• The operating status you confirm (active, off, or unknown).</li>
            <li>• The daily operating duration you estimate.</li>
            <li>• The electricity tariff you configure.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">The formulas</h2>
          <pre className="panel overflow-x-auto p-5 font-mono text-xs leading-relaxed">
{`daily kWh (min) = (min watts × quantity × hours) ÷ 1000
daily kWh (max) = (max watts × quantity × hours) ÷ 1000

daily cost   = daily kWh × tariff (Rp/kWh)
monthly cost = daily cost × 30
annual cost  = daily cost × 365`}
          </pre>
          <p className="text-sm text-muted-foreground">
            Because wattage is a range, every cost is shown as a range too.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Detection: two layers</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A browser-side object detector (TensorFlow.js) runs locally on the video stream a few
            times per second to draw live bounding boxes. Generic pretrained models do not recognise
            air conditioners, sockets, routers, air purifiers or ceiling lights, so after you capture
            a frame a multimodal AI vision model analyses the still image to identify appliances the
            live detector missed. The detector layer is modular, so a custom-trained electronics model
            can replace it later.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Tariff</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The default rate is an <strong className="text-foreground">example, configurable
            estimate</strong> of{" "}
            <span className="font-mono">
              Rp {new Intl.NumberFormat("id-ID").format(TARIFF_CONFIG.defaultRpPerKwh)}/kWh
            </span>
            . PLN rates change over time and vary by customer category, so you can edit it on the
            results page at any time.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Limitations</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Actual electricity consumption may differ depending on appliance model, age, operating
            mode, inverter technology, temperature settings and user behaviour. A camera cannot see
            whether an inverter AC is cycling at partial load, and it cannot read a nameplate that is
            not visible.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            For exact figures, check your appliance energy labels, the model specification sheet, and
            your electricity meter readings.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Language we use</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            "Device detected" means the appliance appears in the photograph. "Likely active" means the
            system believes it may currently be operating. When operating state cannot be determined
            visually, WattNow shows "Unknown" and asks you to decide. Estimates are never presented
            as measurements.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
