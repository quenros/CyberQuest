import { useState } from "react";
import { motion } from "framer-motion";

export default function NameEntry({ onEnter }) {
  const [alias, setAlias] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const name = alias.trim();
    if (!name) return;
    localStorage.setItem("alias", name);
    onEnter(name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-screen items-center justify-center bg-gray-950"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-xl"
      >
        <h1 className="mb-2 text-2xl font-bold text-cyan-400">CyberQuest</h1>
        <p className="mb-6 text-sm text-gray-400">Enter a name to start hacking.</p>
        <input
          autoFocus
          type="text"
          placeholder="Your alias (e.g. h4cker99)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="mb-4 w-full rounded-lg bg-gray-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-cyan-500 py-2 font-semibold text-gray-950 hover:bg-cyan-400 transition-colors"
        >
          Enter
        </button>
      </form>
    </motion.div>
  );
}
