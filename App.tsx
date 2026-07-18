import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Mic, Square, Upload, Eye, EyeOff } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const analyzeTranscript = async (finalTranscript: string) => {
    if (!finalTranscript.trim()) return;
    
    setIsAnalyzing(true);
    setFeedback('Analyzing call transcript...');
    
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_STUDIO;
      if (!apiKey) {
        setFeedback("Missing EXPO_PUBLIC_GOOGLE_AI_STUDIO API key in .env");
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
        setFeedback("Could not generate feedback.");
        console.error("Gemini API Error:", data);
      }
    } catch (error) {
      console.error("Failed to analyze transcript:", error);
      setFeedback("Error connecting to Gemini API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const transcribeAudioBase64 = async (base64Audio: string) => {
    setTranscript('Uploading and transcribing via Replicate...');
    setFeedback('');
    setShowTranscript(true);
    try {
      const replicateKey = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
      if (!replicateKey) {
        setTranscript('Missing EXPO_PUBLIC_REPLICATE_API_KEY in .env');
        return;
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
        setTranscript(`Error from Replicate: ${prediction.detail || JSON.stringify(prediction)}`);
        return;
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
        setTranscript(`Transcribing... Status: ${prediction.status}`);
      }

      if (prediction.status === 'succeeded') {
        const text = prediction.output.text;
        setShowTranscript(false);
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

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission to access microphone is required!');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY );
      setRecording(recording);
      setIsRecording(true);
      setTranscript('');
      setFeedback('');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        transcribeAudioBase64(base64);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudioFileName(asset.name);
        if (isRecording) {
          stopRecording();
        }
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        transcribeAudioBase64(base64);
      }
    } catch (err) {
      console.error('Error picking file', err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Notes</Text>
        <View style={[styles.statusBadge, isRecording && styles.statusBadgeRecording]}>
          <View style={[styles.pulseDot, isRecording && styles.pulseDotRecording]} />
          <Text style={[styles.statusText, isRecording && styles.statusTextRecording]}>
            {isRecording ? 'Listening...' : 'Ready'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.transcriptionArea}>
          {!transcript && !isRecording && (
            <Text style={styles.placeholderText}>Tap the mic to record or upload a file</Text>
          )}

          {!!transcript && (
            <View style={styles.transcriptContainer}>
              {!showTranscript ? (
                <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowTranscript(true)}>
                  <Eye size={18} color="#f8fafc" />
                  <Text style={styles.toggleBtnText}>See Transcription</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.transcriptBubble}>
                  <View style={styles.transcriptHeader}>
                    <Text style={styles.transcriptTitle}>Transcription</Text>
                    <TouchableOpacity onPress={() => setShowTranscript(false)}>
                      <EyeOff size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}
            </View>
          )}

          {!!feedback && (
            <View style={[styles.transcriptBubble, styles.feedbackBubble]}>
              <Text style={styles.feedbackTitle}>AI Feedback</Text>
              <Markdown style={markdownStyles}>
                {feedback}
              </Markdown>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleFileUpload}>
          <Upload size={24} color="#f8fafc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.recordBtn, isRecording && styles.recordBtnRecording]} 
          onPress={toggleRecording}
        >
          {isRecording ? <Square size={32} color="white" fill="white" /> : <Mic size={36} color="white" />}
        </TouchableOpacity>
        
        <View style={styles.secondaryBtnPlaceholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusBadgeRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
    marginRight: 6,
  },
  pulseDotRecording: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f8fafc',
  },
  statusTextRecording: {
    color: '#ef4444',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  transcriptionArea: {
    width: '100%',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 16,
    opacity: 0.5,
    marginVertical: 40,
  },
  transcriptContainer: {
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  transcriptBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    marginTop: 12,
    width: '100%',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  transcriptTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: '600',
  },
  transcriptText: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 22,
  },
  feedbackBubble: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  feedbackTitle: {
    fontSize: 14,
    color: '#60a5fa',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 10,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  recordBtnRecording: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  secondaryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnPlaceholder: {
    width: 50,
    height: 50,
  }
});

const markdownStyles = StyleSheet.create({
  body: { color: '#f8fafc', fontSize: 15, lineHeight: 22 },
  heading1: { color: '#93c5fd', fontSize: 20, marginTop: 10, marginBottom: 5 },
  heading2: { color: '#93c5fd', fontSize: 18, marginTop: 10, marginBottom: 5 },
  heading3: { color: '#93c5fd', fontSize: 16, marginTop: 10, marginBottom: 5 },
  strong: { fontWeight: 'bold', color: 'white' },
  bullet_list: { marginBottom: 10 },
  ordered_list: { marginBottom: 10 },
  paragraph: { marginBottom: 10 },
});
