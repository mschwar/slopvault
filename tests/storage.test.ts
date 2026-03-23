import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  uploadToStorage,
  downloadFromStorage,
  getSignedUrl,
  deleteFromStorage,
  deleteIngestionFiles,
} from "@/lib/supabase/storage";

// Mock Supabase Server Client
const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();
const mockGetPublicUrl = vi.fn(() => ({
  data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/test" },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        download: mockDownload,
        createSignedUrl: mockCreateSignedUrl,
        remove: mockRemove,
        list: mockList,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

describe("storage utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadToStorage", () => {
    test("uploads file with correct path structure", async () => {
      mockUpload.mockResolvedValue({ error: null });

      const file = new File(["test content"], "hello.txt", { type: "text/plain" });
      const result = await uploadToStorage("user-1", "ing-1", file);

      expect(result.path).toMatch(/^user-1\/ing-1\/.+-hello\.txt$/);
      expect(result.publicUrl).toBeNull();
      expect(mockUpload).toHaveBeenCalledOnce();
    });

    test("sanitizes filename removing special characters", async () => {
      mockUpload.mockResolvedValue({ error: null });

      const file = new File(["data"], "my file (1).txt", { type: "text/plain" });
      const result = await uploadToStorage("user-1", "ing-1", file);

      expect(result.path).toMatch(/my_file__1_\.txt$/);
    });

    test("throws on upload error", async () => {
      mockUpload.mockResolvedValue({ error: new Error("Upload failed") });

      const file = new File(["data"], "test.txt", { type: "text/plain" });
      await expect(uploadToStorage("user-1", "ing-1", file)).rejects.toThrow("Upload failed");
    });
  });

  describe("downloadFromStorage", () => {
    test("downloads file content as buffer", async () => {
      const blob = new Blob(["file content"]);
      mockDownload.mockResolvedValue({ data: blob, error: null });

      const result = await downloadFromStorage("user-1", "user-1/ing-1/file.txt");

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString("utf8")).toBe("file content");
    });

    test("throws when path does not start with userId", async () => {
      await expect(
        downloadFromStorage("user-1", "user-2/ing-1/file.txt"),
      ).rejects.toThrow("Unauthorized: cannot access files outside user scope");
    });

    test("throws on download error", async () => {
      mockDownload.mockResolvedValue({ data: null, error: new Error("Not found") });

      await expect(
        downloadFromStorage("user-1", "user-1/ing-1/file.txt"),
      ).rejects.toThrow("Not found");
    });
  });

  describe("getSignedUrl", () => {
    test("returns signed URL with default expiry", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://signed.url/token" },
        error: null,
      });

      const url = await getSignedUrl("user-1", "user-1/ing-1/file.txt");

      expect(url).toBe("https://signed.url/token");
      expect(mockCreateSignedUrl).toHaveBeenCalledWith("user-1/ing-1/file.txt", 3600);
    });

    test("respects custom expiry", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://signed.url/token" },
        error: null,
      });

      await getSignedUrl("user-1", "user-1/ing-1/file.txt", 600);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith("user-1/ing-1/file.txt", 600);
    });

    test("throws when path does not start with userId", async () => {
      await expect(
        getSignedUrl("user-1", "user-2/ing-1/file.txt"),
      ).rejects.toThrow("Unauthorized: cannot access files outside user scope");
    });

    test("throws on API error", async () => {
      mockCreateSignedUrl.mockResolvedValue({ data: null, error: new Error("Expired") });

      await expect(
        getSignedUrl("user-1", "user-1/ing-1/file.txt"),
      ).rejects.toThrow("Expired");
    });
  });

  describe("deleteFromStorage", () => {
    test("deletes file at path", async () => {
      mockRemove.mockResolvedValue({ error: null });

      await deleteFromStorage("user-1", "user-1/ing-1/file.txt");

      expect(mockRemove).toHaveBeenCalledWith(["user-1/ing-1/file.txt"]);
    });

    test("throws when path does not start with userId", async () => {
      await expect(
        deleteFromStorage("user-1", "user-2/ing-1/file.txt"),
      ).rejects.toThrow("Unauthorized: cannot delete files outside user scope");
    });

    test("throws on API error", async () => {
      mockRemove.mockResolvedValue({ error: new Error("Delete failed") });

      await expect(
        deleteFromStorage("user-1", "user-1/ing-1/file.txt"),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("deleteIngestionFiles", () => {
    test("lists and deletes all files for an ingestion", async () => {
      mockList.mockResolvedValue({
        data: [{ name: "file1.txt" }, { name: "file2.png" }],
        error: null,
      });
      mockRemove.mockResolvedValue({ error: null });

      await deleteIngestionFiles("user-1", "ing-1");

      expect(mockList).toHaveBeenCalledWith("user-1/ing-1");
      expect(mockRemove).toHaveBeenCalledWith([
        "user-1/ing-1/file1.txt",
        "user-1/ing-1/file2.png",
      ]);
    });

    test("returns early when no files found", async () => {
      mockList.mockResolvedValue({ data: [], error: null });

      await deleteIngestionFiles("user-1", "ing-1");

      expect(mockRemove).not.toHaveBeenCalled();
    });

    test("returns early when listing returns null", async () => {
      mockList.mockResolvedValue({ data: null, error: null });

      await deleteIngestionFiles("user-1", "ing-1");

      expect(mockRemove).not.toHaveBeenCalled();
    });

    test("throws on list error", async () => {
      mockList.mockResolvedValue({ data: null, error: new Error("List failed") });

      await expect(deleteIngestionFiles("user-1", "ing-1")).rejects.toThrow("List failed");
    });

    test("throws on remove error", async () => {
      mockList.mockResolvedValue({ data: [{ name: "f.txt" }], error: null });
      mockRemove.mockResolvedValue({ error: new Error("Remove failed") });

      await expect(deleteIngestionFiles("user-1", "ing-1")).rejects.toThrow("Remove failed");
    });
  });
});
