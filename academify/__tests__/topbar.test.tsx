import { render, screen } from "@testing-library/react";
import Topbar from "@/components/topbar";
import { SidebarLayoutProvider } from "@/components/sidebar-layout-context";

jest.mock("@/components/current-user-context", () => ({
  useCurrentUser: () => ({ userId: "u1", name: "Test User", avatarUrl: null, role: "student" }),
}));

jest.mock("@/lib/socket-client", () => ({
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

    if (url.includes("/api/users/me")) {
      return mockFetchResponse({ user: { userId: "u1", name: "Test User" } });
    }
    return mockFetchResponse({});
  }) as typeof fetch;
});

describe("Topbar – rendering", () => {
  it("renders the search input", () => {
    renderTopbar();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders the profile menu button", () => {
    renderTopbar();
    expect(screen.getByRole("button", { name: /open navigation/i })).toBeInTheDocument();
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
