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

    console.log('Sending text to Gemini for analysis... prompt length:', prompt.length);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Gemini Analysis response status:', response.status);

    const data = await response.json();
    console.log('Gemini Analysis data received. Success?', !!data.candidates);

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanText = rawText.replace(/```(?:json)?/g, "").trim();
      return JSON.parse(cleanText);
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

export const evaluateObjectionResponse = async (
  base64Audio: string,
  objection: string,
  hint: string
): Promise<{ pass: boolean; feedback: string }> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
    if (!apiKey) {
      throw new Error('Missing EXPO_PUBLIC_GOOGLE_AI_STUDIO API key in .env');
    }
    
    const prompt = `You are a sales coach grading an objection-handling rep. The user sells
high-ticket B2B services to small-business owners and is training to respond
to resistance with calm, curious QUESTIONS — never pressure or justification.

The customer's objection was: "${objection}"
The recommended strategy was: "${hint}"

Listen to the user's recorded audio response and grade it against these rules.

PASS requires BOTH:
1. Substance — the response leads with a genuine question about the
   customer's evidence, math, criteria, or decision process (e.g. "when you
   compared, what did you measure it against?"), OR cleanly isolates the
   objection ("setting price aside — does this solve the problem?"). Calm
   agreement followed by a redirect question also passes ("Fair. Quick
   question though—").
2. Delivery — tone is calm, curious, unhurried. Like a doctor discussing a
   diagnosis, not a vendor chasing a deal.

INSTANT FAIL if the response contains ANY of:
- Justifying or defending the price/product instead of asking a question
- A verdict about the customer ("you don't understand", "you're wrong",
  "trust me") or any pressure/ultimatum
- Offering a discount or cheaper option unprompted
- Apologizing for the ask, or offering the exit ("no worries if not")
- Feature-dumping or a monologue with no question in it
- Needy delivery: rushed, over-explaining, trailing off

FEEDBACK rules: max 2 sentences. Quote or paraphrase the user's exact words
at the moment that decided the grade. On fail, give the one line they should
have said instead. On pass, name the specific move that earned it so they
can repeat it. Judge delivery (pace, filler, tone) as well as wording.

Return a JSON object with exactly two keys:
1. "pass": a boolean indicating if the user successfully handled the objection.
2. "feedback": a short string of constructive feedback on their specific
   delivery and wording.
Do not include json backticks.`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanText = rawText.replace(/```(?:json)?/g, "").trim();
      return JSON.parse(cleanText);
    } else {
      console.error("Gemini Evaluation Error:", data);
      throw new Error("Could not evaluate response.");
    }
  } catch (e: any) {
    console.error(e);
    throw new Error(`Error calling Gemini evaluation: ${e.message}`);
  }
};
