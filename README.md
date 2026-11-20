# Beehive

Static website built with React 19, Vite, TypeScript and the IBM Carbon Design
System (`@carbon/react`), with `react-router-dom` for client-side routing and
Sass for styles.

## Prerequisites

- Node.js 22.13 or later. The locked toolchain needs it: `vitest` requires `^22.12.0 || ^24.0.0 || >=26.0.0` and `eslint` requires `^20.19.0 || ^22.13.0 || >=24`.
- npm (bundled with Node.js).

## Getting started

```sh
npm ci
npm run dev
```

## Project structure

| Path                | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `src/main.tsx`      | Entry point; mounts `App` inside the router              |
| `src/App.tsx`       | Root component; route definitions                        |
| `src/components/`   | Shared components (`Layout` UI Shell)                    |
| `src/pages/`        | Page components (`Home`, `About`, `Contact`, `NotFound`) |
| `src/index.scss`    | Global styles and IBM Carbon Design System imports       |
| `src/test/setup.ts` | Vitest setup (`@testing-library/jest-dom`)               |

## Before you open a PR

Run `npm run lint`, `npm run format:check`, `npm test` and `npm run build`; all four must pass.

## Scripts

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start the dev server                    |
| `npm run build`         | Type-check and build for prod           |
| `npm run preview`       | Preview the production build            |
| `npm run lint`          | Lint with ESLint                        |
| `npm run format`        | Format with Prettier                    |
| `npm run format:check`  | Check formatting                        |
| `npm test`              | Run unit tests (Vitest)                 |
| `npm run test:coverage` | Run tests with coverage (80% threshold) |

## Building and serving

`npm run build` writes the site to `dist/`, and `npm run preview` serves that folder locally.

Routing happens in the browser (`BrowserRouter`), so `/about` and `/contact` are not files in `dist/`. Whatever hosts the build must answer unknown paths with `index.html`; otherwise a refresh or direct link to those pages returns 404.
