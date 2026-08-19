# MMO FES Orchestration Service - AI Agent Instructions

## Project Overview
This is the **orchestration/API layer** for the MMO Export Catch Certificate (ECC) frontend service, acting as middleware between the frontend (`mmo-ecc-fe`) and backend services. Built with **Hapi.js**, TypeScript, MongoDB/Cosmos DB, and Redis for session management.

## Architecture & Key Patterns

### Request Flow
All authenticated requests follow this pattern:
1. **Authentication** - Dual-strategy auth using JWT or Basic (FES API):
   - JWT tokens validated against `IDENTITY_APP_URL` issuer or admin roles
   - FES API uses Basic auth with master password (`FES_API_MASTER_PASSWORD`)
   - Auth can be disabled locally with `DISABLE_AUTH=true`
2. **Document Ownership** - Use `withDocumentLegitimatelyOwned()` helper to validate user owns the document
3. **Controller** - Business logic in `src/controllers/`
4. **Service Layer** - External API calls and data transformations in `src/services/`
5. **Persistence** - Dual storage (Redis for sessions, MongoDB for documents)

### Critical Architectural Components

**Server Lifecycle Extensions** (`src/server.ts`):
- `onRequest` → `onCredentials` → `onPreAuth`/`onPreAuthWithAuth` → `onPostAuth` → `onPreResponse`
- User claims stored in `(request.app as HapiRequestApplicationStateExtended).claims.sub` (user principal)
- Error responses check `acceptsHtml(headers)` to decide between HTML redirect or JSON response

**Dual Storage Pattern**:
- **Redis** - Session data keyed by documentNumber with colon-delimited subkeys:
  ```typescript
  // Example: documentNumber:CATCHES_KEY, documentNumber:EXPORTER_KEY
  await sessionStore.get(documentNumber, CATCHES_KEY);
  ```
- **MongoDB** - Document persistence via Mongoose schemas (`src/persistence/schema/`)
  - Main schemas: `CatchCertificate`, `ProcessingStatement`, `StorageDocument`
  - All extend `BaseModel` with audit fields

**Route Pattern** (`src/routes/`):
- Routes instantiate controller methods, NOT inline handlers
- Auth configured with `defineAuthStrategies()` (returns null if auth disabled)
- Validation uses Joi with custom `failAction` handlers:
  ```typescript
  failAction: async function (req, h, error) {
    const errorDetailsObj = errorExtractor(error);
    if (acceptsHtml(req.headers)) {
      return h.redirect(buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, redirect));
    }
    return h.response(errorDetailsObj).code(400).takeover();
  }
  ```

## Development Workflows

### Local Setup
```bash
# Prerequisites: MongoDB on 27017, Redis on 6379
npm i
npm start  # Runs without auth (DISABLE_AUTH=true)
npm run start-with-auth  # Requires JWT validation
```

**Environment Configuration**:
- Copy `.envSample` to `.env` for local development
- Key vars: `DB_CONNECTION_URI`, `REDIS_HOST_NAME`, `MMO_ECC_REFERENCE_SVC_URL`
- Use `applicationConfig.ts` for all env access (never `process.env` directly)

### Testing
```bash
npm test           # Run tests with coverage
npm run test:ci    # CI mode (runInBand, junit output)
```
- Tests use **Jest** with `ts-jest` preset
- Test files: `*.jest.spec.ts` (NOT `.spec.ts`)
- MongoDB tests use `mongodb-memory-server`
- Coverage thresholds: 90% branches, 90% functions/lines/statements

### Build & Deploy
```bash
npm run build      # TypeScript compilation to dist/
./build.sh         # Used by Docker/CI
```
- Azure Pipelines: Follows GitFlow (main/develop/hotfix/feature/epic)
- Multi-stage Dockerfile: base → test → development → production
- Uses `defradigital/node-development` base images

## Code Conventions

### Authentication Patterns
```typescript
// Route definition
auth: defineAuthStrategies(),  // Returns null if auth disabled

// Handler pattern
handler: async (request, h) => {
  return await withDocumentLegitimatelyOwned(request, h,
    async (userPrincipal, documentNumber, contactId, document) => {
      // Your logic here - document ownership already validated
    }
  );
}
```

### User Identity Access
```typescript
const app = request.app as HapiRequestApplicationStateExtended;
const userPrincipal = app.claims.sub;       // User GUID
const contactId = app.claims.contactId;     // Contact ID
const isFesApi = app.claims.fesApi;         // FES API flag
```

### Logging Pattern
```typescript
logger.info({
  requestId: (request as any).id,
  data: { /* context */ }
}, 'log-message');
```

### Validation Error Handling
- Extract errors with `errorExtractor(error)` (returns key-value error object)
- HTML clients get redirected with query params: `buildRedirectUrlWithErrorStringInQueryParam()`
- API clients get JSON response with 400/403/404 status codes

## Common Pitfalls

1. **Auth Strategy**: Always use `defineAuthStrategies()` in route options, never hardcode auth config
2. **Document Numbers**: Always uppercase: `documentNumber.toUpperCase()`
3. **Session Store Keys**: Use constants from `src/session_store/constants.ts` (CATCHES_KEY, EXPORTER_KEY, etc.)
4. **Response Headers**: Don't redirect Boom errors for API clients - check `acceptsHtml()` first
5. **Test Files**: Must use `.jest.spec.ts` suffix (not `.spec.ts`) to match Jest config
6. **Coverage**: PRs require passing coverage thresholds - write tests before implementation

## External Dependencies

- **Reference Service**: `MMO_ECC_REFERENCE_SVC_URL` - Species, vessels, commodity codes lookup
- **Consolidation Service**: `MMO_CC_LANDINGS_CONSOLIDATION_SVC_URL` - Landings data aggregation
- **GOV.UK Notify**: `FES_NOTIFY_API_KEY` - Email notifications (success/failure/error templates)
- **Azure Blob Storage**: Document uploads via `BLOB_STORAGE_CONNECTION`
- **Event Hubs**: Protective monitoring events via `eventHubConnectionString`

## Key Files Reference

- **Server bootstrap**: `src/start.ts` → `src/server.ts` → `src/router.ts`
- **Config centralization**: `src/applicationConfig.ts` (loads all env vars)
- **Auth helpers**: `src/helpers/auth.ts`, `src/helpers/withDocumentLegitimatelyOwned.ts`
- **Session store**: `src/session_store/redis.ts`, `src/session_store/factory.ts`
- **Schemas**: `src/persistence/schema/{catchCert,processingStatement,storageDoc}.ts`

## Standards precedence (highest wins)

When guidance conflicts, follow this order:

1. **DEFRA Software Development Standards** (mandatory) — https://defra.github.io/software-development-standards/
2. **DEFRA Digital Service Manual** — https://digital.defra.gov.uk/service-manual
3. **GOV.UK Service Standard & Service Manual (GDS)** — https://www.gov.uk/service-manual
4. **Community best practice** — [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/), [12-factor](https://12factor.net/), widely-adopted Node.js/TypeScript patterns

> **DEFRA takes precedence over GDS. GDS takes precedence over community guidance.** Any deviation from a DEFRA standard MUST be raised as a formal exception through DEFRA's architectural governance (Delivery Architecture team: `delivery.architecture@defra.gov.uk`).

## The working framework (Triage → Read → Research → Clarify → Plan → Approval → Implement → Test → Iterate → Summarise)

This section is the **single source of truth** for the working loop. The custom agents ([Orchestrator](.github/agents/orchestration-orchestrator.agent.md), [Planner](.github/agents/orchestration-planner.agent.md), [Developer](.github/agents/orchestration-developer.agent.md) and [Reviewer](.github/agents/orchestration-reviewer.agent.md)) reference it and **must not restate or fork it**. The guiding principle is **match effort to risk**: do the least work that still delivers the change safely and to standard.

**Triage first — pick one of three gears by size and risk:**

- **Trivial** (typo, comment/doc tweak, a small localised change with no impact on architecture, dual-strategy auth, document-ownership validation, session/document storage, Joi validation, external integrations, security or data correctness): skip the planner, research and review. Do a light **Read → Implement → Test → Summarise**, and research only the one point that is genuinely uncertain.
- **Standard** (a normal feature/fix with **no** new architecture, auth/ownership change, or security surface): use a **lightweight inline plan** (a short Objective · Plan · Files · Validation · Risks note from the Developer agent — no heavyweight Planner), get approval, then implement and test. Run a **single** risk-scoped research pass **only if** something is genuinely uncertain.
- **Complex** (an auth/ownership/validation architecture change, session (Redis) or document (MongoDB/Mongoose) storage architecture change, a new external integration (Reference/Consolidation services, GOV.UK Notify, Azure Blob, Event Hubs), a security surface, or multi-item delivery): run the full loop with the Planner agent below.

**Manual override.** The user can force a gear — e.g. "treat this as trivial", "just a lightweight/standard plan", "force the full plan", "skip the planner" — and that instruction wins over the automatic classification. Always honour a request for **more** rigour. When the user asks for **less** rigour than the risk warrants, comply but **briefly flag the risk first**, and never drop the approval gate or security for a change that genuinely touches architecture, auth/ownership, external integrations, security or data correctness.

The loop (Standard and Complex; Trivial uses the light path above):

1. **Read** — Read the relevant files/config in the repo for context before acting. Never assume; verify.
2. **Research (single pass, risk-scoped)** — When something is genuinely uncertain — an unfamiliar or version-sensitive API, security, or DEFRA/GDS policy — do **one** thorough, risk-scoped research pass in the open and validate findings against DEFRA/GDS and framework/library guidance so advice reflects current APIs and policy. Cite sources. **Do not run a second, separate validation research round** — the plan is checked against these same cited sources. Well-trodden or cosmetic steps need little or no research.
3. **Clarify** — Ask the user targeted questions whenever requirements are ambiguous or missing. Surface requirement gaps explicitly with suggested fixes. Do not guess at intent.
4. **Plan** — For **Complex** work, delegate planning to the [Planner - Orchestration Service](.github/agents/orchestration-planner.agent.md) agent, which returns a complete plan with its research already cited. For **Standard** work, produce the lightweight inline plan directly — no separate planning agent. Either way, **check** the plan's risky/version-sensitive steps are covered and cited; only send a targeted revision back if a genuine gap is found (do not re-research what is already cited).
5. **Approval** — Present the plan to the user and obtain explicit approval before implementation. If changes are requested, update the plan and re-present. **Cap the plan → approve → implement cycle at 3 iterations**; if it is still unresolved, stop and surface the blocker to the user.
6. **Implement** — Deliver one task at a time (or parallel independent tasks) from the approved plan. Stay focused on the requested outcome; do not scope-creep or refactor unrelated code. When a change introduces or alters architecture, capture the decision as an ADR and update the relevant docs and ADRs **where the repo already keeps them** (e.g. `docs/`).
7. **Test / Validate** — Build (`npm run build`), run the test suite (`npm test`, or `npm run test:ci` in CI — test files use the `.jest.spec.ts` suffix), lint (`npm run lint`), check errors, and confirm each task works before moving on.
8. **Iterate** — Refine until the user is satisfied with each task.
9. **Summarise** — End with a detailed **executive summary** of what changed, why, how it was validated, and any follow-ups or risks.

**Code review is optional and on-request.** A full code review is **not** part of the default loop. Run it only when the user asks for one. At the end of implementation, if no review has been run, **offer** one (a single Yes/No question); invoke the reviewer only on an explicit Yes.

## Workflow agents

Standard and Complex work is coordinated through four custom agents that all run the framework above:

| Agent | Role |
|-------|------|
| [Orchestrator - Orchestration Service](.github/agents/orchestration-orchestrator.agent.md) | Plans, delegates, verifies and reports; owns the Yes/No user-approval gate and the end-of-work review offer. Does **not** implement. |
| [Planner - Orchestration Service](.github/agents/orchestration-planner.agent.md) | Internal planning subagent; produces the approval-ready plan and the single research pass behind it. Invoked for **Complex** work. |
| [Developer - Orchestration Service](.github/agents/orchestration-developer.agent.md) | Implements an already-approved plan end-to-end with tests; authors the lightweight inline plan for **Standard** work. |
| [Reviewer - Orchestration Service](.github/agents/orchestration-reviewer.agent.md) | Read-only review against DEFRA standards; reports findings by severity. **Optional, on-request only** — not run by default. |

Research (§4.2) and plan-validation research (§4.5) use the [deep-research-defra-alignment](.github/skills/deep-research-defra-alignment/SKILL.md) skill. The [Speckit](.github/agents) agents (`speckit.*`) are a separate spec-driven toolset and are **not** part of this workflow.

## Skills

Use `/develop` for implementation, coding, and research tasks. Use `/unit-tests` for writing tests, coverage, and SonarQube issues.

## Defra standards and governance

This service must comply with [Defra software development standards](https://github.com/DEFRA/software-development-standards) — the single source of truth. The rules below encode those standards; they do not replace them. When a standard changes, update this file.

### Quality gates

All code must pass these checks before merging:

- Linter passes (`npm run lint`)
- All tests pass (`npm test`) — test files use the `.jest.spec.ts` suffix
- Coverage ≥90% global (Statements/Branches/Functions/Lines), ≥95% core business logic, 100% error-handling and security-critical paths — no decrease from the SonarCloud baseline
- SonarQube/SonarCloud quality gate passes; security hotspots reviewed and resolved
- At least one approving review from another developer
- No unresolved security vulnerabilities in dependencies

### Security and PII

- Follow [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- Never commit secrets — load all configuration and credentials from environment variables (`src/applicationConfig.ts`), never `process.env` scattered through code
- **Never log PII**: names, addresses, emails, phone numbers, NI numbers, bank details, usernames, passwords, API keys, tokens
- Validate and sanitise all external input with `joi`; use parameterised queries for database access
- Avoid `eval`, dynamic `Function()`, or executing user-supplied data; validate and normalise file paths

### Dependencies

- New dependencies must be widely used, actively maintained, and compatible with the current Node.js LTS
- Do not introduce a second HTTP framework, ORM, or date library without an approved exception

### Logging

- Structured logging with correlation IDs propagated end-to-end
- Levels: `error` (failures), `warn` (handled but unexpected), `info` (business events), `debug` (development only)

### How Copilot should respond

- Follow conventions already in the codebase — check existing patterns first
- Prefer modifying existing files over creating new ones when the change fits naturally
- Provide minimal diffs touching only the necessary files; do not refactor unrelated code
- Always include or update tests for changed behaviour
- If a request conflicts with these instructions — a discouraged library, a skipped test, a hard-coded secret, or a broken quality gate — flag it explicitly and do not proceed silently

### Licence

All code is published under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) unless an approved exception exists.

<!-- STANDARDS NOTE: These instructions reflect Defra software development standards (https://github.com/DEFRA/software-development-standards). Review this file periodically or after any Defra standards update. -->
