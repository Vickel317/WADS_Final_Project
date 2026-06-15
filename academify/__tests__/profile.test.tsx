import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "@/app/(protected)/profile/[userId]/page";

const mockPush = jest.fn();
let mockUserId = "me";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ userId: mockUserId }),
}));

function makeResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    clone: () => makeResponse(payload),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}



beforeEach(() => {
  mockUserId = "me";
  jest.clearAllMocks();

  // Default fetch mock for ProfilePage
  global.fetch = jest.fn((url: RequestInfo | URL) => {
    const s = String(url);

    // Profile fetch
    if (s.includes("/api/users/other-user-123")) {
      return Promise.resolve(
        makeResponse({
          user: {
            id: "other-user-123",
            name: "Other User",
            major: "Computer Science",
            year: "University Year 3",
            bio: "Other user bio",
            location: "Jakarta",
            website: "otheruser.dev",
            connections: 1,
            posts: 1,
            filesShared: 1,
            skills: ["React"],
            isOwn: false,
            isFollowing: false,
            isFollower: false,
            isConnected: false,
          },
        })
      );
    }

    if (s.includes("/api/users/api-user")) {
      return Promise.resolve(
        makeResponse({
          user: {
            id: "api-user",
            name: "API User",
            major: "Physics",
            year: "University Year 2",
            bio: "Science lover",
            location: "Bandung",
            website: "apiuser.com",
            connections: 10,
            posts: 5,
            filesShared: 3,
            skills: ["Math", "Physics"],
            isOwn: false,
            isFollowing: false,
            isFollower: false,
            isConnected: false,
          },
        })
      );
    }

    if (s.includes("/api/users/me")) {
      return Promise.resolve(
        makeResponse({
          user: {
            id: "me",
            name: "John Doe",
            major: "Computer Science",
            year: "University Year 3",
            bio: "Building useful things.",
            location: "Jakarta",
            website: "johndoe.dev",
            connections: 248,
            posts: 67,
            filesShared: 142,
            skills: ["React", "TypeScript", "Python"],
            isOwn: true,
            isFollowing: false,
            isFollower: false,
            isConnected: false,
          },
        })
      );
    }

    // Recent posts/events calls
    if (s.includes("/posts") || s.includes("/events")) {
      return Promise.resolve(makeResponse({ data: [] }));
    }

    // fallback
    return Promise.resolve(makeResponse({}));
  });
});

describe("ProfilePage – loading state", () => {
  it("shows a loading spinner initially", () => {
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));

    render(<ProfilePage />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});

describe("ProfilePage – own profile (userId=me)", () => {
  it("renders the user's name after loading", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("renders current education level", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText(/university year 3/i)).toBeInTheDocument();
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
  });

  it("shows Follow button for another user's profile", async () => {
    render(<ProfilePage />);
    expect(await screen.findByRole("button", { name: /follow/i })).toBeInTheDocument();
  });
});

describe("ProfilePage – API success", () => {
  it("renders profile data returned from the API", async () => {
    // Override userId route param to api-user
    mockUserId = "api-user";

    render(<ProfilePage />);

    expect(await screen.findByText("API User")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
  });
});

