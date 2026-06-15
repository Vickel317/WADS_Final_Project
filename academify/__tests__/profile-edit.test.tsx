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
    const nameInput = await screen.findByPlaceholderText(/your full name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue("");
    expect(screen.getByPlaceholderText(/city, country/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/yoursite\.com/i)).toHaveValue("");
  });

  it("renders the current education dropdown with K-12 options", async () => {
    render(<EditProfilePage />);
    const select = await screen.findByDisplayValue("Prefer not to say");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elementary (Grades 1–6)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "University Year 1" })).toBeInTheDocument();
  });

  it("does not render skill tags preview when skills are empty", async () => {
    render(<EditProfilePage />);
    await screen.findByText(/skills & interests/i);
    expect(screen.queryByText("React")).not.toBeInTheDocument();
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

describe("EditProfilePage – lecturer", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          name: "Dr. Smith",
          role: "lecturer",
          department: "Faculty of Computer Science",
          specializations: ["Machine Learning"],
          consultationHours: "Mon 2-4PM",
          verifiedPublications: ["https://example.com/paper"],
          askMeAbout: ["Graduate Studies"],
        },
      }),
    });
  });

  it("shows lecturer fields instead of current education", async () => {
    render(<EditProfilePage />);
    expect(await screen.findByDisplayValue("Faculty of Computer Science")).toBeInTheDocument();
    expect(screen.getByText(/department \/ faculty/i)).toBeInTheDocument();
    expect(screen.getByText(/consultation hours/i)).toBeInTheDocument();
    expect(screen.queryByText(/^current education$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/skills & interests/i)).not.toBeInTheDocument();
  });
});

describe("EditProfilePage – validation", () => {
  it("shows error when name is cleared and form is submitted", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    const nameInput = await screen.findByPlaceholderText(/your full name/i);
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith("/api/users/me", expect.objectContaining({ method: "PATCH" }));
  });

  it("shows error when new password is too short", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    await screen.findByRole("button", { name: /save changes/i });
    // Password inputs: [0]=currentPassword, [1]=newPassword, [2]=confirmPassword
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[1], "short");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("shows error when new passwords don't match", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);

    await screen.findByRole("button", { name: /save changes/i });
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

    await screen.findByRole("button", { name: /save changes/i });
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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            name: "John Doe",
            major: "Computer Science",
          },
        }),
      }) // GET /api/users/me
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // PATCH /api/users/me

    render(<EditProfilePage />);
    const nameInput = await screen.findByDisplayValue("John Doe");
    await user.clear(nameInput);
    await user.type(nameInput, "John Doe Jr.");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "John Doe Jr." }),
        })
      )
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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            name: "John Doe",
            major: "Computer Science",
          },
        }),
      }) // GET
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "Server error" }) }); // PATCH

    render(<EditProfilePage />);
    const nameInput = await screen.findByDisplayValue("John Doe");
    await user.clear(nameInput);
    await user.type(nameInput, "John Doe Jr.");
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
          year: "University Year 2",
          bio: "Science bio",
          location: "Surabaya",
          website: "api.com",
          skills: ["Math", "Lab"],
        },
      }),
    });

    render(<EditProfilePage />);
    expect(await screen.findByDisplayValue("API Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("University Year 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Surabaya")).toBeInTheDocument();
  });
});
