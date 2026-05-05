export const TOPICS = [
  {
    id: "xss",
    title: "Cross-Site Scripting",
    shortTitle: "XSS",
    description: "Inject malicious scripts into web pages viewed by other users.",
    difficulty: 1,
    color: "cyan",
    icon: "⚡",
    unlocked: true,
    lecture: {
      title: "Introduction to XSS",
      description: "Learn what XSS is, how it works, and why it's dangerous.",
    },
  },
  {
    id: "sqli",
    title: "SQL Injection",
    shortTitle: "SQLi",
    description: "Manipulate database queries to extract or destroy data.",
    difficulty: 2,
    color: "orange",
    icon: "🗄️",
    unlocked: true,
    lecture: {
      title: "Introduction to SQL Injection",
      description: "Learn how attackers manipulate database queries through unsanitized input.",
    },
    bridgeLectures: [
      {
        beforeIndex: 1,
        id: "union-recon",
        title: "UNION Injection & Schema Discovery",
        description: "Learn to enumerate tables and columns, count query columns, and chain a UNION SELECT to read data the app never meant to expose.",
      },
      {
        beforeIndex: 2,
        id: "stacked-queries",
        title: "Stacked Queries",
        description: "Learn to terminate the current statement with a semicolon and execute an independent second command — DELETE, INSERT, UPDATE, or DROP.",
      },
    ],
  },
  {
    id: "csrf",
    title: "Cross-Site Request Forgery",
    shortTitle: "CSRF",
    description: "Trick users into performing actions they didn't intend.",
    difficulty: 3,
    color: "purple",
    icon: "🎭",
    unlocked: false,
    lecture: {
      title: "Introduction to CSRF",
      description: "Learn how attackers forge requests on behalf of authenticated users.",
    },
  },
];

export const COLOR_MAP = {
  cyan:   { card: "border-cyan-500/30 hover:border-cyan-400/60",   badge: "bg-cyan-500/10 text-cyan-400",   btn: "bg-cyan-500 hover:bg-cyan-400",   glow: "shadow-cyan-500/20" },
  orange: { card: "border-orange-500/30 hover:border-orange-400/60", badge: "bg-orange-500/10 text-orange-400", btn: "bg-orange-500 hover:bg-orange-400", glow: "shadow-orange-500/20" },
  purple: { card: "border-purple-500/30 hover:border-purple-400/60", badge: "bg-purple-500/10 text-purple-400", btn: "bg-purple-500 hover:bg-purple-400", glow: "shadow-purple-500/20" },
};
