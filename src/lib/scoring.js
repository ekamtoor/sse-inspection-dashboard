import { SCHEMA } from "../data/schema.js";

export function computeScore(answers) {
  let earned = 0, total = 0, answered = 0, totalItems = 0;
  SCHEMA.forEach((sec) =>
    sec.items.forEach((it) => {
      total += it.pts;
      totalItems += 1;
      const a = answers[it.id];
      if (a === "pass") earned += it.pts;
      if (a === "pass" || a === "fail") answered += 1;
    })
  );
  return { earned, total, answered, totalItems };
}
