import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";

// 🟢 Get all comments for a post
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const comments = await Comment.find({ postId }).sort({ createdAt: 1 }).lean();

  // Build nested tree (efficient O(n))
  const map = {};
  comments.forEach((c) => (map[c._id] = { ...c, children: [] }));
  const roots = [];
  comments.forEach((c) => {
    if (c.parentId) map[c.parentId]?.children.push(map[c._id]);
    else roots.push(map[c._id]);
  });

  return NextResponse.json(roots);
}

// 🟠 Create comment
export async function POST(req) {
  await connectDB();
  const { postId, parentId, author, content, replyTo } = await req.json();
  if (!postId || !author || !content)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const comment = await Comment.create({
    postId,
    parentId: parentId || null,
    author,
    content,
    replyTo: replyTo || null,
  });

  return NextResponse.json(comment);
}
