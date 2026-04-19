import { motion } from "framer-motion";

export default function FlowSection({ heading, steps }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-8">{heading}</h2>

      <div className="flex flex-col sm:flex-row items-center gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-center flex-1">
            {/* Step card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="flex flex-col items-center text-center gap-2 bg-gray-800 rounded-xl p-5 w-full sm:w-auto flex-1"
            >
              <span className="text-3xl">{step.icon}</span>
              <span className="font-bold text-sm">{step.label}</span>
              <span className="text-xs text-gray-400 leading-snug">{step.detail}</span>
            </motion.div>

            {/* Arrow between steps */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.3 }}
                className="text-gray-600 text-2xl px-2 rotate-90 sm:rotate-0 my-2 sm:my-0"
              >
                →
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
