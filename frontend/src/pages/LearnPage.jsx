import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LEARN_CONTENT } from "../data/learnContent";
import { COLOR_MAP } from "../data/topics";
import IntroSection from "../components/learn/IntroSection";
import FlowSection from "../components/learn/FlowSection";
import CodeSection from "../components/learn/CodeSection";
import CardsSection from "../components/learn/CardsSection";
import TypesSection from "../components/learn/TypesSection";

function renderSection(section, i) {
  switch (section.type) {
    case "intro":   return <IntroSection  key={i} {...section} />;
    case "flow":    return <FlowSection   key={i} {...section} />;
    case "code":    return <CodeSection   key={i} {...section} />;
    case "cards":   return <CardsSection  key={i} {...section} />;
    case "types":   return <TypesSection  key={i} {...section} />;
    default:        return null;
  }
}

export default function LearnPage({ alias }) {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const content = LEARN_CONTENT[topicId];
  if (!content) return <div className="p-8 text-gray-400">Topic not found.</div>;

  const c = COLOR_MAP[content.color];
  const cta = content.sections.find((s) => s.type === "cta");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <span className="text-sm text-gray-400">
          Hacking as <span className="text-white font-medium">{alias}</span>
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-6">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.badge}`}>
            LESSON
          </span>
          <h1 className="text-4xl font-bold mt-3 mb-1">{content.title}</h1>
          <p className="text-gray-400">Read through, then put it into practice.</p>
        </motion.div>

        {/* Sections */}
        {content.sections.filter((s) => s.type !== "cta").map(renderSection)}

        {/* CTA */}
        {cta && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-gray-900 border border-gray-800 p-8 text-center"
          >
            <h2 className="text-2xl font-bold mb-2">{cta.heading}</h2>
            <p className="text-gray-400 mb-6">{cta.body}</p>
            <button
              onClick={() => navigate(`/challenges/${topicId}/0`)}
              className={`px-8 py-3 rounded-xl font-bold text-gray-950 transition-colors ${c.btn}`}
            >
              Start Challenges →
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
