import { render, screen, waitFor } from "@testing-library/react";
import Topbar from "@/components/topbar";
import { SidebarLayoutProvider } from "@/components/sidebar-layout-context";

jest.mock("@/components/current-user-context", () => ({
  useCurrentUser: () => ({ userId: "u1", name: "Test User", avatarUrl: null, role: "student" }),
}));

jest.mock("@/lib/socket-client", () => ({
  getSocket: () => ({
    on: jest.fn(),
    off: jest.fn(),
    connect: jest.fn(),
    connected: false,
    emit: jest.fn(),
  }),
  disconnectSocket: jest.fn(),
}));

function mockFetchResponse(data: unknown, contentType = "application/json") {
  return Promise.resolve({
    ok: true,
    headers: { get: (key: string) => (key === "content-type" ? contentType : null) },
    json: async () => data,
  }) as Promise<Response>;
}

function renderTopbar() {
  return render(
    <SidebarLayoutProvider>
      <Topbar />
    </SidebarLayoutProvider>
  );
}

beforeEach(() => {
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("/api/notifications")) {
      // Topbar loads notifications on mount; default to none.
      return mockFetchResponse([]);
    }
    if (url.includes("/api/users/me")) {
      return mockFetchResponse({ user: { userId: "u1", name: "Test User" } });
    }
    if (url.includes("/api/events/reminders")) {
      return mockFetchResponse({});
    }
    return mockFetchResponse({});
  }) as typeof fetch;
});

describe("Topbar – rendering", () => {
  it("renders the search input", () => {
    renderTopbar();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders the notification button", () => {
    renderTopbar();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("does not show the unread badge when there are no notifications", async () => {
    renderTopbar();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    expect(document.querySelector(".bg-red-500")).not.toBeInTheDocument();
  });

  it("shows the unread badge when notifications exist", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/notifications")) {
        return mockFetchResponse([
          {
            notificationID: "notif_1",
            content: "New message",
            link: null,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      if (url.includes("/api/users/me")) {
        return mockFetchResponse({ user: { userId: "u1", name: "Test User" } });
      }
      return mockFetchResponse({});
    });

    renderTopbar();

    await waitFor(() => {
      expect(document.querySelector(".bg-red-500")).toBeInTheDocument();
    });
  });

  it("renders within a header element", () => {
    renderTopbar();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("search input is a text input", () => {
    renderTopbar();
    const input = screen.getByPlaceholderText(/search/i);
    expect(input.tagName).toBe("INPUT");
  });
});
