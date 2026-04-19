import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function CardsSection({ heading, items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-6">{heading}</h2>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {items.map((card, i) => (
          <motion.div
            key={i}
            variants={item}
            className="flex gap-4 rounded-xl bg-gray-800 border border-gray-700 p-4"
          >
            <span className="text-2xl flex-shrink-0">{card.icon}</span>
            <div>
              <div className="font-semibold text-sm mb-1">{card.title}</div>
              <div className="text-xs text-gray-400 leading-relaxed">{card.body}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
