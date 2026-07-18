export const analyzeTranscript = async (
  finalTranscript: string,
  onProgress: (status: string) => void
): Promise<{ title: string, content: string }[]> => {
  if (!finalTranscript.trim()) return [];
  
  onProgress('Analyzing call transcript...');
  
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
    if (!apiKey) {
      throw new Error("Missing EXPO_PUBLIC_GOOGLE_AI_STUDIO API key in .env");
    }

    const prompt = `Please provide constructive feedback on how this call went based on the following transcript:\n\n"${finalTranscript}"\n\nReturn the response as a valid JSON array of objects, where each object has a "title" field (e.g., "Strengths", "Areas for Improvement") and a "content" field containing the detailed feedback. Do not include markdown formatting or json backticks.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const rawText = data.candidates[0].content.parts[0].text;
      return JSON.parse(rawText);
    } else {
      console.error("Gemini API Error:", data);
      throw new Error("Could not generate feedback.");
    }
  } catch (error: any) {
    console.error("Failed to analyze transcript:", error);
    throw new Error(error.message || "Error connecting to Gemini API.");
  }
};

export const transcribeAudioBase64 = async (
  base64Audio: string,
  onProgress: (status: string) => void
): Promise<string> => {
  onProgress('Extracting voice data...');
  
  try {
    const replicateKey = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
    if (!replicateKey) {
      throw new Error('Missing EXPO_PUBLIC_REPLICATE_API_KEY in .env');
    }
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
        input: {
          audio: `data:audio/m4a;base64,${base64Audio}`,
          task: "transcribe",
          language: "None"
        }
      })
    });
    
    let prediction = await response.json();
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Error during transcription: ${prediction.detail || JSON.stringify(prediction)}`);
    }

    let pollUrl = prediction.urls.get;

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(pollUrl, {
        headers: {
          'Authorization': `Bearer ${replicateKey}`
        }
      });
      prediction = await pollResponse.json();
      onProgress(`Processing audio...`);
    }

    if (prediction.status === 'succeeded') {
      return prediction.output.text;
    } else {
      throw new Error(`Transcription failed: ${prediction.error}`);
    }
  } catch (e: any) {
    console.error(e);
    throw new Error(`Error calling transcription service: ${e.message}`);
  }
};
