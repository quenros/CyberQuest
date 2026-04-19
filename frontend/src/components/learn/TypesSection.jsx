import { motion } from "framer-motion";

const colorMap = {
  yellow: "border-yellow-500/40 bg-yellow-500/5 text-yellow-400",
  orange: "border-orange-500/40 bg-orange-500/5 text-orange-400",
  red:    "border-red-500/40 bg-red-500/5 text-red-400",
};

export default function TypesSection({ heading, items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-6">{heading}</h2>
      <div className="flex flex-col gap-3">
        {items.map((type, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.1 }}
            className={`flex items-start gap-4 rounded-xl border p-4 ${colorMap[type.color]}`}
          >
            <span className="font-bold text-sm w-24 flex-shrink-0 pt-0.5">{type.name}</span>
            <span className="text-sm text-gray-300 leading-relaxed">{type.desc}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
