import { render, screen } from "@testing-library/react";
import FilesPage from "@/app/(protected)/files/page";

describe("FilesPage", () => {
  it("renders the collaboration space preview", async () => {
    render(<FilesPage />);

    // "Collaboration Space" appears in both the card label and the empty-state text,
    // so use findAllByText and assert at least one is present
    const hits = await screen.findAllByText(/collaboration space/i);
    expect(hits.length).toBeGreaterThan(0);
    await screen.findByRole("link", { name: /open collaboration hub/i });
    await screen.findByText(/live collaboration feed/i);
  });
});