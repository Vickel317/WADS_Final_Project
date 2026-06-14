import { canCreateForum } from "@/lib/forum-access";

describe("canCreateForum", () => {
  it("allows admins and lecturers", () => {
    expect(canCreateForum("admin")).toBe(true);
    expect(canCreateForum("lecturer")).toBe(true);
    expect(canCreateForum("LECTURER")).toBe(true);
  });

  it("blocks students and moderators", () => {
    expect(canCreateForum("student")).toBe(false);
    expect(canCreateForum("moderator")).toBe(false);
    expect(canCreateForum(null)).toBe(false);
  });
});
