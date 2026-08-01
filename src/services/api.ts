const MODEL = 'gemini-3.1-flash-image';

export async function applyEffectToImage(
  imageBase64: string,
  mimeType: string,
  effectName: string,
  effectPrompt: string,
  onProgress?: (status: string) => void
): Promise<{ base64: string; mimeType: string }> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_AI_STUDIO API key in .env');
  }

  onProgress?.('Preparing your photo...');

  const prompt = `${effectPrompt}

Rules:
- Apply the effect to the MAIN SUBJECT of the photo only (person, pet, object, food, vehicle, or any focal item — not necessarily a human).
- Do NOT invent, add, or generate any people/humans/characters that are not already clearly present in the original photo.
- If the main subject is an object or animal, keep it as that — never replace it with a person or add a person next to it.
- Preserve recognizability of the original subject.
- Do not add text overlays or watermarks.
- Return only the edited image.`;

  console.log('[Story Snap] Applying effect:', effectName);
  console.log('[Story Snap] Effect prompt:\n', effectPrompt);
  console.log('[Story Snap] Full prompt sent to Gemini:\n', prompt);
  console.log('[Story Snap] Image mimeType:', mimeType, '| base64 length:', imageBase64.length);

  onProgress?.('Applying effect...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.log('[Story Snap] Gemini error response:', JSON.stringify(data, null, 2));
      const message = data?.error?.message || `Gemini request failed (${response.status})`;
      throw new Error(message);
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      console.log('[Story Snap] Unexpected Gemini payload:', JSON.stringify(data, null, 2));
      throw new Error('No image returned from Gemini.');
    }

    const imagePart = parts.find(
      (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data
    );

    if (!imagePart?.inlineData?.data) {
      console.log('[Story Snap] No inline image in parts:', JSON.stringify(parts.map((p: any) => ({ hasText: !!p.text, hasInline: !!p.inlineData })), null, 2));
      throw new Error('Gemini did not return an edited image. Try another photo.');
    }

    onProgress?.('Finishing up...');
    console.log('[Story Snap] Effect applied successfully:', effectName);

    return {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
    };
  } catch (error: any) {
    console.log('[Story Snap] applyEffectToImage failed:', error?.message || error);
    if (error?.name === 'AbortError') {
      throw new Error('Effect timed out. Please try again.');
    }
    throw new Error(error?.message || 'Failed to apply effect.');
  } finally {
    clearTimeout(timeoutId);
  }
}
