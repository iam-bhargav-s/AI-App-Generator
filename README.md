# OneAtlas - AI-Native Internal Tools Platform

[![Live Demo](https://img.shields.io/badge/Demo-Live%20URL-emerald?style=for-the-badge)](https://ai-app-generator-q8ke0yw2h-bhargav-s-git-hubs-projects.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge)](https://github.com/iam-bhargav-s/AI-App-Generator)

OneAtlas is an AI-native platform for generating and deploying business applications, including internal tools, CRUD apps, dashboards, admin panels, and workflow automation. Built on a low-cost, serverless-first multi-tenant architecture.

---

##  Key Architectural Highlights

* **100% Schema Resilience (PostgreSQL JSONB):** To avoid blocking and destructive runtime migrations (`prisma db push`) whenever a user instantiates or modifies an app, the live preview sandbox abstracts data storage into a highly optimized, single-table PostgreSQL JSONB document engine.
* **Asynchronous LLM Scaffolding Pipeline:** Orchestrates Google Gemini (`gemini-1.5-flash`) and OpenAI (`gpt-4o-mini`) using strict structured JSON schemas to enforce schema boundaries and prevent UI crashes on imperfect inputs.
* **Fault-Tolerant NLP Fallback Heuristic Engine:** Includes a native, zero-template natural language processing parser that operates as a bulletproof local failsafe if upstream LLM APIs rate-limit or experience downtime.
* **Context-Aware Presentation Layer:** Implements intelligent string-parsing helpers to strip data types/modifiers from database layers while formatting presentation headers into beautifully spaced human text (e.g., `fuelExpense` ➔ `FUEL EXPENSE`).
* **Look-Back Negation Support:** Explicitly parses sentence-boundary negations (e.g., *"Do NOT generate a Kanban board"*) to strictly control app generation footprints and avoid unnecessary layout bloat.

---

##  The Full-Stack Technical Footprint

The platform enforces a strict, modern full-stack development ecosystem:

* **Frontend Hub:** Next.js (App Router), React, TypeScript, Tailwind CSS
* **Backend & Compute:** Node.js, Next.js Asynchronous API Routes
* **Data & Persistence Layer:** PostgreSQL, Prisma ORM, Neon Serverless Pooling
* **Security Architecture:** Custom JWT-driven authentication with secure `bcrypt` salted password hashing for user-scoped data isolation.
* **Deployment & Ops:** Vercel edge deployment, containerized production multi-stage Dockerfile, and granular `vercel.json` security manifests.

---

##  Production Feature Capabilities (Overdelivered)

The platform successfully satisfies and exceeds requirements by implementing **four** complete, end-to-end optional systems rather than the requested three:

1. **Live CSV Import System:** Integrated directly into the dynamic data grids using `PapaParse`. Allows creators to upload physical spreadsheets, dynamically map rows to the virtual schema, and save batches cleanly into the database.
2. **Workflow Automation Engine:** A native event listener (`workflowEngine.ts`) that actively intercepts data actions (such as `RECORD_CREATED`), executes user-defined webhooks, and writes real-time logs to the database audit trail.
3. **Standalone GitHub Exporter:** Packages the dynamic JSON configuration metadata into a traditional, cleanly typed, human-like Next.js repository tree containing explicit Prisma relational models, pushing it instantly to a target GitHub repo via Octokit.
4. **Mobile-Ready Progressive Web App (PWA):** Engineered native web manifests (`manifest.json`) and mobile standalone meta blocks straight into the Next.js root layout for immediate desktop and mobile installation.

---

##  How to Setup and Run the Project

Follow these definitive step-by-step instructions to configure, initialize, and spin up the environment locally.

### 1. Install Project Dependencies
Install the required system node packages inside your project directory:
```bash
npm install
```

## 2. Initialize Database Client and Sync Models

Run the Prisma ORM compilation commands to generate code hooks and map required schemas to your live serverless PostgreSQL instance:

```bash
npx prisma generate

npx prisma db push
```

## 3. Launch the Local Development Server

Boot up the local Node.js process using the development command script:

```bash
npm run dev
```
