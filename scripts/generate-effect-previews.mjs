#!/usr/bin/env node
/**
 * Generate before/after JPG previews for seeded effects via Gemini.
 *
 * Usage:
 *   npm run generate:previews
 *   npm run generate:previews -- --only=voxel-subject
 *   npm run generate:previews -- --skip-existing
 *
 * Reads EXPO_PUBLIC_GOOGLE_AI_STUDIO from .env
 * Writes assets/effects/{id}-before.jpg and {id}-after.jpg
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'effects');
const MODEL = 'gemini-3.1-flash-image';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** @type {{ id: string, name: string, beforePrompt: string, afterPrompt: string }[]} */
const PREVIEWS = [
  {
    id: 'aura-glow',
    name: 'Glow',
    beforePrompt: `Photorealistic vertical 3:4 night portrait selfie of a young adult outdoors under streetlights, city bokeh behind them, casual jacket, natural phone-camera look, slightly dim ambient light. Real photo, no glow, no filters, no text, no watermark.`,
    afterPrompt: `Identify the main subject of this photo (it may be a person, pet, object, food, vehicle, or any focal item). Add a soft ethereal neon aura around that main subject only: warm-to-cool rim light, gentle bloom, faint light particles near its edges. Keep the subject photorealistic and fully recognizable. Do not restyle or redraw the background or secondary elements — leave the rest of the image exactly the same. No text, no watermark.`,
  },
  {
    id: 'plush-subject',
    name: 'Plushify',
    beforePrompt: `Photorealistic vertical 3:4 photo of a fluffy dog sitting and looking at the camera, indoor home background slightly blurred, soft daylight, clear fur detail, phone snapshot. Real pet photo, not a toy, no text, no watermark.`,
    afterPrompt: `Identify the main subject of this photo (person, pet, object, or item). Convert ONLY that main subject into a cute plush toy version of itself, kept in the exact same place, pose, and scale in the frame. Soft fuzzy fabric, gentle stitch seams, slightly rounder cuddly proportions, embroidered cute eyes if the subject has a face, still clearly the same subject and colors. CRITICAL: Do NOT change, remove, replace, blur, or restyle the background or any secondary objects — leave the rest of the image exactly as it is. Do NOT move the subject onto a studio/neutral backdrop. No text, no watermark.`,
  },
  {
    id: 'polaroid-flash',
    name: 'Polaroid Flash',
    beforePrompt: `Photorealistic vertical 3:4 casual indoor photo of friends hanging out in a living room at night, one person clearly in the foreground facing camera, warm lamp light, everyday clothes, real phone snapshot. Natural photo, NO Polaroid frame, NO flash blowout, no text, no watermark.`,
    afterPrompt: `Transform this photo into an OBVIOUS vintage Polaroid instant print. Must include ALL of these strongly: (1) a thick classic white Polaroid border with a deeper white bottom strip, (2) harsh direct on-camera flash that blows out highlights and flattens midtones, (3) heavy visible film grain and slight softness, (4) faded warm yellow-magenta cast like an old drugstore print, (5) mild light leak or vignette at the edges. Make the Polaroid look unmistakable — not a subtle filter. Keep the main subject recognizable. Do not invent new people. No brand logos, no watermark.`,
  },
  {
    id: 'double-exposure',
    name: 'Double Exposure',
    beforePrompt: `Photorealistic vertical 3:4 portrait of a person in profile or three-quarter view against a plain soft background, clean silhouette, natural daylight, sharp subject detail, phone/camera photo. No double exposure yet, no overlays, no text, no watermark.`,
    afterPrompt: `Create a dramatic double-exposure edit of the MAIN SUBJECT only. Blend the subject silhouette with a second photographic layer — choose a fitting cinematic texture such as clouds, forest canopy, city skyline at dusk, or ocean waves — so the secondary image appears inside / through the subject. Keep facial or subject features readable. Soft filmic contrast, artistic photography look. Do not add extra people. Keep composition elegant and intentional. No text, no watermark, no UI elements.`,
  },
  {
    id: 'voxel-subject',
    name: 'Blocky',
    beforePrompt: `Photorealistic vertical 3:4 photo of a bright yellow rubber duck sitting alone on a clean bathroom sink edge, tiled wall behind it, soft daylight from a window, phone snapshot. The rubber duck is clearly the only main subject. No people, no hands, no faces. Real photo, no 3D style, no text, no watermark.`,
    afterPrompt: `Find the single MAIN SUBJECT already visible in this photo (object, food, vehicle, pet, furniture, or person — whatever is clearly the focal item). Convert ONLY that existing subject into a blocky voxel / low-poly 3D version of itself: cubic forms, soft toy-like lighting, same placement and approximate scale, same recognizable shape and colors. CRITICAL: Do NOT add any humans, people, faces, hands, characters, or figures that are not already in the original photo. Do NOT replace an object with a person. Do NOT put a voxel character holding or standing with the subject. If there is no person in the original, the result must also contain no person. Do not voxelize or restyle the background — leave everything else exactly the same. No text, no watermark.`,
  },
  {
    id: 'film-noir',
    name: 'Film Noir',
    beforePrompt: `Photorealistic vertical 3:4 moody indoor portrait of a person in a dark coat near a window at dusk, city lights faintly outside, natural color photo, soft ambient light, cinematic framing. Real modern photo, still in color, no black and white yet, no text, no watermark.`,
    afterPrompt: `Transform this entire photo into a cinematic 1940s film noir still: pure high-contrast black and white, deep crushed shadows, bright rim light or venetian-blind style light falloff when it fits, subtle film grain, moody dramatic atmosphere. Keep the main subject fully recognizable and the composition intact. Do not invent new people or objects. No color, no text, no watermark.`,
  },
];

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env — add EXPO_PUBLIC_GOOGLE_AI_STUDIO=...');
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const only = argv.find((a) => a.startsWith('--only='))?.split('=')[1];
  const skipExisting = argv.includes('--skip-existing');
  return { only, skipExisting };
}

async function generateContent(apiKey, parts) {
  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
  }

  const outParts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(outParts)) {
    throw new Error('No candidates returned from Gemini');
  }

  const imagePart = outParts.find((p) => p?.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    const text = outParts.map((p) => p.text).filter(Boolean).join(' ');
    throw new Error(`No image in response${text ? `: ${text.slice(0, 200)}` : ''}`);
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  };
}

async function saveAsJpg(base64, outPath) {
  const input = Buffer.from(base64, 'base64');
  await sharp(input)
    .rotate()
    .resize(600, 750, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outPath);
}

async function generateBefore(apiKey, beforePrompt) {
  console.log('  → generating BEFORE (text → image)');
  return generateContent(apiKey, [
    {
      text: `${beforePrompt}\n\nReturn only the image. Vertical 3:4 composition.`,
    },
  ]);
}

async function generateAfter(apiKey, afterPrompt, before) {
  console.log('  → generating AFTER (image edit)');
  return generateContent(apiKey, [
    {
      text: `${afterPrompt}

Rules:
- Apply to the MAIN SUBJECT only.
- Do NOT invent people that are not in the original photo.
- Preserve recognizability.
- No text overlays or watermarks.
- Return only the edited image.`,
    },
    {
      inlineData: {
        mimeType: before.mimeType,
        data: before.base64,
      },
    },
  ]);
}

async function main() {
  loadEnv();
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
  if (!apiKey || apiKey.includes('your_google')) {
    throw new Error('Set a real EXPO_PUBLIC_GOOGLE_AI_STUDIO in .env');
  }

  const { only, skipExisting } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jobs = PREVIEWS.filter((p) => !only || p.id === only);
  if (only && jobs.length === 0) {
    throw new Error(`Unknown effect id "${only}". Valid: ${PREVIEWS.map((p) => p.id).join(', ')}`);
  }

  console.log(`Output: ${OUT_DIR}`);
  console.log(`Effects: ${jobs.map((j) => j.id).join(', ')}\n`);

  for (const job of jobs) {
    const beforePath = path.join(OUT_DIR, `${job.id}-before.jpg`);
    const afterPath = path.join(OUT_DIR, `${job.id}-after.jpg`);

    if (skipExisting && fs.existsSync(beforePath) && fs.existsSync(afterPath)) {
      console.log(`• ${job.name} (${job.id}) — skip (exists)`);
      continue;
    }

    console.log(`• ${job.name} (${job.id})`);
    console.log('  BEFORE prompt:', job.beforePrompt.slice(0, 100) + '…');
    console.log('  AFTER prompt:', job.afterPrompt.slice(0, 100) + '…');

    const before = await generateBefore(apiKey, job.beforePrompt);
    await saveAsJpg(before.base64, beforePath);
    console.log(`  ✓ wrote ${path.relative(ROOT, beforePath)}`);

    const after = await generateAfter(apiKey, job.afterPrompt, before);
    await saveAsJpg(after.base64, afterPath);
    console.log(`  ✓ wrote ${path.relative(ROOT, afterPath)}\n`);
  }

  console.log('Done. Point effects.ts beforeImage/afterImage at these JPGs with require().');
}

main().catch((err) => {
  console.error('\nFailed:', err.message || err);
  process.exit(1);
});
