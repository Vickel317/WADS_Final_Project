import { render, screen, waitFor } from "@testing-library/react";
import ForumsPage from "@/app/(protected)/forums/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/forums",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock("@/components/current-user-context", () => ({
  useCurrentUser: () => ({ userId: "u1", name: "Test", avatarUrl: null, role: "student" }),
}));

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Computer Science", slug: "computer-science", description: "CS topics", createdAt: "" },
  { id: "cat-2", name: "Mathematics", slug: "mathematics", description: "Math", createdAt: "" },
];

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (String(url).includes("/api/categories")) {
      return Promise.resolve({ ok: true, json: async () => ({ categories: MOCK_CATEGORIES }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as unknown as typeof global.fetch;
});

describe("ForumsPage – forum picker", () => {
  it("renders the Forums heading", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("heading", { name: /^forums$/i })).toBeInTheDocument();
  });

  it("renders forum cards after load", async () => {
    render(<ForumsPage />);
    await waitFor(() => {
      expect(screen.getByText("Computer Science")).toBeInTheDocument();
      expect(screen.getByText("Mathematics")).toBeInTheDocument();
    });
  });

  it("links each forum to its hub", async () => {
    render(<ForumsPage />);
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /computer science/i });
      expect(link).toHaveAttribute("href", "/forums/computer-science");
    });
  });
});
