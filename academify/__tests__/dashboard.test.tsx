import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/(protected)/dashboard/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/dashboard",
}));

beforeEach(() => {
  // Return empty so the component falls back to its hardcoded mock data
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});

describe("DashboardPage – rendering", () => {
  it("renders the welcome heading", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });

  it("renders all four stat cards with fallback values", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText("248")).toBeInTheDocument(); // connections
    expect(screen.getByText("67")).toBeInTheDocument();         // forum posts
    expect(screen.getByText("142")).toBeInTheDocument();        // files shared
    expect(screen.getByText("23")).toBeInTheDocument();         // events attended
  });

  it("renders stat card labels", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/connections/i)).toBeInTheDocument();
    expect(screen.getByText(/forum posts/i)).toBeInTheDocument();
    expect(screen.getByText(/files shared/i)).toBeInTheDocument();
    expect(screen.getByText(/events attended/i)).toBeInTheDocument();
  });

  it("renders the Recent Activity section with fallback data", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/recent activity/i)).toBeInTheDocument();
    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("Mike Johnson")).toBeInTheDocument();
  });

  it("renders the Upcoming Events section with fallback data", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/upcoming events/i)).toBeInTheDocument();
    expect(screen.getByText(/machine learning study group/i)).toBeInTheDocument();
    expect(screen.getByText(/web development workshop/i)).toBeInTheDocument();
  });

  it("renders the Trending Discussions section with fallback data", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/trending discussions/i)).toBeInTheDocument();
    expect(screen.getByText(/best resources for learning react/i)).toBeInTheDocument();
  });

  it("renders event links", async () => {
    render(<DashboardPage />);
    const links = await screen.findAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});

describe("DashboardPage – API interaction", () => {
  it("updates stats when API returns data", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: { connections: 999, forumPosts: 10, filesShared: 20, eventsAttended: 5 },
        }),
      })
      .mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<DashboardPage />);
    expect(await screen.findByText("999")).toBeInTheDocument();
  });

  it("shows fallback data when API fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    render(<DashboardPage />);
    expect(await screen.findByText("248")).toBeInTheDocument();
  });
});
