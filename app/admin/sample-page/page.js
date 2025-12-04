"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const res = await fetch("/api/users");
    const data = await res.json();
    setPosts(data);
  }

  async function createPost() {
    if (!newPost.title || !newPost.content) return;
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });
    setNewPost({ title: "", content: "" });
    fetchPosts();
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">📝 Simple Post + Nested Comment System</h1>

      {/* Create Post */}
      <div className="border p-4 rounded space-y-2">
        <input
          className="w-full border p-2 rounded"
          placeholder="Post title"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Post content"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
        />
        <button
          onClick={createPost}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Post
        </button>
      </div>

      {/* Post List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Post key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}

function Post({ post }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    const res = await fetch(`/api/comments?postId=${post._id}`);
    const data = await res.json();
    setComments(data);
  }

  async function addComment(parentId = null, replyTo = null, text) {
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post._id,
        parentId,
        author,
        content: text,
        replyTo,
      }),
    });
    fetchComments();
  }

  return (
    <div className="border rounded p-4">
      <h2 className="text-xl font-semibold">{post.title}</h2>
      <p className="text-gray-700">{post.content}</p>

      {/* Add comment */}
      <div className="mt-4 space-y-2">
        <input
          className="w-full border p-2 rounded"
          placeholder="Your name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={() => {
            if (author && newComment.trim()) {
              addComment(null, null, newComment);
              setNewComment("");
            }
          }}
        >
          Comment
        </button>
      </div>

      {/* Comments */}
      <div className="mt-6 space-y-4">
        {comments.map((c) => (
          <Comment key={c._id} comment={c} onReply={addComment} />
        ))}
      </div>
    </div>
  );
}

function Comment({ comment, onReply, level = 0 }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className={`border-l pl-3 ${level > 0 ? "ml-4" : ""}`}>
      <p>
        <span className="font-semibold">{comment.author}</span>{" "}
        {comment.replyTo && (
          <span className="text-sm text-blue-600">@{comment.replyTo}</span>
        )}
      </p>
      <p>{comment.content}</p>
      <button
        className="text-blue-500 text-sm mt-1"
        onClick={() => setReplying(!replying)}
      >
        Reply
      </button>

      {replying && (
        <div className="mt-2 ml-4">
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Write reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded mt-1"
            onClick={() => {
              if (replyText.trim()) {
                onReply(comment._id, comment.author, replyText);
                setReplyText("");
                setReplying(false);
              }
            }}
          >
            Reply to {comment.author}
          </button>
        </div>
      )}

      {comment.children?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.children.map((child) => (
            <Comment
              key={child._id}
              comment={child}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
