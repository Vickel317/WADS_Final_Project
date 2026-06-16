import { wasPostEditedByUser } from "@/lib/post-edited";

describe("wasPostEditedByUser", () => {
  it("returns false when editedAt is null or undefined", () => {
    expect(wasPostEditedByUser(null)).toBe(false);
    expect(wasPostEditedByUser(undefined)).toBe(false);
  });

  it("returns true when editedAt is set", () => {
    expect(wasPostEditedByUser(new Date("2026-06-19T10:00:00Z"))).toBe(true);
    expect(wasPostEditedByUser("2026-06-19T10:00:00Z")).toBe(true);
  });
});
