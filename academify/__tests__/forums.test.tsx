import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForumsPage from "@/app/(protected)/forums/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/forums",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Computer Science", slug: "computer-science", _count: { posts: 3 } },
  { id: "cat-2", name: "Mathematics", slug: "mathematics", _count: { posts: 2 } },
  { id: "cat-3", name: "Web Development", slug: "web-development", _count: { posts: 1 } },
  { id: "cat-4", name: "AI & Machine Learning", slug: "ai-machine-learning", _count: { posts: 4 } },
  { id: "cat-5", name: "Study Groups", slug: "study-groups", _count: { posts: 0 } },
];

const MOCK_POSTS = [
  {
    postID: "p1",
    title: "Best practices for React state management",
    content: "Discussion about React.",
    category: { name: "Computer Science", slug: "computer-science" },
    author: { name: "Alice", id: "u1" },
    createdAt: new Date().toISOString(),
    _count: { comments: 5 },
  },
  {
    postID: "p2",
    title: "Help with dynamic programming algorithms",
    content: "DP help needed.",
    category: { name: "Computer Science", slug: "computer-science" },
    author: { name: "Bob", id: "u2" },
    createdAt: new Date().toISOString(),
    _count: { comments: 2 },
  },
  {
    postID: "p3",
    title: "Study partners for machine learning final",
    content: "Looking for study partners.",
    category: { name: "AI & Machine Learning", slug: "ai-machine-learning" },
    author: { name: "Emma Wilson", id: "u3" },
    createdAt: new Date().toISOString(),
    _count: { comments: 0 },
  },
  {
    postID: "p4",
    title: "Calculus 3 tips",
    content: "Any tips for Calc 3?",
    category: { name: "Mathematics", slug: "mathematics" },
    author: { name: "Dave", id: "u4" },
    createdAt: new Date().toISOString(),
    _count: { comments: 1 },
  },
  {
    postID: "p5",
    title: "Intro to Neural Networks",
    content: "Beginner guide.",
    category: { name: "AI & Machine Learning", slug: "ai-machine-learning" },
    author: { name: "Sara", id: "u5" },
    createdAt: new Date().toISOString(),
    _count: { comments: 3 },
  },
];

function makeFetchMock(categories = MOCK_CATEGORIES, posts = MOCK_POSTS) {
  return jest.fn().mockImplementation((url: string) => {
    const u = typeof url === "string" ? url : String(url);
    if (u.includes("/api/categories")) {
      return Promise.resolve({ ok: true, json: async () => ({ categories }) });
    }
    if (u.includes("/api/posts")) {
      return Promise.resolve({ ok: true, json: async () => ({ posts, total: posts.length }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = makeFetchMock() as unknown as typeof global.fetch;
});

describe("ForumsPage – rendering", () => {
  it("renders the Discussion Forums heading", () => {
    render(<ForumsPage />);
    expect(screen.getByText(/discussion forums/i)).toBeInTheDocument();
  });

  it("renders the New Thread button", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("button", { name: /new thread/i })).toBeInTheDocument();
  });

  it("renders the All Topics category button immediately", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("button", { name: /all topics/i })).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<ForumsPage />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders thread tabs", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("button", { name: /^trending$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^recent$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /most popular/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unanswered/i })).toBeInTheDocument();
  });
});

describe("ForumsPage – New Thread navigation", () => {
  it("navigates to new thread page when New Thread is clicked", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.click(screen.getByRole("button", { name: /new thread/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/forums\/.*\/new/));
  });
});
