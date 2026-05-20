import { render, screen } from "@testing-library/react";
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

  it("renders the empty-state panel", () => {
    render(<MessagesPage />);
    expect(screen.getByText(/your messages/i)).toBeInTheDocument();
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });
});
