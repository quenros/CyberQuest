import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/client";
import { CHALLENGES } from "../data/challenges";

const MIN_W = 200;

function DragHandle({ onDrag }) {
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (e) => { if (dragging.current) onDrag(e.movementX); };
    const onUp   = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
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

function ExitWarningModal({ onStay, onLeave }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="rounded-2xl bg-gray-900 border border-gray-700 p-8 text-center shadow-2xl max-w-sm w-full"
      >
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Leave this challenge?</h2>
        <p className="text-sm text-gray-400 mb-6">
          Your progress will not be saved and the sandbox will be shut down.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
          >
            Stay
          </button>
          <button
            onClick={onLeave}
            className="flex-1 rounded-lg bg-red-500/80 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Leave anyway
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ChallengePage({ alias }) {
  const navigate = useNavigate();
  const { topicId, index } = useParams();
  const challengeIndex = parseInt(index ?? "0", 10);
  const topicChallenges = CHALLENGES[topicId] ?? [];
  const challenge = topicChallenges[challengeIndex];
  const hasNext = challengeIndex < topicChallenges.length - 1;

  // Reset all state when challenge changes
  const [payload, setPayload]       = useState("");
  const [sandboxPort, setSandboxPort] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [solved, setSolved]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [hintIndex, setHintIndex]   = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);
  const [leftW, setLeftW]   = useState(300);
  const [centerW, setCenterW] = useState(380);

  const iframeRef    = useRef(null);
  const intervalRef  = useRef(null);
  const challengeRef = useRef(challenge);

  // Keep challengeRef current so stopSandbox always uses the right id
  useEffect(() => { challengeRef.current = challenge; }, [challenge]);

  // Reset state and restart sandbox whenever challenge changes
  useEffect(() => {
    let cancelled = false;

    setPayload("");
    setSolved(false);
    setShowModal(false);
    setHintIndex(-1);
    setSubmitting(false);
    setSandboxPort(null);
    setLoading(true);
    clearInterval(intervalRef.current);

    const challengeId = challenge.id;

    async function start() {
      try {
        const { data } = await api.post("/sandbox/start", { alias, challenge_id: challengeId });
        if (cancelled) return;
        setSandboxPort(data.port);

        intervalRef.current = setInterval(async () => {
          if (cancelled) return;
          try {
            const { data } = await api.get("/sandbox/status", {
              params: { alias, challenge_id: challengeId },
            });
            if (data.xss_triggered && !cancelled) {
              clearInterval(intervalRef.current);
              setSolved(true);
              setShowModal(true);
            }
          } catch { /* ignore poll errors */ }
        }, 2000);
      } catch { /* ignore start errors */ }
      finally { if (!cancelled) setLoading(false); }
    }

    start();

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [topicId, challengeIndex]);

  // Warn on browser refresh/close
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  async function stopSandbox() {
    clearInterval(intervalRef.current);
    try {
      await api.post("/sandbox/stop", { alias, challenge_id: challengeRef.current.id });
    } catch { /* best-effort */ }
  }

  function submitPayload() {
    if (!sandboxPort || !payload.trim()) return;
    setSubmitting(true);
    if (iframeRef.current)
      iframeRef.current.src = `http://localhost:${sandboxPort}/?comment=${encodeURIComponent(payload)}`;
    setTimeout(() => setSubmitting(false), 800);
  }

  function requestNav(destination) {
    if (solved) {
      // Already solved — no need to warn, just stop silently and go
      stopSandbox().then(() => navigate(destination));
    } else {
      setPendingNav(destination);
      setShowExitWarning(true);
    }
  }

  async function confirmLeave() {
    await stopSandbox();
    setShowExitWarning(false);
    navigate(pendingNav);
  }

  function goNextChallenge() {
    const dest = `/challenges/${topicId}/${challengeIndex + 1}`;
    if (solved) {
      stopSandbox().then(() => navigate(dest));
    } else {
      requestNav(dest);
    }
  }

  if (!challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        Challenge not found.
      </div>
    );
  }

  const stars = "★".repeat(challenge.difficulty) + "☆".repeat(5 - challenge.difficulty);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => requestNav(`/learn/${topicId}`)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Lesson
          </button>
          <span className="font-bold text-cyan-400">CyberQuest</span>
        </div>
        <span className="text-sm text-gray-400">
          Playing as <span className="text-white">{alias}</span>
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — brief */}
        <aside
          style={{ width: leftW, minWidth: MIN_W }}
          className="flex flex-shrink-0 flex-col gap-5 border-r border-gray-800 p-6 overflow-y-auto"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl text-yellow-400 tracking-wider">{stars}</span>
            <span className="text-sm text-gray-500">{challenge.points} pts</span>
          </div>

          <h2 className="text-xl font-bold leading-snug">{challenge.title}</h2>

          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {challenge.description}
          </p>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">Your Goal</p>
            <p className="text-base font-semibold text-cyan-100 italic leading-snug">
              {challenge.goal}
            </p>
          </div>

          {/* Hints + next challenge */}
          <div className="mt-auto flex flex-col gap-2">
            <AnimatePresence>
              {solved && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={goNextChallenge}
                  className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                    hasNext
                      ? "bg-cyan-500 text-gray-950 hover:bg-cyan-400"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {hasNext ? "Next Challenge →" : "All done! Back to Dashboard →"}
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {challenge.hints.slice(0, hintIndex + 1).map((hint, i) => (
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

            {hintIndex < challenge.hints.length - 1 && !solved && (
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

      {/* Success modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                +{challenge.points} pts
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                >
                  Review Challenge
                </button>
                <button
                  onClick={goNextChallenge}
                  className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-gray-950 hover:bg-cyan-400 transition-colors"
                >
                  {hasNext ? "Next Challenge →" : "Back to Dashboard →"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit warning modal */}
      <AnimatePresence>
        {showExitWarning && (
          <ExitWarningModal
            onStay={() => setShowExitWarning(false)}
            onLeave={confirmLeave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
