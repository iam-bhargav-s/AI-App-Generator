# AI-Native Application Scaffold Engine & Builder

[![Live Demo](https://img.shields.io/badge/Demo-Live%20URL-emerald?style=for-the-badge)](https://ai-app-generator-q8ke0yw2h-bhargav-s-git-hubs-projects.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge)](https://github.com/iam-bhargav-s/AI-App-Generator)

OneAtlas is a state-of-the-art, AI-native platform designed to dynamically scaffold, customize, and deploy full-stack business applications, internal tools, dashboard pipelines, and automated workflows directly from a single natural language description. 

---

## 🏗️ Detailed Directory Map

Below is a breakdown of the repository's modules and core implementation scripts:

```
├── prisma/
│   └── schema.prisma         # Prisma Schema (User, App, Record, WorkflowLog, Snapshot)
├── public/                   # Manifests, PWA Icons, and static assets
├── src/
│   ├── app/                  # Next.js App Router (Pages, Layouts & API Gateways)
│   │   ├── api/
│   │   │   ├── apps/         # App CRUD, Unified Gemini/Local scaffold processing
│   │   │   ├── auth/         # Login, Register & Session Logout handlers
│   │   │   └── preview/      # Runtime endpoints for dynamic Record CRUD
│   │   ├── app/[appId]/      # Dynamic Workspace Builder Shell (Workspace Console)
│   │   ├── dashboard/        # Creator's Workspace list and prompt execution
│   │   ├── login/            # Sign In / Sign Up portal
│   │   └── preview/[appId]/  # Live sandboxed preview with responsive graphs & tables
│   ├── components/           # UI elements & CSV spreadsheets handler
│   │   └── runtime/
│   │       └── CSVImportModal.tsx # Parser mapping raw CSV inputs into virtual schemas
│   ├── lib/                  # Full-stack Engine Utilities & Systems
│   │   ├── appScaffolder.ts  # Dynamic local NLP parser mapping keywords to models
│   │   ├── auth.ts           # Dynamic Session Cookie resolver (supports localhost HTTP)
│   │   ├── codeGenerator.ts  # Compiles configuration templates into React apps
│   │   ├── dbWrapper.ts      # Failover utility: postgres SQL DB <-> local JSON store
│   │   ├── gemini.ts         # Unified Google Gemini Prompt Expansion & Schema designer
│   │   ├── github.ts         # Multi-step GitHub Commits tree builder
│   │   └── workflowEngine.ts # Event emitter driving database webhook triggers
│   └── templates/            # Zero-latency structural blueprints (CRM, HR, Inventory, etc.)
```

---

## Core Technical Features & Resiliency

### 1. Unified Gemini Schema Call
* **Optimized Payload:** Packaged specification expansion, dynamic relational database schemas, and prebuilt mock records into a **single prompt execution** inside [gemini.ts](file:///d:/fullstack_proj/src/lib/gemini.ts). This cuts cold generation latency from ~10 seconds down to **under 4 seconds** and prevents API rate-limiting.

### 2. Double-Failsafe Fallback Engine
* **Local Scaffold Fallback:** If the Gemini API hits a rate limit (HTTP 429) or experiences downtime, [route.ts](file:///d:/fullstack_proj/src/app/api/apps/route.ts) automatically delegates generation to [appScaffolder.ts](file:///d:/fullstack_proj/src/lib/appScaffolder.ts).
* **Deterministic Seeding:** Evaluates prompt keywords using deterministic string matching to mock up models (e.g. *Inventory, Suppliers, Audits*), and seeds 8 realistic records per table using a local random mock data generator.

### 3. Connection-Agnostic Database Failover
* **No-Crash Architecture:** The [dbWrapper.ts](file:///d:/fullstack_proj/src/lib/dbWrapper.ts) monitors active connections. If the PostgreSQL database (configured via Prisma) goes offline or isn't configured, it automatically shifts data read/writes to a structured local JSON file database (`db_fallback.json`), maintaining full app functionality.

### 4. Smart Cookie Verification (Localhost Friendly)
* **Session Persistence:** Resolves browser security cookie blocks on local environments. In [auth.ts](file:///d:/fullstack_proj/src/lib/auth.ts), it checks the active connection protocol:
  - Disables the `; Secure` flag on insecure local HTTP.
  - Enforces the `; Secure; SameSite=None` flag in production HTTPS.

---

## Advanced Production Capabilities

1. **Spreadsheet CSV Ingestion:** Allows users to ingest raw CSV tables into their generated models. Fields are automatically checked, mapped, validated, and bulk-saved.
2. **Workflow Automation Engine:** An event-driven listener ([workflowEngine.ts](file:///d:/fullstack_proj/src/lib/workflowEngine.ts)) that captures database events (e.g., `RECORD_CREATED`), fires webhooks, and appends execution logs.
3. **Standalone GitHub Exporter:** Compiles the virtual database schema into a static codebase including full Next.js routing, interactive charts (via Recharts), layouts, and schemas. Pushes the workspace directly to a target repo using the GitHub REST API tree system ([github.ts](file:///d:/fullstack_proj/src/lib/github.ts)).
4. **Mobile PWA Integration:** Preconfigured with progressive web application manifests (`manifest.json`) and device-responsive layouts for standalone mobile installs.

---

## Setup & Local Development

### 1. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Database Credentials
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host:port/database?sslmode=require"

# AI Core Credentials
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Sync Database Schemas
Sync the Prisma Schema with your target SQL database instance:
```bash
npx prisma generate
npx prisma db push
```

### 4. Start the Local Server
Launch the development server:
```bash
npm run dev
```
