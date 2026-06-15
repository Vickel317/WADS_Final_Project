import { compareCommentsByLikes } from "@/lib/comment-sort";

describe("comment-sort", () => {
  it("sorts by likes descending then oldest first", () => {
    const sorted = [
      { createdAt: new Date("2024-01-03"), _count: { likes: 1 } },
      { createdAt: new Date("2024-01-01"), _count: { likes: 5 } },
      { createdAt: new Date("2024-01-02"), _count: { likes: 5 } },
    ].sort(compareCommentsByLikes);

    expect(sorted[0]._count.likes).toBe(5);
    expect(sorted[0].createdAt.toISOString()).toContain("2024-01-01");
    expect(sorted[1].createdAt.toISOString()).toContain("2024-01-02");
    expect(sorted[2]._count.likes).toBe(1);
  });
});
