import { SCHEMA, PASSING_PERCENTAGE } from "../data/schema.js";

// Walk the schema once and roll up every metric the UI and PDF need:
// earned/total points, the effective denominator after N/A items are dropped,
// counts of failed items broken down by section type, and a final pass/fail
// verdict against the rule set in schema.js.
export function computeScore(answers) {
  const a = answers || {};
  let earned = 0;
  let totalConfigured = 0;
  let naPoints = 0;
  let answered = 0;
  let totalItems = 0;
  let failedItems = 0;
  let failedCriticalItems = 0;
  let failedZTItems = 0;

  for (const sec of SCHEMA) {
    for (const it of sec.items) {
      totalItems += 1;
      totalConfigured += it.pts;
      const v = a[it.id];
      if (v === "pass") {
        earned += it.pts;
        answered += 1;
      } else if (v === "fail") {
        answered += 1;
        failedItems += 1;
        if (sec.critical) failedCriticalItems += 1;
        if (sec.zeroTolerance) failedZTItems += 1;
      } else if (v === "na") {
        naPoints += it.pts;
        answered += 1;
      }
    }
  }

  const effectiveTotal = totalConfigured - naPoints;
  const percentage = effectiveTotal > 0 ? earned / effectiveTotal : 0;

  const failReasons = {
    critical: failedCriticalItems > 0,
    zeroTolerance: failedZTItems > 0,
    percentage: percentage < PASSING_PERCENTAGE,
  };
  const passed = !failReasons.critical && !failReasons.zeroTolerance && !failReasons.percentage;

  return {
    earned,
    total: totalConfigured,
    effectiveTotal,
    naPoints,
    percentage,
    answered,
    totalItems,
    failedItems,
    failedCriticalItems,
    failedZTItems,
    passed,
    failReasons,
  };
}

export function passFailVerdict(score) {
  if (!score) return { passed: false, label: "—", reasons: [] };
  const reasons = [];
  if (score.failReasons.zeroTolerance) reasons.push("Zero-tolerance violation");
  if (score.failReasons.critical) reasons.push("Failed Image or Service Essentials item");
  if (score.failReasons.percentage) {
    reasons.push(`Score below ${Math.round(PASSING_PERCENTAGE * 100)}%`);
  }
  return {
    passed: score.passed,
    label: score.passed ? "PASS" : "FAIL",
    reasons,
  };
}
