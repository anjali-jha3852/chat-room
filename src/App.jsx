

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaMoon, FaSun } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  return config;
});

function AuthForm({ onAuth, theme, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = isLogin ? "/api/login" : "/api/register";
      const body = isLogin ? { email, password } : { name, email, password };
      const res = await api.post(url, body);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onAuth(user);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`w-full max-w-md p-6 rounded-2xl shadow-lg ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-center flex-1">{isLogin ? "Login" : "Register"}</h2>
          <button onClick={toggleTheme} className="ml-2">
            {theme === "dark" ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {loading ? "Working..." : isLogin ? "Login" : "Create account"}
          </button>
        </form>
        <div className="mt-4 text-sm text-center">
          <button
            onClick={() => setIsLogin((s) => !s)}
            className="text-blue-600 underline hover:text-blue-700"
          >
            {isLogin ? "Don't have an account? Register" : "Have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chat({ user, onLogout, theme, toggleTheme }) {
  const [roomId, setRoomId] = useState("");
  const [roomLink, setRoomLink] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  async function createRoom() {
    try {
      const res = await api.post("/api/create-room");
      setRoomId(res.data.roomId);
      setRoomLink(res.data.link);
      alert(`Room created! Share this link: ${res.data.link}`);
    } catch (err) {
      console.error("Failed to create room", err);
    }
  }

  function joinRoom() {
    if (!roomId) return;
    setJoined(true);

    socketRef.current = io(API_URL, { transports: ["websocket"] });
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join_room", roomId, user.id);
    });

    socketRef.current.on("receive_message_room", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !roomId) return;

    const message = { roomId, sender: user.id, text: text.trim(), createdAt: new Date() };
    setMessages((prev) => [...prev, message]);
    setText("");
    socketRef.current.emit("send_message_room", message);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  }

  return (
    <div className={`min-h-screen p-4 flex flex-col items-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="mb-4 flex w-full justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={createRoom}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Private Room
          </button>
          <input
            placeholder="Enter room ID to join"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-3 py-2 border rounded text-black"
          />
          <button
            onClick={joinRoom}
            disabled={joined || !roomId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Join Room
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        {/* Theme toggle icon */}
        <button onClick={toggleTheme} className="ml-2">
          {theme === "dark" ? <FaSun size={22} /> : <FaMoon size={22} />}
        </button>
      </div>

      {roomLink && (
        <div className="mb-2 text-sm">
          Share this link: <a className="underline text-blue-500" href={roomLink}>{roomLink}</a>
        </div>
      )}

      <div className={`w-full max-w-2xl flex flex-col rounded-lg shadow p-3 flex-1 overflow-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`px-3 py-2 rounded-lg max-w-[70%] ${m.sender === user.id ? "bg-blue-600 text-white" : theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"}`}>
                {m.text}
                <div className="text-xs text-right mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {joined && (
          <form onSubmit={sendMessage} className="flex gap-2 mt-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded text-black"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const token = localStorage.getItem("token");
    if (token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, [theme]);

  function handleAuth(loggedUser) {
    setUser(loggedUser);
    localStorage.setItem("user", JSON.stringify(loggedUser));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }

  return user ? (
    <Chat user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
  ) : (
    <AuthForm onAuth={handleAuth} theme={theme} toggleTheme={toggleTheme} />
  );
}
