import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/client";

const CHALLENGE = {
  id: "xss-1-reflected",
  title: "Challenge 1: The Comment Board",
  difficulty: 1,
  points: 100,
  description: `ByteBoard is a community comment board. Users can post comments and see them rendered on the page.\n\nThe developer built it in a hurry and didn't sanitize user input before displaying it. Can you inject a script that calls alert()?`,
  goal: "Make the page execute alert('xss')",
  hints: [
    "HTML allows you to embed scripts using a specific tag. What tag is used to run JavaScript?",
    "Try wrapping your payload in <script> tags. What happens?",
    "The input is reflected directly into the HTML. Try: <script>alert('xss')</script>",
  ],
};

const MIN_W = 200;

function DragHandle({ onDrag }) {
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (e) => { if (dragging.current) onDrag(e.movementX); };
    const onUp   = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-1 flex-shrink-0 bg-gray-800 hover:bg-cyan-500/50 cursor-col-resize transition-colors duration-150 flex items-center justify-center group"
    >
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
        <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
        <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
      </div>
    </div>
  );
}

export default function ChallengePage({ alias }) {
  const navigate = useNavigate();
  const [payload, setPayload]       = useState("");
  const [sandboxPort, setSandboxPort] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [solved, setSolved]         = useState(false);
  const [hintIndex, setHintIndex]   = useState(-1);
  const [submitting, setSubmitting] = useState(false);

  // Panel widths in px
  const [leftW,   setLeftW]   = useState(300);
  const [centerW, setCenterW] = useState(380);

  const iframeRef = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => {
    startSandbox();
    return () => clearInterval(pollRef.current);
  }, []);

  async function startSandbox() {
    setLoading(true);
    try {
      const { data } = await api.post("/sandbox/start", { alias, challenge_id: CHALLENGE.id });
      setSandboxPort(data.port);
      pollRef.current = setInterval(pollStatus, 2000);
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
    if (iframeRef.current)
      iframeRef.current.src = `http://localhost:${sandboxPort}/?comment=${encodeURIComponent(payload)}`;
    setTimeout(() => setSubmitting(false), 800);
  }

  const stars = "★".repeat(CHALLENGE.difficulty) + "☆".repeat(5 - CHALLENGE.difficulty);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/learn/xss")} className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Lesson
          </button>
          <span className="font-bold text-cyan-400">CyberQuest</span>
        </div>
        <span className="text-sm text-gray-400">Playing as <span className="text-white">{alias}</span></span>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — brief */}
        <aside
          style={{ width: leftW, minWidth: MIN_W }}
          className="flex flex-shrink-0 flex-col gap-5 border-r border-gray-800 p-6 overflow-y-auto"
        >
          {/* Difficulty + points */}
          <div className="flex items-center gap-3">
            <span className="text-2xl text-yellow-400 tracking-wider">{stars}</span>
            <span className="text-sm text-gray-500">{CHALLENGE.points} pts</span>
          </div>

          <h2 className="text-xl font-bold leading-snug">{CHALLENGE.title}</h2>

          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {CHALLENGE.description}
          </p>

          {/* Your goal */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">Your Goal</p>
            <p className="text-base font-semibold text-cyan-100 italic leading-snug">
              {CHALLENGE.goal}
            </p>
          </div>

          {/* Hints */}
          <div className="mt-auto flex flex-col gap-2">
            <AnimatePresence>
              {CHALLENGE.hints.slice(0, hintIndex + 1).map((hint, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-300"
                >
                  <span className="font-bold">Hint {i + 1}:</span> {hint}
                </motion.div>
              ))}
            </AnimatePresence>
            {hintIndex < CHALLENGE.hints.length - 1 && (
              <button
                onClick={() => setHintIndex((i) => i + 1)}
                className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400 transition-colors"
              >
                {hintIndex === -1 ? "💡 Get a hint" : "💡 Another hint"}
              </button>
            )}
          </div>
        </aside>

        <DragHandle onDrag={(dx) => setLeftW((w) => Math.max(MIN_W, w + dx))} />

        {/* Center — editor */}
        <div
          style={{ width: centerW, minWidth: MIN_W }}
          className="flex flex-shrink-0 flex-col border-r border-gray-800"
        >
          <div className="border-b border-gray-800 px-4 py-2 text-xs text-gray-500 flex-shrink-0">
            PAYLOAD EDITOR
          </div>
          <div className="flex-1 overflow-hidden">
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
          <div className="border-t border-gray-800 p-4 flex-shrink-0">
            <button
              onClick={submitPayload}
              disabled={submitting || loading || solved}
              className="w-full rounded-lg bg-cyan-500 py-2 font-semibold text-gray-950 hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Injecting..." : "Inject Payload"}
            </button>
          </div>
        </div>

        <DragHandle onDrag={(dx) => setCenterW((w) => Math.max(MIN_W, w + dx))} />

        {/* Right — sandbox iframe */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="border-b border-gray-800 px-4 py-2 text-xs text-gray-500 flex-shrink-0">
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
              className="rounded-2xl bg-gray-900 border border-green-500/50 p-10 text-center shadow-2xl max-w-md w-full"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">XSS Triggered!</h2>
              <p className="text-gray-300 mb-1">You injected a script into ByteBoard.</p>
              <p className="text-sm text-gray-500 mb-6">
                In a real app, this could steal session cookies, redirect users, or deface the page.
              </p>
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400 font-bold text-lg mb-6">
                +{CHALLENGE.points} pts
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSolved(false)}
                  className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                >
                  Review Challenge
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-gray-950 hover:bg-cyan-400 transition-colors"
                >
                  Next Challenge →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
