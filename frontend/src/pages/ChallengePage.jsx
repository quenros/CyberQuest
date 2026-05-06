import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/client";
import { CHALLENGES } from "../data/challenges";
import { TOPICS } from "../data/topics";
import SolutionAnimation from "../components/SolutionAnimation";
import { buildSqlPage } from "../utils/sqlSandbox";

const MIN_W = 200;

function EditorHintButton({ hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="w-4 h-4 rounded-full border border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400 flex items-center justify-center text-[10px] leading-none transition-colors">
        i
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-6 z-50 w-64 rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300 leading-relaxed shadow-xl"
        >
          {hint}
        </motion.div>
      )}
    </div>
  );
}

// ─── Template helpers (srcdoc challenges only) ───────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Replaces {payload}, {payload_escaped}, {show_if_payload} in a page template.
// {payload}           → raw payload (the intentional vulnerability)
// {payload_escaped}   → HTML-escaped payload (safe for attributes / display text)
// {show_if_payload}   → "display:none" when empty, "" otherwise
function substituteTemplate(template, payload) {
  const escaped = escapeHtml(payload);
  return template
    .replace(/\{payload_escaped\}/g, escaped)
    .replace(/\{show_if_payload\}/g, payload ? "" : "display:none")
    .replace(/\{payload\}/g, payload);
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function DragHandle({ onDrag }) {
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    // Iframes absorb mouse events and break drag tracking once the cursor enters them.
    // Disable pointer events on all iframes for the duration of the drag.
    document.querySelectorAll("iframe").forEach((f) => (f.style.pointerEvents = "none"));
    const onMove = (e) => { if (dragging.current) onDrag(e.movementX); };
    const onUp   = () => {
      dragging.current = false;
      document.querySelectorAll("iframe").forEach((f) => (f.style.pointerEvents = ""));
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
        className="rounded-2xl bg-gray-900 border border-gray-700 p-8 text-center shadow-2xl max-w-md w-full"
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

function SolutionConfirmModal({ onCancel, onReveal }) {
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
        className="rounded-2xl bg-gray-900 border border-gray-700 p-8 text-center shadow-2xl max-w-md w-full"
      >
        <div className="text-4xl mb-4">🔓</div>
        <h2 className="text-xl font-bold mb-2">Reveal the solution?</h2>
        <p className="text-sm text-gray-400 mb-6">
          This will show you the exact payload and explain how it works. Try the hints first — they might be all you need.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
          >
            Keep trying
          </button>
          <button
            onClick={onReveal}
            className="flex-1 rounded-lg bg-orange-500/80 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
          >
            Show solution
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DefenseSection({ defense }) {
  if (!defense) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex flex-col gap-2.5"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">🛡 How to defend</p>
      <p className="text-sm text-gray-400 leading-relaxed">{defense.summary}</p>
      <div className="flex flex-col gap-2.5 border-t border-blue-500/10 pt-2">
        {defense.measures.map((m, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-blue-300 mb-0.5">{m.title}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{m.body}</p>
            {m.code && (
              <pre className="mt-2 text-xs text-gray-300 bg-gray-950 border border-gray-700/60 rounded-lg p-3 overflow-x-auto leading-relaxed font-mono whitespace-pre select-text">
                {m.code}
              </pre>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SolutionBox({ solution, solved, animation, defense }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 flex flex-col gap-4 ${
        solved
          ? "border-green-500/30 bg-green-500/5"
          : "border-orange-500/30 bg-orange-500/5"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest ${
        solved ? "text-green-400" : "text-orange-400"
      }`}>
        {solved ? "How you did it" : "Solution"}
      </p>

      <SolutionAnimation animation={animation} />

      <div className="border-t border-gray-800 pt-3 select-text">
        {Array.isArray(solution.explanation) ? (
          <ul className="flex flex-col gap-2">
            {solution.explanation.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="text-gray-600 flex-shrink-0 mt-px">·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed">{solution.explanation}</p>
        )}
      </div>

      <DefenseSection defense={defense} />
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ChallengePage({ alias }) {
  const navigate = useNavigate();
  const { topicId, index } = useParams();
  const challengeIndex = parseInt(index ?? "0", 10);
  const topicChallenges = CHALLENGES[topicId] ?? [];
  const challenge = topicChallenges[challengeIndex];
  const hasNext = challengeIndex < topicChallenges.length - 1;

  const isSrcdoc = challenge?.sandboxType === "srcdoc";
  const isSql    = challenge?.sandboxType === "sql";

  const [payload, setPayload]         = useState("");
  const [sandboxPort, setSandboxPort] = useState(null);
  // srcdoc/sql challenges are ready immediately; container challenges wait for the sandbox
  const [loading, setLoading]         = useState(!isSrcdoc && !isSql);
  const [srcdoc, setSrcdoc]           = useState(
    isSrcdoc ? substituteTemplate(challenge.pageTemplate, "") :
    isSql    ? buildSqlPage(challenge.sqlSchema) :
    ""
  );
  const [sandboxError, setSandboxError] = useState(null);
  const [solved, setSolved]           = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [hintIndex, setHintIndex]     = useState(-1);
  const [submitting, setSubmitting]   = useState(false);
  const [showExitWarning, setShowExitWarning]   = useState(false);
  const [pendingNav, setPendingNav]             = useState(null);
  const [showSolution, setShowSolution]         = useState(false);
  const [confirmSolution, setConfirmSolution]   = useState(false);
  const [leftW, setLeftW]     = useState(450);
  const [centerW, setCenterW] = useState(380);

  const iframeRef       = useRef(null);
  const isNavigatingRef = useRef(false);

  // ── postMessage listener — replaces the old polling approach ──────────────
  // The vulnerable page sends { type: 'xss-triggered' } to the parent frame
  // the moment the XSS fires, making detection instant with no server round-trip.
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === "xss-triggered") {
        setSolved(true);
        setShowModal(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // ── Challenge lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    setPayload("");
    setSolved(false);
    setShowModal(false);
    setHintIndex(-1);
    setSubmitting(false);
    setSandboxPort(null);
    setSandboxError(null);
    setShowSolution(false);
    setConfirmSolution(false);
    isNavigatingRef.current = false;

    if (isSrcdoc) {
      setSrcdoc(substituteTemplate(challenge.pageTemplate, ""));
      setLoading(false);
      return;
    }

    if (isSql) {
      setSrcdoc(buildSqlPage(challenge.sqlSchema));
      setLoading(false);
      return;
    }

    // Container-based challenge — start the Docker sandbox
    setLoading(true);

    async function start() {
      try {
        const { data } = await api.post("/sandbox/start", {
          alias,
          challenge_id: challenge.id,
        });
        if (cancelled) return;
        setSandboxPort(data.port);
      } catch (err) {
        if (!cancelled) setSandboxError(
          err?.response?.data?.error ?? "Failed to start sandbox. Is Docker running and the image built?"
        );
      } finally { if (!cancelled) setLoading(false); }
    }

    start();

    return () => {
      cancelled = true;
      // Stop the container when the user leaves or the challenge changes.
      // Fire-and-forget: we don't await this so navigation isn't blocked.
      api.post("/sandbox/stop", { alias, challenge_id: challenge.id }).catch(() => {});
    };
  }, [topicId, challengeIndex]);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ── Payload submission ────────────────────────────────────────────────────

  function submitPayload() {
    const trimmed = payload.trim();
    if (!trimmed || submitting || solved) return;
    setSubmitting(true);

    if (isSql) {
      iframeRef.current?.contentWindow?.postMessage({ type: "sql", query: trimmed }, "*");
    } else if (isSrcdoc) {
      setSrcdoc(substituteTemplate(challenge.pageTemplate, trimmed));
    } else if (sandboxPort && iframeRef.current) {
      const path = challenge.injectPath.replace("{payload}", encodeURIComponent(trimmed));
      iframeRef.current.src = `/api/sandbox/proxy/${sandboxPort}${path}`;
    }

    setTimeout(() => setSubmitting(false), 800);
  }

  // ── Navigation helpers ────────────────────────────────────────────────────

  function doNavigate(destination) {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigate(destination);
  }

  function requestNav(destination) {
    if (solved) {
      doNavigate(destination);
    } else {
      setPendingNav(destination);
      setShowExitWarning(true);
    }
  }

  function confirmLeave() {
    setShowExitWarning(false);
    doNavigate(pendingNav);
  }

  function goNextChallenge() {
    if (!hasNext) { doNavigate("/"); return; }
    const topic = TOPICS.find((t) => t.id === topicId);
    const bridge = (topic?.bridgeLectures ?? []).find(
      (b) => b.beforeIndex === challengeIndex + 1
    );
    doNavigate(bridge ? `/learn/${topicId}/${bridge.id}` : `/challenges/${topicId}/${challengeIndex + 1}`);
  }

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        Challenge not found.
      </div>
    );
  }

  const stars = "★".repeat(challenge.difficulty) + "☆".repeat(5 - challenge.difficulty);
  const showSolutionBox = showSolution || solved;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => requestNav("/")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <span className="font-bold text-cyan-400">CyberQuest</span>
        </div>
        <span className="text-sm text-gray-400">
          Playing as <span className="text-white">{alias}</span>
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
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

          {/* Actions section */}
          <div className="flex flex-col gap-2">
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
              {showSolutionBox && challenge.solution && (
                <SolutionBox
                  solution={challenge.solution}
                  solved={solved}
                  animation={challenge.animation}
                  defense={challenge.defense}
                />
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

            {!showSolution && !solved && challenge.solution && (
              <button
                onClick={() => setConfirmSolution(true)}
                className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-500 hover:border-orange-500/50 hover:text-orange-400 transition-colors"
              >
                👁 Reveal Solution
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
          <div className="border-b border-gray-800 px-4 py-2.5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                {challenge.editorLabel ?? "Payload"}
              </span>
              {challenge.editorHint && <EditorHintButton hint={challenge.editorHint} />}
            </div>
            {!payload && challenge.editorPlaceholder && (
              <p className="mt-1 text-xs text-gray-700 font-mono truncate">
                e.g. {challenge.editorPlaceholder}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage={challenge.editorLanguage ?? "html"}
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
              {submitting ? "Working..." : (challenge.editorAction ?? "Inject Payload")}
            </button>
          </div>
        </div>

        <DragHandle onDrag={(dx) => setCenterW((w) => Math.max(MIN_W, w + dx))} />

        {/* Right — target sandbox */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="border-b border-gray-800 px-4 py-2 text-xs text-gray-500 flex-shrink-0">
            TARGET: {challenge.targetName}
          </div>
          <div className="flex-1 bg-white relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
                Starting sandbox...
              </div>
            )}
            {sandboxError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-3 p-8 text-center">
                <div className="text-3xl">⚠️</div>
                <p className="text-red-400 font-semibold text-sm">Sandbox failed to start</p>
                <p className="text-gray-500 text-xs max-w-xs">{sandboxError}</p>
                <code className="text-xs text-gray-600 bg-gray-800 rounded px-3 py-1">
                  docker build -t cyberquest-xss-3 challenges/xss-3-stored
                </code>
              </div>
            )}

            {(isSrcdoc || isSql) ? (
              // srcdoc/sql challenges render entirely in the browser — no container
              <iframe
                ref={iframeRef}
                srcDoc={srcdoc}
                sandbox="allow-scripts"
                className="h-full w-full border-0"
                title="Challenge Sandbox"
              />
            ) : (
              // container challenges load from the Docker sandbox port
              sandboxPort && (
                <iframe
                  ref={iframeRef}
                  src={`/api/sandbox/proxy/${sandboxPort}/`}
                  className="h-full w-full border-0"
                  title="Challenge Sandbox"
                />
              )
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
              className="rounded-2xl bg-gray-900 border border-green-500/50 p-8 shadow-2xl max-w-xl w-full flex flex-col gap-5"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-2xl font-bold text-green-400 mb-1">Challenge Solved!</h2>
                <p className="text-sm text-gray-400">Here's what your payload did and why it worked.</p>
              </div>

              {challenge.solution && (
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  <SolutionAnimation animation={challenge.animation} />
                  <div className="border-t border-gray-800 pt-3">
                    {Array.isArray(challenge.solution.explanation) ? (
                      <ul className="flex flex-col gap-2">
                        {challenge.solution.explanation.map((point, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                            <span className="text-gray-600 flex-shrink-0 mt-px">·</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-300 leading-relaxed">{challenge.solution.explanation}</p>
                    )}
                  </div>

                  <DefenseSection defense={challenge.defense} />
                </div>
              )}

              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400 font-bold text-lg text-center">
                +{challenge.points} pts
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                >
                  See Breakdown →
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

      {/* Solution confirm modal */}
      <AnimatePresence>
        {confirmSolution && (
          <SolutionConfirmModal
            onCancel={() => setConfirmSolution(false)}
            onReveal={() => { setConfirmSolution(false); setShowSolution(true); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
