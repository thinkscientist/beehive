# Contributing to Beehive

Thank you for your interest in contributing to Beehive! This guide outlines how to set up your local development environment, project coding standards, and the pull request submission process.

## Prerequisites

- **Node.js**: 22.13 or later.
- **npm**: Bundled with Node.js.
- **Git**: For version control.

## Getting Started

1. Fork and clone the repository:

   ```sh
   git clone https://github.com/<your-username>/beehive.git
   cd beehive
   ```

2. Install dependencies:

   ```sh
   npm ci
   ```

3. Start the local development server:
   ```sh
   npm run dev
   ```

## Development Scripts

The following npm scripts are available:

| Command                 | Purpose                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`           | Starts Vite dev server with hot module replacement                                 |
| `npm run build`         | Runs TypeScript compiler checks (`tsc -b`) and builds production assets in `dist/` |
| `npm run preview`       | Locally serves the production build in `dist/`                                     |
| `npm run server`        | Starts the `/api` server for live CUGA and Hive data (see `.env.example`)          |
| `npm run lint`          | Runs ESLint checks across TypeScript and React files                               |
| `npm run format`        | Automatically formats files using Prettier                                         |
| `npm run format:check`  | Verifies that all files conform to Prettier formatting                             |
| `npm test`              | Runs unit tests once via Vitest                                                    |
| `npm run test:coverage` | Runs unit tests with V8 coverage reporting (enforces 80% threshold)                |

## Quality Standards

Before submitting a pull request, ensure all four validation checks pass cleanly:

```sh
npm run lint
npm run format:check
npm test
npm run build
```

### Working Agreements

- **Surgical changes**: Make PR-sized changes focused on one concern. Avoid bundling drive-by refactorings or stylistic adjustments.
- **Minimal complete solutions**: Every modified line should trace directly to the issue or feature requirement.
- **IBM Carbon components**: Prefer Carbon Design System (`@carbon/react`) components and tokens over ad-hoc CSS or custom primitives.
- **Test coverage**: Every behavioral change or new feature must ship with corresponding Vitest tests (`*.test.tsx`). The project maintains an 80% coverage threshold.
- **TypeScript strict mode**: Ensure strict typing without suppressing type errors or using unnecessary `any` casts.

## Commit Guidelines and DCO

All commits must be signed off under the Developer Certificate of Origin (DCO). Use the `-s` flag when committing:

```sh
git commit -s -m "🌱 chore: concise description of change"
```

## Pull Request Process

1. Create a branch from a fresh copy of the default branch:

   ```sh
   git checkout -b <type>/<short-description>
   ```

2. Follow PR title conventions:
   - `✨ feat: ...` for new features
   - `🐛 fix: ...` for bug fixes
   - `📖 docs: ...` or `📖 proposal: ...` for documentation and proposals
   - `🌱 chore: ...` for maintenance, tests, or refactoring
   - `⚠️ breaking: ...` for breaking changes

3. In the pull request description, explain the rationale (why) rather than just what was changed. Reference relevant issues using `Closes #N` or `Refs #N`.
