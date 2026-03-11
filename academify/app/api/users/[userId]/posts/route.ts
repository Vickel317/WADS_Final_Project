import { NextRequest, NextResponse } from "next/server";

// Mock posts data
const mockPosts = [
  {
    id: "post_1",
    userId: "user_1",
    title: "Advanced JavaScript Patterns",
    content: "A comprehensive guide to design patterns in JavaScript including closures, prototypes, and more.",
    category: "Technology",
    createdAt: new Date("2026-03-05"),
    updatedAt: new Date("2026-03-05"),
    likes: 42,
    comments: 8,
  },
  {
    id: "post_2",
    userId: "user_1",
    title: "Study Tips for Finals",
    content: "Effective techniques to prepare for final exams including time management and focus strategies.",
    category: "Study Tips",
    createdAt: new Date("2026-02-28"),
    updatedAt: new Date("2026-02-28"),
    likes: 156,
    comments: 23,
  },
  {
    id: "post_3",
    userId: "user_2",
    title: "Calculus Problem Solving",
    content: "Step-by-step approach to solving complex calculus problems.",
    category: "Mathematics",
    createdAt: new Date("2026-03-08"),
    updatedAt: new Date("2026-03-08"),
    likes: 89,
    comments: 15,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Filter posts by user
    const userPosts = mockPosts.filter((post) => post.userId === userId);

    if (userPosts.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        message: "No posts found for this user",
      });
    }

    return NextResponse.json(
      {
        data: userPosts,
        total: userPosts.length,
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
