# Contributing to MetroMeet AI

Thanks for considering a contribution! This project intentionally stays
small, build-tool-free, and dependency-light — please read the notes below
before opening a PR so your change fits the project's grain.

## Getting started

```bash
git clone https://github.com/<your-username>/metromeet-ai.git
cd metromeet-ai
npm install
npm run dev      # http://localhost:3000
npm run verify    # check imports/exports/circular deps before you start
```

No API keys or `.env` file are needed — the app gracefully falls back to
offline behavior for both the AI assistant and the Places provider.

## Project ground rules

1. **One-directional dependencies.** `data → core → places → rendering → ai
   → ui → main`. `diagnostics/` may depend on anything; nothing may depend on
   `diagnostics/`. See [`docs/architecture.md`](docs/architecture.md).
2. **No new build tools without discussion.** This project deliberately ships
   unbundled ES modules. If your change genuinely needs a bundler, open an
   issue first — that's a bigger conversation than a single PR.
3. **Keep algorithms and their tests together.** If you touch `core/`,
   `rendering/`, `places/`, or `ai/` behavior, run the Diagnostics suite
   (`DEBUG=true` in `src/config/FeatureFlags.js`, then `await
   runDiagnostics()` in the console) and make sure it's still 29/29 — or add
   a new test in `diagnostics/Diagnostics.js` if you added new behavior worth
   covering.
4. **Match the existing style.** Look at a neighboring file in the same
   folder before introducing a new pattern.

## Making a change

1. Fork the repo and create a branch: `git checkout -b feature/my-change`.
2. Make your change.
3. Run `npm run verify` — this must pass.
4. If you touched app behavior, run the Diagnostics suite and confirm 29/29.
5. Update relevant docs under `docs/` if the public behavior or API changed.
6. Open a PR using the provided template.

## Adding a new module

- **New Places provider**: implement `getNearbyPlaces(station, categories)`
  in `places/providers/`, register it in `places/PlacesService.js`. See
  [`docs/places.md`](docs/places.md).
- **New Diagnostics test**: `Diagnostics.register('YourSuite', 'test name',
  () => { ...assert... })` — one call, no framework changes needed.
- **New rendering overlay**: add a function alongside
  `drawHoverOverlay`/`drawFriendMarkers`/`drawMeetupMarker` in
  `rendering/overlays.js`, call it from `performDraw()`.

## Reporting bugs / requesting features

Please use the issue templates — they help us triage faster.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
