---
name: Railway session storage
description: Durable database distinction needed for authentication sessions.
---

The external Railway database contains two similarly named tables: `sessions` is an application table with `id`, `user_id`, and `expires_at`; `express_sessions` is the express-session store with `sid`, `sess`, and `expire`. Authentication session storage must use `express_sessions`.

**Why:** Pointing connect-pg-simple at `sessions` causes login to fail after OTP verification because the store queries the missing `sess` column.

**How to apply:** When changing authentication storage or database selection, verify the selected database's session table schema rather than assuming the Drizzle `sessions` model is the express-session store.