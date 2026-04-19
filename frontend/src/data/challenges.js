export const CHALLENGES = {
  xss: [
    {
      id: "xss-1-reflected",
      title: "Challenge 1: The Comment Board",
      difficulty: 1,
      points: 100,
      description:
        "ByteBoard is a community comment board. Users can post comments and see them rendered on the page.\n\nThe developer built it in a hurry and didn't sanitize user input before displaying it. Can you inject a script that calls alert()?",
      goal: "Make the page execute alert('xss')",
      hints: [
        "HTML allows you to embed scripts using a specific tag. What tag is used to run JavaScript?",
        "Try wrapping your payload in <script> tags. What happens?",
        "The input is reflected directly into the HTML. Try: <script>alert('xss')</script>",
      ],
    },
    // Challenge 2, 3, 4 to be added
  ],
};
