import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import api from "../api/client";

const CHALLENGE = {
  id: "xss-1-reflected",
  title: "Challenge 1: The Comment Board",
  difficulty: 1,
  points: 100,
  brief: `ByteBoard is a community comment board. Users can post comments and see them rendered on the page.

The developer built it in a hurry and didn't sanitize user input before displaying it. Can you inject a script that calls alert()?

**Your goal:** Make the page execute \`alert('xss')\``,
  hints: [
    "HTML allows you to embed scripts using a specific tag. What tag is used to run JavaScript?",
    "Try wrapping your payload in <script> tags. What happens?",
    "The input is reflected directly into the HTML. Try: <script>alert('xss')</script>",
  ],
};

export default function ChallengePage({ alias }) {
  const [payload, setPayload] = useState("");
  const [sandboxPort, setSandboxPort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const iframeRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    startSandbox();
    return () => clearInterval(pollRef.current);
  }, []);

  async function startSandbox() {
    setLoading(true);
    try {
      const { data } = await api.post("/sandbox/start", {
        alias,
        challenge_id: CHALLENGE.id,
      });
      setSandboxPort(data.port);
      pollRef.current = setInterval(() => pollStatus(data.port), 2000);
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus() {
    const { data } = await api.get("/sandbox/status", {
      params: { alias, challenge_id: CHALLENGE.id },
    });
    if (data.xss_triggered) {
      clearInterval(pollRef.current);
      setSolved(true);
    }
  }

  function submitPayload() {
    if (!sandboxPort || !payload.trim()) return;
    setSubmitting(true);
    const url = `http://localhost:${sandboxPort}/?comment=${encodeURIComponent(payload)}`;
    if (iframeRef.current) iframeRef.current.src = url;
    setTimeout(() => setSubmitting(false), 800);
  }

  function showNextHint() {
    setHintIndex((i) => Math.min(i + 1, CHALLENGE.hints.length - 1));
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <span className="font-bold text-cyan-400">CyberQuest</span>
        <span className="text-sm text-gray-400">Playing as <span className="text-white">{alias}</span></span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — brief */}
        <aside className="flex w-80 flex-shrink-0 flex-col gap-4 border-r border-gray-800 p-6 overflow-y-auto">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                {"★".repeat(CHALLENGE.difficulty)}{"☆".repeat(5 - CHALLENGE.difficulty)}
              </span>
              <span className="text-xs text-gray-500">{CHALLENGE.points} pts</span>
            </div>
            <h2 className="text-lg font-bold">{CHALLENGE.title}</h2>
          </div>

          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {CHALLENGE.brief}
          </div>

          {/* Hints */}
          <div className="mt-auto">
            <AnimatePresence>
              {CHALLENGE.hints.slice(0, hintIndex + 1).map((hint, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-300"
                >
                  <span className="font-bold">Hint {i + 1}:</span> {hint}
                </motion.div>
              ))}
            </AnimatePresence>
            {hintIndex < CHALLENGE.hints.length - 1 && (
              <button
                onClick={showNextHint}
                className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400 transition-colors"
              >
                {hintIndex === -1 ? "💡 Get a hint" : "💡 Another hint"}
              </button>
            )}
          </div>
        </aside>

        {/* Center — editor */}
        <div className="flex w-96 flex-shrink-0 flex-col border-r border-gray-800">
          <div className="border-b border-gray-800 px-4 py-2 text-xs text-gray-500">
            PAYLOAD EDITOR
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={payload}
              onChange={(v) => setPayload(v || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "off",
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <div className="border-t border-gray-800 p-4">
            <button
              onClick={submitPayload}
              disabled={submitting || loading || solved}
              className="w-full rounded-lg bg-cyan-500 py-2 font-semibold text-gray-950 hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Injecting..." : "Inject Payload"}
            </button>
          </div>
        </div>

        {/* Right — sandbox iframe */}
        <div className="flex flex-1 flex-col">
          <div className="border-b border-gray-800 px-4 py-2 text-xs text-gray-500">
            TARGET: ByteBoard
          </div>
          <div className="flex-1 bg-white relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
                Starting sandbox...
              </div>
            )}
            {sandboxPort && (
              <iframe
                ref={iframeRef}
                src={`http://localhost:${sandboxPort}/`}
                className="h-full w-full border-0"
                title="Challenge Sandbox"
              />
            )}
          </div>
        </div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="rounded-2xl bg-gray-900 border border-green-500/50 p-10 text-center shadow-2xl max-w-md"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">XSS Triggered!</h2>
              <p className="text-gray-300 mb-1">You injected a script into ByteBoard.</p>
              <p className="text-sm text-gray-500 mb-6">
                In a real app, this could steal session cookies, redirect users, or deface the page.
              </p>
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400 font-bold text-lg">
                +{CHALLENGE.points} pts
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
