---
name: Vitest/Vite compatibility
description: Test-runner compatibility constraints for this Vite 5 application
---

The application uses Vite 5, while the newest Vitest may resolve its own newer Vite major. In that combination, the production React plugin can fail to transform TSX in Vitest; an explicit test-only TSX pre-transform keeps page tests runnable without changing the production Vite config.

**Why:** The test runner and application build can resolve different Vite majors, so reusing the application plugin configuration is not always reliable.

**How to apply:** Check the resolved Vite versions before changing the test runner or React plugin. Keep any compatibility transform isolated to the test config.

Vitest's include patterns must also exclude repository tests that use Node's `node:test` runner; Vitest cannot bundle those built-in imports under the current browser-oriented configuration.

**Why:** Broadening the include pattern to all server tests makes the otherwise passing Vitest run fail during module resolution before those tests execute.

**How to apply:** Add server suites to the include list explicitly rather than including every server test until the Node test runner has its own configuration.