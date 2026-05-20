import { render, screen } from "@testing-library/react";
import FilesPage from "@/app/(protected)/files/page";

describe("FilesPage", () => {
  it("renders the collaboration space preview", () => {
    render(<FilesPage />);

    // "Collaboration Space" appears in both the card label and the empty-state text,
    // so use getAllByText and assert at least one is present
    expect(screen.getAllByText(/collaboration space/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /open collaboration hub/i })).toBeInTheDocument();
    expect(screen.getByText(/live collaboration feed/i)).toBeInTheDocument();
  });
});