import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TOPICS, COLOR_MAP } from "../data/topics";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Dashboard({ alias }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-cyan-400">CyberQuest</span>
        <span className="text-sm text-gray-400">
          Hacking as <span className="text-white font-medium">{alias}</span>
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold mb-1">Choose a Topic</h1>
          <p className="text-gray-400 mb-10">
            Learn the concept, then test your skills with hands-on challenges.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {TOPICS.map((topic) => {
            const c = COLOR_MAP[topic.color];
            return (
              <motion.div
                key={topic.id}
                variants={card}
                className={`relative rounded-2xl border bg-gray-900 p-6 flex flex-col gap-4 transition-all duration-200 shadow-lg ${c.card} ${c.glow} ${
                  topic.unlocked ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => topic.unlocked && navigate(`/learn/${topic.id}`)}
              >
                {!topic.unlocked && (
                  <div className="absolute top-4 right-4 text-gray-600 text-lg">🔒</div>
                )}
                <div className="text-4xl">{topic.icon}</div>

                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                    {topic.shortTitle}
                  </span>
                  <h2 className="mt-2 text-lg font-bold leading-tight">{topic.title}</h2>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">{topic.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                  <span>{"★".repeat(topic.difficulty)}{"☆".repeat(5 - topic.difficulty)} Difficulty</span>
                  <span>{topic.challengeCount} challenges</span>
                </div>

                {topic.unlocked && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/learn/${topic.id}`); }}
                      className="flex-1 rounded-lg border border-gray-600 py-2 text-xs text-gray-400 hover:border-gray-400 hover:text-white transition-colors"
                    >
                      Learn First
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/challenges/${topic.id}/0`); }}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold text-gray-950 transition-colors ${c.btn}`}
                    >
                      Start Hacking →
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
