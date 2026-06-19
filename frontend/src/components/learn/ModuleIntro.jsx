import { motion } from 'framer-motion'

export default function ModuleIntro({ sections }) {
  if (!sections?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8 flex flex-col gap-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Before we start
      </p>
      {sections.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="flex flex-col gap-1"
        >
          <h3 className="text-base font-bold text-white">{s.heading}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
          {s.code && (
            <pre className="mt-2 text-xs font-mono text-gray-300 bg-gray-950 border border-gray-700/60 rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre select-text">
              {s.code}
            </pre>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
