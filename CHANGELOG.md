# Changelog

All notable changes to SlopVault will be documented in this file.

## [0.1.0.0] - 2026-03-22

### Added
- You can now upload files directly to Supabase Storage — RLS-protected per user
- Storage utilities: upload, download, signed URLs, and batch deletion
- Discarding an ingestion now cleans up uploaded files automatically
- Edge case tests for mixed input (files + audio links) ingestion
- 18 new unit tests covering all storage operations and auth boundaries

### Changed
- File storage moved from local filesystem to Supabase Storage
- File paths use `{userId}/{ingestionId}/{filename}` for per-user isolation
- `preservedPath` renamed to `storagePath` across types and extraction pipeline
- Ingestion pipeline fully unified on Supabase (dump + vault)

### Removed
- Local filesystem storage (`node:fs` operations no longer used)
- Upload manifest JSON files (now tracked via database)
