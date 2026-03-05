import { render, screen } from "@testing-library/react";
import Topbar from "@/components/topbar";

describe("Topbar – rendering", () => {
  it("renders the search input", () => {
    render(<Topbar />);
    expect(
      screen.getByPlaceholderText(/search for forums, files, events/i)
    ).toBeInTheDocument();
  });

  it("renders the notification button", () => {
    render(<Topbar />);
    // Notification button has a red dot badge; find the button by its SVG structure
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2); // notifications + settings
  });

  it("renders the notification unread indicator dot", () => {
    render(<Topbar />);
    const redDot = document.querySelector(".bg-red-500");
    expect(redDot).toBeInTheDocument();
  });

  it("renders within a header element", () => {
    render(<Topbar />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("search input is a text input", () => {
    render(<Topbar />);
    const input = screen.getByPlaceholderText(/search for forums, files, events/i);
    expect(input.tagName).toBe("INPUT");
  });
});
