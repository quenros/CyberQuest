import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";

export default function CodeSection({ heading, code, language = "html", filename = "example.html" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <h2 className="text-2xl font-bold mb-6">{heading}</h2>
      <div className="rounded-xl overflow-hidden border border-gray-700">
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2">
          <span className="w-3 h-4 rounded-full bg-red-500/70" />
          <span className="w-3 h-4 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-4 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-gray-500">{filename}</span>
        </div>
        <Editor
          height="160px"
          defaultLanguage={language}
          theme="vs-dark"
          value={code}
          options={{
            readOnly: true,
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: "off",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderLineHighlight: "none",
          }}
        />
      </div>
    </motion.div>
  );
}
