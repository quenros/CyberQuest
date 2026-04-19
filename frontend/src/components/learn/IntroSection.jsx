import { motion } from "framer-motion";

export default function IntroSection({ heading, body }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-3">{heading}</h2>
      <p className="text-gray-300 text-lg leading-relaxed">{body}</p>
    </motion.div>
  );
}
