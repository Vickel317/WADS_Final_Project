import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessagesPage from "@/app/(protected)/messages/page";

describe("MessagesPage – rendering", () => {
  it("renders the Messages heading", () => {
    render(<MessagesPage />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<MessagesPage />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders all mock conversations", () => {
    render(<MessagesPage />);
    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("Mike Johnson")).toBeInTheDocument();
    expect(screen.getByText("Emma Wilson")).toBeInTheDocument();
    expect(screen.getByText("Study Group - CS30")).toBeInTheDocument();
    expect(screen.getByText("ML Project Team")).toBeInTheDocument();
  });

  it("renders last message previews", () => {
    render(<MessagesPage />);
    expect(screen.getByText(/sure! i can help with that algorithm/i)).toBeInTheDocument();
    expect(screen.getByText(/thanks for sharing those notes/i)).toBeInTheDocument();
  });

  it("shows unread badge for conversations with unread count", () => {
    render(<MessagesPage />);
    // Study Group - CS30 has 3 unread messages
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the empty state panel", () => {
    render(<MessagesPage />);
    expect(screen.getByText(/your messages/i)).toBeInTheDocument();
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it("renders online status indicators", () => {
    render(<MessagesPage />);
    // Sarah Chen and Mike Johnson are online – two green dots
    const onlineDots = document.querySelectorAll(".bg-green-400");
    expect(onlineDots.length).toBeGreaterThanOrEqual(2);
  });
});

describe("MessagesPage – search filtering", () => {
  it("filters conversations by name", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.type(screen.getByPlaceholderText(/search/i), "Sarah");

    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.queryByText("Mike Johnson")).not.toBeInTheDocument();
  });

  it("is case-insensitive when filtering", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.type(screen.getByPlaceholderText(/search/i), "emma");

    expect(screen.getByText("Emma Wilson")).toBeInTheDocument();
  });

  it("shows no conversations when search matches nothing", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.type(screen.getByPlaceholderText(/search/i), "zzzzzzzzz");

    expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument();
    expect(screen.queryByText("Mike Johnson")).not.toBeInTheDocument();
  });
});

describe("MessagesPage – conversation selection", () => {
  it("opens the selected conversation when clicked", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.click(screen.getByText("Sarah Chen"));
    expect(screen.getByRole("heading", { name: "Sarah Chen" })).toBeInTheDocument();
    expect(screen.getByText(/active now/i)).toBeInTheDocument();
  });

  it("opens group conversation details when clicked", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.click(screen.getByText("Study Group - CS30"));
    expect(screen.getByRole("heading", { name: "Study Group - CS30" })).toBeInTheDocument();
    expect(screen.getByText(/group chat/i)).toBeInTheDocument();
  });
});
