import { createHash } from "node:crypto";

function normalizeForFingerprint(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .trim();
}

export function buildPromptFingerprint(input: string): string {
  const normalized = normalizeForFingerprint(input);
  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

export function buildPromptFamilyFingerprint(input: string): string {
  const normalized = normalizeForFingerprint(input);
  const words = normalized
    .split(" ")
    .filter(Boolean)
    .filter((word) => word.length > 2);
  const unique = Array.from(new Set(words)).sort();
  const stem = unique.slice(0, 32).join(" ");
  return `family:${createHash("sha256").update(stem).digest("hex").slice(0, 16)}`;
}
