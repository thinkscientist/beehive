# AGENTS.md

Guidance for automated agents (and humans) working in this repository. It
describes how to work well with the Hive harness. For the project overview see
[`README.md`](README.md).

## Project

Static website built with React 19, Vite, TypeScript and the IBM Carbon Design
System (`@carbon/react`), with `react-router-dom` for client-side routing and
Sass for styles.

| Path                | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `src/main.tsx`      | Entry point; mounts `App` inside the router                             |
| `src/App.tsx`       | Root component; route definitions                                       |
| `src/components/`   | Shared components (`Layout` UI Shell, `ErrorBoundary`)                  |
| `src/pages/`        | One component per route (Home, About, Contact, NotFound, CUGA, Hive)    |
| `src/data/`         | Shared static data (agent roster)                                       |
| `src/lib/`          | Client helpers for the `/api` server                                    |
| `src/index.scss`    | Global styles                                                           |
| `src/test/setup.ts` | Vitest setup (`@testing-library/jest-dom`)                              |
| `server/`           | Small Node server that keeps live-service credentials out of the bundle |
| `vite.config.ts`    | Vite and Vitest configuration (jsdom)                                   |
| `eslint.config.js`  | ESLint flat config (typescript-eslint, hooks)                           |

## Commands

Run `npm ci` once, then use the scripts below. These are the same checks a
reviewer will run, so run them before opening a PR.

| Command                 | Use                                  |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start the dev server                 |
| `npm run build`         | Type-check (`tsc -b`) and build      |
| `npm run preview`       | Serve the production build locally   |
| `npm run server`        | Start the `/api` server (`server/`)  |
| `npm run lint`          | ESLint                               |
| `npm run format`        | Format with Prettier                 |
| `npm run format:check`  | Prettier check                       |
| `npm test`              | Unit tests (Vitest, single run)      |
| `npm run test:coverage` | Tests with coverage; fails under 80% |

A change is ready only when `npm run lint`, `npm run format:check`,
`npm test` and `npm run build` all pass.

## Working agreements

- **Surgical, PR-sized changes.** One concern per PR. Do not mix refactors,
  formatting sweeps or dependency bumps with a feature or fix.
- **Smallest complete change.** No speculative abstractions or drive-by
  cleanups. Every changed line should trace back to the issue.
- **Follow existing patterns** in the file and directory you are editing before
  introducing a new one.
- **Tests ship with behaviour changes.** Add or update a Vitest test (React
  Testing Library, files named `*.test.tsx` next to the code) that fails
  without the change.
- **Prefer Carbon components** over hand-rolled UI. Use Carbon tokens and
  typography instead of ad-hoc colours and sizes.
- **Keep public names working.** Add new routes, ids and config keys; do not
  rename existing ones.
- **Do not commit** `node_modules/`, `dist/`, `coverage/` or secrets.

## Code style

Formatting is enforced by Prettier (`.prettierrc.json`: no semicolons, single
quotes, trailing commas). Do not hand-format; run `npm run format`. Lint rules
live in `eslint.config.js`; do not disable a rule to make a check pass without
explaining why in the PR.

## Git and PR conventions

- Branch from a fresh `origin/<default-branch>`.
- Sign every commit off (DCO): `git commit -s`.
- Title prefix by type: ✨ feature, 🐛 fix, 📖 docs or proposal, ⚠️ breaking,
  🌱 chore/other.
- Reference the issue in the PR body: `Closes #N` when it fully resolves the
  issue, `Refs #N` (with what is left and why) when it does not.
- Explain _why_ in the PR body; the diff already shows _what_.

## Hive guardrails

- Work only on issues you have claimed (`hive/in-progress` label). Leave issues
  that are already claimed, or labelled `hold`, `on-hold` or `do-not-merge`,
  alone.
- Do not merge PRs and do not remove the `hold` label; a human does that.
- Before starting, check open PRs for overlap with the files you intend to
  touch. If another PR covers the ground, pick something else.
- Changes under `.github/workflows/` cannot be pushed by agents at the
  contributor tier. File an issue with the exact replacement text and note that
  a human or merge-tier agent must apply it.
- Never print, commit or send credentials or harness tokens.
