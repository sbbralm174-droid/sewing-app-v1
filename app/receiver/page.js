"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let socket;

export default function ReceiverPage() {
  const [messages, setMessages] = useState([]);

 useEffect(() => {
  if (!socket) socket = io("http://localhost:3000");

  socket.on("load-messages", (msgs) => {
    setMessages(msgs);
  });

  socket.on("receive-message", (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  return () => {
    socket.off("load-messages");
    socket.off("receive-message");
  };
}, []);


  return (
    <div style={{ padding: "20px" }}>
      <h1>Receiver UI</h1>
      <ul>
  {messages.map((msg, i) => (
    <li key={msg._id || i}>{msg.text}</li>  // ✅ এখন শুধু text দেখাচ্ছে
  ))}
</ul>

    </div>
  );
}
