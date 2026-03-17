---
name: unit-tests
description: 'Expert unit test engineer for MMO FES Orchestration. Use when: writing unit tests, updating tests for code changes, fixing failing tests, improving code coverage, fixing SonarQube issues.'
---

# Orchestration — Unit Tests Skill

Expert in writing and maintaining unit tests for the MMO FES Orchestration service.

## When to Use

- Writing unit tests for new or modified code
- Fixing failing tests after code changes
- Improving code coverage to meet thresholds
- Fixing SonarQube issues or code smells

## Coverage Requirements

- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%
- Run tests: `npm test`
- Run CI tests: `npm run test:ci`

## Test Framework & Tools

- **Jest** as primary test runner with ts-jest
- **tape** + **sinon** + **nock** for legacy tests
- **mongodb-memory-server** for MongoDB integration tests
- Test files must use `.jest.spec.ts` suffix and live in `test/` folder

## Test File Naming Convention

```
test/controllers/catch-certificate.jest.spec.ts    ✓ Correct
test/controllers/catch-certificate.test.ts          ✗ Wrong extension
test/controllers/catch-certificate.spec.ts          ✗ Missing .jest prefix
```

## Mocking Patterns

### Authenticated Request

```typescript
const mockRequest = {
  app: {
    claims: {
      sub: 'user-guid-123',
      contactId: 'contact-456',
      fesApi: 'api-key',
    }
  },
  headers: { accept: 'application/json' },
  params: { documentNumber: 'GBR-2024-CC-12345' },
};
```

### Response Toolkit

```typescript
const mockH = {
  response: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  code: jest.fn().mockReturnThis(),
  takeover: jest.fn().mockReturnThis(),
};
```

### Redis Mock

```typescript
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }));
});
```

### Document Ownership

```typescript
jest.mock('../../src/helpers/ownership', () => ({
  withDocumentLegitimatelyOwned: jest.fn().mockResolvedValue(mockDocument),
}));
```

### MongoDB Memory Server

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

## What to Test

1. **Authentication** — JWT token validation, Basic auth header parsing
2. **Document ownership** — `withDocumentLegitimatelyOwned()` allow/deny scenarios
3. **Dual response** — `acceptsHtml()` routing to redirect vs JSON
4. **Redis operations** — session data CRUD with colon-delimited keys
5. **MongoDB queries** — CRUD operations with lean queries
6. **GOV.UK Notify** — email sending with correct personalization
7. **Error handling** — Boom error responses, validation failures
8. **Document number** — uppercase normalization

## SonarQube Issue Resolution

When fixing SonarQube issues, **NEVER modify functionality**. If existing tests fail after a fix, revert it.

## Workflow

1. Identify the source file(s) that need tests
2. Create test file with `.jest.spec.ts` extension in `test/` directory
3. Read source code to understand all branches
4. Write tests following Arrange/Act/Assert pattern
5. Run `npm test` and check coverage output
6. If coverage below thresholds, add targeted tests
7. Check problems tab for SonarQube issues
