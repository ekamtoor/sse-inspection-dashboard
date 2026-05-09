import { jsPDF } from "jspdf";
import { SCHEMA, PASSING_PERCENTAGE, getInspectionSchema, isScored, getResponseType } from "../data/schema.js";
import { getBranding } from "./branding.js";

// A4 portrait, mm units. Designed to print or share via OS-level share sheet.
const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;
const CONTENT_W = PAGE_W - M * 2;

// Stone palette — keeps the PDF visually consistent with the in-app design.
const COLOR = {
  ink: [28, 25, 23],
  muted: [120, 113, 108],
  faint: [214, 211, 209],
  surface: [250, 250, 249],
  amber: [245, 158, 11],
  red: [220, 38, 38],
  redSoft: [254, 226, 226],
  redInk: [127, 29, 29],
  emerald: [16, 185, 129],
  emeraldSoft: [220, 252, 231],
  stone700: [68, 64, 60],
  stone200: [231, 229, 228],
};

function setFill(pdf, [r, g, b]) {
  pdf.setFillColor(r, g, b);
}
function setText(pdf, [r, g, b]) {
  pdf.setTextColor(r, g, b);
}
function setDraw(pdf, [r, g, b]) {
  pdf.setDrawColor(r, g, b);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${url}`));
    img.src = url;
  });
}

async function loadAsDataUrl(url, maxPx = 600) {
  const img = await loadImage(url);
  const longSide = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longSide > maxPx ? maxPx / longSide : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), w, h };
}

async function preloadPhotos(report) {
  const out = {};
  const photoMap = report.photos || {};
  for (const id of Object.keys(photoMap)) {
    const list = photoMap[id] || [];
    if (list.length === 0) continue;
    out[id] = [];
    for (const p of list) {
      if (!p?.url) continue;
      try {
        const result = await loadAsDataUrl(p.url);
        // Keep the original full-size URL alongside the resized JPEG so the
        // PDF can link the embedded thumbnail to the high-res image.
        result.originalUrl = p.url;
        result.name = p.name;
        out[id].push(result);
      } catch (err) {
        console.warn("Skipping photo in PDF:", err);
      }
    }
  }
  return out;
}

// Pre-load any image attachments hanging off inspection notes so we can embed
// them in the Notes section. Non-image attachments are referenced by name only.
async function preloadNoteAttachments(report) {
  const out = {};
  for (const n of report.notes || []) {
    const att = n?.attachment;
    if (!att?.url) continue;
    const looksLikeImage = (att.contentType || "").startsWith("image/")
      || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(att.name || "");
    if (!looksLikeImage) continue;
    try {
      const result = await loadAsDataUrl(att.url);
      result.originalUrl = att.url;
      result.name = att.name;
      out[n.id] = result;
    } catch (err) {
      console.warn("Skipping note attachment in PDF:", err);
    }
  }
  return out;
}

// Logo loaded as PNG to preserve any transparent background. URL is read from
// branding so onboarding a new tenant only requires updating one file (and
// dropping their logo into /public).
async function loadBrandLogo() {
  const { parentLogoUrl } = getBranding();
  if (!parentLogoUrl) return null;
  try {
    const img = await loadImage(parentLogoUrl);
    const maxPx = 400;
    const longSide = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longSide > maxPx ? maxPx / longSide : 1;
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL("image/png"), w, h };
  } catch {
    return null;
  }
}

// Mirrors the verdict logic in lib/scoring.js so old reports without the
// summary fields still render with a consistent pass/fail badge.
function deriveSummary(report) {
  if (typeof report.percentage === "number" && typeof report.passed === "boolean") {
    return {
      effectiveTotal: report.effectiveTotal ?? report.total,
      naPoints: report.naPoints ?? 0,
      percentage: report.percentage,
      passed: report.passed,
      failReasons: report.failReasons || {},
    };
  }
  let earned = 0;
  let totalConfigured = 0;
  let naPoints = 0;
  let failedCriticalItems = 0;
  let failedZTItems = 0;
  const sections = report.template?.sections || SCHEMA;
  for (const sec of sections) {
    for (const it of sec.items) {
      if (!isScored(it)) continue;
      totalConfigured += it.pts;
      const v = report.answers?.[it.id];
      if (v === "pass") earned += it.pts;
      else if (v === "na") naPoints += it.pts;
      else if (v === "fail") {
        if (sec.critical) failedCriticalItems += 1;
        if (sec.zeroTolerance) failedZTItems += 1;
      }
    }
  }
  const usedTotal = totalConfigured > 0 ? totalConfigured : (report.total || 0);
  const effectiveTotal = Math.max(usedTotal - naPoints, 0);
  const computedEarned = earned > 0 ? earned : (report.score || 0);
  const percentage = effectiveTotal > 0 ? computedEarned / effectiveTotal : 0;
  const failReasons = {
    critical: failedCriticalItems > 0,
    zeroTolerance: failedZTItems > 0,
    percentage: percentage < PASSING_PERCENTAGE,
  };
  return {
    effectiveTotal,
    naPoints,
    percentage,
    passed: !failReasons.critical && !failReasons.zeroTolerance && !failReasons.percentage,
    failReasons,
  };
}

export async function generateReportPDF({ report, site }) {
  const [photoCache, brandLogo, noteImageCache] = await Promise.all([
    preloadPhotos(report),
    loadBrandLogo(),
    preloadNoteAttachments(report),
  ]);

  const summary = deriveSummary(report);
  const fullSchema = getInspectionSchema(report);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = M;

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - M - 8) {
      pdf.addPage();
      y = M;
    }
  };

  // ---- Header band ----
  setFill(pdf, COLOR.ink);
  pdf.rect(0, 0, PAGE_W, 58, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setText(pdf, COLOR.amber);
  pdf.text("INSPECTION REPORT", M, M + 2);

  // Pass/fail pill next to the section eyebrow
  const verdict = summary.passed ? "PASS" : "FAIL";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  const verdictW = pdf.getTextWidth(verdict);
  const verdictPillW = verdictW + 5;
  const verdictPillX = M + pdf.getTextWidth("INSPECTION REPORT") + 4;
  setFill(pdf, summary.passed ? COLOR.emerald : COLOR.red);
  pdf.roundedRect(verdictPillX, M - 2.5, verdictPillW, 4.6, 0.8, 0.8, "F");
  setText(pdf, [255, 255, 255]);
  pdf.text(verdict, verdictPillX + 2.5, M + 1);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  setText(pdf, [255, 255, 255]);
  pdf.text(site?.name || "Site", M, M + 11);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  setText(pdf, [180, 175, 170]);
  const subtitle = [site?.city, site?.brand].filter(Boolean).join(" · ");
  if (subtitle) pdf.text(subtitle, M, M + 17);

  // SSE logo on a small white card in the top-right of the dark band.
  if (brandLogo?.dataUrl) {
    try {
      const aspect = brandLogo.w / brandLogo.h;
      const cardH = 22;
      const cardW = cardH * aspect + 4; // padding around the mark
      const cardX = PAGE_W - M - cardW;
      const cardY = 6;
      // White background card so the colored logo reads cleanly on the dark band.
      setFill(pdf, [255, 255, 255]);
      pdf.roundedRect(cardX, cardY, cardW, cardH, 1.2, 1.2, "F");
      pdf.addImage(
        brandLogo.dataUrl,
        "PNG",
        cardX + 2,
        cardY + 2,
        cardW - 4,
        cardH - 4,
        undefined,
        "FAST"
      );
    } catch {
      // ignore logo embed failures
    }
  }

  // Score / inspector / flags row
  const completedDate = new Date(report.completedAt);
  const dateStr = completedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = completedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const labelY = M + 28;
  const valueY = M + 36;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, COLOR.amber);
  pdf.text("SCORE", M, labelY);
  pdf.text("INSPECTOR", M + 50, labelY);
  pdf.text("FLAGS", M + 100, labelY);
  pdf.text("COMPLETED", M + 130, labelY);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setText(pdf, [255, 255, 255]);
  const denom = summary.effectiveTotal || report.total;
  pdf.text(`${report.score}/${denom}`, M, valueY);
  pdf.setFontSize(8);
  setText(pdf, [180, 175, 170]);
  pdf.text(`${Math.round(summary.percentage * 100)}%`, M, valueY + 4);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, [255, 255, 255]);
  pdf.text(report.inspector || "Inspector", M + 50, valueY);
  const failsCount = report.fails?.length || 0;
  pdf.setFontSize(14);
  setText(pdf, failsCount > 0 ? COLOR.red : [120, 120, 120]);
  pdf.text(`${failsCount}`, M + 100, valueY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  setText(pdf, [180, 175, 170]);
  pdf.text(`${dateStr} · ${timeStr}`, M + 130, valueY);

  y = 66;

  // ---- Pass-fail rationale (when failed) ----
  if (!summary.passed) {
    const reasons = [];
    if (summary.failReasons.zeroTolerance) reasons.push("Zero-tolerance violation flagged");
    if (summary.failReasons.critical) reasons.push("Image or Service Essentials item failed");
    if (summary.failReasons.percentage) reasons.push(`Score below ${Math.round(PASSING_PERCENTAGE * 100)}%`);
    if (reasons.length > 0) {
      ensureSpace(8 + reasons.length * 4.5);
      setFill(pdf, COLOR.redSoft);
      setDraw(pdf, COLOR.red);
      pdf.setLineWidth(0.4);
      const boxH = 6 + reasons.length * 4.4;
      pdf.roundedRect(M, y, CONTENT_W, boxH, 2, 2, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      setText(pdf, COLOR.redInk);
      pdf.text("Did not pass", M + 4, y + 5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      reasons.forEach((r, i) => {
        pdf.text(`• ${r}`, M + 4, y + 5 + (i + 1) * 4.4);
      });
      y += boxH + 5;
    }
  }

  // ---- ZT violation banner ----
  const reportSections = report.template?.sections || SCHEMA;
  const ztFails = (report.fails || []).filter((f) => {
    const sec = reportSections.find((s) => s.items.some((i) => i.id === f.id));
    return sec?.zeroTolerance;
  });
  if (ztFails.length > 0) {
    ensureSpace(18);
    setFill(pdf, COLOR.redSoft);
    setDraw(pdf, COLOR.red);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(M, y, CONTENT_W, 14, 2, 2, "FD");
    setText(pdf, COLOR.redInk);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(
      `${ztFails.length} Zero-Tolerance Violation${ztFails.length > 1 ? "s" : ""}`,
      M + 4,
      y + 6
    );
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Cure immediately or escalate to operator.", M + 4, y + 11);
    y += 18;
  }

  // ---- By section ----
  ensureSpace(12);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  setText(pdf, COLOR.ink);
  pdf.text("By Section", M, y + 4);
  y += 8;

  for (const sec of reportSections) {
    if (sec.documentation) continue; // skip 0-pt sections from the score overview
    const scoredItems = sec.items.filter(isScored);
    const earned = scoredItems.reduce((a, it) => a + (report.answers?.[it.id] === "pass" ? it.pts : 0), 0);
    const total = scoredItems.reduce((a, it) => a + it.pts, 0);
    const naPts = scoredItems.reduce((a, it) => a + (report.answers?.[it.id] === "na" ? it.pts : 0), 0);
    const fails = scoredItems.filter((it) => report.answers?.[it.id] === "fail").length;
    const effective = total - naPts;
    if (total === 0 && fails === 0) continue;

    ensureSpace(11);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setText(pdf, COLOR.ink);
    const labelText = sec.zeroTolerance ? `! ${sec.label}` : sec.label;
    pdf.text(labelText, M, y + 3);

    pdf.setFont("helvetica", "normal");
    setText(pdf, COLOR.muted);
    const scoreText = `${earned}/${effective || total}`;
    const scoreTextW = pdf.getTextWidth(scoreText);
    pdf.text(scoreText, PAGE_W - M - scoreTextW, y + 3);
    if (fails > 0) {
      const failText = `${fails} flag${fails > 1 ? "s" : ""}`;
      const w = pdf.getTextWidth(failText);
      const x = PAGE_W - M - scoreTextW - w - 4;
      setText(pdf, COLOR.red);
      pdf.text(failText, x, y + 3);
    }

    if (effective > 0) {
      const barY = y + 5;
      setFill(pdf, COLOR.faint);
      pdf.rect(M, barY, CONTENT_W, 1.4, "F");
      const filledColor = sec.zeroTolerance && fails > 0 ? COLOR.red : COLOR.stone700;
      setFill(pdf, filledColor);
      pdf.rect(M, barY, CONTENT_W * (earned / effective), 1.4, "F");
    }
    y += 9;
  }

  y += 6;

  // ---- Full inspection log ----
  ensureSpace(10);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  setText(pdf, COLOR.ink);
  pdf.text("Full Inspection", M, y + 4);
  y += 9;

  const ID_COL_W = 14;
  const STATUS_W = 14;
  const Q_COL_X = M + ID_COL_W;
  const Q_COL_W = CONTENT_W - ID_COL_W - STATUS_W - 2;
  const ROW_PAD_Y = 2.2;

  for (const sec of fullSchema) {
    const items = sec.items;
    if (!items || items.length === 0) continue;
    const scoredItems = items.filter(isScored);
    const earned = scoredItems.reduce((a, it) => a + (report.answers?.[it.id] === "pass" ? it.pts : 0), 0);
    const total = scoredItems.reduce((a, it) => a + it.pts, 0);
    const naPts = scoredItems.reduce((a, it) => a + (report.answers?.[it.id] === "na" ? it.pts : 0), 0);
    const fails = scoredItems.filter((it) => report.answers?.[it.id] === "fail").length;
    const naCount = scoredItems.filter((it) => report.answers?.[it.id] === "na").length;
    const passCount = scoredItems.filter((it) => report.answers?.[it.id] === "pass").length;
    const effective = total - naPts;

    // Section header band — taller for documentation sections so the
    // subtitle can fit beneath the title.
    const bandH = sec.documentation && sec.subtitle ? 12 : 7.6;
    ensureSpace(bandH + 3);
    setFill(pdf, sec.zeroTolerance ? COLOR.redSoft : COLOR.surface);
    pdf.rect(M, y, CONTENT_W, bandH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, sec.zeroTolerance ? COLOR.redInk : COLOR.ink);
    const header = sec.zeroTolerance ? `! ${sec.label}` : sec.label;
    pdf.text(header, M + 2, y + 5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, COLOR.muted);
    let metaRight;
    if (sec.documentation) {
      metaRight = `${passCount} pass  ·  ${naCount} N/A`;
      if (fails > 0) metaRight = `${fails} flag${fails > 1 ? "s" : ""}  ·  ${metaRight}`;
    } else {
      metaRight = `${earned}/${effective || total}`;
      if (naPts > 0) metaRight = `${naPts}pt N/A  ·  ${metaRight}`;
      if (fails > 0) metaRight = `${fails} flag${fails > 1 ? "s" : ""}  ·  ${metaRight}`;
    }
    const w = pdf.getTextWidth(metaRight);
    pdf.text(metaRight, PAGE_W - M - 2 - w, y + 5);

    if (sec.documentation && sec.subtitle) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      setText(pdf, COLOR.muted);
      const subLines = pdf.splitTextToSize(sec.subtitle, CONTENT_W - 4);
      pdf.text(subLines.slice(0, 1), M + 2, y + 9.5);
    }
    y += bandH + 2;

    // Each item in section
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const ans = report.answers?.[it.id];
      const comment = report.comments?.[it.id] || "";
      const photos = photoCache[it.id] || [];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      const qLines = pdf.splitTextToSize(it.q, Q_COL_W);
      pdf.setFontSize(9);
      const cLines = comment ? pdf.splitTextToSize(comment, Q_COL_W) : [];

      const tileH = 22;
      const photoBlockH = photos.length > 0 ? tileH + 3 : 0;
      const baseH =
        ROW_PAD_Y * 2 + qLines.length * 4.4 +
        (cLines.length > 0 ? cLines.length * 4 + 2 : 0) +
        photoBlockH;

      ensureSpace(baseH + 1);

      // ID column
      pdf.setFont("courier", "bold");
      pdf.setFontSize(8);
      setText(pdf, COLOR.muted);
      pdf.text(it.id, M, y + ROW_PAD_Y + 3);

      // Question
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      setText(pdf, COLOR.ink);
      pdf.text(qLines, Q_COL_X, y + ROW_PAD_Y + 3);

      // Status pill on the right. Pass/Fail/N/A get a colored pill; for
      // number / text / select items we render the answer value verbatim
      // (truncated). Empty answers stay as a dash.
      const rt = getResponseType(it);
      const hasAns = ans != null && ans !== "";
      let statusInfo;
      if (rt === "pass_fail") {
        statusInfo = ans === "pass"
          ? { label: "PASS", fill: COLOR.emerald, color: [255, 255, 255] }
          : ans === "fail"
            ? { label: "FAIL", fill: COLOR.red, color: [255, 255, 255] }
            : ans === "na"
              ? { label: "N/A", fill: COLOR.stone700, color: [255, 255, 255] }
              : { label: "—", fill: null, color: COLOR.muted };
      } else if (!hasAns) {
        statusInfo = { label: "—", fill: null, color: COLOR.muted };
      } else {
        const raw = rt === "number" && it.unit ? `${ans} ${it.unit}` : String(ans);
        const trimmed = raw.length > 22 ? `${raw.slice(0, 21)}…` : raw;
        statusInfo = { label: trimmed, fill: COLOR.surface, color: COLOR.ink };
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      const sw = pdf.getTextWidth(statusInfo.label);
      const pillPad = 2.2;
      const pillW = sw + pillPad * 2;
      const pillH = 4.4;
      const pillX = PAGE_W - M - pillW;
      const pillY = y + ROW_PAD_Y;
      if (statusInfo.fill) {
        setFill(pdf, statusInfo.fill);
        pdf.roundedRect(pillX, pillY, pillW, pillH, 0.8, 0.8, "F");
      }
      setText(pdf, statusInfo.color);
      pdf.text(statusInfo.label, pillX + pillPad, pillY + pillH - 1.3);

      let cursorY = y + ROW_PAD_Y + qLines.length * 4.4 + 1;

      // Comment
      if (cLines.length > 0) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        setText(pdf, COLOR.stone700);
        pdf.text(cLines, Q_COL_X, cursorY + 3);
        cursorY += cLines.length * 4 + 2;
      }

      // Photos
      if (photos.length > 0) {
        const tileMaxW = 30;
        let cursorX = Q_COL_X;
        const photoY = cursorY + 1;
        const rowMaxX = PAGE_W - M;
        for (const p of photos) {
          const aspect = p.w / p.h;
          const tw = Math.min(tileMaxW, tileH * aspect);
          if (cursorX + tw > rowMaxX) {
            cursorX = Q_COL_X;
            cursorY = photoY + tileH + 2;
            ensureSpace(tileH + 4);
          }
          try {
            pdf.addImage(p.dataUrl, "JPEG", cursorX, cursorY + 1, tw, tileH, undefined, "FAST");
            // Make the embedded thumbnail clickable — opens the full-size
            // image URL in the PDF viewer's default browser. Works in iOS
            // Files / Adobe Acrobat / Chrome's PDF viewer.
            if (p.originalUrl) {
              pdf.link(cursorX, cursorY + 1, tw, tileH, { url: p.originalUrl });
            }
          } catch (err) {
            console.warn("Skipping photo embed:", err);
          }
          cursorX += tw + 2;
        }
        cursorY += tileH + 2;
      }

      y = cursorY + ROW_PAD_Y;

      if (idx < items.length - 1) {
        setDraw(pdf, COLOR.faint);
        pdf.setLineWidth(0.15);
        pdf.line(M + 1, y, PAGE_W - M - 1, y);
      }
    }

    y += 4;
  }

  // ---- Inspection-level notes ----
  const notes = (report.notes || []).slice().sort((a, b) => (a.at || "").localeCompare(b.at || ""));
  if (notes.length > 0) {
    y += 2;
    ensureSpace(12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setText(pdf, COLOR.ink);
    pdf.text("Inspection Notes", M, y + 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, COLOR.muted);
    pdf.text(`${notes.length} entr${notes.length === 1 ? "y" : "ies"}`, M + pdf.getTextWidth("Inspection Notes") + 3, y + 4);
    y += 9;

    for (const n of notes) {
      const headerLine = `${(n.actor || "—")}  ·  ${n.at ? new Date(n.at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : ""}`;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      const textLines = n.text ? pdf.splitTextToSize(n.text, CONTENT_W - 6) : [];
      const noteImage = noteImageCache[n.id];
      const attachmentLine = n.attachment ? `Attachment: ${n.attachment.name}` : null;
      const attachmentLineH = attachmentLine ? 4 : 0;
      const imageH = noteImage ? 30 : 0;
      const blockH =
        4 + // header line
        2 +
        (textLines.length > 0 ? textLines.length * 4.6 + 2 : 0) +
        (imageH > 0 ? imageH + 3 : 0) +
        (attachmentLineH > 0 ? attachmentLineH + 1 : 0) +
        4;

      ensureSpace(blockH + 2);

      // Subtle card background
      setFill(pdf, COLOR.surface);
      setDraw(pdf, COLOR.faint);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(M, y, CONTENT_W, blockH, 1.5, 1.5, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      setText(pdf, COLOR.muted);
      pdf.text("NOTE", M + 3, y + 4);
      pdf.setFont("helvetica", "normal");
      setText(pdf, COLOR.muted);
      pdf.text(headerLine, M + 3 + pdf.getTextWidth("NOTE") + 3, y + 4);

      let cursorY = y + 7;
      if (textLines.length > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        setText(pdf, COLOR.ink);
        pdf.text(textLines, M + 3, cursorY + 3);
        cursorY += textLines.length * 4.6 + 1;
      }
      if (noteImage?.dataUrl) {
        try {
          const aspect = noteImage.w / noteImage.h;
          const tw = Math.min(imageH * aspect, CONTENT_W - 6);
          pdf.addImage(noteImage.dataUrl, "JPEG", M + 3, cursorY + 1, tw, imageH, undefined, "FAST");
          if (noteImage.originalUrl) {
            pdf.link(M + 3, cursorY + 1, tw, imageH, { url: noteImage.originalUrl });
          }
          cursorY += imageH + 2;
        } catch (err) {
          console.warn("Skipping note image embed:", err);
        }
      }
      // For non-image attachments, render the filename as a clickable text
      // link to the original file (PDF/doc/csv etc).
      if (attachmentLine && !noteImage) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8.5);
        setText(pdf, COLOR.stone700);
        pdf.text(attachmentLine, M + 3, cursorY + 3);
        if (n.attachment?.url) {
          const lineW = pdf.getTextWidth(attachmentLine);
          pdf.link(M + 3, cursorY + 0.5, lineW, 4, { url: n.attachment.url });
        }
        cursorY += attachmentLineH + 1;
      }

      y += blockH + 2;
    }
  }

  // ---- Footer page numbers ----
  const { pdfFooterPrefix } = getBranding();
  const pageCount = pdf.getNumberOfPages();
  const footerY = PAGE_H - 6;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, COLOR.muted);
    pdf.text(`${pdfFooterPrefix} · ${site?.name || ""} · ${dateStr}`, M, footerY);
    const right = `Page ${i} of ${pageCount}`;
    pdf.text(right, PAGE_W - M - pdf.getTextWidth(right), footerY);
  }

  return pdf;
}

export function reportFilename(report, site) {
  const { pdfFilenamePrefix } = getBranding();
  const dt = new Date(report.completedAt);
  const ymd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const safe = (site?.name || "Report").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `${pdfFilenamePrefix}-${safe}-${ymd}.pdf`;
}
