import { fetchPostCommentTree } from "@/lib/post-comments";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    comment: { findMany: jest.fn() },
    commentLike: { groupBy: jest.fn() },
  },
}));

describe("fetchPostCommentTree", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a sorted tree with like counts", async () => {
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([
      {
        commentID: "c1",
        postID: "p1",
        authorID: "u1",
        content: "top",
        parentId: null,
        createdAt: new Date("2024-01-01"),
        author: { name: "Alice" },
      },
      {
        commentID: "c2",
        postID: "p1",
        authorID: "u2",
        content: "reply",
        parentId: "c1",
        createdAt: new Date("2024-01-02"),
        author: { name: "Bob" },
      },
    ]);
    (prisma.commentLike.groupBy as jest.Mock).mockResolvedValue([
      { commentID: "c1", _count: { _all: 3 } },
      { commentID: "c2", _count: { _all: 1 } },
    ]);

    const result = await fetchPostCommentTree("p1");

    expect(result.total).toBe(2);
    expect(result.topLevel).toHaveLength(1);
    expect(result.topLevel[0].commentID).toBe("c1");
    expect(result.topLevel[0]._count.likes).toBe(3);
    expect(result.topLevel[0].replies).toHaveLength(1);
    expect(result.topLevel[0].replies[0]._count.likes).toBe(1);
  });
});
