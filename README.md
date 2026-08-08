# Room Energy Scan

BUILD PROMPT — AI ROOM ENERGY SCANNER

Build a fully functional, responsive web application called WattSight.

PRODUCT IDEA

WattSight is a camera-based room electricity audit web app designed for users in Indonesia.

The user should NOT need to download an application or purchase any hardware.

The user simply opens the website on a:

Smartphone

Tablet

Laptop

The website accesses the device camera with permission and visually scans a room.

While the camera is running, the application should attempt to detect electrical/electronic devices visible in the camera feed and draw labeled bounding boxes around them in real time.

Examples of detectable electronics:

Air conditioner / AC

Light / lamp

Television

Computer monitor

Laptop

Desktop computer

Speaker

Fan

Standing fan

Ceiling fan

Electric socket / outlet

Power strip

Router / Wi-Fi router

Air purifier

Vacuum cleaner

Refrigerator

Microwave

Rice cooker

Electric kettle

Water dispenser

Projector

Printer

Charger

Game console

Other recognizable electronic appliances

The application should then allow the user to photograph the room together with the detected devices.

The captured image will be analyzed by AI to estimate the electrical characteristics of each detected appliance.

The ultimate purpose is to help users understand:

“How much electricity could this room be using, how much could it cost me, and what can I realistically do to reduce it?”

IMPORTANT PRODUCT PRINCIPLE

Do NOT present estimated wattage as an exact measurement.

A camera cannot determine exact electricity consumption.

Therefore all results must clearly use words such as:

Estimated

Likely

Approximate

Typical range

Confidence level

Example:

Air Conditioner
Estimated power:
400–800 W

NOT:

Power: 623 W

unless the user manually enters an exact model/specification.

Always distinguish between:

DEVICE DETECTED

The appliance exists in the photograph.

and:

LIKELY ACTIVE

The system believes the appliance may currently be operating.

For appliances whose operating state cannot be determined visually, display:

Operating status: Unknown

and allow users to change it manually.

CORE USER FLOW

Create the experience in this order:

STEP 1 — LANDING PAGE

Create a clean, futuristic but friendly landing page.

Main headline:

See Where Your Electricity Goes.

Supporting text:

Scan a room with your camera and let AI estimate the electricity consumption, cost, and possible energy waste around you.

Primary CTA:

Scan a Room

Secondary CTA:

How It Works

Include three simple steps:

Scan

Analyze

Save Energy

Also display:

No additional hardware required.

and:

No app download required.

STEP 2 — CAMERA PERMISSION

When clicking Scan a Room, request camera access using the browser MediaDevices API:

navigator.mediaDevices.getUserMedia()

The application must work on:

Android Chrome

iPhone Safari

iPad

Windows laptop

MacBook

Use responsive camera layouts.

On mobile, preferably request the rear-facing camera:

facingMode: environment

Allow the user to switch:

Front Camera
↔
Back Camera

If camera permission is denied, show:

Camera access is needed to scan your room. You can enable it in your browser permissions.

Also provide:

Upload Photo Instead

as fallback.

STEP 3 — LIVE ELECTRONICS DETECTION

The live camera interface is the main experience.

Display:

Full-screen or large camera preview

Bounding boxes around detected electronics

Device labels

Confidence percentage

Number of electronics detected

Example:

┌─────────────────────────────┐
│ AIR CONDITIONER │
│ 91% confidence │
└─────────────────────────────┘

┌────────────────────┐
│ TELEVISION │
│ 87% │
└────────────────────┘

┌───────────────┐
│ FAN │
│ 83% │
└───────────────┘

At the top display:

Scanning room...

Then dynamically update:

7 electronic devices detected

Use a smooth visual tracking effect.

Bounding boxes should remain approximately attached to objects as the camera moves.

Avoid flickering boxes where possible by using tracking / smoothing between frames.

COMPUTER VISION ARCHITECTURE

Implement the best realistic browser-compatible solution.

Preferred architecture:

LIVE DETECTION

Use a browser-compatible object detection model such as:

TensorFlow.js

ONNX Runtime Web

MediaPipe

YOLO-compatible browser inference

Choose whichever solution is most stable and practical.

The architecture should be modular so the detection model can later be replaced by a custom-trained electronics detection model.

Create a file/module similar to:

src/services/objectDetection.ts

that exposes functions such as:

initializeDetector()

detectObjects(frame)

normalizeDetection()

trackDetections()

Create an electronics class mapping layer.

For generic pretrained models, map recognized classes where possible.

Examples:

tv -> television

laptop -> laptop

refrigerator -> refrigerator

microwave -> microwave

etc.

Because common models may NOT recognize:

Air conditioners

Electrical sockets

Routers

Air purifiers

Ceiling lights

design the architecture so a custom model can later add these classes.

For the hackathon prototype, also use AI image analysis after a photograph is captured to identify electronics that the live object detector missed.

This means:

LIVE DETECTOR

Provides fast bounding boxes.

AI PHOTO ANALYZER

Provides deeper appliance identification and energy estimation.

STEP 4 — CAPTURE BUTTON

Place a large circular camera shutter button at the bottom center.

Label:

Capture & Analyze

When clicked:

Freeze/capture the current camera frame.

Save current object detections.

Display a brief analysis animation.

Send the image to the AI analysis backend.

Identify additional electronics that may have been missed.

Merge duplicate detections.

Generate an editable appliance list.

Do NOT permanently upload camera images unless needed for analysis.

Clearly communicate privacy.

Example:

Your image is used only to analyze the room and is not publicly shared.

STEP 5 — DETECTION REVIEW

Before calculating electricity usage, show:

We Found 8 Devices

Display editable cards:

Air Conditioner

Detected: 94%

Status:
Likely Active

[Active]
[Off]
[Unknown]

Quantity:
1

[Edit]

Television

Detected: 88%

Status:
Likely Off

Quantity:
1

[Edit]

Ceiling Lights

Detected: AI estimate

Quantity:
6

[Edit]

Provide buttons:

+ Add Missing Device

and:

Remove Incorrect Detection

This is extremely important.

AI detection will not always be correct.

Allow users to correct the room before calculation.

STEP 6 — AI APPLIANCE ANALYSIS

For every device, use AI to estimate:

Appliance category

Possible subtype

Approximate size

Approximate wattage range

Typical wattage

Whether it appears active

Confidence level

Example:

Split Air Conditioner

Estimated capacity:
0.5–1 PK

Estimated electrical demand:
400–800 W

Typical estimate:
600 W

Confidence:
Medium

Operating state:
Likely active

For a television:

LED Television

Estimated size:
43–55 inch

Estimated electricity:
60–120 W

Typical estimate:
90 W

DO NOT attempt to identify exact product models unless visually obvious.

If uncertain, use broad ranges.

AI SYSTEM PROMPT

Create a backend AI service with instructions approximately like this:

"You are an energy-efficiency assistant analyzing photographs of indoor spaces.

Identify electrical and electronic appliances visible in the image.

For every appliance:

Identify the general appliance type.

Estimate quantity.

Estimate the likely wattage range based on typical appliances available in Indonesia.

Give a reasonable midpoint estimate.

Determine whether the appliance visually appears active, inactive, or cannot be determined.

Provide a confidence level: high, medium, or low.

Do not invent exact brands or specifications when they are not visible.

Never represent estimated electricity usage as a measured value.

Return structured JSON only.

Example:

{
'devices': [
{
'name': 'Split Air Conditioner',
'quantity': 1,
'powerMinWatts': 400,
'powerMaxWatts': 800,
'typicalWatts': 600,
'status': 'likely_active',
'confidence': 'medium',
'reason': 'Wall-mounted split AC visible'
}
]
}"

Use structured output validation.

STEP 7 — USAGE-TIME INPUT

Power is NOT the same as energy consumption.

Therefore users must be able to specify approximately how many hours each device operates daily.

For each active appliance display:

Air Conditioner

Estimated:
400–800 W

How long do you normally use it?

[ – ] 8 hours/day [ + ]

Provide convenient presets:

1h
2h
4h
8h
12h
24h

The AI can suggest a default based on appliance type, but the user must be able to edit it.

Examples:

Air conditioner:
Suggested 8 h/day

Router:
Suggested 24 h/day

Television:
Suggested 4 h/day

Lights:
Suggested 6 h/day

STEP 8 — ELECTRICITY TARIFF

Create an Indonesian electricity tariff setting.

Do NOT permanently hardcode one tariff because PLN rates may change and tariffs vary by customer category.

Allow:

Electricity Tariff

Rp ______ / kWh

Include:

Use suggested Indonesian household tariff

but make the value configurable in an admin/config file.

Also allow users to manually change it.

Example interface:

Electricity rate:

Rp 1,700 / kWh

[Edit]

Clearly label it as:

Example / configurable estimate

if no confirmed current rate is available.

ENERGY CALCULATION

Use these formulas.

For every appliance:

Minimum daily energy

(minimum watts × usage hours) / 1000

Maximum daily energy

(maximum watts × usage hours) / 1000

Result:

kWh/day

Daily cost

daily kWh × electricity tariff

Monthly cost

daily cost × 30

Annual cost

daily cost × 365

Calculate both:

MINIMUM

and:

MAXIMUM

where wattage estimates are ranges.

Example:

Air Conditioner

400–800 W

8 hours/day

= 3.2–6.4 kWh/day

At example tariff:

Rp1,700/kWh

= approximately:

Rp5,440–Rp10,880/day

and:

Rp163,200–Rp326,400/month

STEP 9 — RESULTS DASHBOARD

Create a visually impressive results page.

Main headline:

Your Room Energy Scan

Display four main cards:

DEVICES

8 detected

ESTIMATED ACTIVE POWER

1.2–2.1 kW

ESTIMATED MONTHLY ENERGY

220–370 kWh

ESTIMATED MONTHLY COST

Rp374,000–Rp629,000

Use Indonesian Rupiah formatting.

Example:

Rp 374.000

not:

$374

DEVICE BREAKDOWN

Show cards or a horizontal bar chart:

Air Conditioner

400–800 W

8 h/day

Estimated monthly cost:

Rp163.000–Rp326.000

Contribution:

47%

Lighting

60–120 W

6 h/day

Estimated monthly cost:

Rp18.000–Rp37.000

Contribution:

6%

Rank devices from highest estimated electricity consumption to lowest.

Headline:

Biggest Energy Users

Air Conditioner

Television

Lighting

Monitor

Router

ROOM ENERGY SCORE

Create a score:

WATTSIGHT SCORE

Example:

72 / 100

Categories:

90–100
Excellent

75–89
Efficient

60–74
Moderate

40–59
High Consumption

0–39
Very High Consumption

Do NOT judge purely based on total watts.

Consider:

Number of appliances

Expected room type

Estimated usage duration

Dominance of high-energy devices

Devices possibly running unnecessarily

Estimated standby load

Ask user to select the room type before final judgement:

Bedroom

Classroom

Living room

Office

Kitchen

School room

Meeting room

Other

Also optionally ask:

How many people normally use this room?

This improves context.

ENERGY VERDICT

Create an AI-generated summary.

Example:

Your energy use is slightly high.

Most of the estimated electricity consumption comes from the air conditioner, which represents approximately 52% of the room's estimated electricity use.

Your lighting and electronics appear reasonable, but reducing AC runtime by approximately two hours per day could have the largest effect.

Never say the result is definitely accurate.

Use:

Based on the appliances detected and your estimated usage...

STEP 10 — AI ENERGY COACH

Generate personalized recommendations based ONLY on appliances actually detected.

Avoid generic advice.

BAD:

"Turn off lights."

GOOD:

"Your scan detected six ceiling lights. If daylight is available near the windows, consider using only the lights farther from the windows during daytime."

Example:

Your Top 3 Opportunities

1. Optimize AC usage

Estimated impact:

High

Your AC is likely the largest electricity user in this room.

Current estimate:

8 h/day

Try:

6 h/day

Possible monthly saving:

Rp41.000–Rp82.000

2. Reduce standby electronics

Detected:

TV
Speaker
Monitor

If these remain connected when not used, standby consumption may accumulate.

Potential impact:

Low–Medium

3. Use natural daylight

Six lights were detected near a large window.

During sufficiently bright daytime conditions, consider reducing the number of lights in use.

Potential impact:

Medium

ENERGY SIMULATOR

Create one of the most important interactive features:

WHAT IF?

Users can change behaviors using sliders.

Example:

AC usage

Current:
8 h/day

Proposed:
6 h/day

Result immediately changes:

Before:

Rp520.000/month

After:

Rp451.000/month

YOU COULD SAVE

Rp69.000/month

Rp828.000/year

This makes the application actionable rather than simply informative.

POWER TOGGLE SIMULATION

For every detected appliance provide:

[Include]
[Exclude]

Users can simulate:

What if I turn this appliance off?

Totals update instantly.

ENERGY WASTE DETECTION

Create AI-generated warnings where appropriate.

Examples:

POSSIBLE ENERGY WASTE

⚠ Television appears active but no viewer is visible.

Word this carefully:

Possible unnecessary usage detected

not:

The TV is being wasted.

MULTIPLE COOLING DEVICES

AC + fan detected.

Do NOT automatically call this waste because combined fan and AC operation may allow higher AC temperature settings.

Instead say:

AC and fan detected together. Using a fan may allow a higher AC temperature setting while maintaining comfort.

DAYLIGHT OPPORTUNITY

Bright window area + lights active.

Display:

Natural daylight may be available. Consider whether all detected lights are necessary.

SAVINGS CALCULATOR

Calculate savings for recommendations.

Example:

Current AC use:

600 W × 8 h/day

Proposed:

600 W × 6 h/day

Difference:

1.2 kWh/day

Monthly:

36 kWh/month

At tariff:

Rp1,700/kWh

Estimated saving:

Rp61,200/month

Display ranges when input wattage is a range.

IMAGE RESULT

Save/display the captured room image on the result page.

Overlay bounding boxes and labels.

Users should be able to toggle:

Show Detection

ON / OFF

Example:

[Image]

Air Conditioner — 94%

Television — 88%

Light ×6 — AI detected

Fan — 82%

DOWNLOAD / SHARE REPORT

Allow users to generate a simple digital report.

Title:

WattSight Room Energy Report

Include:

Captured image

Detected electronics

Estimated wattage

Estimated operating hours

Estimated monthly energy

Estimated cost in Rupiah

Biggest electricity user

WattSight Score

Top recommendations

Potential monthly savings

Allow:

Download Report

and:

Share Result

For the MVP, generating a browser-printable report is acceptable.

HISTORY

Users should NOT be forced to create an account.

The first scan must work without signup.

After receiving results, optionally display:

Want to compare this room later?

Then offer:

Save Scan

Allow optional authentication.

Use:

Supabase Auth

or equivalent.

History page:

My Energy Scans

Bedroom
Aug 8

Rp420k–Rp610k/month

Classroom
Aug 4

Rp670k–Rp910k/month

Allow users to compare scans.

BEFORE VS AFTER

Allow users to scan the same room again later.

Display:

ENERGY PROGRESS

Previous:

Rp620k estimated/month

Current:

Rp510k estimated/month

Difference:

↓ Rp110k

Estimated improvement:

17.7%

This creates long-term value.

NO DOWNLOAD REQUIREMENT

Build WattSight primarily as a:

Progressive Web App / responsive website.

Users should be able to:

Open link

Give camera permission

Scan room

Receive analysis

without installing anything.

Optionally allow:

Add WattSight to Home Screen

after repeated use.

Do NOT force installation.

DESIGN LANGUAGE

Make the application look like a polished startup product rather than a school assignment.

Design inspiration:

clean AI tools

computer vision interfaces

modern energy dashboards

minimal futuristic UX

Use:

Dark charcoal backgrounds for scanner screens

White/light content areas for reports

Electric green or lime accents for energy savings

Subtle yellow for electricity

Red/orange only for warnings

Rounded cards

Smooth animations

Large typography

Strong spacing

Avoid excessive eco clichés such as:

too many leaves

trees everywhere

green gradients everywhere

This is an energy intelligence product, not a generic environmental website.

CAMERA SCREEN DESIGN

Create something visually similar to an AI computer vision interface.

Top:

WattSight

● LIVE

7 devices

Center:

Camera feed with object boxes.

Bottom:

[ Gallery ]

[ LARGE CAMERA BUTTON ]

[ Switch Camera ]

Also show:

Move slowly around the room

and:

Keep electronics visible for better detection

ANALYZING ANIMATION

After capturing:

Scanning Electronics...

Then animate stages:

✓ Objects identified

✓ Appliance types estimated

✓ Electricity ranges calculated

✓ Cost estimated

✓ Energy opportunities found

Then transition to results.

TECHNOLOGY STACK

Preferred:

Frontend

React

TypeScript

Tailwind CSS

Vite or framework supported best by Lovable

Backend

Supabase

Use:

database

optional authentication

scan history

API / Edge Functions where appropriate

Computer Vision

Browser-side model where possible:

TensorFlow.js

or

ONNX Runtime Web

or

MediaPipe

Use a modular detector architecture.

AI IMAGE ANALYSIS

Use a multimodal vision-capable AI API through a secure backend / server-side function.

Never expose secret API keys in frontend code.

Store API keys only in environment variables / secrets.

MOCK MODE

VERY IMPORTANT FOR DEVELOPMENT AND HACKATHON DEMO.

If the live object-detection model or AI API is unavailable, include:

DEMO MODE

Provide several sample room images and realistic predefined detections.

Example:

Classroom Demo

Detected:

1 AC

8 lights

1 projector

1 computer

2 speakers

This ensures the application remains demoable even if internet/model inference fails during judging.

Make Demo Mode clearly labeled.

OBJECT DETECTION FALLBACK

If a browser device cannot run the real-time detector efficiently:

Keep the live camera preview.

Capture a still image.

Perform AI vision detection after capture.

Draw the returned bounding boxes afterward.

Do NOT block the user from using WattSight because live detection is unsupported.

PERFORMANCE

Optimize for phones.

Do NOT process every camera frame.

For example run detection:

approximately 2–5 times per second

depending on device performance.

Resize inference frames for efficiency.

The camera preview can remain high resolution while the AI model uses reduced resolution.

Show loading states.

Prevent the UI from freezing.

PRIVACY

Include a privacy message:

Your camera feed stays private. WattSight only analyzes frames necessary for device detection. Captured images are not publicly shared.

Where technically possible:

perform live object detection locally in the browser.

Only upload a captured still image when deeper AI analysis is requested.

Allow:

Delete scan

for saved scans.

ACCESSIBILITY

Support:

Mobile screens

Tablet screens

Desktop

Keyboard navigation

High color contrast

Clear button labels

Do not communicate warnings using color alone.

DATA STRUCTURE

Create an Appliance object similar to:

interface Appliance {
  id: string;
  name: string;
  category: string;
  quantity: number;

  detectionConfidence?: number;

  powerMinWatts: number;
  powerMaxWatts: number;
  typicalWatts: number;

  status:
    | "active"
    | "off"
    | "unknown"
    | "likely_active"
    | "likely_off";

  hoursPerDay: number;

  dailyKwhMin?: number;
  dailyKwhMax?: number;

  monthlyCostMin?: number;
  monthlyCostMax?: number;

  source:
    | "live_detector"
    | "ai_image"
    | "user_added";
}


REQUIRED PAGES

Build:

Landing Page

Camera Scanner

Detection Review

Energy Analysis

Results Dashboard

What-If Simulator

Scan History

Scan Comparison

About / Methodology

Privacy Page

METHODOLOGY PAGE

This page is important for scientific credibility.

Explain:

WattSight does not measure electricity directly.

WattSight estimates electricity use based on:

Visually detected appliance type

Typical wattage ranges

User-confirmed operating status

User-estimated operating duration

Electricity tariff

Clearly explain:

Actual electricity consumption may differ depending on appliance model, age, operating mode, inverter technology, temperature settings, and user behavior.

Recommend checking:

appliance energy labels

model specifications

electricity meter readings

for exact measurements.

IMPACT METRICS

Track statistics such as:

Devices analyzed

Estimated kWh identified

Potential electricity savings

Potential Rupiah savings

Rooms scanned

For saved users, optionally display:

Your Potential Impact

Possible monthly saving:

Rp135.000

Possible annual saving:

Rp1.620.000

Electricity avoided:

XX kWh/year

Do NOT exaggerate CO2 reduction unless a verified emissions factor is available.

SPECIAL HACKATHON FEATURE — ENERGY BLIND SPOT

Create a feature called:

Energy Blind Spot

The AI identifies one appliance that the user may underestimate.

Example:

Your Energy Blind Spot: Air Conditioner

Only 1 of your 9 detected devices is an air conditioner, but it may account for approximately:

54% of your room's electricity consumption.

This should make the result memorable and educational.

SPECIAL FEATURE — ONE CHANGE

At the bottom of every analysis give exactly one strongest recommendation:

If You Change Only One Thing...

Example:

Reduce AC operation from approximately 8 hours to 6 hours per day.

Potential saving:

Rp43.000–Rp86.000/month

This prevents overwhelming the user with too many recommendations.

HACKATHON STORY

The application's core problem is:

People receive an electricity bill showing the total amount they consumed, but they often cannot visually understand which objects around them are responsible for that consumption.

WattSight converts an ordinary camera into an electricity-awareness interface.

Instead of:

"Your household used 300 kWh."

WattSight lets people look around their room and understand:

That AC matters more than those six lights.

The innovation is not measuring electricity through hardware.

The innovation is making electricity consumption visible and understandable through computer vision and AI.

CORE VALUE PROPOSITION

Use this wording prominently:

Point. Scan. Understand your electricity.

Alternative supporting line:

Turn any camera into an instant visual energy audit.

CRITICAL REQUIREMENTS

The final application MUST:

Work as a website

Require no custom hardware

Request device-camera permission

Work on phone, tablet, and laptop

Have upload-photo fallback

Detect electronics visually

Draw bounding boxes

Allow a user to capture a photograph

Allow users to correct AI detections

Estimate appliance wattage as ranges

Calculate estimated energy consumption

Calculate estimated electricity cost in Indonesian Rupiah

Allow configurable Rp/kWh electricity tariff

Ask/allow users to edit daily usage duration

Rank devices by electricity consumption

Estimate total room electricity consumption

Determine whether usage appears low/moderate/high WITH context

Explain uncertainty

Generate personalized energy-saving recommendations

Calculate possible monetary savings

Include a What-If simulator

Work without mandatory signup

Be mobile-first

Include Demo Mode

Never claim estimates are actual electrical measurements

Focus first on building a working end-to-end MVP:

Camera
→ Detection
→ Capture
→ Review
→ AI Analysis
→ Wattage Estimate
→ Rupiah Estimate
→ Energy Score
→ Personalized Recommendation

Do not spend excessive development time on decorative secondary features until this complete core flow works.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://scan-see-save.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d80be36c-d71f-4c0c-9bd7-02b73da104d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
