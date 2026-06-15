import { render, screen } from "@testing-library/react";
import EventsPage from "@/app/(protected)/events/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("EventsPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/events")) {
        return {
          ok: true,
          json: async () => ({
            data: [],
            pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
          }),
        } as Response;
      }
      if (url.includes("/api/categories")) {
        return {
          ok: true,
          json: async () => ({ categories: [] }),
        } as Response;
      }
      if (url.includes("/api/users/me")) {
        return {
          ok: true,
          json: async () => ({ user: { userId: "user-1", name: "Test User" } }),
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the events calendar header and create button", async () => {
    render(<EventsPage />);
    await screen.findByRole("heading", { name: /study sessions & events/i });
    expect(screen.getByRole("button", { name: /create event/i })).toBeInTheDocument();
    expect(screen.getByText(/events attended/i)).toBeInTheDocument();
  });
});
