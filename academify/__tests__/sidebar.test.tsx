import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/sidebar";
import { SidebarLayoutProvider } from "@/components/sidebar-layout-context";

const mockPathname = jest.fn(() => "/forums");

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock("@/components/current-user-context", () => ({
  useCurrentUser: () => ({ userId: "u1", name: "Test", avatarUrl: null, role: "student" }),
}));

function renderSidebar() {
  return render(
    <SidebarLayoutProvider>
      <Sidebar />
    </SidebarLayoutProvider>
  );
}

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
});

describe("Sidebar – rendering", () => {
  it("does not render the old sidebar tagline", () => {
    renderSidebar();
    expect(screen.queryByText(/learn together, grow together/i)).not.toBeInTheDocument();
  });

  it("renders primary and secondary navigation links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^forums$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^events$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^chat$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /connections/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my uploads/i })).toBeInTheDocument();
  });

  it("does not show removed top-level items", () => {
    renderSidebar();
    expect(screen.queryByRole("link", { name: /collab space/i })).not.toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /^forums$/i })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("link", { name: /^events$/i })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: /^chat$/i })).toHaveAttribute("href", "/messages");
    expect(screen.getByRole("link", { name: /my uploads/i })).toHaveAttribute("href", "/files");
  });
});

describe("Sidebar – active state", () => {
  it("applies active styles to the Forums link when on /forums", () => {
    mockPathname.mockReturnValue("/forums");
    renderSidebar();
    const forumsLink = screen.getByRole("link", { name: /^forums$/i });
    expect(forumsLink).toHaveClass("text-white");
  });

  it("applies active styles to nested forum routes", () => {
    mockPathname.mockReturnValue("/forums/computer-science");
    renderSidebar();
    const forumsLink = screen.getByRole("link", { name: /^forums$/i });
    expect(forumsLink).toHaveClass("text-white");
  });

  it("applies active styles to the Events link when on /events", () => {
    mockPathname.mockReturnValue("/events");
    renderSidebar();
    const eventsLink = screen.getByRole("link", { name: /^events$/i });
    expect(eventsLink).toHaveClass("text-white");
  });

  it("applies active styles to nested event routes", () => {
    mockPathname.mockReturnValue("/events/evt_123/edit");
    renderSidebar();
    const eventsLink = screen.getByRole("link", { name: /^events$/i });
    expect(eventsLink).toHaveClass("text-white");
  });
});
