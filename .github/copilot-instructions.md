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
