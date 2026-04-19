export const TOPICS = [
  {
    id: "xss",
    title: "Cross-Site Scripting",
    shortTitle: "XSS",
    description: "Inject malicious scripts into web pages viewed by other users.",
    difficulty: 1,
    challengeCount: 4,
    color: "cyan",
    icon: "⚡",
    unlocked: true,
  },
  {
    id: "sqli",
    title: "SQL Injection",
    shortTitle: "SQLi",
    description: "Manipulate database queries to extract or destroy data.",
    difficulty: 2,
    challengeCount: 4,
    color: "orange",
    icon: "🗄️",
    unlocked: false,
  },
  {
    id: "csrf",
    title: "Cross-Site Request Forgery",
    shortTitle: "CSRF",
    description: "Trick users into performing actions they didn't intend.",
    difficulty: 3,
    challengeCount: 3,
    color: "purple",
    icon: "🎭",
    unlocked: false,
  },
];

export const COLOR_MAP = {
  cyan:   { card: "border-cyan-500/30 hover:border-cyan-400/60",   badge: "bg-cyan-500/10 text-cyan-400",   btn: "bg-cyan-500 hover:bg-cyan-400",   glow: "shadow-cyan-500/20" },
  orange: { card: "border-orange-500/30 hover:border-orange-400/60", badge: "bg-orange-500/10 text-orange-400", btn: "bg-orange-500 hover:bg-orange-400", glow: "shadow-orange-500/20" },
  purple: { card: "border-purple-500/30 hover:border-purple-400/60", badge: "bg-purple-500/10 text-purple-400", btn: "bg-purple-500 hover:bg-purple-400", glow: "shadow-purple-500/20" },
};
