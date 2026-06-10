import { render, screen } from "@testing-library/react";
import MessagesPage from "@/app/(protected)/messages/page";

describe("MessagesPage – rendering", () => {
  it("renders the Messages heading", async () => {
    render(<MessagesPage />);
    await screen.findByText("Messages");
  });

  it("renders the search input", async () => {
    render(<MessagesPage />);
    await screen.findByPlaceholderText(/search/i);
  });

  it("renders the empty-state panel", async () => {
    render(<MessagesPage />);
    await screen.findByText(/your messages/i);
    await screen.findByText(/select a conversation/i);
  });
});
