import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, SafeAreaView, StyleSheet, Animated } from 'react-native';
import { Mic, Upload, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, sharedStyles } from '../styles/shared';

interface HomeScreenProps {
  onAudioReady: (base64Audio: string) => void;
  showToast: (msg: string) => void;
}

const MAX_SAMPLES = 40;

export default function HomeScreen({ onAudioReady, showToast }: HomeScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [samples, setSamples] = useState<number[]>(Array(MAX_SAMPLES).fill(0.05)); // baseline

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();
    } else {
      setSeconds(0);
      pulseAnim.setValue(0);
      pulseAnim.stopAnimation();
      setSamples(Array(MAX_SAMPLES).fill(0.05));
    }
    return () => clearInterval(interval);
  }, [isRecording, pulseAnim]);

  const formatTime = (totalSeconds: number) => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      showToast('Recording saved — analyzing...');
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          onAudioReady(base64);
        }
      }
    } else {
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          showToast('Microphone permission required');
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        
        const options = {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        };
        
        const { recording: newRecording } = await Audio.Recording.createAsync(options);
        
        newRecording.setOnRecordingStatusUpdate((status) => {
          if (status.metering !== undefined) {
            // Map metering approx -60 to 0 -> 0.05 to 1.0
            const val = Math.max(0.05, Math.min(1, (status.metering + 60) / 60));
            setSamples(prev => [...prev.slice(1), val]);
          }
        });
        
        setRecording(newRecording);
        setIsRecording(true);
      } catch (err) {
        console.error(err);
        showToast('Failed to start recording');
      }
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        showToast(`Uploaded: ${result.assets[0].name}`);
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
        onAudioReady(base64);
      }
    } catch (err) {
      showToast('Upload canceled');
    }
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1.18] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] });

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <View style={[sharedStyles.content, { justifyContent: 'space-between' }]}>
        <View>
          <View style={sharedStyles.brandRow}>
            <View style={sharedStyles.logoMark}>
              <View style={sharedStyles.logoMarkInner} />
            </View>
            <Text style={sharedStyles.brandText}>CloseCoach</Text>
          </View>
          <Text style={styles.headline}>
            Train the call.{'\n'}Win the next one.
          </Text>
        </View>

        <View style={styles.stage}>
          <View style={styles.orbit} />
          
          <Pressable 
            onPress={toggleRecording}
            style={({ pressed }) => [styles.recordButtonWrapper, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            {isRecording && (
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            )}
            
            <View style={[styles.coreButton, isRecording ? styles.coreButtonRecording : styles.coreButtonReady]}>
              <View style={styles.coreButtonContent}>
                
                {/* Visualizer / Icon */}
                <View style={styles.iconContainer}>
                  {isRecording ? (
                    <Square size={28} color={colors.text} fill={colors.text} />
                  ) : (
                    <Mic size={28} color={colors.text} />
                  )}
                </View>
                
                {isRecording ? (
                  <>
                    <Text style={styles.recordingLabel}>Recording</Text>
                    <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                  </>
                ) : (
                  <Text style={styles.readyText}>
                    Record a{'\n'}conversation
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
          
          {/* Scrolling Waveform Below Button */}
          <View style={styles.waveformContainer}>
            {isRecording && samples.map((val, i) => (
              <View 
                key={i} 
                style={[
                  styles.waveformBar, 
                  { 
                    height: Math.max(4, val * 40),
                    opacity: 0.4 + (val * 0.6) // louder means brighter
                  }
                ]} 
              />
            ))}
          </View>

        </View>

        <View style={styles.actions}>
          <Pressable 
            onPress={handleUpload}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          >
            <View style={styles.cardIcon}>
              <Upload size={20} color="#e5e5e5" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Upload a call</Text>
              <Text style={styles.cardSubtitle}>Audio or video file</Text>
            </View>
            <Text style={styles.cardChevron}>›</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headline: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 34,
    width: 300,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  orbit: {
    position: 'absolute',
    width: 258,
    height: 258,
    borderWidth: 1,
    borderColor: 'rgba(115, 115, 115, 0.2)',
    borderRadius: 129,
  },
  recordButtonWrapper: { width: 184, height: 184, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1, borderColor: 'rgba(245, 245, 245, 0.4)', borderRadius: 92,
  },
  coreButton: {
    position: 'absolute', top: 22, left: 22, right: 22, bottom: 22,
    borderRadius: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  coreButtonReady: {
    backgroundColor: colors.surface, borderColor: 'rgba(255, 255, 255, 0.1)', shadowColor: 'rgba(255, 255, 255, 0.1)',
  },
  coreButtonRecording: {
    backgroundColor: colors.surfacePressed, borderColor: 'rgba(115, 115, 115, 0.5)', shadowColor: 'rgba(0, 0, 0, 0.5)',
  },
  coreButtonContent: { alignItems: 'center', justifyContent: 'center' },
  recordingLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700', marginBottom: 4 },
  timerText: { color: colors.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  readyText: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 18 },
  actions: { gap: 12 },
  actionCard: {
    width: '100%', minHeight: 74, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16,
  },
  actionCardPressed: { transform: [{ scale: 0.98 }], backgroundColor: colors.surfacePressed },
  cardIcon: {
    width: 44, height: 44, backgroundColor: colors.surfacePressed, borderWidth: 1,
    borderColor: colors.borderLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  cardChevron: { color: colors.textSubtle, fontSize: 24, fontWeight: '500' },
  iconContainer: {
    height: 36,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 40, // push it down below the circle
    gap: 3,
    width: '100%',
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#a78bfa',
    borderRadius: 2,
  },
});
