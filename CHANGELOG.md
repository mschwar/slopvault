# Changelog

All notable changes to SlopVault will be documented in this file.

## [0.1.0.0] - 2026-03-22

### Added
- Supabase Storage integration for file uploads (`ingestion-sources` bucket with RLS)
- Storage utility module with upload, download, signed URLs, and deletion
- Storage cleanup on ingestion discard (removes orphaned files)
- Edge case tests for mixed input (files + audio links) ingestion
- Comprehensive unit tests for all storage utility functions (18 new tests)

### Changed
- Migrated file storage from local filesystem to Supabase Storage
- File paths now use `{userId}/{ingestionId}/{filename}` format for RLS compatibility
- Renamed `preservedPath` to `storagePath` across types and extraction pipeline
- Unified ingestion pipeline on Supabase-backed persistence (dump + vault)

### Removed
- Local filesystem storage (`node:fs` file operations in ingestion service)
- Upload manifest JSON files (replaced by database tracking via ingestion_items)
- Deleted 5 test corpus manifest/artifact files that used local storage paths
