import { render, screen } from "@testing-library/react";
import FilesPage from "@/app/(protected)/files/page";

describe("FilesPage", () => {
  it("renders the collaboration space preview", () => {
    render(<FilesPage />);

    expect(screen.getByText(/collaboration space/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open collaboration hub/i })).toBeInTheDocument();
    expect(screen.getByText(/capstone sprint/i)).toBeInTheDocument();
    expect(screen.getByText(/live collaboration feed/i)).toBeInTheDocument();
  });
});