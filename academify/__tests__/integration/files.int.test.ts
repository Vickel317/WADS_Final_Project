/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  getPresignedGetUrl: jest.fn().mockResolvedValue("https://minio.example.com/presigned-url"),
}));

jest.mock("@/lib/clamav", () => ({
  scanObjectFromMinio: jest.fn().mockResolvedValue({ ok: true, infected: false }),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/files/route";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";

describe("integration: files API + database", () => {
  const marker = `int-files-${Date.now()}`;
  let userId: string | null = null;
  let fileId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${marker}@example.com`,
        password: "better-auth-managed",
        username: `${marker}_user`,
        name: "Files Integration User",
      },
    });
    userId = user.userId;

    (getSessionUser as jest.Mock).mockResolvedValue({
      session: {},
      user: { userId, email: `${marker}@example.com`, name: "Files Integration User", role: "STUDENT" },
    });
  });

  afterAll(async () => {
    if (fileId) {
      await prisma.file.delete({ where: { fileID: fileId } }).catch(() => undefined);
    }
    if (userId) {
      await prisma.user.delete({ where: { userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("registers a file upload and persists metadata in PostgreSQL", async () => {
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        objectKey: `${marker}/document.pdf`,
        fileName: `${marker}-document.pdf`,
        fileType: "application/pdf",
        fileSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.file.name).toBe(`${marker}-document.pdf`);
    expect(payload.file.type).toBe("application/pdf");
    expect(payload.file.size).toBe(1024);
    expect(payload.file.uploadedBy.id).toBe(userId);
    fileId = payload.file.id;
  });

  it("lists files persisted in PostgreSQL", async () => {
    const request = new NextRequest("http://localhost/api/files");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    const match = payload.files.find((f: { id: string }) => f.id === fileId);
    expect(match).toBeDefined();
    expect(match.name).toBe(`${marker}-document.pdf`);
  });

  it("filters files by search query", async () => {
    const request = new NextRequest(`http://localhost/api/files?search=${marker}`);
    const response = await GET(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.files.length).toBeGreaterThanOrEqual(1);
    expect(payload.files.every((f: { name: string }) => f.name.includes(marker))).toBe(true);
  });
});
