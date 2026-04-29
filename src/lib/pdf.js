import { jsPDF } from "jspdf";
import { SCHEMA } from "../data/schema.js";

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
  stone700: [68, 64, 60],
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

// Resize to keep the embedded JPEG small — display size in the PDF is ~25mm,
// so 600px is plenty of detail and cuts a 1600px source by ~7x in bytes.
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

// Pre-fetch every photo before rendering so jspdf's sync addImage calls
// have data ready. Failures are logged and skipped, not fatal.
async function preloadPhotos(report) {
  const out = {};
  const photoMap = report.photos || {};
  const ids = Object.keys(photoMap);
  for (const id of ids) {
    const list = photoMap[id] || [];
    if (list.length === 0) continue;
    out[id] = [];
    for (const p of list) {
      if (!p?.url) continue;
      try {
        out[id].push(await loadAsDataUrl(p.url));
      } catch (err) {
        console.warn("Skipping photo in PDF:", err);
      }
    }
  }
  return out;
}

// Best-effort load of the Seven Star Energy logo for the PDF footer.
// Encodes as PNG to preserve transparency. Returns null if the file isn't
// present so the renderer falls back to plain text.
async function loadBrandLogo() {
  try {
    const img = await loadImage("/seven-star-logo.png");
    const maxPx = 200;
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

export async function generateReportPDF({ report, site }) {
  const [photoCache, brandLogo] = await Promise.all([
    preloadPhotos(report),
    loadBrandLogo(),
  ]);

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
  pdf.rect(0, 0, PAGE_W, 54, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setText(pdf, COLOR.amber);
  pdf.text("PRE-INSPECTION REPORT", M, M + 2);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  setText(pdf, [255, 255, 255]);
  pdf.text(site?.name || "Site", M, M + 11);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  setText(pdf, [180, 175, 170]);
  const subtitle = [site?.city, site?.brand].filter(Boolean).join(" · ");
  if (subtitle) pdf.text(subtitle, M, M + 17);

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

  const labelY = M + 26;
  const valueY = M + 34;
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
  pdf.text(`${report.score}/${report.total}`, M, valueY);
  pdf.setFontSize(11);
  pdf.text(report.inspector || "Inspector", M + 50, valueY);
  pdf.setFontSize(14);
  setText(
    pdf,
    report.fails.length > 0 ? COLOR.red : [120, 120, 120]
  );
  pdf.text(`${report.fails.length}`, M + 100, valueY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  setText(pdf, [180, 175, 170]);
  pdf.text(`${dateStr} · ${timeStr}`, M + 130, valueY);

  y = 62;

  // ---- Cover-page brand stamp ----
  if (brandLogo?.dataUrl) {
    try {
      const aspect = brandLogo.w / brandLogo.h;
      const stampH = 18;
      const stampW = stampH * aspect;
      const stampX = PAGE_W - M - stampW;
      const stampY = y;
      pdf.addImage(
        brandLogo.dataUrl,
        "PNG",
        stampX,
        stampY,
        stampW,
        stampH,
        undefined,
        "FAST"
      );
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      setText(pdf, COLOR.muted);
      const caption = "Prepared by Seven Star Energy";
      pdf.text(caption, stampX + stampW - pdf.getTextWidth(caption), stampY + stampH + 3.2);
      y += stampH + 8;
    } catch {
      // ignore logo embed failures
    }
  }

  // ---- ZT violation banner ----
  const ztFails = report.fails.filter((f) => {
    const sec = SCHEMA.find((s) => s.items.some((i) => i.id === f.id));
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

  for (const sec of SCHEMA) {
    const items = sec.items;
    const earned = items.reduce((a, it) => a + (report.answers[it.id] === "pass" ? it.pts : 0), 0);
    const total = items.reduce((a, it) => a + it.pts, 0);
    const fails = items.filter((it) => report.answers[it.id] === "fail").length;
    if (total === 0 && fails === 0) continue;

    ensureSpace(11);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setText(pdf, COLOR.ink);
    const labelText = sec.zeroTolerance ? `! ${sec.label}` : sec.label;
    pdf.text(labelText, M, y + 3);

    pdf.setFont("helvetica", "normal");
    setText(pdf, COLOR.muted);
    if (total > 0) {
      const scoreText = `${earned}/${total}`;
      const w = pdf.getTextWidth(scoreText);
      pdf.text(scoreText, PAGE_W - M - w, y + 3);
    }
    if (fails > 0) {
      const failText = `${fails} flag${fails > 1 ? "s" : ""}`;
      const w = pdf.getTextWidth(failText);
      const x = total > 0
        ? PAGE_W - M - pdf.getTextWidth(`${earned}/${total}`) - w - 4
        : PAGE_W - M - w;
      setText(pdf, COLOR.red);
      pdf.text(failText, x, y + 3);
    }

    if (total > 0) {
      const barY = y + 5;
      setFill(pdf, COLOR.faint);
      pdf.rect(M, barY, CONTENT_W, 1.4, "F");
      const filledColor = sec.zeroTolerance && fails > 0 ? COLOR.red : COLOR.stone700;
      setFill(pdf, filledColor);
      pdf.rect(M, barY, CONTENT_W * (earned / total), 1.4, "F");
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

  for (const sec of SCHEMA) {
    const items = sec.items;
    if (!items || items.length === 0) continue;
    const earned = items.reduce((a, it) => a + (report.answers[it.id] === "pass" ? it.pts : 0), 0);
    const total = items.reduce((a, it) => a + it.pts, 0);
    const fails = items.filter((it) => report.answers[it.id] === "fail").length;

    // Section header band
    ensureSpace(11);
    setFill(pdf, sec.zeroTolerance ? COLOR.redSoft : COLOR.surface);
    pdf.rect(M, y, CONTENT_W, 7.6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, sec.zeroTolerance ? COLOR.redInk : COLOR.ink);
    const header = sec.zeroTolerance ? `! ${sec.label}` : sec.label;
    pdf.text(header, M + 2, y + 5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, COLOR.muted);
    let metaRight = "";
    if (total > 0) metaRight = `${earned}/${total}`;
    if (fails > 0) metaRight = metaRight ? `${fails} flag${fails > 1 ? "s" : ""}  ·  ${metaRight}` : `${fails} flag${fails > 1 ? "s" : ""}`;
    if (metaRight) {
      const w = pdf.getTextWidth(metaRight);
      pdf.text(metaRight, PAGE_W - M - 2 - w, y + 5);
    }
    y += 9;

    // Each item in section
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const ans = report.answers[it.id];
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

      // Status pill on the right
      const statusInfo = ans === "pass"
        ? { label: "PASS", fill: COLOR.emerald, color: [255, 255, 255] }
        : ans === "fail"
          ? { label: "FAIL", fill: COLOR.red, color: [255, 255, 255] }
          : { label: "—", fill: null, color: COLOR.muted };

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
          } catch (err) {
            console.warn("Skipping photo embed:", err);
          }
          cursorX += tw + 2;
        }
        cursorY += tileH + 2;
      }

      y = cursorY + ROW_PAD_Y;

      // Hairline divider between items
      if (idx < items.length - 1) {
        setDraw(pdf, COLOR.faint);
        pdf.setLineWidth(0.15);
        pdf.line(M + 1, y, PAGE_W - M - 1, y);
      }
    }

    y += 4;
  }

  // ---- Footer page numbers ----
  const pageCount = pdf.getNumberOfPages();
  const footerY = PAGE_H - 6;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, COLOR.muted);
    pdf.text(`Vanguard · by Seven Star Energy · ${site?.name || ""} · ${dateStr}`, M, footerY);
    const right = `Page ${i} of ${pageCount}`;
    pdf.text(right, PAGE_W - M - pdf.getTextWidth(right), footerY);
  }

  return pdf;
}

export function reportFilename(report, site) {
  const dt = new Date(report.completedAt);
  const ymd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const safe = (site?.name || "Report").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `Vanguard-${safe}-${ymd}.pdf`;
}
