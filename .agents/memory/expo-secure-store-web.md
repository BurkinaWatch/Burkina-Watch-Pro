---
name: Expo SecureStore web compatibility
description: SecureStore may expose an incomplete web shim in the Expo preview runtime.
---

Native iOS and Android sessions should use SecureStore, but Expo Web preview can lack the SecureStore native methods. Keep a platform-aware fallback for preview-only execution.

**Why:** The Expo preview crashed when the auth provider read SecureStore on Web even though native SecureStore was available and correctly typed.

**How to apply:** Wrap SecureStore reads/writes/deletes behind a Platform.OS check and use the existing web-safe storage only for Platform.OS === "web"; never replace native SecureStore with that fallback.