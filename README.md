# Medically Modern — CGM Funnel Redesign

Redesigned CGM patient intake funnel for [Medically Modern](https://medicallymodern.com), built around a **qualify → validate → route → collect → connect** flow inspired by high-conversion telehealth funnels (Hims, etc.).

## The Problem

Current flow: Patient fills a big form → becomes cold lead → team tries calling 10 times → low conversion.

## The New Flow

1. **Qualify** — One question per screen: diabetes status, insulin use, insurance type
2. **Validate** — "Great news — your CGM should be covered" with trust triggers
3. **Route** — CGM preference (Dexcom / Libre / Not sure)
4. **Collect** — Streamlined patient info form (name, phone, DOB, email, doctor)
5. **Connect** — Confirmation with next steps + instant call/SMS option

## Key Design Decisions

- **One question per screen** — reduces cognitive load for Medicare-aged patients
- **Qualifying questions come before PII** — patient is invested before giving personal info
- **Emotional interstitials** — trust-building screens between questions maintain momentum
- **Immediate engagement on confirmation** — call button + SMS auto-trigger, no cold follow-up
- **Progress bar** — visual indicator of completion keeps patients moving forward
- **Mobile-first** — large tap targets, clean typography, works on any device

## Running Locally

Open `cgm-funnel/index.html` in a browser. No build step needed — it's vanilla HTML/CSS/JS.

## Live Preview

Enable GitHub Pages on this repo (Settings → Pages → Source: main branch) to get a shareable link.

## Structure

```
cgm-funnel/
├── index.html              # Main funnel page
├── assets/
│   ├── css/funnel.css      # All styles
│   ├── js/funnel.js        # Funnel logic & state management
│   └── images/             # Product images, logos
```

## TODO

- [ ] Connect form submission to Monday.com / CRM API
- [ ] Add SMS auto-trigger on form completion
- [ ] Add AI chat rep layer (Step 4 from boss's spec)
- [ ] A/B test against current JotForm intake
- [ ] Add analytics/pixel tracking per step
