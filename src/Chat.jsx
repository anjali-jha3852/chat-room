import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

export default function Chat({ token }) {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    const s = io("http://localhost:5000", { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/chats", { headers: { Authorization: "Bearer " + token } })
      .then(res => setChats(res.data))
      .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message", msg => {
      if (msg.chatId === currentChat?._id) setMessages(prev => [...prev, msg]);
    });
    return () => socket.off("message");
  }, [socket, currentChat]);

  const joinChat = async chat => {
    setCurrentChat(chat);
    if (socket) socket.emit("joinChat", chat._id);
    const res = await axios.get(`http://localhost:5000/api/chats/${chat._id}/messages`, {
      headers: { Authorization: "Bearer " + token }
    });
    setMessages(res.data);
  };

  const sendMessage = () => {
    if (!newMsg || !socket || !currentChat) return;
    socket.emit("sendMessage", { chatId: currentChat._id, content: newMsg });
    setNewMsg("");
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 200, borderRight: "1px solid #ccc" }}>
        <h3>Chats</h3>
        {chats.map(chat => (
          <div key={chat._id} onClick={() => joinChat(chat)} style={{ cursor: "pointer", margin: 5 }}>
            {chat.title || "Chat"}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 10 }}>
        <h3>Messages</h3>
        <div style={{ height: 400, overflowY: "scroll", border: "1px solid #ccc", padding: 5 }}>
          {messages.map(msg => (
            <div key={msg._id}>
              <b>{msg.senderId}</b>: {msg.content}
            </div>
          ))}
        </div>
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
