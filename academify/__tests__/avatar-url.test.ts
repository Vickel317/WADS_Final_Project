import { resolveAvatarUrl } from "@/lib/avatar-url";

describe("resolveAvatarUrl", () => {
  it("returns null when avatar is missing", () => {
    expect(resolveAvatarUrl("user-1", null)).toBeNull();
    expect(resolveAvatarUrl("user-1", undefined)).toBeNull();
    expect(resolveAvatarUrl("user-1", "")).toBeNull();
  });

  it("keeps external and data URLs as-is", () => {
    expect(resolveAvatarUrl("user-1", "https://example.com/a.png")).toBe(
      "https://example.com/a.png"
    );
    expect(resolveAvatarUrl("user-1", "data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc"
    );
  });

  it("keeps already-resolved API paths", () => {
    expect(resolveAvatarUrl("user-1", "/api/users/user-1/avatar")).toBe(
      "/api/users/user-1/avatar"
    );
  });

  it("maps MinIO object keys to the avatar proxy route", () => {
    expect(resolveAvatarUrl("user-1", "1749-uuid-photo.jpg")).toBe(
      "/api/users/user-1/avatar"
    );
  });
});
