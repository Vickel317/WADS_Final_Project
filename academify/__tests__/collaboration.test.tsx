import { render, screen } from "@testing-library/react";
import CollaborationPage from "@/app/(protected)/collaboration/page";

describe("CollaborationPage", () => {
  it("renders the collaboration hero and spaces", () => {
    render(<CollaborationPage />);

    // "Collaboration Space" appears in both the hero badge and the empty-state text,
    // so use getAllByText and assert at least one is present
    expect(screen.getAllByText(/collaboration space/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/team workspaces inside forums/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /active spaces/i })).toBeInTheDocument();
    expect(screen.getByText(/live activity/i)).toBeInTheDocument();
  });
});