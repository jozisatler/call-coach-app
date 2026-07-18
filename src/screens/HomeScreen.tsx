import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Upload, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BlurView } from 'expo-blur';
import { colors, sharedStyles } from '../styles/shared';

const { width } = Dimensions.get('window');

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
      duration: 600,
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
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
        ])
      ).start();
    } else {
      setSeconds(0);
      Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
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
          
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
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

  // Interpolations for background ambient glow
  const blob1Scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const blob1Opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  const blob2Scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const blob2Opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });

  // Interpolations for the record button
  const buttonScale = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] });
  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] });
  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Ambient Background */}
      <Animated.View style={[styles.glowBlob, styles.blob1, { transform: [{ scale: blob1Scale }], opacity: blob1Opacity }]} />
      <Animated.View style={[styles.glowBlob, styles.blob2, { transform: [{ scale: blob2Scale }], opacity: blob2Opacity }]} />
      <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={sharedStyles.safeArea}>
        <View style={[sharedStyles.content, { justifyContent: 'space-between' }]}>
          <View>
            <View style={styles.header}>
              <View style={[sharedStyles.brandRow, { marginBottom: 0 }]}>
                <View style={sharedStyles.logoMark}>
                  <View style={sharedStyles.logoMarkInner} />
                </View>
                <Text style={sharedStyles.brandText}>CloseCoach</Text>
              </View>
              
              <View style={styles.profileContainer}>
                <Text style={styles.profileGreeting}>Hello, John</Text>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitials}>J</Text>
                </View>
              </View>
            </View>
            <Text style={styles.headline}>
              Train the call.{'\n'}Win the next one.
            </Text>
          </View>

          <View style={styles.stage}>
            <Pressable 
              onPress={toggleRecording}
              style={({ pressed }) => [styles.recordButtonWrapper, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              {isRecording && (
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
              )}
              
              <Animated.View style={[
                styles.coreButton, 
                isRecording && { transform: [{ scale: buttonScale }] },
                isRecording && styles.coreButtonRecording
              ]}>
                <BlurView intensity={80} tint="dark" style={styles.coreButtonBlur}>
                  <View style={styles.coreButtonContent}>
                    
                    <View style={styles.iconContainer}>
                      {isRecording ? (
                        <Square size={28} color="#ffffff" fill="#ffffff" />
                      ) : (
                        <Mic size={28} color={colors.text} />
                      )}
                    </View>
                    
                    {isRecording ? (
                      <>
                        <Text style={[styles.recordingLabel, { color: '#ffffff' }]}>Recording</Text>
                        <Text style={[styles.timerText, { color: 'rgba(255,255,255,0.8)' }]}>{formatTime(seconds)}</Text>
                      </>
                    ) : (
                      <Text style={styles.readyText}>
                        Record a{'\n'}conversation
                      </Text>
                    )}
                  </View>
                </BlurView>
              </Animated.View>
            </Pressable>
            
            <View style={styles.waveformContainer}>
              {samples.map((val, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.waveformBar, 
                    { 
                      height: isRecording ? Math.max(4, val * 40) : 4,
                      opacity: isRecording ? 0.3 + (val * 0.7) : 0.2,
                      backgroundColor: isRecording ? '#ffffff' : colors.textSubtle
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
              <BlurView intensity={40} tint="dark" style={styles.actionCardBlur}>
                <View style={styles.cardIcon}>
                  <Upload size={20} color="#ffffff" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>Upload a call</Text>
                  <Text style={styles.cardSubtitle}>Audio or video file</Text>
                </View>
                <Text style={styles.cardChevron}>›</Text>
              </BlurView>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
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
    filter: 'blur(40px)', // web only, but expo-blur covers native
  },
  blob1: {
    top: '20%',
    left: '-20%',
    backgroundColor: '#4f46e5', // Rich indigo
  },
  blob2: {
    top: '40%',
    right: '-25%',
    backgroundColor: '#9333ea', // Deep purple
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileGreeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  profileInitials: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headline: { 
    color: '#ffffff', 
    fontSize: 36, 
    fontWeight: '800', 
    marginTop: 36, 
    lineHeight: 44, 
    letterSpacing: -1.2,
  },
  stage: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 340, 
    position: 'relative' 
  },
  recordButtonWrapper: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10 
  },
  pulseRing: { 
    position: 'absolute', 
    width: 240, 
    height: 240, 
    borderRadius: 120, 
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
  },
  coreButton: { 
    width: 170, 
    height: 170, 
    borderRadius: 85, 
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.2)', 
  },
  coreButtonRecording: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  coreButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreButtonContent: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  recordingLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5,
    marginTop: 4,
  },
  timerText: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginTop: 4, 
    fontVariant: ['tabular-nums'] 
  },
  readyText: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 14, 
    fontWeight: '600', 
    textAlign: 'center', 
    lineHeight: 18, 
    marginTop: 8 
  },
  actions: { 
    paddingBottom: 20 
  },
  actionCard: { 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionCardPressed: { 
    opacity: 0.8,
  },
  actionCardBlur: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
  },
  cardIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  cardSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  cardChevron: { color: 'rgba(255,255,255,0.3)', fontSize: 26, fontWeight: '500' },
  iconContainer: {
    height: 40,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 48, 
    gap: 3,
    width: '100%',
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
});

