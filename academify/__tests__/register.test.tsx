import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";

const mockPush = jest.fn();

function mockFetchWithAuthConfig(
  handler?: (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }> | { ok: boolean; json: () => Promise<unknown> }
) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (String(url).includes("/api/auth/config")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ googleEnabled: false, googleCallbackUrl: "" }),
      });
    }
    if (handler) {
      return Promise.resolve(handler(url));
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchWithAuthConfig();
});

describe("RegisterPage – rendering", () => {
  it("renders all form fields", () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/john\.doe@university/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min\. 8 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/re-enter your password/i)).toBeInTheDocument();
  });

  it("renders Create Account submit button", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders terms of service checkbox", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders a link back to the login page", () => {
    render(<RegisterPage />);
    const loginLinks = screen.getAllByRole("link", { name: /^login$/i });
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("renders stats on the left panel", () => {
    render(<RegisterPage />);
    expect(screen.getByText("10K+")).toBeInTheDocument();
    expect(screen.getByText("500+")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });
});

describe("RegisterPage – validation", () => {
  it("shows error when name is empty", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  });

  it("shows error for invalid email", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Jane Doe");
    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "bademail");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Jane Doe");
    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "jane@example.com");
    await user.type(screen.getByPlaceholderText(/min\. 8 characters/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("shows error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Jane Doe");
    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "jane@example.com");
    await user.type(screen.getByPlaceholderText(/min\. 8 characters/i), "password123");
    await user.type(screen.getByPlaceholderText(/re-enter your password/i), "different123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error when terms are not agreed", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Jane Doe");
    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "jane@example.com");
    await user.type(screen.getByPlaceholderText(/min\. 8 characters/i), "password123");
    await user.type(screen.getByPlaceholderText(/re-enter your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/must agree to the terms/i)).toBeInTheDocument();
  });

  it("does not call fetch when validation fails", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/config"));
    (fetch as jest.Mock).mockClear();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("RegisterPage – API interaction", () => {
  async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText(/john doe/i), "Jane Doe");
    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "jane@example.com");
    await user.type(screen.getByPlaceholderText(/min\. 8 characters/i), "password123");
    await user.type(screen.getByPlaceholderText(/re-enter your password/i), "password123");
    await user.click(screen.getByRole("checkbox"));
  }

  it("redirects to /login on successful registration", async () => {
    const user = userEvent.setup();
    mockFetchWithAuthConfig((url) =>
      Promise.resolve({
        ok: true,
        json: async () => (String(url).includes("/api/auth/sign-up/email") ? { message: "ok" } : {}),
      })
    );

    render(<RegisterPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("shows error message on API failure", async () => {
    const user = userEvent.setup();
    mockFetchWithAuthConfig((url) =>
      Promise.resolve({
        ok: !String(url).includes("/api/auth/sign-up/email"),
        json: async () =>
          String(url).includes("/api/auth/sign-up/email")
            ? { message: "Email already in use" }
            : {},
      })
    );

    render(<RegisterPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    mockFetchWithAuthConfig((url) => {
      if (String(url).includes("/api/auth/sign-up/email")) {
        return new Promise(() => {});
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<RegisterPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();
  });
});
