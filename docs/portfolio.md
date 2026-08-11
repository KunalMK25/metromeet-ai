# Portfolio Material

Reusable descriptions and talking points for presenting this project outside
the repository — resume, LinkedIn, a portfolio site, or an interview.

---

## Resume project description

**MetroMeet AI — Fairness-First Transit Meetup Planner** *(personal project)*

> Designed and built a graph-based meetup planner for Bangalore's metro
> network from scratch: a weighted-graph Dijkstra routing engine, a custom
> fairness-first optimization algorithm (minimizes worst-case travel time
> rather than total/average), a cached canvas rendering pipeline, a
> context-aware AI assistant with a real LLM fallback chain, and a
> 29-test automated diagnostics suite — architected as 39 dependency-ordered
> ES modules with zero circular imports and no build tooling.

**One-line version:** *Built a fairness-first metro meetup planner (weighted
Dijkstra + custom optimization algorithm) as a 39-module vanilla JS
architecture with a full automated test suite.*

## LinkedIn project description

> 🚇 **MetroMeet AI** — I built a meetup planner for Bangalore's Namma Metro
> that answers a harder question than "what's the midpoint": *where can a
> group meet such that no one person gets stuck with a brutal commute while
> everyone else's is short?*
>
> Under the hood: a weighted graph over the real metro network (interchange
> penalties emerge from the graph structure — never hardcoded per station),
> Dijkstra's algorithm, and a custom scoring function that treats fairness as
> the primary objective, with nearby-hangout quality (pulled from live
> OpenStreetMap data) as a tie-breaker.
>
> I also built a context-aware AI layer — it answers "why did you pick this
> station?" from the actual computed data first, and only calls out to
> Claude for genuinely open-ended questions — plus a from-scratch canvas
> rendering engine with multi-layer caching, and a 29-test diagnostics suite
> that's completely stripped from the production bundle.
>
> No framework, no bundler — 39 hand-organized ES modules with a strict
> one-directional dependency graph. Live demo + source: [link]

## GitHub repository description

> Fairness-first meetup planner for the Bangalore Namma Metro — weighted-graph
> Dijkstra routing, a custom optimization algorithm, a context-aware AI
> assistant, live nearby-places data, and a cached canvas map renderer. Zero
> build tools, 39 dependency-ordered ES modules, 29-test diagnostics suite.

## Repository topics (GitHub)

```
javascript, es-modules, dijkstra, graph-algorithms, canvas, vanilla-js,
transit, bangalore, namma-metro, optimization-algorithm, ai-assistant,
claude-api, static-site, vercel, no-framework
```

## Portfolio website description

> **MetroMeet AI** is a full-stack-feeling client-side application that
> solves a genuinely non-trivial optimization problem: finding a metro
> station where a group of friends can meet without any one person bearing
> an unfair travel burden. It combines classic graph algorithms (Dijkstra
> over a custom line-aware weighted graph), a hand-designed multi-term
> scoring function, a from-scratch canvas rendering engine with several
> layers of caching, a context-aware AI assistant with a three-tier fallback
> chain (data-grounded answers → live LLM → offline bot), and a real
> automated test suite — all built without a framework or bundler, as 39
> modules with a strict, verified dependency order.

## Interview talking points

- **The fairness-vs-total-distance trade-off.** Most "find a midpoint" tools
  minimize total or average distance, which can strand one person with a bad
  commute so the average looks good. I designed a scoring function where the
  fairness term (spread between fastest and slowest traveler) is *squared*,
  so it dominates for meaningfully unfair candidates but still yields to a
  clearly faster option — a genuine multi-objective optimization decision,
  not just "shortest path."
- **Why interchange penalties live in the graph, not in `if` statements.**
  Early on, interchange detection was a bug: any trip passing *through* a
  physical interchange station (even staying on the same line) was
  incorrectly charged a transfer penalty. The fix was architectural — model
  each line through an interchange station as a *separate graph node*, so a
  same-line trip never touches the interchange edge at all. This is a good
  example of "the right data structure eliminates a whole bug class" rather
  than patching symptoms.
- **Why there's no framework or bundler.** A deliberate scope decision: at 39
  modules and ~3,500 lines, native ES module resolution is fast enough that
  a bundler would add build-tool surface area without a corresponding
  benefit — and it keeps every file inspectable exactly as shipped. I can
  talk through when that trade-off would flip (see below).
- **The ES-module circular-import constraint during modularization.** When I
  split the original single-file app into modules, I hit a real technical
  wall: the renderer needed the scheduler to call it back, and the scheduler
  couldn't statically import the renderer without creating a cycle. Fixed
  with a small dependency-inversion seam (`setDrawCallback`) — a concrete
  example of a language/module-system constraint forcing an actual
  architecture decision, not just code-moving.
- **Diagnostics that cost nothing in production.** The 29-test suite is
  loaded via a *dynamic* `import()` gated behind a `DEBUG` flag, so in a
  production build the test code isn't just "not run" — it's never fetched
  or parsed at all.
- **Graceful degradation as a design principle, not an afterthought.** Both
  the AI assistant and the Places provider have explicit fallback chains
  (live → cached/static → offline), and I wrote error boundaries around
  canvas rendering itself so a single bad frame can't cascade into a broken
  session.

## Design decisions

| Decision | Reasoning |
|---|---|
| No framework (React/Vue/etc.) | App state is small and mostly graph/canvas-driven — a framework's reactivity model wasn't buying much over direct DOM updates, and it kept the "no build step" property |
| No bundler | Small enough module count that unbundled resolution is fast; maximizes inspectability | 
| Interchange penalty as a graph edge, not a flag | Eliminates a whole class of "did I remember to check the interchange flag here" bugs |
| Squared fairness term in scoring | Encodes "somewhat unfair is bad, very unfair is much worse" without a lookup table |
| Three-tier AI fallback (direct answer → Claude → offline bot) | Correctness and availability over always-call-the-LLM; most questions the app can already answer are guaranteed accurate this way |
| Diagnostics via dynamic import | True zero production cost, not just "gated off" |

## Trade-offs (things I'd reconsider at a larger scale)

- **No bundler** stops being free once the module count or dependency tree
  grows significantly — see [`docs/deployment.md`](deployment.md) for where
  that line is and how Vite would slot in without restructuring.
- **No framework** means manual DOM diffing for the friends list / chat —
  fine at this scale, would need a real reconciliation strategy (or a
  framework) if the UI got much more dynamic.
- **Client-side-only** means the AI/Places API calls happen straight from
  the browser; a production product handling real user data would want a
  thin backend to hold API keys server-side rather than relying on the
  Claude-artifact-style keyless call this demo uses.

## Common interview questions (and how this project answers them)

**"Walk me through a hard bug you fixed."**
→ The interchange-penalty bug above — good story arc (symptom → root cause
in the data model → structural fix → regression test in Diagnostics).

**"Tell me about a time you had to make an architecture trade-off under a
constraint you didn't choose."**
→ The ES-module circular-import / `setDrawCallback` story.

**"How do you think about testing without a formal test framework?"**
→ The hand-rolled Diagnostics suite: registration pattern, assertion helper,
DEBUG-gated dynamic import, and why it's isolated from production paths.

**"How would you scale this?"**
→ Bundler swap-in point, backend-for-API-keys, and the rendering layer's
explicit extensibility for a future live-vehicle overlay
(see [`docs/renderer.md`](renderer.md#future-extensibility)).
