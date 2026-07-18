import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
          
          // Fade out before transitioning
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onAudioReady(base64);
          });
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
          ...Audio.RecordingOptionsPresets.LOW_QUALITY,
          isMeteringEnabled: true,
        };
        
        const { recording: newRecording } = await Audio.Recording.createAsync(options);
        
        newRecording.setProgressUpdateInterval(50);
        
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
        
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onAudioReady(base64);
        });
      }
    } catch (err) {
      showToast('Upload canceled');
    }
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1.18] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] });

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <Animated.View style={[sharedStyles.content, { justifyContent: 'space-between', opacity: fadeAnim }]}>
        <View style={styles.header}>
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
          
          <View style={styles.profileContainer}>
            <Text style={styles.profileGreeting}>Hello, John</Text>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>J</Text>
            </View>
          </View>
        </View>

        <View style={styles.stage}>
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
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  profileGreeting: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileInitials: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headline: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 32, lineHeight: 40, letterSpacing: -1 },
  stage: { alignItems: 'center', justifyContent: 'center', height: 300, position: 'relative' },
  recordButtonWrapper: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  pulseRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  coreButton: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  coreButtonReady: { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', shadowColor: '#000' },
  coreButtonRecording: { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', shadowColor: '#ffffff' },
  coreButtonContent: { alignItems: 'center', justifyContent: 'center' },
  recordingLabel: { color: colors.text, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  timerText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600', marginTop: 4, fontVariant: ['tabular-nums'] },
  readyText: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginTop: 4 },
  actions: { paddingBottom: 20 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  actionCardPressed: { backgroundColor: '#1f1f1f', borderColor: 'rgba(255, 255, 255, 0.15)' },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
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
    marginTop: 40, 
    gap: 3,
    width: '100%',
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
});
