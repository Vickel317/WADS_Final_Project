import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfilePage from "@/app/(protected)/profile/edit/page";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Return empty so the component keeps its default form values
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});

describe("EditProfilePage – rendering", () => {
  it("renders the Edit Profile heading", async () => {
    render(<EditProfilePage />);
    expect(await screen.findByText(/edit profile/i)).toBeInTheDocument();
  });

  it("renders default form values", async () => {
    render(<EditProfilePage />);
    const nameInput = await screen.findByDisplayValue("John Doe");
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("Computer Science")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jakarta, Indonesia")).toBeInTheDocument();
    expect(screen.getByDisplayValue("johndoe.dev")).toBeInTheDocument();
  });

  it("renders the year dropdown with options", async () => {
    render(<EditProfilePage />);
    const select = await screen.findByDisplayValue("3rd Year");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1st Year" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Graduate" })).toBeInTheDocument();
  });

  it("renders skill tags preview", async () => {
    render(<EditProfilePage />);
    expect(await screen.findByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders password change section", async () => {
    render(<EditProfilePage />);
    expect(await screen.findByText(/change password/i)).toBeInTheDocument();
    // All three password fields share placeholder "••••••••"
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    expect(passwordInputs.length).toBe(3);
  });

  it("renders Save Changes and Cancel buttons", async () => {
    render(<EditProfilePage />);
    expect(await screen.findByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});

describe("EditProfilePage – validation", () => {
  it("shows error when name is cleared and form is submitted", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    const nameInput = await screen.findByDisplayValue("John Doe");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith("/api/users/me", expect.objectContaining({ method: "PATCH" }));
  });

  it("shows error when new password is too short", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    await screen.findByDisplayValue("John Doe");
    // Password inputs: [0]=currentPassword, [1]=newPassword, [2]=confirmPassword
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[1], "short");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("shows error when new passwords don't match", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    await screen.findByDisplayValue("John Doe");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[0], "oldpass123");    // currentPassword
    await user.type(passwordInputs[1], "newpass123");    // newPassword
    await user.type(passwordInputs[2], "different456"); // confirmPassword
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error when setting new password without providing current password", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    await screen.findByDisplayValue("John Doe");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[1], "newpass123");  // newPassword
    await user.type(passwordInputs[2], "newpass123");  // confirmPassword
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/current password is required/i)).toBeInTheDocument();
  });
});

describe("EditProfilePage – submission", () => {
  it("calls PATCH /api/users/me and redirects on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // GET /api/users/me
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // PATCH /api/users/me

    render(<EditProfilePage />);
    await screen.findByDisplayValue("John Doe");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/users/me", expect.objectContaining({ method: "PATCH" }))
    );
    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });

  it("goes back when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("shows error message when PATCH fails", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // GET
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "Server error" }) }); // PATCH

    render(<EditProfilePage />);
    await screen.findByDisplayValue("John Doe");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });
});

describe("EditProfilePage – pre-fills from API", () => {
  it("pre-fills form with data returned by API", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          name: "API Name",
          major: "Physics",
          year: "2nd Year",
          bio: "Science bio",
          location: "Surabaya",
          website: "api.com",
          skills: ["Math", "Lab"],
        },
      }),
    });

    render(<EditProfilePage />);
    expect(await screen.findByDisplayValue("API Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Physics")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Surabaya")).toBeInTheDocument();
  });
});
