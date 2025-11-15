import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export async function GET() {
  await connectDB();
  const posts = await Post.find().sort({ createdAt: -1 });
  return NextResponse.json(posts);
}

export async function POST(req) {
  await connectDB();
  const { title, content } = await req.json();
  const post = await Post.create({ title, content });
  return NextResponse.json(post);
}
