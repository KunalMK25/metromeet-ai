# Deployment

MetroMeet AI is a **static, build-tool-free site**: `index.html` plus native
ES modules under `src/`. There is nothing to bundle, transpile, or compile —
`npm run build` just assembles a clean `dist/` folder (a straight copy).

## Why no bundler?

- The app is small enough (39 modules) that unbundled ES module resolution
  is fast even over a real network.
- Every file served is the exact, unminified source — great for
  inspectability and for a portfolio/interview context.
- Zero build-tool surface area to keep updated or debug.

If the project grows significantly, swapping in Vite would be a drop-in
change (point it at `index.html`, no source restructuring needed) — see
"Future roadmap" in the [README](../README.md).

## Local development

```bash
npm install
npm run dev        # serves the project root at http://localhost:3000
```

No `.env` file or API keys are required for local development — the AI
assistant automatically falls back to context-aware direct answers and then
an offline bot if the Claude API isn't reachable, and Places automatically
falls back to a curated static dataset if the OpenStreetMap Overpass API
isn't reachable.

## Production build

```bash
npm run build       # → dist/ (index.html + src/, copied as-is)
npm start            # serves dist/ locally, to sanity-check the build
```

## Deploying to Vercel

1. Push the repository to GitHub.
2. In the Vercel dashboard, **Import Project** → select the repo.
3. Vercel reads `vercel.json` automatically:
   - `buildCommand`: `npm run build`
   - `outputDirectory`: `dist`
4. Deploy. No environment variables are required.

Or via the CLI:

```bash
npm install -g vercel
vercel --prod
```

## GitHub Pages compatibility

Since the output is fully static, GitHub Pages works too:

```bash
npm run build
# then publish the dist/ folder via your preferred Pages workflow,
# e.g. `git subtree push --prefix dist origin gh-pages`
# or a GitHub Actions workflow that runs `npm run build` and
# uploads `dist/` as a Pages artifact.
```

The only requirement is that the host serves `.js` files with a JavaScript
MIME type (both Vercel and GitHub Pages do this correctly by default) and
does **not** rewrite `/src/...` paths — this app has no client-side router.

## Verifying a deployment

```bash
npm run verify      # checks every import resolves, no circular deps, no syntax errors
```

Safe to run in CI before every deploy — see `scripts/verify.js`.
