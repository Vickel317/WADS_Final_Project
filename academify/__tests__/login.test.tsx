"use client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

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

describe("LoginPage – rendering", () => {
  it("renders the Academify brand", () => {
    render(<LoginPage />);
    expect(screen.getAllByText(/academify/i).length).toBeGreaterThan(0);
  });

  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/john\.doe@university/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  it("renders the login submit button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  });

  it("renders a link to the register page", () => {
    render(<LoginPage />);
    const registerLinks = screen.getAllByRole("link", { name: /register/i });
    expect(registerLinks.length).toBeGreaterThan(0);
  });

  it("renders the Remember me checkbox", () => {
    render(<LoginPage />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });
});

describe("LoginPage – validation", () => {
  it("shows an email validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "notanemail");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("shows a password required error when password is empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("does not call fetch when validation fails", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/config"));
    (fetch as jest.Mock).mockClear();

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("LoginPage – API interaction", () => {
  it("redirects to /dashboard on successful login", async () => {
    const user = userEvent.setup();
    mockFetchWithAuthConfig((url) =>
      Promise.resolve({
        ok: true,
        json: async () => (String(url).includes("/api/auth/sign-in/email") ? { message: "ok" } : {}),
      })
    );

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a general error message on failed login", async () => {
    const user = userEvent.setup();
    mockFetchWithAuthConfig((url) =>
      Promise.resolve({
        ok: !String(url).includes("/api/auth/sign-in/email"),
        json: async () =>
          String(url).includes("/api/auth/sign-in/email")
            ? { message: "Invalid credentials" }
            : {},
      })
    );

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    mockFetchWithAuthConfig((url) => {
      if (String(url).includes("/api/auth/sign-in/email")) {
        return new Promise(() => {});
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });
});
