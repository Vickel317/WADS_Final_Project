/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as listFiles } from "@/app/api/files/route";
import { GET as getFile } from "@/app/api/files/[fileId]/route";
import { getSessionUser, verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getPresignedGetUrl } from "@/lib/storage";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    spaceMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    file: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/storage", () => ({
  getPresignedGetUrl: jest.fn(async (value: string) => `presigned:${value}`),
}));

describe("File visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns only the viewer's own files and files shared to their spaces", async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({
      user: { userId: "user_mina", name: "Mina" },
    });
    (prisma.spaceMember.findMany as jest.Mock).mockResolvedValue([{ spaceID: "space_1" }]);
    (prisma.file.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/files");
    const response = await listFiles(request);

    expect(response.status).toBe(200);
    expect(prisma.file.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ uploadedByID: "user_mina" }, { spaceID: { in: ["space_1"] } }],
        },
        orderBy: { updatedAt: "desc" },
      })
    );
  });

  it("hides files that are neither owned nor shared", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_mina",
      email: "mina@example.com",
      role: "student",
    });
    (prisma.file.findUnique as jest.Mock).mockResolvedValue({
      fileID: "file_1",
      uploadedByID: "user_harris",
      spaceID: null,
      fileUrl: "objects/file_1",
      fileName: "notes.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
      uploadedBy: { userId: "user_harris", name: "Harris" },
      space: null,
    });

    const request = new NextRequest("http://localhost/api/files/file_1");
    const response = await getFile(request, { params: Promise.resolve({ fileId: "file_1" }) });

    expect(response.status).toBe(404);
    expect(getPresignedGetUrl).not.toHaveBeenCalled();
  });
});