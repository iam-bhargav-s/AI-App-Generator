# AI App Generator (Track A) - Premium Dynamic Runtime & Sandbox Platform

[![Live Demo](https://img.shields.io/badge/Demo-Live%20URL-emerald?style=for-the-badge)](https://ai-app-generator-q8ke0yw2h-bhargav-s-git-hubs-projects.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge)](https://github.com/iam-bhargav-s/AI-App-Generator)

An advanced, metadata-driven application runtime engine that dynamically converts natural language prompts and structured configurations into fully operational web applications in an instant, in-browser sandbox environment. Built from the ground up to solve structural ambiguity, prevent destructive migrations, and deliver a polished, commercial-grade SaaS developer experience.

---

## 🚀 Key Architectural Highlights

* **100% Schema Resilience (PostgreSQL JSONB):** To avoid blocking and destructive runtime migrations (`prisma db push`) whenever a user instantiates or modifies an app, the live preview sandbox abstracts data storage into a highly optimized, single-table PostgreSQL JSONB document engine.
* **Asynchronous LLM Scaffolding Pipeline:** Orchestrates Google Gemini (`gemini-1.5-flash`) and OpenAI (`gpt-4o-mini`) using strict structured JSON schemas to enforce schema boundaries and prevent UI crashes on imperfect inputs.
* **Fault-Tolerant NLP Fallback Heuristic Engine:** Includes a native, zero-template natural language processing parser that operates as a bulletproof local failsafe if upstream LLM APIs rate-limit or experience downtime.
* **Context-Aware Presentation Layer:** Implements intelligent string-parsing helpers to strip data types/modifiers from database layers while formatting presentation headers into beautifully spaced human text (e.g., `fuelExpense` ➔ `FUEL EXPENSE`).
* **Look-Back Negation Support:** Explicitly parses sentence-boundary negations (e.g., *"Do NOT generate a Kanban board"*) to strictly control app generation footprints and avoid unnecessary layout bloat.

---

## 🛠️ The Full-Stack Technical Footprint

The platform enforces a strict, modern full-stack development ecosystem:

* **Frontend Hub:** Next.js (App Router), React, TypeScript, Tailwind CSS
* **Backend & Compute:** Node.js, Next.js Asynchronous API Routes
* **Data & Persistence Layer:** PostgreSQL, Prisma ORM, Neon Serverless Pooling
* **Security Architecture:** Custom JWT-driven authentication with secure `bcrypt` salted password hashing for user-scoped data isolation.
* **Deployment & Ops:** Vercel edge deployment, containerized production multi-stage Dockerfile, and granular `vercel.json` security manifests.

---

## ✨ Production Feature Capabilities (Overdelivered)

The platform successfully satisfies and exceeds requirements by implementing **four** complete, end-to-end optional systems rather than the requested three:

1. **📊 Live CSV Import System:** Integrated directly into the dynamic data grids using `PapaParse`. Allows creators to upload physical spreadsheets, dynamically map rows to the virtual schema, and save batches cleanly into the database.
2. **⚙️ Workflow Automation Engine:** A native event listener (`workflowEngine.ts`) that actively intercepts data actions (such as `RECORD_CREATED`), executes user-defined webhooks, and writes real-time logs to the database audit trail.
3. **📦 Standalone GitHub Exporter:** Packages the dynamic JSON configuration metadata into a traditional, cleanly typed, human-like Next.js repository tree containing explicit Prisma relational models, pushing it instantly to a target GitHub repo via Octokit.
4. **📱 Mobile-Ready Progressive Web App (PWA):** Engineered native web manifests (`manifest.json`) and mobile standalone meta blocks straight into the Next.js root layout for immediate desktop and mobile installation.

---

## 🎨 Premium UI/UX Design Token System

The design system moves entirely away from standard boilerplate templates into a highly intentional, dark minimalist workspace:
* **Background Base:** Deep, cohesive `zinc-950` (#09090b)
* **Card Architecture:** Translucent `zinc-900/40` with an ultra-fine `border-white/5` and structural glassmorphism (`backdrop-blur`).
* **Accent Colorways:** Refined premium Monochromatic Mint Green & Emerald Teal gradients for unified, high-end action responses.
* **Developer Observability:** Integrated a terminal-style Live Engine Telemetry scroller directly into the user console to capture runtime processes, database transactions, and file-sync hooks visually.

---

## ⚙️ How to Setup and Run the Project

Follow these definitive step-by-step instructions to configure, initialize, and spin up the environment locally.

### 1. Install Project Dependencies
Install the required system node packages inside your project directory:
```bash
npm install
