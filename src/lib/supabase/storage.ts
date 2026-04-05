import { createClient } from "@/lib/supabase/server";

export interface StorageUploadResult {
  path: string;
  fullPath: string;
  publicUrl: string | null;
}

/**
 * Upload a file to Supabase Storage in the ingestion-sources bucket.
 * Files are organized by user_id/ingestion_id/filename for RLS compatibility.
 */
export async function uploadToStorage(
  userId: string,
  ingestionId: string,
  file: File,
): Promise<StorageUploadResult> {
  const supabase = await createClient();
  
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${userId}/${ingestionId}/${crypto.randomUUID()}-${safeName}`;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const { error } = await supabase
    .storage
    .from("ingestion-sources")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  
  if (error) throw error;
  
  // Get the public URL (will be null since bucket is private)
  const { data: urlData } = supabase
    .storage
    .from("ingestion-sources")
    .getPublicUrl(path);
  
  return {
    path,
    fullPath: path,
    publicUrl: null, // Bucket is private, access via signed URL or authenticated request
  };
}

/**
 * Download a file from Supabase Storage.
 * Returns the file content as a buffer.
 */
export async function downloadFromStorage(
  userId: string,
  path: string,
): Promise<Buffer> {
  const supabase = await createClient();
  
  // Verify the path starts with the user's ID (RLS check)
  if (!path.startsWith(`${userId}/`)) {
    throw new Error("Unauthorized: cannot access files outside user scope");
  }
  
  const { data, error } = await supabase
    .storage
    .from("ingestion-sources")
    .download(path);
  
  if (error) throw error;
  
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Get a signed URL for temporary access to a private file.
 */
export async function getSignedUrl(
  userId: string,
  path: string,
  expiresIn: number = 3600, // 1 hour default
): Promise<string> {
  const supabase = await createClient();
  
  // Verify the path starts with the user's ID (RLS check)
  if (!path.startsWith(`${userId}/`)) {
    throw new Error("Unauthorized: cannot access files outside user scope");
  }
  
  const { data, error } = await supabase
    .storage
    .from("ingestion-sources")
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  
  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFromStorage(
  userId: string,
  path: string,
): Promise<void> {
  const supabase = await createClient();
  
  // Verify the path starts with the user's ID (RLS check)
  if (!path.startsWith(`${userId}/`)) {
    throw new Error("Unauthorized: cannot delete files outside user scope");
  }
  
  const { error } = await supabase
    .storage
    .from("ingestion-sources")
    .remove([path]);
  
  if (error) throw error;
}

/**
 * Delete all files for an ingestion.
 */
export async function deleteIngestionFiles(
  userId: string,
  ingestionId: string,
): Promise<void> {
  const supabase = await createClient();
  
  const prefix = `${userId}/${ingestionId}/`;
  
  // List all files with the prefix
  const { data: listData, error: listError } = await supabase
    .storage
    .from("ingestion-sources")
    .list(`${userId}/${ingestionId}`);
  
  if (listError) throw listError;
  if (!listData || listData.length === 0) return;
  
  const paths = listData.map(item => `${prefix}${item.name}`);
  
  const { error } = await supabase
    .storage
    .from("ingestion-sources")
    .remove(paths);
  
  if (error) throw error;
}
