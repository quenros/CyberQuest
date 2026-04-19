import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CardsSection({ heading, items }) {
  const [hovered, setHovered] = useState(null);

  function handleClick(card) {
    setHovered((prev) => (prev?.title === card.title ? null : card));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-6">{heading}</h2>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((card, i) => (
          <motion.div
            key={i}
            onClick={() => handleClick(card)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-colors duration-150 ${
              hovered?.title === card.title
                ? "border-cyan-500/50 bg-cyan-500/5"
                : "border-gray-700 bg-gray-800"
            }`}
          >
            <span className="text-2xl">{card.icon}</span>
            <div className="font-semibold text-sm">{card.title}</div>
            <div className="text-xs text-gray-400 leading-relaxed">{card.body}</div>
            <div className="text-xs text-gray-600 mt-1">
              {hovered?.title === card.title ? "click to close" : "click to see example"}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanding code panel below */}
      <AnimatePresence mode="wait">
        {hovered && (
          <motion.div
            key={hovered.title}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border border-gray-700 bg-gray-950 overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b border-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-gray-500 font-mono">
                  example.html — {hovered.title}
                </span>
              </div>
              {/* Code — selectable plain text */}
              <pre className="p-5 text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto select-text">
                <code>{hovered.code}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
