# Contributing to UntitledOne

Thanks for your interest — contributions are welcome!

## Ways to contribute
- Fix bugs or improve DX
- Tackle `good first issue` / `help wanted`
- Improve docs and examples
- Propose features via an issue first

## Local setup
1. Clone and create a branch: `git checkout -b feat/short-name`
2. Install: `pnpm i` (or `npm i`)
3. Copy env: `cp .env.example .env` and fill your local values
4. Run dev server: `pnpm dev`

Run checks locally before opening a PR:
- `pnpm lint && pnpm typecheck`
- `pnpm test` (if tests are present)

## Branching
- `main` is protected; PRs only.
- Use prefixes: `feat/*`, `fix/*`, `docs/*`, `chore/*`, `refactor/*`.

## Commit style
Use **Conventional Commits**:
- `feat: add timestamped comments`
- `fix: handle empty audio file`
- `docs: update README`
- `chore: bump deps`

Keep messages short and meaningful.

## Pull Requests
- Keep PRs small and focused.
- Link an issue (e.g., `Closes #123`) where possible.
- Include screenshots for UI changes.
- Ensure lint/typecheck pass and docs are updated.
- Be kind and responsive to review comments.

## Code style
- TypeScript strict; avoid `any` unless justified.
- ESLint + Prettier; run `pnpm lint --fix` before pushing.
- Accessible UI by default (shadcn/ui + Radix UI patterns).

## Project conventions
- Never commit real secrets; use `.env.example` as a reference.
- Source lives under `src/` (Next.js App Router).
- Use path aliases like `@/components/...` where configured.

## Issue labels (suggested)
`bug`, `enhancement`, `documentation`, `good first issue`, `help wanted`, `security`.

Thanks for contributing! 🎧
