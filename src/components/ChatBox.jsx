import React, { useEffect, useState } from "react";
import API from "../Axios"; // Axios helper
import socket from "../socket"; // Socket.IO client
import "./ChatBox.css";


export default function ChatBox({ chatId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!chatId) return;

    // 1. Fetch previous messages
    API.get(`/api/chats/${chatId}/messages`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Fetch messages error:", err));

    // 2. Join chat room
    socket.emit("joinChat", chatId);

    // 3. Listen for new messages
    const handleMessage = (msg) => {
      if (String(msg.chatId) === String(chatId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [chatId]);

  const sendMessage = () => {
    if (!text.trim()) return;

    // Optimistic update (instant UI feedback)
    setMessages((prev) => [
      ...prev,
      {
        _id: Date.now(), // temporary ID
        senderId: currentUser?.id,
        content: text,
      },
    ]);

    socket.emit("sendMessage", {
      chatId,
      content: text,
    });

    setText("");
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-lg shadow-md">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-[70%] p-2 rounded-lg ${
              msg.senderId === currentUser?.id
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-200 text-gray-900 mr-auto"
            }`}
          >
            <strong>
              {msg.senderId === currentUser?.id ? "You" : msg.senderId}
            </strong>
            : {msg.content}
          </div>
        ))}
      </div>
      <div className="p-2 flex gap-2 border-t">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
