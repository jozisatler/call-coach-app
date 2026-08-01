import { Effect, EffectCategory } from '../types';

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
    name: 'Aura Glow',
    description: 'Neon rim light and soft bloom around whatever is front and center.',
    prompt:
      'Identify the main subject of this photo (it may be a person, pet, object, food, vehicle, or any focal item). Add a soft ethereal neon aura around that main subject only: warm-to-cool rim light, gentle bloom, faint light particles near its edges. Keep the subject photorealistic and fully recognizable. Do not restyle or redraw the background or secondary elements — leave the rest of the image exactly the same. No text, no watermark.',
    beforeImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=750&fit=crop',
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
    beforeImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=750&fit=crop',
    categories: ['trending', 'new', 'popular'],
    uses: 18750,
    creator: 'softcraft',
  },
  {
    id: 'figure-box',
    name: 'Collector Figure',
    description: 'Main subject as a desk figurine with packaging.',
    prompt:
      'Identify the main subject of this photo (person, pet, object, or item). Create a 1/7 scale commercialized collectible figurine of that main subject only, in a realistic style, in a real environment. Place the figurine on a computer desk with a round transparent acrylic base (no text on the base). The computer screen shows a 3D modelling process of this figurine. Next to the screen is a toy packaging box in the style of high-quality collectible figures, with original flat artwork of the subject. No readable brand logos, no watermark.',
    beforeImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=750&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=750&fit=crop',
    categories: ['popular', 'top', 'trending'],
    uses: 16320,
    creator: 'shelf.life',
  },
  {
    id: 'voxel-subject',
    name: 'Voxel Pop',
    description: 'Blocky 3D main subject — scene stays real.',
    prompt:
      'Find the single MAIN SUBJECT already visible in this photo (object, food, vehicle, pet, furniture, or person — whatever is clearly the focal item). Convert ONLY that existing subject into a blocky voxel / low-poly 3D version of itself: cubic forms, soft toy-like lighting, same placement and approximate scale, same recognizable shape and colors. CRITICAL: Do NOT add any humans, people, faces, hands, characters, or figures that are not already in the original photo. Do NOT replace an object with a person. Do NOT put a voxel character holding or standing with the subject. If there is no person in the original, the result must also contain no person. Do not voxelize or restyle the background — leave everything else exactly the same. No text, no watermark.',
    beforeImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=750&fit=crop',
    categories: ['new', 'trending'],
    uses: 12890,
    creator: 'blockform',
  },
];

export function getEffectsByCategory(category: EffectCategory | 'all'): Effect[] {
  if (category === 'all') return EFFECTS;
  return EFFECTS.filter((effect) => effect.categories.includes(category));
}

export function formatUses(uses: number): string {
  if (uses >= 1000) return `${(uses / 1000).toFixed(uses >= 10000 ? 0 : 1)}k`;
  return String(uses);
}
