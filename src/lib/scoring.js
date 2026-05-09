import { SCHEMA, PASSING_PERCENTAGE, isScored } from "../data/schema.js";

// Walk the schema once and roll up every metric the UI and PDF need:
// earned/total points, the effective denominator after N/A items are dropped,
// counts of failed items broken down by section type, and a final pass/fail
// verdict against the rule set in schema.js.
//
// Only items with responseType === "pass_fail" (or items without a
// responseType, the legacy default) contribute to the score. Number / text /
// select items are informational and never affect the verdict.
//
// `sections` defaults to the built-in 200-pt SCHEMA. Pass an inspection's
// stamped template sections in for custom templates so old reports re-score
// against the structure they were generated against.
export function computeScore(answers, sections = SCHEMA) {
  const a = answers || {};
  let earned = 0;
  let totalConfigured = 0;
  let naPoints = 0;
  let answered = 0;
  let totalItems = 0;
  let failedItems = 0;
  let failedCriticalItems = 0;
  let failedZTItems = 0;

  for (const sec of sections) {
    for (const it of sec.items) {
      // Non-pass-fail items don't participate in scoring at all — but if the
      // user typed an answer, count it toward "answered" so the progress bar
      // reflects activity. They never count toward totalItems either, so the
      // progress denominator stays meaningful.
      if (!isScored(it)) {
        const v = a[it.id];
        if (v != null && v !== "") answered += 1;
        continue;
      }

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
  if (score.failReasons.critical) reasons.push("Failed critical item");
  if (score.failReasons.percentage) {
    reasons.push(`Score below ${Math.round(PASSING_PERCENTAGE * 100)}%`);
  }
  return {
    passed: score.passed,
    label: score.passed ? "PASS" : "FAIL",
    reasons,
  };
}
