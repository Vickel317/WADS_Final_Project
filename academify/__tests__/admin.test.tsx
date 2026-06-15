import { render, screen } from "@testing-library/react";
import AdminPage from "@/app/(protected)/admin/page";

describe("AdminPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders analytics stats when the admin API succeeds", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        analytics: {
          users: { total: 12, byRole: {}, byStatus: {} },
          posts: { total: 34, totalReplies: 5 },
          reports: { total: 2, byStatus: {} },
          moderation: { totalActions: 7, byAction: {} },
        },
      }),
    });

    render(<AdminPage />);
    await screen.findByRole("heading", { name: /admin panel/i });
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage users/i })).toHaveAttribute("href", "/admin/users");
  });

  it("shows an error when the admin API returns forbidden", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Forbidden" } }),
    });

    render(<AdminPage />);
    expect(await screen.findByText(/forbidden/i)).toBeInTheDocument();
  });
});
