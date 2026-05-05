import { TOPICS } from "./topics";
import { CHALLENGES } from "./challenges";

function buildCurriculum() {
  return Object.fromEntries(
    TOPICS.map((topic) => {
      const items = [];

      if (topic.lecture) {
        items.push({
          type: "lecture",
          title: topic.lecture.title,
          description: topic.lecture.description,
          route: `/learn/${topic.id}`,
        });
      }

      (CHALLENGES[topic.id] ?? []).forEach((challenge, i) => {
        const bridge = (topic.bridgeLectures ?? []).find((b) => b.beforeIndex === i);
        if (bridge) {
          items.push({
            type: "lecture",
            title: bridge.title,
            description: bridge.description,
            route: `/learn/${topic.id}/${bridge.id}`,
          });
        }
        items.push({
          type: "challenge",
          title: challenge.title,
          description: challenge.summary,
          route: `/challenges/${topic.id}/${i}`,
          difficulty: challenge.difficulty,
          points: challenge.points,
        });
      });

      return [topic.id, items];
    })
  );
}

export const CURRICULUM = buildCurriculum();
