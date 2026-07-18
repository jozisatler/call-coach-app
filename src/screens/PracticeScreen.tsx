import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mic, Square } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { sharedStyles } from '../styles/shared';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { evaluateObjectionResponse } from '../services/api';

const { width } = Dimensions.get('window');

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
    <View style={styles.cardWrapper}>
      <BlurView intensity={40} tint="dark" style={styles.card}>
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
            <Pressable style={styles.actionButtonWrapper} onPress={startRecording}>
              <BlurView intensity={40} tint="dark" style={styles.actionButton}>
                <Mic color="#fff" size={20} />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Respond</Text>
              </BlurView>
            </Pressable>
          )}
          
          {practiceState === 'recording' && (
            <View>
              <Pressable style={[styles.actionButtonWrapper, styles.recordingButtonWrapper]} onPress={stopRecording}>
                <BlurView intensity={40} tint="dark" style={styles.actionButton}>
                  <Square color="#fff" fill="#fff" size={20} />
                  <Text style={[styles.actionButtonText, { color: '#fff' }]}>Stop & Grade</Text>
                </BlurView>
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
            <View style={[styles.resultBoxWrapper, practiceState === 'pass' ? styles.passBoxWrapper : styles.failBoxWrapper]}>
              <BlurView intensity={30} tint="dark" style={styles.resultBox}>
                <Text style={[styles.resultTitle, practiceState === 'pass' ? styles.passText : styles.failText]}>
                  {practiceState === 'pass' ? 'PASS ✅' : 'FAIL ❌'}
                </Text>
                <Text style={styles.resultFeedback}>{feedback}</Text>
                <Pressable onPress={() => setPracticeState('idle')}>
                  <View style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </View>
                </Pressable>
              </BlurView>
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );
};

export default function PracticeScreen({ onGoBack }: PracticeScreenProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 4000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const blob1Scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const blob1Opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.5] });
  const blob2Scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const blob2Opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] });

  return (
    <View style={styles.container}>
      {/* Ambient Background */}
      <Animated.View style={[styles.glowBlob, styles.blob1, { transform: [{ scale: blob1Scale }], opacity: blob1Opacity }]} />
      <Animated.View style={[styles.glowBlob, styles.blob2, { transform: [{ scale: blob2Scale }], opacity: blob2Opacity }]} />
      <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={sharedStyles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={onGoBack} style={styles.backButtonWrapper}>
            <BlurView intensity={30} tint="light" style={styles.backButton}>
              <ArrowLeft color="#fff" size={24} />
            </BlurView>
          </Pressable>
          <Text style={styles.headerTitle}>Practice Objections</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
          {OBJECTIONS.map((obj, i) => (
            <Flashcard key={i} objection={obj.objection} response={obj.response} />
          ))}
          
          <Pressable onPress={onGoBack} style={styles.footerButtonWrapper}>
            <BlurView intensity={30} tint="dark" style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Back to Home</Text>
            </BlurView>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#050505',
  },
  glowBlob: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    filter: 'blur(40px)',
  },
  blob1: {
    top: '10%',
    left: '-20%',
    backgroundColor: '#3b82f6', // blue
  },
  blob2: {
    top: '60%',
    right: '-25%',
    backgroundColor: '#8b5cf6', // violet
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButtonWrapper: {
    width: 44, height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  backButton: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  scrollContainer: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 24, lineHeight: 24 },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  card: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  objectionText: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 16, lineHeight: 28 },
  responseContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  responseText: { color: '#a78bfa', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  tapPrompt: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  
  practiceSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingButtonWrapper: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
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
  
  resultBoxWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  passBoxWrapper: { borderColor: 'rgba(16, 185, 129, 0.5)' },
  failBoxWrapper: { borderColor: 'rgba(239, 68, 68, 0.5)' },
  resultBox: {
    padding: 20,
  },
  resultTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  passText: { color: '#34d399' },
  failText: { color: '#f87171' },
  resultFeedback: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retryButtonText: { color: '#fff', fontWeight: '700' },
  
  footerButtonWrapper: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footerButton: {
    paddingVertical: 16,
    alignItems: 'center',
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
