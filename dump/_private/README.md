# Private Dump Directory

This directory is for **full-fidelity, sensitive exports** that should **never be committed** to the repository.

## Purpose

- Store complete user data exports containing private conversations
- Keep large export files that exceed reasonable repo size limits
- Hold sensitive material that requires access control

## Usage

1. Place full provider exports here during local development
2. Reference files here when creating reduced test samples for `dump/<provider>/`
3. **Never commit files from this directory** — it's gitignored

## Workflow

```
Full export (private/sensitive)
    ↓
dump/_private/chatgpt-export-2026-03-11.zip
    ↓
Extract, sanitize, reduce
    ↓
Copy relevant samples to dump/openai-dump/
    ↓
Add MANIFEST.md sidecar describing the sample
```

## Security Notes

- This directory is listed in `.gitignore` (`dump/_private/`)
- Do not manually force-add files here
- Keep exports encrypted at rest if they contain sensitive personal data
- Delete exports when no longer needed for development
