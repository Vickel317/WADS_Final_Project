import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "@/app/(protected)/profile/[userId]/page";

const mockPush = jest.fn();
let mockUserId = "me";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ userId: mockUserId }),
}));

beforeEach(() => {
  mockUserId = "me";
  jest.clearAllMocks();
  // Reject so the catch block uses the mock profile
  global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
});

describe("ProfilePage – loading state", () => {
  it("shows a loading spinner initially", () => {
    // Keep fetch hanging
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
    render(<ProfilePage />);
    // Loading spinner is a spinning div; check loading container exists
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});

describe("ProfilePage – own profile (userId=me)", () => {
  it("renders the user's name after loading", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("renders major and year", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText(/computer science/i)).toBeInTheDocument();
    expect(screen.getByText(/3rd year/i)).toBeInTheDocument();
  });

  it("renders the Edit Profile button for own profile", async () => {
    render(<ProfilePage />);
    expect(await screen.findByRole("button", { name: /edit profile/i })).toBeInTheDocument();
  });

  it("navigates to /profile/edit when Edit Profile is clicked", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: /edit profile/i }));
    expect(mockPush).toHaveBeenCalledWith("/profile/edit");
  });

  it("renders stat cards with correct values", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText("248")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
  });

  it("renders skills", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("renders location and website", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText(/jakarta/i)).toBeInTheDocument();
    expect(screen.getByText(/johndoe\.dev/i)).toBeInTheDocument();
  });
});

describe("ProfilePage – other user's profile", () => {
  beforeEach(() => {
    mockUserId = "other-user-123";
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
  });

  it("shows Connect button for another user's profile", async () => {
    render(<ProfilePage />);
    expect(await screen.findByRole("button", { name: /connect/i })).toBeInTheDocument();
  });
});

describe("ProfilePage – API success", () => {
  it("renders profile data returned from the API", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          id: "api-user",
          name: "API User",
          major: "Physics",
          year: "2nd Year",
          bio: "Science lover",
          location: "Bandung",
          website: "apiuser.com",
          connections: 10,
          posts: 5,
          filesShared: 3,
          skills: ["Math", "Physics"],
          isOwn: false,
          isConnected: false,
        },
      }),
    });

    render(<ProfilePage />);
    expect(await screen.findByText("API User")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
  });
});
