# Accept and Create Catch Certificate Performance Root Cause Analysis

## Table of Contents

- [Scope](#scope)
- [Sequential Analysis Steps Performed](#sequential-analysis-steps-performed)
- [Executive Summary](#executive-summary)
- [End-to-End Call Chain](#end-to-end-call-chain)
- [How One User Journey Turns Into Many Database Reads](#how-one-user-journey-turns-into-many-database-reads)
  - [1. Progress page load](#1-progress-page-load)
  - [2. Check your information page load](#2-check-your-information-page-load)
  - [3. Final submit](#3-final-submit)
  - [4. Correlation with your `Find` metric](#4-correlation-with-your-find-metric)
- [Database Metric to Code Correlation](#database-metric-to-code-correlation)
- [Root Causes](#root-causes)
  - [Root Cause 1: ownership validation reads the document, then the route handler reads it again](#root-cause-1-ownership-validation-reads-the-document-then-the-route-handler-reads-it-again)
  - [Root Cause 2: submit path re-reads the same draft several times in one request](#root-cause-2-submit-path-re-reads-the-same-draft-several-times-in-one-request)
  - [Root Cause 3: frontend page fan-out multiplies backend reads before submission starts](#root-cause-3-frontend-page-fan-out-multiplies-backend-reads-before-submission-starts)
  - [Root Cause 4: dashboard queries are cursor-heavy and one owner branch is under-indexed](#root-cause-4-dashboard-queries-are-cursor-heavy-and-one-owner-branch-is-under-indexed)
  - [Root Cause 5: several hot reads fetch whole documents when only a few fields are needed](#root-cause-5-several-hot-reads-fetch-whole-documents-when-only-a-few-fields-are-needed)
  - [Root Cause 6: draft header aggregate uses `$lookup` on every dashboard load](#root-cause-6-draft-header-aggregate-uses-lookup-on-every-dashboard-load)
- [Index Review Against Current Queries](#index-review-against-current-queries)
  - [Indexes that already help](#indexes-that-already-help)
  - [Index gap that matters most in this flow](#index-gap-that-matters-most-in-this-flow)
  - [Important Azure Cosmos DB for MongoDB nuance](#important-azure-cosmos-db-for-mongodb-nuance)
- [Priority-Ordered Improvements](#priority-ordered-improvements)
- [Detailed Fixes and Code Examples](#detailed-fixes-and-code-examples)
  - [P1. Reuse the ownership-validated document](#p1-reuse-the-ownership-validated-document)
  - [P2. Reuse one draft snapshot inside submit](#p2-reuse-one-draft-snapshot-inside-submit)
  - [P3. Add the missing compound index for exporter-contact dashboard queries](#p3-add-the-missing-compound-index-for-exporter-contact-dashboard-queries)
  - [P4. Use projected and `lean()` reads for hot, read-only paths](#p4-use-projected-and-lean-reads-for-hot-read-only-paths)
  - [P5. Collapse pre-submit frontend fan-out into additive responses](#p5-collapse-pre-submit-frontend-fan-out-into-additive-responses)
  - [P6. Cache month-based dashboard results per user](#p6-cache-month-based-dashboard-results-per-user)
  - [P7. Remove the `$lookup` from the draft-header hot path](#p7-remove-the-lookup-from-the-draft-header-hot-path)
- [Improvements That Should Not Be the First Fix](#improvements-that-should-not-be-the-first-fix)
- [Recommended Delivery Order](#recommended-delivery-order)
- [Validation Plan](#validation-plan)
- [Root Cause Conclusion](#root-cause-conclusion)

## Scope

This analysis traces the catch certificate flow from the external frontend into orchestration and then into the `exportCertificates` collection.

Repositories reviewed:

- `eutd-mmo-fes-external-frontend`
- `eutd-mmo-fes-orchestration`

Primary user journey reviewed:

1. Accept and Create Catch Certificate dashboard
2. Progress page
3. Check your information page
4. Submit catch certificate

Assumption used for platform guidance:

- The database behavior and index format strongly resemble Azure Cosmos DB API for MongoDB.
- Official Azure Cosmos DB for MongoDB guidance and MongoDB query guidance were used to validate the conclusions.

## Sequential Analysis Steps Performed

1. Mapped the external frontend route loaders and actions involved in catch certificate creation and submission.
2. Traced each frontend API helper to the orchestration route, controller, service, and persistence layer.
3. Correlated each hot path with the database operations most likely to be generated (`find`, `getMore`, `aggregate`, `findAndModify`).
4. Compared the query shapes in code with the indexes that already exist on `exportCertificates`.
5. Cross-checked the observed patterns with Azure Cosmos DB for MongoDB and MongoDB query optimization guidance.

## Executive Summary

The main problem is not one single missing index on the submit endpoint.

The main problem is request amplification:

- The external frontend makes multiple orchestration calls per page in the catch certificate journey.
- Most orchestration routes first validate ownership by reading the document from Mongo/Cosmos.
- The controller or service handling the same request then reads the same document again.
- The final submit path re-reads the same draft several more times after cache invalidation.
- The dashboard path issues cursor-heavy list queries that can spill into `getMore`, and one important owner branch is missing a sort-friendly compound index.

Under concurrency, this creates a large burst of `find` operations against the same `exportCertificates` documents before any real submission work is done.

That pattern matches the metrics you supplied:

- `Find`: `3.71k` operations, `2.19s` average latency
- `GetMore`: `242` operations, `32.45s` average latency
- `Aggregate`: `335` operations, `1.04s` average latency
- `FindAndModify`: `1.33k` operations, `352.71ms` average latency

## End-to-End Call Chain

| User action | External frontend code path | Frontend API calls | Orchestration hot path | Likely DB pattern |
| --- | --- | --- | --- | --- |
| Dashboard load | `app/routes/create-catch-certificate.catch-certificates.tsx` -> `app/.server/dashboard.ts` | `GET /v1/documents/{year}/{month}?type=catchCertificate` | `DocumentController.getAllDocuments()` -> `getDraftCatchCertHeadersForUser()` + `getAllCatchCertsForUserByYearAndMonth()` | `aggregate`, `find`, `getMore` |
| Landings entry load | `app/models/landingsEntry.server.ts` | `GET /v1/export-certificates/landings-type` | `withDocumentLegitimatelyOwned()` -> `ExportPayloadController.getLandingsType()` | repeated `find` |
| Progress page load | `app/.server/progress.ts` | `GET /v1/export-certificates/landings-type`, `GET /v1/progress/catchCertificate`, `GET transportations` | ownership validation + progress service + transport service | repeated `find` |
| Check your information load | `app/models/checkYourInformation.server.ts` | `GET /v1/certificate/catchCertificate`, `GET /v1/progress/catchCertificate` | ownership validation + summary controller + progress service | repeated `find` |
| Submit | `app/models/checkYourInformation.server.ts` -> `app/.server/certificateSummary.ts` | `POST /v1/export-certificates/create` | ownership validation -> pre-check -> createExportCertificate service | repeated `find`, `findAndModify` |

## How One User Journey Turns Into Many Database Reads

### 1. Progress page load

Minimum hot path reads when `landingsEntryOption` already exists:

1. `GET /v1/export-certificates/landings-type`
   - ownership validation read
   - `getLandingsType()` read
2. `GET /v1/progress/catchCertificate`
   - ownership validation read
   - `ProgressService.get()` read
3. transport summary call from the frontend progress loader
   - ownership validation read
   - transport service read

Minimum Mongo/Cosmos reads for this page load: about `6`.

### 2. Check your information page load

1. `GET /v1/certificate/catchCertificate`
   - ownership validation read
   - summary read
2. `GET /v1/progress/catchCertificate`
   - ownership validation read
   - progress read

Minimum Mongo/Cosmos reads for this page load: about `4`.

### 3. Final submit

`POST /v1/export-certificates/create` currently performs, at minimum:

1. ownership validation read
2. `ExportPayloadService.get()` -> draft read
3. `getCertificateStatus()` -> draft read
4. `gatherExportInfo()` -> draft read
5. phase 2 `getDraft()` after cache invalidation -> draft read
6. `findOneAndUpdate()` style state transition on completion or status update

Minimum Mongo/Cosmos reads for submit alone: about `5` reads plus at least `1` write-oriented `findAndModify`.

### 4. Correlation with your `Find` metric

If one successful submit journey from progress page to completion generates at least:

- `6` reads on progress
- `4` reads on check-your-information
- `5` reads on submit

then one journey creates about `15` document reads before redirects and dashboard reloads.

That means:

$$250 \text{ concurrent journeys} \times 15 \text{ reads} = 3750 \text{ find-like operations}$$

Your observed `Find` workload is `3.71k`, which is directionally consistent with this code path.

## Database Metric to Code Correlation

| Metric | Most likely code source | Why it matches |
| --- | --- | --- |
| `Find` | `withDocumentLegitimatelyOwned()` + `CatchCertService.getDraft()` + `CatchCertService.getDocument()` | These helpers are called on almost every catch certificate endpoint, often twice in the same request. |
| `GetMore` | dashboard monthly completed-documents query and draft-header aggregate query | `getMore` happens on cursor continuation. The dashboard pulls all completed docs for the selected month and also runs an aggregate for in-progress docs. Under load this is the clearest source of cursor continuation. |
| `Aggregate` | `getDraftCatchCertHeadersForUser()` | This path uses `$match` + `$lookup` + `$project` + `sort` for every dashboard load. |
| `FindAndModify` | `upsertDraftData()`, `completeDraft()`, `updateCertificateStatus()` | These use `findOneAndUpdate()` heavily during draft mutation and submit transitions. |

## Root Causes

### Root Cause 1: ownership validation reads the document, then the route handler reads it again

`withDocumentLegitimatelyOwned()` validates ownership up front by calling `validateDocumentOwnership()`. That helper hits Mongo/Cosmos through `findOne()` when the cache is cold.

After that, the handler usually ignores the already validated document and calls `getDraft()` or `getDocument()` again.

Examples:

- `GET /v1/certificate/catchCertificate`
- `GET /v1/progress/catchCertificate`
- `GET /v1/export-certificates/export-payload`
- `GET /v1/export-certificates/export-payload/direct-landings`
- `GET /v1/export-certificates/landings-type`
- `POST /v1/export-certificates/create`

This is the single clearest source of inflated `Find` count.

### Root Cause 2: submit path re-reads the same draft several times in one request

Even after the existing FI0-11132 optimizations, the submit path still does multiple draft reads in sequence:

- one for the pre-check payload
- one for status
- one for phase 1 export info gathering
- one more after cache invalidation

This is expensive because the `exportCertificates` document is large and nested.

### Root Cause 3: frontend page fan-out multiplies backend reads before submission starts

The frontend does not directly hammer the database, but it triggers several orchestration endpoints for each page.

Because each of those endpoints repeats ownership validation and then repeats draft reads, one human click path creates many database reads.

### Root Cause 4: dashboard queries are cursor-heavy and one owner branch is under-indexed

The dashboard path is important because users return there after create/submit, and many concurrent users load it at the same time.

The current completed-documents query filters by an owner `$or`, by `status`, and by a `createdAt` range, then sorts by `createdAt desc`.

Existing indexes already help two owner branches:

- `createdBy + status + createdAt`
- `contactId + status + createdAt`

But the third owner branch only has a single-field index:

- `exportData.exporterDetails.contactId`

There is no matching compound index for:

- `exportData.exporterDetails.contactId + status + createdAt`

That is a plausible source of the slow list reads and `getMore` cursor continuation on dashboard loads.

### Root Cause 5: several hot reads fetch whole documents when only a few fields are needed

Examples:

- ownership validation only needs ownership fields and status
- `getLandingsType()` only needs `exportData.landingsEntryOption`, and in fallback cases transport and landing basics
- `getCertificateStatus()` only needs `status`

Reading the whole draft repeatedly increases CPU, document load time, and response latency.

### Root Cause 6: draft header aggregate uses `$lookup` on every dashboard load

`getDraftCatchCertHeadersForUser()` uses:

- `$match`
- `$lookup` into `failedonlinecertificates`
- `$project`
- `sort`

This is not the main cause of the `Find` spike, but it explains part of the `Aggregate` workload and contributes to the dashboard becoming expensive under concurrency.

## Index Review Against Current Queries

### Indexes that already help

- `documentNumber`
  - good for targeted single-document access by document number
- `contactId + status + createdAt`
  - good for one dashboard owner branch
- `createdBy + status + createdAt`
  - good for another dashboard owner branch

### Index gap that matters most in this flow

- missing compound index on:
  - `exportData.exporterDetails.contactId`
  - `status`
  - `createdAt: -1`

That gap matters more than adding another `documentNumber` index.

### Important Azure Cosmos DB for MongoDB nuance

According to Microsoft guidance for Azure Cosmos DB for MongoDB:

- multiple single-field indexes are usually enough for multi-filter predicates
- compound indexes are most important when sort behavior needs to be efficient

That means the highest-value new index here is the sort-friendly owner-path index for dashboard queries, not a large collection of new compound indexes for every filter combination.

## Priority-Ordered Improvements

| Priority | Improvement | Evidence | Expected effect on DB load | Functional safety |
| --- | --- | --- | --- | --- |
| `P1` | Reuse the ownership-validated document in hot orchestration routes instead of reading it again | `withDocumentLegitimatelyOwned()` already passes `document`, but most handlers ignore it and call `getDraft()` / `getDocument()` again | Large reduction in `Find` count across progress, summary, transport, landings type, export payload, and submit paths | Very safe. No functional change. Only removes duplicate reads. |
| `P2` | Reuse one request-scoped draft snapshot throughout `createExportCertificate` submit flow | Submit currently re-reads the same draft multiple times even inside one request | High reduction in submit-path `Find` load and lower submit latency under concurrency | Safe if the snapshot is reused only within the same request and one explicit refresh is kept where freshness is required |
| `P3` | Add compound index on `exportData.exporterDetails.contactId`, `status`, `createdAt: -1` | Dashboard completed-doc query and draft-header query sort by `createdAt` and filter by owner + status; this owner branch lacks a matching sort-friendly index | Lower latency for dashboard reads and fewer `getMore`/scan-heavy list queries | Very safe. Index-only change. No behavior change |
| `P4` | Introduce lightweight projected and `lean()` reads for ownership, status, and landings-type checks | Several hot paths fetch the full nested document when only a few fields are needed | Lower document load time and lower CPU per read | Safe if used only for read-only paths that do not need hydrated Mongoose documents |
| `P5` | Collapse progress/check-information fan-out by extending existing responses instead of making separate calls | Progress and summary pages each call multiple endpoints that all repeat the same document reads | Medium to high reduction in `Find` load per journey | Safe if response changes are additive and frontend rendering remains unchanged |
| `P6` | Cache `/v1/documents/{year}/{month}` results per user and month with short TTL and targeted invalidation | In-progress draft headers are cached, but completed monthly results are not; repeated dashboard loads will hit DB again | Reduces repeated `find` and `getMore` load during peaks and after redirects back to dashboard | Safe with short TTL and invalidation on create, complete, delete, copy, and void |
| `P7` | Replace the draft-header `$lookup` aggregate with a cheaper pattern | `getDraftCatchCertHeadersForUser()` uses `$lookup` against `failedonlinecertificates` on each request | Lowers `Aggregate` cost and may reduce cursor continuation on dashboard loads | Safe if failure state is read separately in batch or materialized without changing visible dashboard behavior |

## Detailed Fixes and Code Examples

### P1. Reuse the ownership-validated document

#### Why this is highest priority

This change attacks the largest multiplier in the system.

Every route below currently has a strong chance of doing two reads for one logical operation:

- one read in ownership validation
- one read in the controller or service

Because the helper already passes the validated document into the callback, the codebase already contains the right abstraction. It is simply not being used consistently.

#### Example

Target pattern:

- use the `document` already supplied by `withDocumentLegitimatelyOwned()`
- add controller or service overloads that accept a previously loaded document

```ts
// route example
return withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId, document) => {
  return Controller.getSummaryCertificateFromDocument(
    document as CatchCertificate,
    userPrincipal,
    contactId
  );
}, [DocumentStatuses.Draft, DocumentStatuses.Locked, DocumentStatuses.Complete]);

// controller example
public static async getSummaryCertificateFromDocument(
  document: CatchCertificate,
  userPrincipal: string,
  contactId: string
): Promise<CertificateSummary> {
  const summaryErrors = await SummaryErrorsService.get(userPrincipal, document.documentNumber, contactId);

  return {
    ...toFrontEndDocumentNumber(document),
    ...toFrontEndCatchCert(document),
    validationErrors: summaryErrors,
    userReference: document.userReference,
  };
}
```

Apply the same pattern to these hot routes first:

- `/v1/certificate/catchCertificate`
- `/v1/progress/{journey}` for catch certificate
- `/v1/export-certificates/landings-type`
- `/v1/export-certificates/export-payload`
- `/v1/export-certificates/export-payload/direct-landings`
- `/v1/export-certificates/create`
- transport read routes used by the progress page

#### Why it is safe

- ownership is still validated exactly once
- the same document is still used
- the returned payload does not change
- only duplicate reads are removed

### P2. Reuse one draft snapshot inside submit

#### Why this matters

The submit path is the most expensive single request in the flow.

Even after the existing optimizations, it still repeatedly calls draft getters during the same request.

This can be reduced by creating a request-scoped context object and passing it through the pre-check and create service logic.

#### Example

```ts
type CreateCcContext = {
  draft: CatchCertificate;
  exportPayload: ProductsLanded;
  contactId: string;
  userPrincipal: string;
  documentNumber: string;
};

const draft = (document as CatchCertificate) ?? await CatchCertService.getDraft(userPrincipal, documentNumber, contactId);
const exportPayload = await CatchCertService.getExportPayload(userPrincipal, documentNumber, contactId, draft);

const ctx: CreateCcContext = {
  draft,
  exportPayload,
  contactId,
  userPrincipal,
  documentNumber,
};

const preCheckErrors = await ExportPayloadController.preCheckCertificateFromContext(ctx);
if (preCheckErrors) {
  return h.response(preCheckErrors.response).code(preCheckErrors.code);
}

const results = await ExportPayloadService.createExportCertificateFromContext(ctx, userEmail);
```

Service-side example:

```ts
public static async createExportCertificateFromContext(ctx: CreateCcContext, email: string) {
  const { draft, userPrincipal, documentNumber, contactId } = ctx;

  const [exporter, exportLocation, transportations, transportDetails, conservation] = await Promise.all([
    CatchCertService.getExporterDetails(userPrincipal, documentNumber, contactId, draft),
    CatchCertService.getExportLocation(userPrincipal, documentNumber, contactId, draft),
    CatchCertificateTransport.getTransportations(userPrincipal, documentNumber, contactId, draft),
    CatchCertificateTransport.getTransportationDetails(userPrincipal, documentNumber, contactId, draft),
    CatchCertService.getConservation(userPrincipal, documentNumber, contactId, draft),
  ]);

  // Only do one fresh read later if there is a proven freshness requirement.
}
```

#### Why it is safe

- the request still works with the same document state
- the same validation logic runs
- only duplicate reads inside the same request are removed
- one explicit refresh can still be kept if a post-invalidation read is genuinely required

### P3. Add the missing compound index for exporter-contact dashboard queries

#### Why this matters

The completed-doc dashboard query filters by owner, `status`, month range, and sorts by `createdAt desc`.

Two owner branches already have supporting compound indexes. The exporter-contact branch does not.

That means users whose ownership resolves through `exportData.exporterDetails.contactId` are much more likely to trigger scans or less efficient sorted reads.

#### Example

```mongodb
db.exportCertificates.createIndex({
  "exportData.exporterDetails.contactId": 1,
  status: 1,
  createdAt: -1
})
```

#### Why it is safe

- it does not change result shape or business logic
- it directly supports an existing query pattern
- it aligns with Azure Cosmos DB for MongoDB guidance where compound indexes are most valuable for efficient sort behavior

### P4. Use projected and `lean()` reads for hot, read-only paths

#### Why this matters

Some hot paths only need a small subset of fields but still load the full document.

That is expensive when the draft contains nested `exportData.products`, catches, landings, transport blocks, and validation state.

Good candidates:

- ownership validation
- certificate status check
- landings type lookup
- transport summary lookup

#### Example

Ownership validation example:

```ts
const ownershipProjection = [
  "documentNumber",
  "status",
  "createdBy",
  "contactId",
  "exportData.exporterDetails.contactId",
] as const;

document = await model.findOne(
  { documentNumber, status: { $in: statuses } },
  ownershipProjection,
  { lean: true }
);
```

Status and landings-type helper example:

```ts
export const getDraftStatusAndLandingMode = async (documentNumber: string) =>
  CatchCertModel.findOne(
    {
      documentNumber,
      status: { $in: [DocumentStatuses.Draft, DocumentStatuses.Pending, DocumentStatuses.Locked] },
    },
    [
      "status",
      "userReference",
      "exportData.landingsEntryOption",
      "exportData.transportation",
      "exportData.transportations",
    ],
    { lean: true }
  );
```

#### Why it is safe

- these paths are read-only
- the code only consumes plain data fields
- the response contract does not change

### P5. Collapse pre-submit frontend fan-out into additive responses

#### Why this matters

The progress and summary pages currently make multiple orchestration calls that all end up reading the same draft again.

The lowest-risk version of this fix is not a brand new UI flow. It is extending existing endpoint payloads so the frontend can stop calling separate helper endpoints.

Good candidates:

- include `landingsEntryOption` and transport summary in the progress response
- include progress completeness in the certificate summary response

#### Example

Orchestration response example:

```ts
return {
  progress: progressSections,
  requiredSections,
  completedSections,
  landingsEntryOption: data.exportData.landingsEntryOption,
  transportSummary: ProgressService.getPrimaryTransportSummary(data),
};
```

Frontend loader example:

```ts
const {
  progress,
  completedSections,
  requiredSections,
  landingsEntryOption,
  transportSummary,
} = await getProgressBundle(bearerToken, "catchCertificate", documentNumber);

if (!landingsEntryOption) {
  return redirect(route("/create-catch-certificate/:documentNumber/landings-entry", { documentNumber }));
}
```

#### Why it is safe

- the user-visible page remains the same
- only redundant API calls are removed
- additive response fields are backward-compatible when introduced carefully

### P6. Cache month-based dashboard results per user

#### Why this matters

The in-progress draft headers are already cached, but the completed monthly results are not.

That means:

- dashboard reloads
- redirect-after-submit
- many concurrent users on the same month view

all keep re-running the same month query.

#### Example

```ts
const cacheKey = `${CATCH_CERTIFICATE_KEY}/documents/${yearAndMonth}`;
const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

const cached = await sessionStore.readFor<AllDocuments>(userPrincipal, contactId, cacheKey);
if (cached) {
  return cached;
}

const payload = {
  inProgress: await getDraftCatchCertHeadersForUser(userPrincipal, contactId),
  completed: await getAllCatchCertsForUserByYearAndMonth(yearAndMonth, userPrincipal, contactId),
};

await sessionStore.writeFor(userPrincipal, contactId, cacheKey, payload, 60);
return payload;
```

Invalidate on:

- create draft
- complete draft
- delete draft
- copy
- void

#### Why it is safe

- response stays identical
- short TTL prevents stale data from persisting for long
- targeted invalidation keeps the dashboard current enough for normal user behavior

### P7. Remove the `$lookup` from the draft-header hot path

#### Why this matters

`getDraftCatchCertHeadersForUser()` is responsible for a meaningful part of the `Aggregate` workload.

The current pattern joins `failedonlinecertificates` into the main aggregate every time the dashboard is loaded.

That is expensive under concurrency.

#### Safer implementation option

Keep behavior the same, but split the work into:

1. a direct header query on `exportCertificates`
2. one batched lookup on `failedonlinecertificates` by the returned document numbers

#### Example

```ts
const headers = await CatchCertModel.find(
  {
    $or: ownerQuery,
    status: { $in: [DocumentStatuses.Draft, DocumentStatuses.Pending, DocumentStatuses.Locked] },
  },
  ["documentNumber", "status", "userReference", "createdAt"],
  { lean: true }
).sort({ createdAt: -1 });

const failedDocuments = await FailedOnlineCertificatesModel.find(
  { documentNumber: { $in: headers.map((h) => h.documentNumber) } },
  ["documentNumber"],
  { lean: true }
);

const failedSet = new Set(failedDocuments.map((d) => d.documentNumber));

return headers.map((header) => ({
  ...header,
  isFailed: header.status === DocumentStatuses.Draft && failedSet.has(header.documentNumber),
}));
```

#### Why it is safe

- visible dashboard result stays the same
- the expensive join is removed from the hot path
- batched point lookup is easier to reason about and benchmark

## Improvements That Should Not Be the First Fix

These may help later, but they are not the root-first actions for this incident.

| Candidate | Why it should not be first |
| --- | --- |
| Add more `documentNumber` indexes | Single-document access by `documentNumber` is already reasonably supported. The main issue is repeated reads, not inability to find by document number. |
| Scale throughput alone | More throughput can mask the problem briefly, but it does not remove read amplification or cursor-heavy queries. |
| Add many broad compound indexes for all filter combinations | Azure Cosmos DB for MongoDB guidance does not support that as the main optimization path for multi-filter predicates. The first missing compound index to add is the sort-friendly exporter-contact dashboard index. |

## Recommended Delivery Order

1. Implement `P1` on the hottest catch certificate routes.
2. Implement `P2` inside `createExportCertificate` submit flow.
3. Add `P3` index.
4. Run load tests and collect `explain()` output for:
   - dashboard month query
   - draft-header query
   - progress route read path
   - submit route pre-check path
5. Implement `P4` on the highest-frequency read-only helpers.
6. Implement `P5` and `P6` if `Find` and `GetMore` are still above target.
7. Implement `P7` if `Aggregate` remains a material contributor after the earlier fixes.

## Validation Plan

For each change set, verify all of the following before and after load testing:

1. `Find` count per submit journey
2. `GetMore` count during dashboard-heavy tests
3. `Aggregate` latency for draft-header retrieval
4. submit success rate and timeout rate
5. `explain()` output:
   - `pathsIndexed`
   - `pathsNotIndexed`
   - `retrievedDocumentCount`
   - `outputDocumentCount`
   - `timeInclusiveMS`

Recommended success criteria:

- `retrievedDocumentCount` moves much closer to `outputDocumentCount` on dashboard queries
- submit journey generates materially fewer `find` operations
- dashboard reload after submit no longer causes heavy `getMore` spikes
- no change in user-visible behavior, redirects, progress rules, or validation results

## Root Cause Conclusion

The current implementation overuses the database in two ways at once:

1. it re-reads the same `exportCertificates` draft multiple times per request
2. it issues cursor-heavy dashboard queries that are only partially supported by the current index set

That combination is enough to explain the database saturation under concurrency.

The highest-value fixes are not broad rewrites.

The highest-value fixes are:

- remove duplicate reads
- reuse already loaded documents inside the same request
- add the missing sort-friendly owner index
- reduce list-query repetition and cursor continuation

All of those changes can be delivered without changing the business behavior of the page or the submission flow.