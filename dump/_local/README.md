# Local Dump Directory

This directory is for **personal, work-in-progress, or temporary** corpus files during local development.

## Purpose

- Scratch space for copy-paste experiments
- Temporary holding area for new provider samples being evaluated
- Personal notes and working files not ready for sharing

## Usage

```
New provider sample arrives
    ↓
dump/_local/gemini-experiment-1.txt
    ↓
Evaluate, clean, validate
    ↓
Move to dump/google-dump/ with MANIFEST.md
    ↓
Delete from _local/
```

## Conventions

- Use descriptive filenames: `<provider>-<experiment>-<date>.<ext>`
- Clean up regularly — don't let this become a junk drawer
- Move validated samples to their proper provider bucket
- Add a note in the sample if it represents a new export method

## Git Status

This directory is **gitignored** (`dump/_local/` in `.gitignore`).
Files here are strictly local-only.
