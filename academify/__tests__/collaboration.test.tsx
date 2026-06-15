import { render, screen } from "@testing-library/react";
import CollaborationPage from "@/app/(protected)/collaboration/page";

describe("CollaborationPage", () => {
  it("renders the collaboration hero and spaces", async () => {
    render(<CollaborationPage />);

    // "Collaboration Space" appears in both the hero badge and the empty-state text,
    // so use findAllByText and assert at least one is present
    const collabHits = await screen.findAllByText(/collaboration space/i);
    expect(collabHits.length).toBeGreaterThan(0);
    await screen.findByText(/team workspaces inside forums/i);
    await screen.findByRole("heading", { name: /active spaces/i });
    await screen.findByText(/collaboration rules/i);
  });
});