import { useRef } from 'react'
import { motion, useAnimate } from 'framer-motion'

function Actor({ label, icon, color }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-xl border ${color} bg-gray-900 px-6 py-4 min-w-[110px]`}>
      <span className="text-3xl">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{label}</span>
    </div>
  )
}

export default function CsrfFlowSection() {
  const [scope, animate] = useAnimate()
  const played = useRef(false)
  const arrowRef = useRef(null)

  async function playSequence() {
    // Reset — bring badge back to start before replaying
    await animate('.cookie-badge', { opacity: 0, x: 0 }, { duration: 0.15 })
    await animate('.request-line', { scaleX: 0, opacity: 0 }, { duration: 0 })
    await animate('.server-box', { borderColor: 'rgb(55 65 81)' }, { duration: 0 })
    await animate('.state-change', { opacity: 0 }, { duration: 0 })

    // 1. Victim visits attacker page — attacker box pulses
    await animate('.attacker-box', { scale: [1, 1.05, 1] }, { duration: 0.4 })

    // 2. Request line draws from victim browser toward server
    await animate('.request-line', { scaleX: 1, opacity: 1 }, { duration: 0.5, ease: 'easeOut' })

    // 3. Cookie badge slides along the arrow — travel 40% of the arrow's actual width
    const arrowWidth = arrowRef.current?.offsetWidth ?? 200
    await animate('.cookie-badge', { opacity: 1, x: arrowWidth * 0.4 }, { duration: 0.6, ease: 'easeInOut' })

    // 4. Server receives the request — border flashes red
    await animate('.server-box', { borderColor: ['rgb(55 65 81)', 'rgb(239 68 68)', 'rgb(239 68 68)'] }, { duration: 0.4 })

    // 5. State change label fades in
    await animate('.state-change', { opacity: 1 }, { duration: 0.4 })

    played.current = true
  }

  // Auto-play on mount via whileInView won't work in test; trigger manually via button
  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      onViewportEnter={() => { if (!played.current) playSequence() }}
      className="rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">How CSRF works</h2>
        <button
          onClick={playSequence}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
          aria-label="Replay animation"
        >
          ↺ Replay
        </button>
      </div>

      {/* Actors row */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="attacker-box">
          <Actor label="Attacker" icon="🧑‍💻" color="border-gray-700" />
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-gray-500 mb-1">Victim's browser</span>
          <Actor label="Victim" icon="👤" color="border-gray-700" />
        </div>
        <div className="server-box rounded-xl border border-gray-700 p-0">
          <Actor label="Server" icon="🖥️" color="border-transparent" />
        </div>
      </div>

      {/* Animated request arrow with cookie badge */}
      <div ref={arrowRef} className="relative flex items-center mb-6 px-4">
        <motion.div
          className="request-line h-0.5 bg-red-500 flex-1 origin-left"
          style={{ scaleX: 0, opacity: 0 }}
        />
        <motion.div
          className="cookie-badge absolute left-4 -top-5 bg-gray-800 border border-yellow-500/60 text-yellow-400 rounded-full px-2 py-0.5 text-xs font-mono whitespace-nowrap"
          style={{ opacity: 0, x: 0 }}
        >
          🍪 session_id=abc123
        </motion.div>
        <span className="text-red-500 text-lg ml-1">→</span>
      </div>

      {/* Step labels */}
      <ol className="flex flex-col gap-2 text-sm text-gray-400 list-decimal list-inside">
        <li>Victim visits the attacker's page while logged in to the target site.</li>
        <li>The attacker's page fires a request to the target server automatically.</li>
        <li>The browser <span className="text-yellow-400 font-semibold">auto-attaches the session cookie</span> — the victim never sees this.</li>
        <li>The server receives a credentialled request and processes it as if the victim intended it.</li>
      </ol>

      {/* State change indicator */}
      <motion.div
        className="state-change mt-6 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        style={{ opacity: 0 }}
      >
        💀 Victim's account state changed — without their knowledge or consent.
      </motion.div>
    </motion.div>
  )
}
