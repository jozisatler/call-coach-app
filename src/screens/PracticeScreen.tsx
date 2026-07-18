import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mic, Square } from 'lucide-react-native';
import { sharedStyles } from '../styles/shared';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { evaluateObjectionResponse } from '../services/api';

interface PracticeScreenProps {
  onGoBack: () => void;
}

const OBJECTIONS = [
  {
    objection: "It's too expensive.",
    response: "Acknowledge and pivot to value: 'I completely understand that price is a major factor. If we set price aside for a moment, does our solution actually solve the core problem you are facing?'"
  },
  {
    objection: "We already use a competitor.",
    response: "Validate and explore gaps: 'That's great that you're already investing in this area. Just out of curiosity, what is the one thing you wish your current provider did better?'"
  },
  {
    objection: "Send me an email with more info.",
    response: "Prevent the brush-off: 'I'd be happy to send you some materials. To make sure I only send what's actually relevant to you, what specific challenges are you hoping the info will address?'"
  },
  {
    objection: "We don't have the budget right now.",
    response: "Find the timeline or priority: 'I hear you. If budget wasn't an issue, is this a priority for your team right now? When does your new budget cycle begin?'"
  }
];

type PracticeState = 'idle' | 'recording' | 'analyzing' | 'pass' | 'fail';

const MAX_SAMPLES = 40;

const Flashcard = ({ objection, response }: { objection: string, response: string }) => {
  const [revealed, setRevealed] = useState(false);
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [feedback, setFeedback] = useState('');
  const [samples, setSamples] = useState<number[]>(Array(MAX_SAMPLES).fill(0.05));

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });
      
      newRecording.setProgressUpdateInterval(50);
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          const val = Math.max(0.05, Math.min(1, (status.metering + 60) / 60));
          setSamples(prev => [...prev.slice(1), val]);
        }
      });
      
      setRecording(newRecording);
      setPracticeState('recording');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setPracticeState('analyzing');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No URI');
      
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      
      const result = await evaluateObjectionResponse(base64Audio, objection, response);
      setFeedback(result.feedback);
      setPracticeState(result.pass ? 'pass' : 'fail');
      
    } catch (err) {
      console.error('Failed to evaluate', err);
      setPracticeState('idle');
    }
    setRecording(null);
    setSamples(Array(MAX_SAMPLES).fill(0.05));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>OBJECTION</Text>
      <Text style={styles.objectionText}>"{objection}"</Text>
      
      {revealed ? (
        <View style={styles.responseContainer}>
          <Text style={styles.cardLabel}>RECOMMENDED RESPONSE</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ) : (
        <Pressable onPress={() => setRevealed(true)}>
          <Text style={styles.tapPrompt}>Tap for hint</Text>
        </Pressable>
      )}

      <View style={styles.practiceSection}>
        {practiceState === 'idle' && (
          <Pressable style={styles.actionButton} onPress={startRecording}>
            <Mic color="#000" size={20} />
            <Text style={styles.actionButtonText}>Respond</Text>
          </Pressable>
        )}
        
        {practiceState === 'recording' && (
          <View>
            <Pressable style={[styles.actionButton, styles.recordingButton]} onPress={stopRecording}>
              <Square color="#fff" size={20} />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Stop & Grade</Text>
            </Pressable>
            <View style={styles.waveformContainer}>
              {samples.map((val, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.waveformBar, 
                    { 
                      height: Math.max(4, val * 40),
                      opacity: 0.4 + (val * 0.6)
                    }
                  ]} 
                />
              ))}
            </View>
          </View>
        )}

        {practiceState === 'analyzing' && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.analyzingText}>Grading your response...</Text>
          </View>
        )}

        {(practiceState === 'pass' || practiceState === 'fail') && (
          <View style={[styles.resultBox, practiceState === 'pass' ? styles.passBox : styles.failBox]}>
            <Text style={[styles.resultTitle, practiceState === 'pass' ? styles.passText : styles.failText]}>
              {practiceState === 'pass' ? 'PASS ✅' : 'FAIL ❌'}
            </Text>
            <Text style={styles.resultFeedback}>{feedback}</Text>
            <Pressable style={styles.retryButton} onPress={() => setPracticeState('idle')}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

export default function PracticeScreen({ onGoBack }: PracticeScreenProps) {
  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={onGoBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Practice Objections</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Test your skills. Record your rebuttal to see if you pass.</Text>
        
        {OBJECTIONS.map((obj, i) => (
          <Flashcard key={i} objection={obj.objection} response={obj.response} />
        ))}
        
        <Pressable onPress={onGoBack} style={styles.footerButton}>
          <Text style={styles.footerButtonText}>Back to Results</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 24, lineHeight: 24 },
  card: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  objectionText: { color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  responseContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  responseText: { color: '#a78bfa', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  tapPrompt: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 12 },
  
  practiceSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12
  },
  analyzingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  resultBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  passBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  failBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  resultTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  passText: { color: '#34d399' },
  failText: { color: '#f87171' },
  resultFeedback: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  
  footerButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 16,
    gap: 3,
    width: '100%',
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
});
