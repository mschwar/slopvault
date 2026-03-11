import type {
  IngestPreviewItem,
  IngestSaveReceipt,
  IngestSaveResponse
} from "@/lib/ingest-contract";

const DEMO_VAULT_KEY = "slopvault.demo.vault";

export interface DemoVaultArtifact extends IngestPreviewItem {
  savedAt: string;
  savedId: string;
}

function readVault(): DemoVaultArtifact[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(DEMO_VAULT_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as DemoVaultArtifact[];
  } catch {
    return [];
  }
}

function writeVault(items: DemoVaultArtifact[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_VAULT_KEY, JSON.stringify(items));
}

function createSavedId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${random}`;
}

export function listDemoVaultArtifacts() {
  return readVault().sort((left, right) =>
    right.savedAt.localeCompare(left.savedAt)
  );
}

export function savePreviewItemsToDemoVault(
  items: IngestPreviewItem[]
): IngestSaveResponse {
  const savedAt = new Date().toISOString();
  const existing = readVault();

  const savedItems = items.map<DemoVaultArtifact>((item) => ({
    ...item,
    savedAt,
    savedId: createSavedId("artifact")
  }));

  writeVault([...savedItems, ...existing]);

  const receipts = savedItems.map<IngestSaveReceipt>((item) => ({
    savedId: item.savedId,
    title: item.title,
    artifactType: item.artifactType,
    visibility: item.metadata.visibility
  }));

  return {
    savedAt,
    savedCount: receipts.length,
    receipts
  };
}

