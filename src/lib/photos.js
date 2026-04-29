import { supabase } from "./supabase.js";

const BUCKET = "inspection-photos";
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = src;
  });
}

// Resizes/compresses to keep mobile uploads fast on cellular. Falls back to
// the original file if the browser can't decode it (e.g. some HEIC variants).
async function resizeImage(file) {
  if (!file.type.startsWith("image/") || file.size < 200_000) return file;
  try {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);
    let { width, height } = img;
    const longSide = Math.max(width, height);
    if (longSide > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / longSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

function uniqueName(originalName) {
  const ext = (originalName.match(/\.[^.]+$/)?.[0] || ".jpg").toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export async function uploadPhoto(userId, inspectionId, file) {
  const compressed = await resizeImage(file);
  const path = `${userId}/${inspectionId}/${uniqueName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: compressed.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, name: file.name };
}

export async function deletePhoto(path) {
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Best-effort cleanup; orphaned objects can be swept later.
  }
}
