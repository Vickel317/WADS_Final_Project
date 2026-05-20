import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/sidebar";

const mockPathname = jest.fn(() => "/dashboard");

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
});

describe("Sidebar – rendering", () => {
  it("renders the Academify brand name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Academify")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forums/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /collab space/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /files/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /events/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /connections/i })).toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /forums/i })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("link", { name: /chat/i })).toHaveAttribute("href", "/messages");
    expect(screen.getByRole("link", { name: /collab space/i })).toHaveAttribute("href", "/collaboration");
    expect(screen.getByRole("link", { name: /files/i })).toHaveAttribute("href", "/files");
    expect(screen.getByRole("link", { name: /events/i })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: /connections/i })).toHaveAttribute("href", "/connections");
  });

  it("renders the user section at the bottom", () => {
    render(<Sidebar />);
    expect(screen.getByText("Signed in user")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Sidebar />);
    expect(screen.getByText(/learn together, grow together/i)).toBeInTheDocument();
  });
});

describe("Sidebar – active state", () => {
  it("applies active styles to the Dashboard link when on /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const dashLink = screen.getByRole("link", { name: /dashboard/i });
    // Active links have white text (text-white class)
    expect(dashLink).toHaveClass("text-white");
  });

  it("does not apply active styles to other links when on /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const forumsLink = screen.getByRole("link", { name: /forums/i });
    expect(forumsLink).not.toHaveClass("text-white");
  });

  it("applies active styles to forums link when on /forums", () => {
    mockPathname.mockReturnValue("/forums");
    render(<Sidebar />);
    const forumsLink = screen.getByRole("link", { name: /forums/i });
    expect(forumsLink).toHaveClass("text-white");
  });

  it("applies active styles to nested routes (e.g. /forums/some-category)", () => {
    mockPathname.mockReturnValue("/forums/computer-science");
    render(<Sidebar />);
    const forumsLink = screen.getByRole("link", { name: /forums/i });
    expect(forumsLink).toHaveClass("text-white");
  });
});
