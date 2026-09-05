---
name: StreetView durable storage
description: Durable production storage for StreetView media and its authorization boundary.
---

Production StreetView media uses private S3-compatible object storage with direct multipart uploads. Express issues short-lived, contribution- and user-scoped signed URLs; storage credentials never reach the browser, and the filesystem backend is development-only.

**Why:** Video files are too large and operationally sensitive to proxy through Express or store in PostgreSQL, while production filesystem storage is not durable.

**How to apply:** Keep originals separate from future processing artifacts, derive object keys from contribution UUIDs rather than filenames, fail closed when production storage is incomplete, and enforce owner checks for upload, read, and deletion.