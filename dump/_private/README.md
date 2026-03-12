# dump/_private

This directory is for **full-fidelity, sensitive exports** that should **never be committed**.

It exists so you can work with real user export histories locally while keeping the committed corpus (`dump/*-dump/`) sanitized.

Git behavior:

- Contents are ignored by `.gitignore` (`dump/_private/*`).
- This README remains tracked so the directory purpose is visible.

Working rules:

- Do not force-add files from here.
- Prefer deriving reduced samples into the provider buckets (`dump/openai-dump/`, etc.) plus `MANIFEST-{filename}.md` sidecars.

