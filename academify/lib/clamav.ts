import { createHash } from "crypto";
import { getObjectBytes, deleteObject } from "@/lib/storage";

// Integration point for option A: scan after MinIO/S3 upload.
//
// Important:
// - This repo currently uploads directly to MinIO via presigned URL.
// - So scanning must happen AFTER upload by downloading the object bytes.
// - You must provide ClamAV in your runtime (clamscan binary or clamd).
//
// This file contains a placeholder scan implementation that is safe to deploy
// (it will not mark files as clean). You need to wire real ClamAV invocation.

export type ClamScanResult =
  | { ok: true; infected: false }
  | { ok: true; infected: true; virusName: string }
  | { ok: false; error: string };

function digestSha256(bytes: Uint8Array | Buffer) {
  const hash = createHash("sha256");
  hash.update(Buffer.from(bytes));
  return hash.digest("hex");
}

export async function scanBytesWithClamAV(
  _fileBytes: Uint8Array | Buffer,
  _fileName: string
): Promise<ClamScanResult> {
  // ClamAV implementation cancelled.
  // Return a deterministic error so API caller knows scanning is disabled.
  return { ok: false, error: "ClamAV scan disabled" };
}

export async function scanObjectFromMinio(
  _objectKey: string,
  _fileName: string
): Promise<ClamScanResult> {
  // ClamAV implementation cancelled.
  return { ok: false, error: "ClamAV scan disabled" };
}

export async function deleteInfectedObject(_objectKey: string, _fileId?: string) {
  // ClamAV implementation cancelled: no-op.
}





