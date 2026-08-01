import { ImageSourcePropType } from 'react-native';

export type EffectCategory = 'trending' | 'popular' | 'new' | 'top';

export interface Effect {
  id: string;
  name: string;
  description: string;
  prompt: string;
  beforeImage: ImageSourcePropType;
  afterImage: ImageSourcePropType;
  categories: EffectCategory[];
  uses: number;
  creator: string;
}

export type Screen =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'capture'; effect: Effect }
  | { name: 'processing'; effect: Effect; imageUri: string; imageBase64: string; mimeType: string }
  | { name: 'result'; effect: Effect; originalUri: string; resultBase64: string; resultMimeType: string };
