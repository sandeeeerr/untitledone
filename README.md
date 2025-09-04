# UntitledOne

> Open-source platform for remote collaboration between audio creatives — file sharing, time-based feedback, and lightweight project management.

![License](https://img.shields.io/badge/license-MIT-blue)
![Contributions](https://img.shields.io/badge/contributions-welcome-brightgreen)

—

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Help & Support](#help--support)
- [Security](#security)
- [License](#license)

## Overview

UntitledOne makes it easy to share music projects, discuss versions, and annotate audio with precise timestamps. Built for speed, simplicity, and modularity on a modern web stack.

## Features

- Private projects with audio-first uploads (Supabase Storage)
- Timestamped, threaded comments on waveforms
- Activity overview and simple version context
- Auth, database, and RLS with Supabase
- UI with Next.js 15, TypeScript, Tailwind, and shadcn/ui (Radix UI)

## Tech Stack

- Next.js (App Router)
- Supabase (Auth, Database, Storage)
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- TanStack Query, React Hook Form + Zod, next-intl

## Project Structure

```text
src/
├─ app/                # Next.js App Router (server-first)
├─ components/         # Atomic Design + shadcn/ui
├─ hooks/              # Custom hooks
├─ i18n/               # next-intl (messages/, routing)
├─ lib/                # api/, supabase/, env, utils
├─ stories/            # Storybook
├─ types/              # Supabase schema types (generated)
└─ styles/             # globals.css, tailwind.css (optional)
```

## Quick Start

Prerequisites: Node.js LTS, pnpm (or npm).

1. Install: `pnpm i` (or `npm i`)
2. Environment: copy `.env.example` → `.env` and fill values:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`
3. Development: `pnpm dev` and open `http://localhost:3000`

Useful scripts:

- `pnpm dev` — start dev server
- `pnpm typecheck` — TypeScript typecheck
- `pnpm lint` — ESLint
- `pnpm format` — Prettier (incl. Tailwind plugin)
- `pnpm gen:types` — generate Supabase DB types
- `pnpm test` — unit tests (Vitest)
- `pnpm cypress:open` — E2E tests
- `pnpm storybook` — Storybook

## Usage

1. Register/sign in via the auth flow
2. Create a project and upload an audio file
3. Add timestamped comments; discuss versions in context
4. Invite collaborators to work together

## Screenshots

Add images to `/assets` and reference them here:

- `assets/screenshot-dashboard.png`
- `assets/screenshot-project.png`

## Documentation

Docs will be available at `https://docs.untitledone.nl` (separate app). Link will be added when live.

## Contributing

Contributions are welcome! Please follow Conventional Commits and our guidelines.

- See `CONTRIBUTING.md` (coming soon)
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Style & quality: ESLint, Prettier and TypeScript strict are enabled

## Help & Support

Open an issue for bugs or questions. Provide a clear title, reproduction steps, and expected/actual behavior.

## Security

Report vulnerabilities via `SECURITY.md`. Do not expose secrets in client code; only use `NEXT_PUBLIC_*` in the client.

## License

MIT — see `LICENSE`.
