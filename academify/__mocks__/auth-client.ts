const authClient = {
  signIn: { email: jest.fn(), social: jest.fn() },
  signUp: { email: jest.fn() },
  signOut: jest.fn(),
  useSession: jest.fn(() => ({ data: null, isPending: false })),
  getSession: jest.fn().mockResolvedValue({ data: null }),
};

export { authClient };
export default authClient;
