import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileSetupPage from "@/app/setup/page";

describe("ProfileSetupPage", () => {
  it("renders student setup fields aligned with profile edit", () => {
    render(<ProfileSetupPage />);
    expect(screen.getByRole("heading", { name: /almost there/i })).toBeInTheDocument();
    expect(screen.getByText(/current education/i)).toBeInTheDocument();
    expect(screen.getByText(/skills & interests/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complete setup/i })).toBeInTheDocument();
  });

  it("shows lecturer-specific fields when lecturer role is selected", async () => {
    const user = userEvent.setup();
    render(<ProfileSetupPage />);

    await user.click(screen.getByRole("button", { name: /i am a lecturer/i }));
    expect(screen.getByText(/department \/ faculty/i)).toBeInTheDocument();
    expect(screen.getByText(/consultation hours/i)).toBeInTheDocument();
  });
});
