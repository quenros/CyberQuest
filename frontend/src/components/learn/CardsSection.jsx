import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const panelVariants = {
  left: {
    hidden: { opacity: 0, x: -24 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit:   { opacity: 0, x: -16, transition: { duration: 0.15 } },
  },
  right: {
    hidden: { opacity: 0, x: 24 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit:   { opacity: 0, x: 16, transition: { duration: 0.15 } },
  },
};

function CodePanel({ card, side }) {
  const v = panelVariants[side];
  return (
    <AnimatePresence mode="wait">
      {card && (
        <motion.div
          key={card.title}
          variants={v}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex flex-col gap-2 w-56 flex-shrink-0"
        >
          <div className="text-xs text-gray-500 font-mono uppercase tracking-widest px-1">
            example.html
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-1 text-xs text-gray-500 font-mono truncate">example.html</span>
            </div>
            <pre className="p-3 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
              <code>{card.code}</code>
            </pre>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CardsSection({ heading, items }) {
  const [hovered, setHovered] = useState(null);

  const leftCard  = hovered?.side === "left"  ? hovered : null;
  const rightCard = hovered?.side === "right" ? hovered : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-6">{heading}</h2>

      <div className="flex items-start gap-4">
        {/* Left code panel */}
        <div className="w-56 flex-shrink-0 min-h-[1px]">
          <CodePanel card={leftCard} side="left" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {items.map((card, i) => (
            <motion.div
              key={i}
              onMouseEnter={() => setHovered(card)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col gap-2 rounded-xl border p-4 cursor-default transition-colors duration-150 ${
                hovered?.title === card.title
                  ? "border-cyan-500/50 bg-cyan-500/5"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <span className="text-2xl">{card.icon}</span>
              <div className="font-semibold text-sm">{card.title}</div>
              <div className="text-xs text-gray-400 leading-relaxed">{card.body}</div>
              <div className="text-xs text-gray-600 mt-1">
                {card.side === "left" ? "← hover to see code" : "hover to see code →"}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right code panel */}
        <div className="w-56 flex-shrink-0 min-h-[1px]">
          <CodePanel card={rightCard} side="right" />
        </div>
      </div>
    </motion.div>
  );
}
