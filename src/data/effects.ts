import { Effect, EffectCategory } from '../types';

export const FEED_TABS: { id: EffectCategory; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
];

export const STYLE_CHIPS: {
  id: string;
  label: string;
  color: string;
  soft: string;
  text: string;
  textActive: string;
  effectIds?: string[];
}[] = [
  {
    id: 'all',
    label: 'All',
    color: '#e8e4dc',
    soft: 'rgba(232,228,220,0.42)',
    text: '#e8e4dc',
    textActive: '#0c0c0c',
  },
  {
    id: 'glow',
    label: 'Glow',
    color: '#74c0fc',
    soft: 'rgba(116,192,252,0.42)',
    text: '#a5d8ff',
    textActive: '#062033',
    effectIds: ['aura-glow'],
  },
  {
    id: 'cute',
    label: 'Cute',
    color: '#ffa8cc',
    soft: 'rgba(255,168,204,0.42)',
    text: '#ffc9de',
    textActive: '#3b0a1f',
    effectIds: ['plush-subject'],
  },
  {
    id: 'retro',
    label: 'Retro',
    color: '#ffc078',
    soft: 'rgba(255,192,120,0.42)',
    text: '#ffd8a8',
    textActive: '#3b1f00',
    effectIds: ['polaroid-flash'],
  },
  {
    id: 'art',
    label: 'Art',
    color: '#b197fc',
    soft: 'rgba(177,151,252,0.42)',
    text: '#d0bfff',
    textActive: '#1e0b3d',
    effectIds: ['double-exposure'],
  },
  {
    id: 'blocky',
    label: '3D',
    color: '#8ce99a',
    soft: 'rgba(140,233,154,0.42)',
    text: '#b2f2bb',
    textActive: '#052410',
    effectIds: ['voxel-subject'],
  },
  {
    id: 'moody',
    label: 'Moody',
    color: '#ced4da',
    soft: 'rgba(206,212,218,0.42)',
    text: '#dee2e6',
    textActive: '#141618',
    effectIds: ['film-noir'],
  },
];

/** @deprecated use FEED_TABS + STYLE_CHIPS */
export const CATEGORIES: { id: EffectCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Popular' },
  { id: 'top', label: 'Top' },
  { id: 'new', label: 'New' },
];

/**
 * Seeded effects based on real viral Gemini / ChatGPT image trends.
 * All prompts target the MAIN SUBJECT (person, pet, object, or item) — not humans only.
 */
export const EFFECTS: Effect[] = [
  {
    id: 'aura-glow',
    name: 'Glow',
    description: 'Neon rim light and soft bloom around whatever is front and center.',
    prompt:
      'Identify the main subject of this photo (it may be a person, pet, object, food, vehicle, or any focal item). Add a soft ethereal neon aura around that main subject only: warm-to-cool rim light, gentle bloom, faint light particles near its edges. Keep the subject photorealistic and fully recognizable. Do not restyle or redraw the background or secondary elements — leave the rest of the image exactly the same. No text, no watermark.',
    beforeImage: require('../../assets/effects/aura-glow-before.jpg'),
    afterImage: require('../../assets/effects/aura-glow-after.jpg'),
    categories: ['trending', 'popular', 'top'],
    uses: 24100,
    creator: 'glowlab',
  },
  {
    id: 'plush-subject',
    name: 'Plushify',
    description: 'Cute plush main subject — scene stays the same.',
    prompt:
      'Identify the main subject of this photo (person, pet, object, or item). Convert ONLY that main subject into a cute plush toy version of itself, kept in the exact same place, pose, and scale in the frame. Soft fuzzy fabric, gentle stitch seams, slightly rounder cuddly proportions, embroidered cute eyes if the subject has a face, still clearly the same subject and colors. CRITICAL: Do NOT change, remove, replace, blur, or restyle the background or any secondary objects — leave the rest of the image exactly as it is. Do NOT move the subject onto a studio/neutral backdrop. No text, no watermark.',
    beforeImage: require('../../assets/effects/plush-subject-before.jpg'),
    afterImage: require('../../assets/effects/plush-subject-after.jpg'),
    categories: ['trending', 'new', 'popular'],
    uses: 18750,
    creator: 'softcraft',
  },
  {
    id: 'polaroid-flash',
    name: 'Polaroid Flash',
    description: 'Instant photo — thick frame, blown-out flash, heavy grain.',
    prompt:
      'Transform this photo into an OBVIOUS vintage Polaroid instant print. Must include ALL of these strongly: (1) a thick classic white Polaroid border with a deeper white bottom strip, (2) harsh direct on-camera flash that blows out highlights and flattens midtones, (3) heavy visible film grain and slight softness, (4) faded warm yellow-magenta cast like an old drugstore print, (5) mild light leak or vignette at the edges. Make the Polaroid look unmistakable — not a subtle filter. Keep the main subject recognizable. Do not invent new people. No brand logos, no watermark.',
    beforeImage: require('../../assets/effects/polaroid-flash-before.jpg'),
    afterImage: require('../../assets/effects/polaroid-flash-after.jpg'),
    categories: ['popular', 'top', 'trending'],
    uses: 16320,
    creator: 'snaplab',
  },
  {
    id: 'double-exposure',
    name: 'Double Exposure',
    description: 'Subject blended with a cinematic sky or city silhouette.',
    prompt:
      'Create a dramatic double-exposure edit of the MAIN SUBJECT only. Blend the subject silhouette with a second photographic layer — choose a fitting cinematic texture such as clouds, forest canopy, city skyline at dusk, or ocean waves — so the secondary image appears inside / through the subject. Keep facial or subject features readable. Soft filmic contrast, artistic photography look. Do not add extra people. Keep composition elegant and intentional. No text, no watermark, no UI elements.',
    beforeImage: require('../../assets/effects/double-exposure-before.jpg'),
    afterImage: require('../../assets/effects/double-exposure-after.jpg'),
    categories: ['new', 'trending', 'popular'],
    uses: 12890,
    creator: 'overlap',
  },
  {
    id: 'voxel-subject',
    name: 'Blocky',
    description: 'Blocky 3D main subject — scene stays real.',
    prompt:
      'Find the single MAIN SUBJECT already visible in this photo (object, food, vehicle, pet, furniture, or person — whatever is clearly the focal item). Convert ONLY that existing subject into a blocky voxel / low-poly 3D version of itself: cubic forms, soft toy-like lighting, same placement and approximate scale, same recognizable shape and colors. CRITICAL: Do NOT add any humans, people, faces, hands, characters, or figures that are not already in the original photo. Do NOT replace an object with a person. Do NOT put a voxel character holding or standing with the subject. If there is no person in the original, the result must also contain no person. Do not voxelize or restyle the background — leave everything else exactly the same. No text, no watermark.',
    beforeImage: require('../../assets/effects/voxel-subject-before.jpg'),
    afterImage: require('../../assets/effects/voxel-subject-after.jpg'),
    categories: ['new', 'trending'],
    uses: 11240,
    creator: 'blockform',
  },
  {
    id: 'film-noir',
    name: 'Film Noir',
    description: 'High-contrast black-and-white detective-movie still.',
    prompt:
      'Transform this entire photo into a cinematic 1940s film noir still: pure high-contrast black and white, deep crushed shadows, bright rim light or venetian-blind style light falloff when it fits, subtle film grain, moody dramatic atmosphere. Keep the main subject fully recognizable and the composition intact. Do not invent new people or objects. No color, no text, no watermark.',
    beforeImage: require('../../assets/effects/film-noir-before.jpg'),
    afterImage: require('../../assets/effects/film-noir-after.jpg'),
    categories: ['trending', 'top', 'popular'],
    uses: 9640,
    creator: 'studio.noir',
  },
];

export function getEffectsByCategory(category: EffectCategory | 'all'): Effect[] {
  if (category === 'all') return EFFECTS;
  return EFFECTS.filter((effect) => effect.categories.includes(category));
}

export function getEffectsByStyleChip(chipId: string): Effect[] {
  if (chipId === 'all') return EFFECTS;
  const chip = STYLE_CHIPS.find((item) => item.id === chipId);
  if (!chip?.effectIds?.length) return EFFECTS;
  return EFFECTS.filter((effect) => chip.effectIds!.includes(effect.id));
}

export function getEffectById(id: string): Effect | undefined {
  return EFFECTS.find((effect) => effect.id === id);
}

/** Demo hero effect — Surprise Me always lands here. */
export const SURPRISE_EFFECT_ID = 'voxel-subject';

export function formatUses(uses: number): string {
  if (uses >= 1000) return `${(uses / 1000).toFixed(uses >= 10000 ? 0 : 1)}k`;
  return String(uses);
}
