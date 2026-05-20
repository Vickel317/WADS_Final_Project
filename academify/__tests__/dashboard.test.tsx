import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(protected)/dashboard/page";

describe("DashboardPage – rendering", () => {
  it("renders the welcome heading", async () => {
    render(await DashboardPage());
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it("renders the stat cards section", async () => {
    render(await DashboardPage());
    expect(screen.getAllByText(/connections/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/forum posts/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/files shared/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/events joined/i).length).toBeGreaterThan(0);
  });

  it("renders the Recent Activity section", async () => {
    render(await DashboardPage());
    expect(screen.getByRole("heading", { name: /recent activity/i })).toBeInTheDocument();
  });

  it("renders the Upcoming Events section", async () => {
    render(await DashboardPage());
    expect(screen.getByRole("heading", { name: /upcoming events/i })).toBeInTheDocument();
  });

  it("renders the Trending Discussions section", async () => {
    render(await DashboardPage());
    expect(screen.getByRole("heading", { name: /trending discussions/i })).toBeInTheDocument();
  });
});
