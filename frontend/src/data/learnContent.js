export const LEARN_CONTENT = {
  xss: {
    title: "Cross-Site Scripting (XSS)",
    color: "cyan",
    sections: [
      {
        type: "intro",
        heading: "What is XSS?",
        body: "Cross-Site Scripting (XSS) lets an attacker inject their own JavaScript into a webpage that other users visit. Instead of attacking the server directly, you're attacking the people using the site.",
      },
      {
        type: "flow",
        heading: "How does it work?",
        steps: [
          { icon: "🧑‍💻", label: "Attacker", detail: "Types malicious script into an input field" },
          { icon: "🌐", label: "Server",   detail: "Saves or reflects the input without sanitizing it" },
          { icon: "👤", label: "Victim",   detail: "Loads the page — the script runs in their browser" },
          { icon: "💀", label: "Exploit",  detail: "Cookies stolen, page defaced, keystrokes logged" },
        ],
      },
      {
        type: "code",
        heading: "What a basic payload looks like",
        language: "html",
        code: `<!-- Normal comment input -->
<input value="Hello!" />

<!-- XSS payload injected instead -->
<input value=""><script>alert('XSS')</script>" />

<!-- The browser sees and executes the script -->`,
      },
      {
        type: "cards",
        heading: "Why is it dangerous?",
        items: [
          { icon: "🍪", title: "Cookie Theft",    body: "Steal session cookies to log in as the victim." },
          { icon: "🎣", title: "Phishing",        body: "Inject fake login forms to capture credentials." },
          { icon: "🖥️", title: "Page Defacement", body: "Modify what the victim sees on the page." },
          { icon: "⌨️", title: "Keylogging",      body: "Record every keystroke the victim types." },
        ],
      },
      {
        type: "types",
        heading: "Three types of XSS",
        items: [
          { name: "Reflected",  color: "yellow", desc: "Payload is in the URL. Only affects users who click the crafted link." },
          { name: "Stored",     color: "orange", desc: "Payload is saved to the database. Affects every user who loads the page." },
          { name: "DOM-based",  color: "red",    desc: "Payload manipulates the page's DOM directly via JavaScript." },
        ],
      },
      {
        type: "cta",
        heading: "Ready to practice?",
        body: "You'll start with reflected XSS — the simplest form. Your goal is to inject a script into a vulnerable comment board.",
      },
    ],
  },
};
