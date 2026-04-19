import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";

export default function Dashboard() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">CyberQuest</h1>
        <button
          onClick={logout}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
      <p className="text-gray-400">Challenges coming soon...</p>
    </motion.div>
  );
}
