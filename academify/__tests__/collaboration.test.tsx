import { render, screen } from "@testing-library/react";
import CollaborationPage from "@/app/(protected)/collaboration/page";

describe("CollaborationPage", () => {
  it("renders the collaboration hero and spaces", () => {
    render(<CollaborationPage />);

    expect(screen.getByText(/collaboration space/i)).toBeInTheDocument();
    expect(screen.getByText(/one workspace for shared files/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /active spaces/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /capstone sprint/i })).toBeInTheDocument();
    expect(screen.getByText(/live activity/i)).toBeInTheDocument();
  });
});