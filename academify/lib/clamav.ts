import { createHash } from "crypto";
import { promises as fs } from "fs";
import { join as joinPath } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";

import { getObjectBytes } from "@/lib/storage";

type ClamScanResult =
  | { ok: true; infected: false }
  | { ok: true; infected: true; virusName: string }
  | { ok: false; error: string };

function digestSha256(bytes: Uint8Array | Buffer) {
  const hash = createHash("sha256");
  hash.update(Buffer.from(bytes));
  return hash.digest("hex");
}

function parseClamOutput(output: string): { infected: boolean; virusName?: string } {
  // Typical clamscan output (with --infected):
  // /tmp/file: Eicar-Test-Signature FOUND
  // When clean + --infected: no matches; output can be empty.
  const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Match: <path>: <virusname> FOUND
    const m = line.match(/^(.*?):\s*(.+?)\s+FOUND\s*$/i);
    if (m) {
      const virusName = m[2];
      return { infected: true, virusName };
    }
  }

  return { infected: false };
}

async function runClamscanOnFile(filePath: string): Promise<ClamScanResult> {
  // clamscan exit codes:
  // 0: no virus found
  // 1: virus found
  // 2: error
  // We use --no-summary and --infected for simpler parsing.
  return new Promise((resolve) => {
    execFile(
      "clamscan",
      ["--no-summary", "--infected", filePath],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const output = `${stdout ?? ""}\n${stderr ?? ""}`.trim();
        if (err) {
          // Exit code 1 => infected; Exit code 2 => error.
          const code = (err instanceof Error ? (err as unknown as { code?: unknown }).code : undefined) as number | undefined;
          if (code === 1) {
            const parsed = parseClamOutput(output);
            if (parsed.infected && parsed.virusName) {
              return resolve({ ok: true, infected: true, virusName: parsed.virusName });
            }
            return resolve({ ok: true, infected: true, virusName: "Unknown" });
          }
          return resolve({ ok: false, error: `ClamAV scan failed: ${output || err.message}` });
        }

        const parsed = parseClamOutput(output);
        if (parsed.infected && parsed.virusName) {
          return resolve({ ok: true, infected: true, virusName: parsed.virusName });
        }
        return resolve({ ok: true, infected: false });
      }
    );
  });
}

export async function scanBytesWithClamAV(
  fileBytes: Uint8Array | Buffer,
  fileName: string
): Promise<ClamScanResult> {
  const hash = digestSha256(fileBytes);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const tempPath = joinPath(tmpdir(), `academify-clam-${hash}-${safeName}`);

  try {
    await fs.writeFile(tempPath, Buffer.from(fileBytes));
    return await runClamscanOnFile(tempPath);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

export async function scanObjectFromMinio(objectKey: string, fileName: string): Promise<ClamScanResult> {
  const { body } = await getObjectBytes(objectKey);
  // getObjectBytes returns streaming body; normalize to Buffer/Uint8Array
  const bytes = Buffer.from(await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
  return scanBytesWithClamAV(bytes, fileName);
}

export async function deleteInfectedObject(_objectKey: string, _fileId?: string) {
  // No-op here; endpoint can decide what to do with infected files.
  void _objectKey;
  void _fileId;
}


export type { ClamScanResult };

