# dump/_local

This directory is for **personal scratch space** while you evaluate new samples or export methods.

Git behavior:

- Contents are ignored by `.gitignore` (`dump/_local/*`).
- This README remains tracked so the directory purpose is visible.

Workflow:

1. Drop new WIP samples here.
2. Once validated, move them into the right provider bucket (`dump/*-dump/`).
3. Add a `MANIFEST-{filename}.md` sidecar for any sample that matters.
4. Delete the scratch file from `_local/`.

