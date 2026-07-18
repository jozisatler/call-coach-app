export const analyzeTranscript = async (
  finalTranscript: string,
  onProgress: (status: string) => void
): Promise<{ overallScore: number; feedback: { title: string, content: string }[] }> => {
  if (!finalTranscript.trim()) return { overallScore: 0, feedback: [] };
  
  onProgress('Analyzing call transcript...');
  
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
    if (!apiKey) {
      throw new Error("Missing EXPO_PUBLIC_GOOGLE_AI_STUDIO API key in .env");
    }

    const prompt = `Please provide constructive feedback on how this call went based on the following transcript:\n\n"${finalTranscript}"\n\nReturn the response as a valid JSON object with exactly two keys:\n1. "overallScore": a number between 0 and 100 rating the call's success.\n2. "feedback": a JSON array of exactly 4 objects with the following "title"s in this exact order: "Strengths", "Areas for Improvements", "Communication Style", "First Biggest Mistake". The "content" field of each object should contain detailed, constructive feedback for that category in markdown.\n\nDo not include json backticks.`;

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
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
    if (!apiKey) {
      throw new Error('Missing EXPO_PUBLIC_GOOGLE_AI_STUDIO API key in .env');
    }
    
    console.log('Sending audio to Gemini for transcription...');
    
    const prompt = "Please transcribe this audio exactly as it is. Do not add any extra commentary, just the pure raw transcript of what is spoken.";
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "audio/m4a",
                data: base64Audio
              }
            }
          ]
        }]
      })
    });
    
    console.log('Gemini Transcription response status:', response.status);
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Gemini Transcription Error:", data);
      throw new Error("Could not transcribe audio via Gemini.");
    }
  } catch (e: any) {
    console.error(e);
    throw new Error(`Error calling Gemini transcription: ${e.message}`);
  }
};
