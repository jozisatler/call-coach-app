import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { BlurView } from 'expo-blur';
import { colors, sharedStyles } from '../styles/shared';
import { analyzeTranscript, transcribeAudioBase64 } from '../services/api';

const { width } = Dimensions.get('window');
const blobSize = Math.min(width * 0.55, 420);

interface ProcessingScreenProps {
  base64Audio: string;
  onGoBack: () => void;
}

export default function ProcessingScreen({ base64Audio, onGoBack }: ProcessingScreenProps) {
  const [status, setStatus] = useState('Initializing...');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');

  const anims = useRef(Array(10).fill(0).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let mounted = true;
    
    const durations = [5500, 6000, 5200, 6500, 5400, 5800, 6200, 5100, 5600, 6800];
    
    anims.forEach((val, i) => {
      Animated.loop(
        Animated.timing(val, { toValue: 1, duration: durations[i], useNativeDriver: true })
      ).start();
    });
    
    const processAudio = async () => {
      try {
        const text = await transcribeAudioBase64(base64Audio, (s) => mounted && setStatus(s));
        if (mounted) setTranscript(text);
        
        const aiFeedback = await analyzeTranscript(text, (s) => mounted && setStatus(s));
        if (mounted) {
          setFeedback(aiFeedback);
          setStatus('Analysis complete');
          setIsProcessing(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setIsProcessing(false);
        }
      }
    };

    processAudio();
    return () => { mounted = false; };
  }, [base64Audio]);

  // Blob interpolations (same as before)
  const b1X = anims[0].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 40, 22, -22, 0] });
  const b1Y = anims[0].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -22, 38, 20, 0] });
  const b1S = anims[0].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.15, 0.92, 1.08, 1] });

  const b2X = anims[1].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -30, 30, 38, 0] });
  const b2Y = anims[1].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 30, -28, 0, 0] });
  const b2S = anims[1].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.08, 1.2, 0.9, 1] });

  const b3X = anims[2].interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, 48, -26, 0] });
  const b3Y = anims[2].interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, 24, -30, 0] });
  const b3S = anims[2].interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [1, 1.12, 1.18, 1] });

  const b4X = anims[3].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -38, 20, 28, 0] });
  const b4Y = anims[3].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -38, 28, -20, 0] });
  const b4S = anims[3].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.15, 0.92, 1.08, 1] });

  const b5X = anims[4].interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, 34, -30, 0] });
  const b5Y = anims[4].interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, 34, 16, 0] });
  const b5S = anims[4].interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [1, 1.2, 0.96, 1] });

  const b6X = anims[5].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -42, 24, 16, 0] });
  const b6Y = anims[5].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 28, -34, 24, 0] });
  const b6S = anims[5].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.08, 1.18, 0.92, 1] });

  const b7X = anims[6].interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, 30, -34, 0] });
  const b7Y = anims[6].interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, -30, 34, 0] });
  const b7S = anims[6].interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [1, 1.15, 1.06, 1] });

  const b8X = anims[7].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 30, -30, 34, 0] });
  const b8Y = anims[7].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 38, -24, -16, 0] });
  const b8S = anims[7].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.12, 1.2, 0.96, 1] });

  const b9X = anims[8].interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, -38, 30, 0] });
  const b9Y = anims[8].interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, 20, -34, 0] });
  const b9S = anims[8].interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [1, 1.18, 0.92, 1] });

  const b10X = anims[9].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 42, -22, 26, 0] });
  const b10Y = anims[9].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 18, 36, -28, 0] });
  const b10S = anims[9].interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.08, 1.15, 0.96, 1] });

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.ambientContainer}>
          <Animated.View style={[styles.blob, styles.b1, { transform: [{ translateX: b1X }, { translateY: b1Y }, { scale: b1S }] }]} />
          <Animated.View style={[styles.blob, styles.b2, { transform: [{ translateX: b2X }, { translateY: b2Y }, { scale: b2S }] }]} />
          <Animated.View style={[styles.blob, styles.b3, { transform: [{ translateX: b3X }, { translateY: b3Y }, { scale: b3S }] }]} />
          <Animated.View style={[styles.blob, styles.b4, { transform: [{ translateX: b4X }, { translateY: b4Y }, { scale: b4S }] }]} />
          <Animated.View style={[styles.blob, styles.b5, { transform: [{ translateX: b5X }, { translateY: b5Y }, { scale: b5S }] }]} />
          <Animated.View style={[styles.blob, styles.b6, { transform: [{ translateX: b6X }, { translateY: b6Y }, { scale: b6S }] }]} />
          <Animated.View style={[styles.blob, styles.b7, { transform: [{ translateX: b7X }, { translateY: b7Y }, { scale: b7S }] }]} />
          <Animated.View style={[styles.blob, styles.b8, { transform: [{ translateX: b8X }, { translateY: b8Y }, { scale: b8S }] }]} />
          <Animated.View style={[styles.blob, styles.b9, { transform: [{ translateX: b9X }, { translateY: b9Y }, { scale: b9S }] }]} />
          <Animated.View style={[styles.blob, styles.b10, { transform: [{ translateX: b10X }, { translateY: b10Y }, { scale: b10S }] }]} />
        </View>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      <SafeAreaView style={sharedStyles.safeArea}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isProcessing && !error && (
            <View style={styles.processingState}>
              <View style={styles.spinnerContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
              <Text style={styles.statusTitle}>Analyzing Context</Text>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}

          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {feedback !== '' && !isProcessing && !error && (
            <View style={[styles.glassCard, styles.feedbackCard]}>
              <View style={styles.cardHeader}>
                <Sparkles size={16} color="#ffffff" />
                <Text style={styles.cardTitlePremium}>AI Coach Feedback</Text>
              </View>
              <Markdown style={markdownStyles}>{feedback}</Markdown>
            </View>
          )}

          {transcript !== '' && !isProcessing && !error && (
            <View style={[styles.glassCard, { marginTop: 24 }]}>
              <Text style={styles.cardTitle}>Raw Transcript</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          )}

          {(!isProcessing || error !== '') && (
            <Pressable onPress={onGoBack} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Back to Home</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.25 }],
  },
  blob: {
    position: 'absolute',
    width: blobSize,
    height: blobSize,
    borderRadius: blobSize / 2,
    opacity: 0.8,
  },
  b1: { backgroundColor: '#ec4899', top: '-10%', left: '-5%' },
  b2: { backgroundColor: '#06b6d4', top: '-5%', right: '-10%' },
  b3: { backgroundColor: '#7c3aed', bottom: '-10%', left: '-8%' },
  b4: { backgroundColor: '#10b981', top: '30%', right: '-15%' },
  b5: { backgroundColor: '#f97316', bottom: '-5%', right: '-5%' },
  b6: { backgroundColor: '#3b82f6', top: '35%', left: '25%' },
  b7: { backgroundColor: '#fbbf24', top: '55%', left: '-12%' },
  b8: { backgroundColor: '#c026d3', top: '-8%', left: '40%' },
  b9: { backgroundColor: '#14b8a6', bottom: '20%', right: '30%' },
  b10: { backgroundColor: '#f43f5e', top: '45%', left: '10%' },
  
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 80, paddingTop: 40 },
  
  processingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  spinnerContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusTitle: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
  statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24, padding: 24,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitlePremium: { color: '#ffffff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 8 },
  cardTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  transcriptText: { color: '#ffffff', fontSize: 15, lineHeight: 24 },
  feedbackCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', borderWidth: 1, borderRadius: 16, padding: 20 },
  errorTitle: { color: '#f87171', fontWeight: '700', marginBottom: 8 },
  errorText: { color: '#ffffff', lineHeight: 22 },
  
  footerButton: {
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});

const markdownStyles = StyleSheet.create({
  body: { color: '#ffffff', fontSize: 16, lineHeight: 26 },
  heading1: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  heading2: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  heading3: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  strong: { fontWeight: 'bold', color: '#fff' },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  paragraph: { marginBottom: 12 },
});
