import { motion } from "framer-motion";

function CodePanel({ label, code, highlight, caption, variant }) {
  const borderCls = variant === "after"
    ? "border-red-500/30 bg-red-500/5"
    : "border-gray-700 bg-gray-800/60";
  const highlightCls = variant === "after"
    ? "text-red-400 bg-red-400/10 rounded px-0.5"
    : "text-amber-400 bg-amber-400/10 rounded px-0.5";

  const parts = highlight ? code.split(highlight) : null;

  return (
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <div className={`rounded-xl border ${borderCls} p-4 flex-1`}>
        <pre className="text-sm font-mono text-gray-300 whitespace-pre leading-relaxed overflow-x-auto">
          {parts ? (
            <>
              {parts[0]}
              <span className={highlightCls}>{highlight}</span>
              {parts[1]}
            </>
          ) : code}
        </pre>
      </div>
      {caption && (
        <p className="text-xs text-gray-500 leading-relaxed">{caption}</p>
      )}
    </div>
  );
}

export default function InjectionSection({ heading, before, after }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-6">{heading}</h2>
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <CodePanel {...before} variant="before" />
        <div className="flex items-center justify-center text-gray-600 text-xl md:rotate-0 rotate-90 flex-shrink-0">
          →
        </div>
        <CodePanel {...after} variant="after" />
      </div>
    </motion.div>
  );
}
