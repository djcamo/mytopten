# GEMINI.md - Project Instructional Context

## Project Overview

**My Top Ten** is a modern, Astro-powered web application that allows users to curate, manage, and share their personal "Top 10" song lists. The project leverages Supabase for authentication (Email/Password and Spotify OAuth) and as a real-time database for storing user profiles, playlists, and songs.

### Main Technologies
- **Framework:** [Astro](https://astro.build/) (v5.11.0)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** Vanilla CSS, Font Awesome
- **Client-side Logic:** Vanilla JavaScript for DOM manipulation and Supabase interaction.

---

## Architecture

The project follows a hybrid architecture combining Astro's static site generation (SSG) with client-side interactivity:
- **Pages (`src/pages/`):** Each `.astro` file defines a route (e.g., `/login`, `/account`, `/playlist`).
- **Layouts (`src/layout/`):** Base layouts (`Layout.astro`, `LayoutHome.astro`) manage the HTML head, global styles, scripts, and the `supabaseClient` initialization.
- **Components (`src/components/`):** Reusable UI elements like `Header.astro`, `Footer.astro`, and `Navigation.astro`.
- **Database Client (`src/db/supabase.js`):** Exported Supabase client for server-side or module-based client-side usage.
- **Global Scripts (`public/scripts/scripts.js`):** Handles most of the client-side interactivity, including auth state management, CRUD operations for playlists/songs, and dynamic UI updates.

---

## Building and Running

The project utilizes standard npm scripts for the development lifecycle:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs all required project dependencies. |
| `npm run dev` | Starts the local development server at `http://localhost:4321`. |
| `npm run build` | Builds the production-ready static site into the `./dist/` directory. |
| `npm run preview` | Previews the production build locally. |
| `npm run astro` | Runs specific Astro CLI commands (e.g., `astro add`, `astro check`). |

---

## Development Conventions

### 1. Supabase Client
- **Global Access:** The Supabase client is initialized globally in `src/components/GlobalScripts.astro` and exposed as `window.supabaseClient`.
- **Environment Variables:** `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY` must be defined in the environment (e.g., `.env` file) for both build-time and client-side usage.

### 2. Client-side Logic
- **`public/scripts/scripts.js`:** This file contains the bulk of the application's interactive logic. When modifying pages, ensure that the corresponding logic in this file is updated or that new logic is appropriately scoped to specific pathnames (e.g., `if (window.location.pathname === "/playlist") { ... }`).

### 3. Styling and Assets
- **CSS:** Global styles are managed via `src/components/GlobalStyles.astro` and external files in `public/css/`.
- **Static Assets:** Images, fonts, and external scripts are stored in the `public/` directory and referenced via absolute paths (e.g., `/images/logo.png`).

### 4. Components
- **Astro Components:** Prefer creating reusable components in `src/components/` for UI consistency.
- **Props:** Use TypeScript interfaces for component props to maintain type safety within `.astro` files.

---

## Key Files Summary

- `astro.config.mjs`: Core Astro configuration.
- `package.json`: Project metadata, dependencies, and scripts.
- `src/pages/index.astro`: The home page landing experience.
- `src/layout/Layout.astro`: The main wrapper for all internal pages.
- `public/scripts/scripts.js`: The central hub for client-side application logic.
- `src/db/supabase.js`: Configuration for the Supabase client.

### Additional Coding PReferences

- Keep project dependencies minimal
- Use relative imports and NOT a path alias