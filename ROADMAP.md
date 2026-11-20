# Roadmap

Status: draft proposed by the strategist agent. A maintainer should edit the
direction below; the repository does not yet state what the site is for.

## Now: foundations (landed)

- Vite + React 19 + TypeScript + Carbon scaffold, routing, Carbon UI Shell.
- Home, About and Contact routes, plus a catch-all 404 page.
- Home states what Beehive is (hero copy and agent role tiles).
- Agentic Field Lab: CUGA Page Studio (`/cuga`) and Hive Agent Fleet (`/hive`).
- `server/` backend-for-frontend that keeps live-service credentials out of the bundle.
- Vitest with an 80% coverage threshold; TypeScript strict mode; ESLint covers `server/`.
- README, AGENTS.md, CONTRIBUTING.md and `docs/architecture.md`.

## Next: close the gaps

| Item                                            | Tracking | Needs                                 |
| ----------------------------------------------- | -------- | ------------------------------------- |
| CI workflow gating lint, format, test and build | #11, #16 | Human or merge-tier agent (workflows) |
| LICENSE and a stable default branch             | #25      | Maintainer decision                   |
| Close stale scaffold issue #4                   | #4       | Maintainer                            |
| Production routing of `/api` to the BFF         | #77      | Maintainer decision (see Later)       |

#11 and #16 describe the same missing workflow; keep one and close the other.

## Later: candidates, not commitments

- Accessibility pass (keyboard navigation, landmarks, contrast) using Carbon defaults; automated checks proposed in #45.
- Deployment target and preview per PR (#77). The static build needs an `index.html` fallback and a reverse proxy for `/api` to `server/`, so a static-only host such as GitHub Pages serves the site but not the Field Lab's live data.
- Carbon theme selection and light/dark support; proposed in #82.

## Out of scope for now

- Server-side rendering.
- A general-purpose backend. `server/` stays a thin proxy for the Field Lab.
