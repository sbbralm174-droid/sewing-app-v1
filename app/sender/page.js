"use client";
import { useState } from "react";
import { io } from "socket.io-client";

let socket;

export default function SenderPage() {
  const [text, setText] = useState("");

  if (!socket) {
    socket = io("http://localhost:3000");
  }

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("send-message", text);
    setText("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sender UI</h1>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
