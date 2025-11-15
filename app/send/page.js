"use client";

import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("loadMessages", (data) => {
      setMessages(data);
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [msg, ...prev]);
    });

    return () => {
      socket.off("loadMessages");
      socket.off("newMessage");
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    socket.emit("sendMessage", text);
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Live Chat</h2>
      <div style={{ marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{ padding: 8, width: "80%" }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      <ul style={{ marginTop: 20 }}>
        {messages.map((m) => (
          <li key={m._id}>{m.text}</li>
        ))}
      </ul>
    </div>
  );
}
