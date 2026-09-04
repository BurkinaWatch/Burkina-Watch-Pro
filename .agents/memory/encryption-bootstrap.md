---
name: Encryption bootstrap
description: Environment-specific startup and test-import constraint for the encryption singleton.
---

The encryption service is instantiated during module import and refuses to
start without a valid `MASTER_ENCRYPTION_KEY` when KMS is disabled. Tests that
exercise encrypted services must set a deterministic test key before using
dynamic imports; the application workflow must receive the real key through
the workspace secret manager.

**Why:** A missing key can look like a surveillance regression even though the
camera code is valid, and static ESM imports run before top-level test setup.

**How to apply:** Keep production startup fail-closed. In tests, configure only
an isolated deterministic key before importing encryption-dependent modules;
never put a real key in source, logs, or test fixtures.