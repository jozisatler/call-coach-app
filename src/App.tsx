import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Upload, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

// Define the SpeechRecognition types for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          currentTranscript += chunk;
          
          // If this chunk is final, log it as requested
          if (event.results[i].isFinal) {
            console.log('🗣️ Transcribed:', chunk);
          }
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        // Auto-restart if we are still supposed to be recording
        if (isRecording) {
          try {
             recognition.start();
          } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const analyzeTranscript = async (finalTranscript: string) => {
    if (!finalTranscript.trim()) return;
    
    setIsAnalyzing(true);
    setFeedback('Analyzing call transcript...');
    
    try {
      // User must add VITE_ prefix to their .env file for Vite to expose it
      const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO;
      if (!apiKey) {
        setFeedback("Missing VITE_GOOGLE_AI_STUDIO API key in .env");
        setIsAnalyzing(false);
        return;
      }

      const prompt = `Please provide constructive feedback on how this call went based on the following transcript:\n\n"${finalTranscript}"`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        setFeedback(data.candidates[0].content.parts[0].text);
      } else {
        setFeedback("Could not generate feedback. Please check console for details.");
        console.error("Gemini API Error:", data);
      }
    } catch (error) {
      console.error("Failed to analyze transcript:", error);
      setFeedback("Error connecting to Gemini API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setShowTranscript(false);
      
      // Log full transcript
      console.log('📝 Full Transcript:', transcript);
      
      // Request feedback from Gemini
      analyzeTranscript(transcript);
    } else {
      setTranscript('');
      setFeedback('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start recording", e);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const transcribeAudioFile = async (file: File) => {
    setTranscript('Uploading and transcribing via Replicate...');
    setFeedback('');
    try {
      const replicateKey = import.meta.env.VITE_REPLICATE_API_KEY;
      if (!replicateKey) {
        setTranscript('Missing VITE_REPLICATE_API_KEY in .env');
        return;
      }
      
      const base64Audio = await fileToBase64(file);
      
      const response = await fetch('/replicate-api/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
          input: {
            audio: base64Audio,
            task: "transcribe",
            language: "None"
          }
        })
      });
      
      let prediction = await response.json();
      
      if (response.status !== 201 && response.status !== 200) {
        setTranscript(`Error from Replicate: ${prediction.detail || JSON.stringify(prediction)}`);
        return;
      }

      let pollUrl = prediction.urls.get;
      // Rewrite the URL to use our proxy
      pollUrl = pollUrl.replace('https://api.replicate.com', '/replicate-api');

      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(pollUrl, {
          headers: {
            'Authorization': `Bearer ${replicateKey}`
          }
        });
        prediction = await pollResponse.json();
        setTranscript(`Transcribing... Status: ${prediction.status}`);
      }

      if (prediction.status === 'succeeded') {
        const text = prediction.output.text;
        setTranscript(text);
        console.log('📝 Full Transcript (Replicate):', text);
        analyzeTranscript(text);
      } else {
        setTranscript(`Transcription failed: ${prediction.error}`);
      }
    } catch (e: any) {
      console.error(e);
      setTranscript(`Error calling transcription service: ${e.message}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 File selected for upload:', file.name, file.type, file.size, 'bytes');
      
      const url = URL.createObjectURL(file);
      setAudioFileUrl(url);
      setAudioFileName(file.name);
      
      // If we were recording, stop it
      if (isRecording) {
        toggleRecording();
      }
      
      // Start processing the uploaded file
      transcribeAudioFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Voice Notes</h1>
        <div className={`status-badge ${isRecording ? 'recording' : ''}`}>
          <div className="pulse-dot"></div>
          {isRecording ? 'Listening...' : 'Ready'}
        </div>
      </header>

      <main className="main-content">
        <div className="transcription-area">
          {!transcript && !isRecording && !audioFileUrl && (
            <p className="placeholder-text">Tap the mic to start transcribing or upload a file</p>
          )}
          {audioFileUrl && (
            <div className="audio-player-container">
               <p className="audio-file-name">{audioFileName}</p>
               <audio controls src={audioFileUrl} className="audio-player" />
            </div>
          )}
          {transcript && (
            <div className="transcript-container">
              {!showTranscript ? (
                <button 
                  className="toggle-transcript-btn" 
                  onClick={() => setShowTranscript(true)}
                >
                  <Eye size={18} />
                  See Transcription
                </button>
              ) : (
                <div className="transcript-bubble">
                  <div className="transcript-header">
                    <span className="transcript-title">Transcription</span>
                    <button 
                      className="close-transcript-btn" 
                      onClick={() => setShowTranscript(false)}
                      title="Hide Transcription"
                    >
                      <EyeOff size={16} />
                    </button>
                  </div>
                  <div className="transcript-text">
                    {transcript}
                  </div>
                </div>
              )}
            </div>
          )}
          {feedback && (
            <div className="transcript-bubble feedback-bubble">
              <strong className="feedback-title">AI Feedback</strong>
              <div className="markdown-content">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="controls">
        <input 
          type="file" 
          accept="audio/*,video/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        <button 
          className="secondary-btn"
          onClick={triggerFileInput}
          aria-label="Upload audio file"
          title="Upload audio file"
        >
          <Upload size={24} />
        </button>
        <button 
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
        </button>
        {/* Empty div for flexbox spacing balance */}
        <div className="secondary-btn-placeholder"></div>
      </div>
    </div>
  );
}

export default App;
