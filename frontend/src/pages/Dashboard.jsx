import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TOPICS, COLOR_MAP } from "../data/topics";
import { CURRICULUM } from "../data/curriculum";

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function Dashboard({ alias }) {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState(null);

  function toggleTopic(topic) {
    if (!topic.unlocked) return;
    setSelectedTopic((prev) => (prev?.id === topic.id ? null : topic));
  }

  const curriculum = selectedTopic ? (CURRICULUM[selectedTopic.id] ?? []) : [];
  const c = selectedTopic ? COLOR_MAP[selectedTopic.color] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
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
            Select a topic to see its lectures and challenges.
          </p>
        </motion.div>

        {/* Topic cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5"
        >
          {TOPICS.map((topic) => {
            const tc = COLOR_MAP[topic.color];
            const isSelected = selectedTopic?.id === topic.id;
            return (
              <motion.div
                key={topic.id}
                variants={cardVariants}
                onClick={() => toggleTopic(topic)}
                className={`relative rounded-2xl border bg-gray-900 p-6 flex flex-col gap-4 transition-all duration-200 shadow-lg ${
                  topic.unlocked ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                } ${isSelected ? `${tc.card} ring-1 ring-offset-0` : tc.card}`}
              >
                {!topic.unlocked && (
                  <div className="absolute top-4 right-4 text-gray-600 text-lg">🔒</div>
                )}
                {isSelected && (
                  <div className="absolute top-4 right-4 text-gray-400 text-sm">▲</div>
                )}

                <div className="text-4xl">{topic.icon}</div>
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tc.badge}`}>
                    {topic.shortTitle}
                  </span>
                  <h2 className="mt-2 text-lg font-bold leading-tight">{topic.title}</h2>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">{topic.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                  <span>{"★".repeat(topic.difficulty)}{"☆".repeat(5 - topic.difficulty)} Difficulty</span>
                  <span>{topic.challengeCount} challenges</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Curriculum panel */}
        <AnimatePresence>
          {selectedTopic && (
            <motion.div
              key={selectedTopic.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className={`rounded-2xl border bg-gray-900 p-6 ${c.card}`}>
                {/* Panel header */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{selectedTopic.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{selectedTopic.title}</h3>
                    <p className="text-xs text-gray-500">{curriculum.length} items</p>
                  </div>
                </div>

                {/* Curriculum list */}
                <div className="flex flex-col gap-2">
                  {curriculum.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 hover:border-gray-500 transition-colors group"
                    >
                      {/* Step number */}
                      <span className="text-xs text-gray-600 w-5 text-center flex-shrink-0">
                        {i + 1}
                      </span>

                      {/* Icon */}
                      <span className="text-lg flex-shrink-0">
                        {item.type === "lecture" ? "📖" : "⚡"}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            item.type === "lecture"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-yellow-500/15 text-yellow-400"
                          }`}>
                            {item.type === "lecture" ? "LECTURE" : "CHALLENGE"}
                          </span>
                          {item.difficulty && (
                            <span className="text-xs text-yellow-500">
                              {"★".repeat(item.difficulty)}{"☆".repeat(5 - item.difficulty)}
                            </span>
                          )}
                          {item.points && (
                            <span className="text-xs text-gray-500">{item.points} pts</span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>

                      {/* Go button */}
                      <button
                        onClick={() => navigate(item.route)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-950 transition-colors ${c.btn}`}
                      >
                        Go →
                      </button>
                    </motion.div>
                  ))}

                  {curriculum.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">
                      Content coming soon.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
