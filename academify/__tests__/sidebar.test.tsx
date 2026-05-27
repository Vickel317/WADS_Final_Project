import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/sidebar";

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

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
});

describe("Sidebar – rendering", () => {
  it("renders the Academify brand name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Academify")).toBeInTheDocument();
  });

  it("renders primary and secondary navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^forums$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^chat$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /connections/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my uploads/i })).toBeInTheDocument();
  });

  it("does not show removed top-level items", () => {
    render(<Sidebar />);
    expect(screen.queryByRole("link", { name: /^events$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /collab space/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^events$/i })).not.toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /^forums$/i })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("link", { name: /^chat$/i })).toHaveAttribute("href", "/messages");
    expect(screen.getByRole("link", { name: /my uploads/i })).toHaveAttribute("href", "/files");
  });
});

describe("Sidebar – active state", () => {
  it("applies active styles to the Forums link when on /forums", () => {
    mockPathname.mockReturnValue("/forums");
    render(<Sidebar />);
    const forumsLink = screen.getByRole("link", { name: /^forums$/i });
    expect(forumsLink).toHaveClass("text-white");
  });

  it("applies active styles to nested forum routes", () => {
    mockPathname.mockReturnValue("/forums/computer-science");
    render(<Sidebar />);
    const forumsLink = screen.getByRole("link", { name: /^forums$/i });
    expect(forumsLink).toHaveClass("text-white");
  });
});
