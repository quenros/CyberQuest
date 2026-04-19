import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/client";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.role);
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-screen items-center justify-center"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-xl"
      >
        <h1 className="mb-6 text-2xl font-bold text-cyan-400">CyberQuest</h1>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg bg-gray-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg bg-gray-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-cyan-500 py-2 font-semibold text-gray-950 hover:bg-cyan-400 transition-colors"
        >
          Login
        </button>
      </form>
    </motion.div>
  );
}
