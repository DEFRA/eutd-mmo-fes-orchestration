---
name: develop
description: 'Expert Hapi.js/TypeScript middleware developer for MMO FES Orchestration. Use when: implementing features, fixing bugs, refactoring code, researching codebase, planning solutions. Covers dual-auth, dual-storage, ownership validation, GOV.UK Notify, PDF generation.'
license: OGL-UK-3.0
metadata:
  author: mmo-fes
  version: "1.0"
---

# Orchestration — Developer Skill

Expert software engineer for the MMO FES Orchestration service. Reads the codebase, researches, plans, reasons, writes production-ready middleware code following project conventions.

## Working framework alignment

This skill operates inside the **working framework** in [copilot-instructions.md](../../copilot-instructions.md) §4
(Triage → Read → Research → Clarify → Plan → Approval → Implement → Test → Iterate →
Summarise). Follow it; do not restate or fork it.

- **Triage first.** Framework-**trivial** work (typo/comment/small localised change) takes the light path
  (Read → Implement → Test → Summarise). **Standard** work (a normal feature/fix with no new architecture,
  auth/ownership change, or security surface) uses a lightweight inline plan (authored by the Developer, no
  heavyweight Planner) plus the user-approval gate. **Complex** work (an auth/ownership/validation
  architecture change, session/document storage architecture change, a new external integration, a security
  surface) runs the full loop, including planning and the **user-approval gate** before any implementation —
  normally coordinated by the [Orchestrator](../../agents/orchestration-orchestrator.agent.md)
  and [Planner](../../agents/orchestration-planner.agent.md) agents.
- **Research (§4.2), single pass** in the open uses the
  [deep-research-defra-alignment](../deep-research-defra-alignment/SKILL.md) skill; align findings to the
  DEFRA precedence (DEFRA > GDS > community) and cite sources.

## When to Use

- Implementing new API endpoints or middleware
- Working with authentication (JWT/Basic dual-auth)
- Adding document ownership validation
- Integrating with Redis sessions or MongoDB persistence
- Working with GOV.UK Notify, PDF generation, or Event Hubs
- Any production code writing task

## Workflow

### Before Making Changes

1. Search codebase for similar route and controller patterns
2. Check `defineAuthStrategies()` for authentication requirements
3. Review Redis key patterns and MongoDB schema for the feature area
4. Understand the `acceptsHtml()` response handling pattern

### During Implementation

1. Follow all mandatory rules from the auto-loaded instruction files (`nodejs-hapi.instructions.md`, `typescript.instructions.md`)
2. Always validate document ownership with `withDocumentLegitimatelyOwned()`
3. Support both HTML and JSON responses via `acceptsHtml()` checks

### After Implementation

1. Run build: `npm run build`
2. Run lint: `npm run lint`
3. Verify no TypeScript errors in problems panel
4. Invoke the `/unit-tests` skill to write or update tests
5. Review git diff to ensure no accidental changes

## Project Conventions

### Dual Authentication

```typescript
// defineAuthStrategies() sets up both JWT (external) and Basic (internal)
{
  method: 'GET',
  path: '/api/v1/documents/{documentNumber}',
  options: {
    auth: defineAuthStrategies(), // JWT or Basic
    validate: {
      params: Joi.object({
        documentNumber: Joi.string().required().uppercase()
      })
    }
  },
  handler: async (request, h) => { /* ... */ }
}
```

### Document Ownership Validation

```typescript
// CRITICAL: Always validate ownership before operations.
// withDocumentLegitimatelyOwned wraps the handler and only invokes the callback
// once ownership is confirmed; otherwise it returns the 403/redirect itself.
return await withDocumentLegitimatelyOwned(request, h,
  async (userPrincipal, documentNumber, contactId, document) => {
    // ownership already validated — safe to operate on `document`
    return h.response(document).code(200);
  }
);
```

### Dual Storage (Redis + MongoDB)

```typescript
// Redis: session data with colon-delimited keys
const sessionKey = `${userId}:${documentNumber}:catches`;
await redis.set(sessionKey, JSON.stringify(catchData));
await redis.get(sessionKey);

// MongoDB: document persistence with Mongoose schemas
const doc = await DocumentModel.findOne({ documentNumber }).lean().exec();
```

### User Identity from Request

```typescript
// Extract user identity from authenticated request
const userId = request.app.claims.sub;       // GUID
const contactId = request.app.claims.contactId;
const fesApi = request.app.claims.fesApi;
```

### Response Handling (HTML vs JSON)

```typescript
// Support both browser and API clients
if (acceptsHtml(request.headers)) {
  return h.redirect(buildRedirectUrlWithError(details, '/error'));
}
return h.response(details).code(400);
```

### GOV.UK Notify Integration

```typescript
await notifyClient.sendEmail(templateId, emailAddress, {
  personalisation: {
    documentNumber,
    exporterName,
    reference: documentNumber,
  }
});
```

## Anti-Patterns

> Mandatory rules in the instruction files also apply. The items below are additional anti-patterns specific to this skill:

- Skipping `withDocumentLegitimatelyOwned()` ownership validation
- Using flat Redis keys instead of colon-delimited convention
- Not handling both HTML and JSON response formats
- Forgetting to `.uppercase()` document numbers in routes
