import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(protected)/dashboard/page";

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

jest.mock("@/lib/get-session", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    eventAttendee: { count: jest.fn() },
    file: { count: jest.fn(), findMany: jest.fn() },
    spaceMember: { count: jest.fn() },
    follow: { count: jest.fn() },
    event: { findMany: jest.fn() },
    collabSpace: { findMany: jest.fn() },
    message: { findMany: jest.fn() },
  },
}));

import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({
      provider: "better-auth",
      session: {},
      user: { userId: "user-1", name: "Test User", role: "STUDENT" },
    });
    (prisma.eventAttendee.count as jest.Mock).mockResolvedValue(2);
    (prisma.file.count as jest.Mock).mockResolvedValue(3);
    (prisma.spaceMember.count as jest.Mock).mockResolvedValue(1);
    (prisma.follow.count as jest.Mock).mockResolvedValue(4);
    (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.file.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.collabSpace.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.message.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("redirects to login when unauthenticated", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce(null);
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders personalized dashboard sections", async () => {
    const page = await DashboardPage();
    render(page);
    expect(screen.getByRole("heading", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse forums/i })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("heading", { name: /upcoming events/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recent chats/i })).toBeInTheDocument();
  });
});
