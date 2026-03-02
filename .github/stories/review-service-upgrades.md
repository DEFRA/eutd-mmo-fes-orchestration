## Per-repo repeatable steps

### 0) Prep

1.  **Checkout a fresh branch**

        -   `git checkout -b feature/-FI0-10851-sprint-182-review-service-to-identify-if-upgrades-are-required`

2.  **Clean slate**

        -   Ensure you're not carrying local build artefacts, and you're on the right Node version (use `.nvmrc` / `.node-version` if present).

3.  **Ensure `.nvmrc` exists and is correct**

        -   If `.nvmrc` exists, verify it matches the repo's expected Node version.

        -   If `.nvmrc` does not exist, create it with the repo's Node version.

        -   Preferred source order for version:

                    -   `package.json` -> `engines.node`

                    -   Existing `.node-version`

                    -   Team standard/default (document what was used)

        -   Example:

                    -   `echo "20" > .nvmrc`

        -   Then run:

                    -   `nvm use`

---

### 1) Establish a baseline

1.  **Install exactly what the lockfile specifies**

        -   `npm ci` (preferred for reproducibility)

        -   If the repo doesn't have a lockfile, use `npm install` and consider adding one.

2.  **Run tests/build once (baseline sanity)**

        -   `npm test` / `npm run test`

        -   `npm run build` (if applicable)

        -   Optional but helpful: `npm run lint`

3.  **Create a rollback checkpoint**

        -   `git add package.json package-lock.json .nvmrc 2>/dev/null || true`

        -   `git commit -m "chore: baseline before dependency upgrades"`

        -   If you do not want a commit, keep working tree clean and use:

                    -   `git checkout -- package.json package-lock.json`

---

### 2) Vulnerability check (what changed?)

1.  **Run the audit**

        -   `npm audit`

2.  **Capture the output**

        -   Note:

                    -   Package(s) affected

                    -   Severity

                    -   Whether it's **direct** or **transitive**

                    -   Recommended fix version (if available)

Tip: If the repo is noisy with transitive issues, focus first on _direct deps_ you control --- upgrades there often lift the transitive chain.

---

### 3) Apply fixes safely

Work from least risky to most risky:

#### A) Safe automated patch/minor where possible

1.  **Attempt the non-breaking audit fix**

        -   `npm audit fix`

2.  **Re-run**

        -   `npm audit`

> Avoid `npm audit fix --force` as a default --- it can introduce breaking majors.

#### B) Targeted upgrades for direct dependencies (minor upgrades)

1.  **See what's outdated**

        -   `npm outdated`

2.  **Update minor versions (conservatively)**

        -   Use one of these approaches:

                    -   **Manual targeted updates** (recommended for control):

                                    -   `npm install <pkg>@^<latest_minor>` for each direct dep you approve

                    -   **Broad minor update** (quicker but less controlled):

                                    -   `npm update`
                                        This updates packages within the semver ranges in `package.json`.

3.  **Re-run**

        -   `npm audit`

4.  **Agent mode: upgrade one dependency at a time with validation**

        -   For each direct dependency you plan to upgrade (minor/patch only, no major):

                    1.  `npm install <pkg>@<target_non_breaking_version>`

                    2.  `npm test`

                    3.  `npm run build`

                    4.  If either command fails:

                                    -   Revert that package change immediately:

                                                    -   `git checkout -- package.json package-lock.json`

                                    -   Record package name + error summary in your report.

                                    -   Continue with next package.

                    5.  If both pass, keep the change and continue.

        -   This gives an auditable pass/fail result per package and avoids bundling breakages.

#### C) If vuln is transitive-only

Options in order:

1.  **Upgrade the nearest direct dependency** that brings in the vulnerable transitive.

2.  If still stuck:

        -   Consider **overrides** (npm supports `"overrides"` in `package.json`) to force a safe transitive version.

3.  Document why you used overrides (they're powerful, but you want future-you to remember).

---

### 4) Validate the repo still works

1.  `npm test`

2.  `npm run build` (if relevant)

3.  Smoke check the app (if it's a UI)

4.  Optional: run the repo's e2e or contract tests (if any)

5.  **Final regression after all accepted upgrades**

        -   `npm test`

        -   `npm run build`

---

### 5) Produce a clean PR

1.  **Commit only what's needed**

        -   `package.json`

        -   `package-lock.json`

2.  **PR description template**

        -   What you ran: `npm ci`, `npm audit`, `npm audit fix`, `npm outdated`, update approach

        -   What changed (high level)

        -   Before/after audit summary (number of vulns by severity)

        -   Any overrides and why

        -   Test evidence (commands + results)

        -   Rollback log (packages reverted due to test/build failures)

        -   `.nvmrc` status (created/updated + value)

---

## Agent-friendly execution sequence (copy/paste)

1.  `git checkout -b feature/<ticket>-dependency-upgrades`
2.  Ensure `.nvmrc` exists/updated, then `nvm use`
3.  `npm ci`
4.  Baseline: `npm test && npm run build`
5.  `npm audit`
6.  `npm audit fix`
7.  `npm audit`
8.  `npm outdated`
9.  Upgrade direct deps one-by-one (minor/patch only)
10. After each package: `npm test && npm run build`
11. On failure: revert `package.json` + `package-lock.json`, log failure, continue
12. Final: `npm test && npm run build && npm audit`
13. Prepare PR with before/after audit + revert log + `.nvmrc` note

---

## About `npm audit --json | npm-audit-markdown --output report.md`

- Useful for reporting, not for fixing.

- It helps you generate readable evidence of current vulnerabilities.

- It does **not** decide non-breaking upgrade paths by itself.

- Keep it as an extra reporting step after `npm audit`, for example:

      -   `npm audit --json | npm-audit-markdown --output report.md`

      -   Attach `report.md` to the PR for traceability.

---

## Recommended "standard operating procedure" you can copy/paste into each repo's PR

- Baseline: `.nvmrc` verified/created, `npm ci`, tests/build pass ✅

- Audit: `npm audit` (recorded output)

- Fixes:

      -   `npm audit fix` (no force)

        -   Minor updates (targeted, one-by-one)

        -   After each package: `npm test` + `npm run build`

        -   Revert package change immediately if validation fails

      -   Optional: `overrides` for stubborn transitive issues

- Verification: tests/build/lint ✅

- Final: `npm audit` clean or risk documented ✅

---
