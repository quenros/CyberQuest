// Ordered curriculum per topic — mix of lectures and challenges.
// Add entries here as new content is created.
export const CURRICULUM = {
  xss: [
    {
      type: "lecture",
      title: "Introduction to XSS",
      description: "Learn what XSS is, how it works, and why it's dangerous.",
      route: "/learn/xss",
    },
    {
      type: "challenge",
      title: "Challenge 1: The Comment Board",
      description: "Inject a script into an unsanitized comment field.",
      route: "/challenges/xss/0",
      difficulty: 1,
      points: 100,
    },
    // Lecture 2 and Challenges 2–4 to be added
  ],
  sqli: [],
  csrf: [],
};
