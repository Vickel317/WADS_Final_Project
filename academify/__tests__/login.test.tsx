"use client";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
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

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("LoginPage – API interaction", () => {
  it("redirects to /dashboard on successful login", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "ok" }),
    });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a general error message on failed login", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    // Hang the fetch so we can see the loading state
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/john\.doe@university/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });
});
