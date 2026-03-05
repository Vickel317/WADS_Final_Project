import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForumsPage from "@/app/(protected)/forums/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/forums",
}));

beforeEach(() => jest.clearAllMocks());

describe("ForumsPage – rendering", () => {
  it("renders the Discussion Forums heading", () => {
    render(<ForumsPage />);
    expect(screen.getByText(/discussion forums/i)).toBeInTheDocument();
  });

  it("renders the New Thread button", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("button", { name: /new thread/i })).toBeInTheDocument();
  });

  it("renders all category buttons", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("button", { name: /all topics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /computer science/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mathematics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /web development/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai & machine learning/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /study groups/i })).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<ForumsPage />);
    expect(screen.getByPlaceholderText(/search discussions/i)).toBeInTheDocument();
  });

  it("renders all mock threads by default", () => {
    render(<ForumsPage />);
    expect(screen.getByText(/best practices for react state management/i)).toBeInTheDocument();
    expect(screen.getByText(/help with dynamic programming algorithms/i)).toBeInTheDocument();
    expect(screen.getByText(/study partners for machine learning final/i)).toBeInTheDocument();
    expect(screen.getByText(/calculus 3/i)).toBeInTheDocument();
    expect(screen.getByText(/intro to neural networks/i)).toBeInTheDocument();
  });

  it("renders thread tabs", () => {
    render(<ForumsPage />);
    expect(screen.getByRole("button", { name: /^trending$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^recent$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /most popular/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unanswered/i })).toBeInTheDocument();
  });
});

describe("ForumsPage – search filtering", () => {
  it("filters threads by title search", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.type(screen.getByPlaceholderText(/search discussions/i), "react");

    expect(screen.getByText(/best practices for react state management/i)).toBeInTheDocument();
    expect(screen.queryByText(/help with dynamic programming/i)).not.toBeInTheDocument();
  });

  it("filters threads by author name", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.type(screen.getByPlaceholderText(/search discussions/i), "Emma Wilson");

    expect(screen.getByText(/study partners for machine learning final/i)).toBeInTheDocument();
    expect(screen.queryByText(/best practices for react/i)).not.toBeInTheDocument();
  });

  it("shows empty state when no threads match search", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.type(screen.getByPlaceholderText(/search discussions/i), "zzzzzzz");

    expect(screen.getByText(/no threads found/i)).toBeInTheDocument();
  });
});

describe("ForumsPage – category filtering", () => {
  it("filters threads when a category is selected", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.click(screen.getByRole("button", { name: /mathematics/i }));

    expect(screen.getByText(/calculus 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/best practices for react/i)).not.toBeInTheDocument();
  });

  it("navigates to category page when non-all category is clicked", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.click(screen.getByRole("button", { name: /computer science/i }));

    expect(mockPush).toHaveBeenCalledWith("/forums/computer-science");
  });

  it("does NOT navigate when All Topics is selected", async () => {
    const user = userEvent.setup();
    render(<ForumsPage />);

    await user.click(screen.getByRole("button", { name: /computer science/i }));
    jest.clearAllMocks();
    await user.click(screen.getByRole("button", { name: /all topics/i }));

    expect(mockPush).not.toHaveBeenCalled();
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
