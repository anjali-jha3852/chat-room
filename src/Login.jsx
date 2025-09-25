import { useState } from "react";
import axios from "axios";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    try {
      const url = `http://localhost:5000/api/${isRegister ? "register" : "login"}`;
      const payload = isRegister ? { name, email, password } : { email, password };
      const res = await axios.post(url, payload);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {isRegister && (
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      )}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSubmit}>{isRegister ? "Register" : "Login"}</button>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Switch to Login" : "Switch to Register"}
      </button>
    </div>
  );
}
