import { motion } from "framer-motion";

function f(delay = 0, y = 6) {
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35, ease: "easeOut" },
  };
}

const ACCENT_MAP = {
  gray:   "border-gray-700",
  red:    "border-red-500/30",
  orange: "border-orange-500/30",
  yellow: "border-yellow-500/30",
  green:  "border-green-500/30",
};

function AnimBlock({ step }) {
  return (
    <motion.div {...f(step.delay)} className={`rounded-lg border ${ACCENT_MAP[step.accent] ?? ACCENT_MAP.gray} bg-gray-950 p-3`}>
      {step.label && (
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">{step.label}</p>
      )}
      <div className="font-mono text-sm leading-relaxed">
        {step.segments.map((seg, i) =>
          seg.delay !== undefined ? (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: seg.delay, duration: 0.25 }}
              className={seg.cls}
            >
              {seg.text}
            </motion.span>
          ) : (
            <span key={i} className={seg.cls}>{seg.text}</span>
          )
        )}
      </div>
    </motion.div>
  );
}

function AnimArrow({ step }) {
  return (
    <motion.div {...f(step.delay, 0)} className="flex items-center gap-2 text-xs text-gray-600">
      <div className="flex-1 h-px bg-gray-800" />
      <span>↓ {step.label}</span>
      <div className="flex-1 h-px bg-gray-800" />
    </motion.div>
  );
}

function AnimLegend({ step }) {
  return (
    <motion.div {...f(step.delay)} className="flex flex-col gap-1.5 pt-1">
      {step.items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: item.delay, duration: 0.3 }}
          className="flex items-start gap-2 text-xs"
        >
          <code className={`font-mono font-bold shrink-0 ${item.codeCls}`}>{item.code}</code>
          <span className="text-gray-600 shrink-0 mt-px">—</span>
          <span className="text-gray-400">{item.desc}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function SolutionAnimation({ animation }) {
  if (!animation?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {animation.map((step, i) => {
        if (step.type === "block")  return <AnimBlock  key={i} step={step} />;
        if (step.type === "arrow")  return <AnimArrow  key={i} step={step} />;
        if (step.type === "legend") return <AnimLegend key={i} step={step} />;
        return null;
      })}
    </div>
  );
}
