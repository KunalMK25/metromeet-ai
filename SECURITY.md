# Security Policy

## Supported versions

MetroMeet AI is a single-version, actively developed project. Security fixes
are applied to the `main` branch only.

| Version | Supported |
|---|---|
| 6.x (current) | ✅ |
| < 6.0 | ❌ |

## Scope

MetroMeet AI is a **static, client-side-only application** — there is no
backend server, no database, no user authentication, and no persistent
storage of personal data beyond what lives in the browser tab's memory for
the current session (friend names and stations you type in, which are never
sent anywhere except as part of an AI chat request's context).

Network calls this app makes:
- `overpass-api.de` (OpenStreetMap Overpass API) — for live nearby-places data
- `api.anthropic.com` — for the AI assistant's Claude-backed answers

Both are optional at runtime: if either is unreachable, the app degrades
gracefully to offline/static fallbacks (see
[`docs/places.md`](docs/places.md) and [`docs/ai.md`](docs/ai.md)) rather
than failing.

## Reporting a vulnerability

If you discover a security issue (e.g. an XSS vector in rendered content, a
way to exfiltrate data via the AI context, a dependency vulnerability),
please **do not open a public issue**. Instead:

1. Use GitHub's [private vulnerability reporting](../../security/advisories/new)
   feature for this repository, **or**
2. Email the maintainer listed in `package.json`'s `author` field.

Please include:
- A description of the issue and its potential impact
- Steps to reproduce
- Any suggested fix, if you have one

We aim to acknowledge reports within 5 business days.

## Dependencies

This project has exactly one runtime-adjacent dependency
(`serve`, used only for local development — it is never shipped to
production, since Vercel/GitHub Pages serve `dist/` directly). Run
`npm audit` periodically to check for advisories in the dev toolchain.
