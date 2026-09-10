/**
 * @deprecated Demo vault has been removed. The vault now reads from /api/ingestions.
 * This file is kept as a placeholder to avoid breaking imports during migration.
 * Remove this file once all import references are cleaned up.
 */

import type {
  IngestPreviewItem,
  IngestSaveReceipt,
  IngestSaveResponse
} from "@/lib/ingest-contract";

/**
 * @deprecated Use the ingestion API instead. This function now returns an empty array.
 */
export function listDemoVaultArtifacts() {
  return [];
}

/**
 * @deprecated Use the ingestion API instead. This function now returns a mock receipt.
 */
export function savePreviewItemsToDemoVault(
  items: IngestPreviewItem[]
): IngestSaveResponse {
  const savedAt = new Date().toISOString();

  const receipts = items.map<IngestSaveReceipt>((item) => ({
    savedId: `deprecated-${Date.now()}`,
    title: item.title,
    artifactType: item.artifactType,
    visibility: item.metadata.visibility
  }));

  return {
    savedAt,
    savedCount: 0,
    receipts
  };
}
