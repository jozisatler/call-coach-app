import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Effect } from '../types';
import BeforeAfterPeek from '../components/BeforeAfterPeek';
import { colors, sharedStyles } from '../styles/shared';

interface CaptureScreenProps {
  effect: Effect;
  onBack: () => void;
  onImageReady: (payload: { uri: string; base64: string; mimeType: string }) => void;
  showToast: (msg: string) => void;
  /** True while the card-expand overlay is still covering the preview. */
  expanding?: boolean;
}

export default function CaptureScreen({
  effect,
  onBack,
  onImageReady,
  showToast,
  expanding = false,
}: CaptureScreenProps) {
  const [busy, setBusy] = useState(false);
  const chrome = useRef(new Animated.Value(expanding ? 0 : 1)).current;

  useEffect(() => {
    if (expanding) {
      chrome.setValue(0);
      return;
    }
    Animated.timing(chrome, {
      toValue: 1,
      duration: 320,
      delay: 40,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [chrome, expanding]);

  const pick = async (source: 'camera' | 'library') => {
    try {
      setBusy(true);

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showToast('Camera permission is required');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showToast('Photo library permission is required');
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.85,
              base64: true,
              exif: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.85,
              base64: true,
              exif: false,
            });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        showToast('Could not read that image. Try another one.');
        return;
      }

      const mimeType = asset.mimeType || 'image/jpeg';
      onImageReady({
        uri: asset.uri,
        base64: asset.base64,
        mimeType,
      });
    } catch {
      showToast('Something went wrong picking the image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top', 'bottom']}>
      <Animated.View style={{ opacity: chrome }} pointerEvents={expanding ? 'none' : 'auto'}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {effect.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <View style={styles.content}>
        <BeforeAfterPeek
          beforeSource={effect.beforeImage}
          afterSource={effect.afterImage}
          aspectRatio={4 / 5}
          borderRadius={18}
        />

        <Animated.View style={{ opacity: chrome }} pointerEvents={expanding ? 'none' : 'auto'}>
          <Text style={styles.description}>{effect.description}</Text>
          <Text style={styles.promptLabel}>What this does</Text>
          <Text style={styles.prompt} numberOfLines={3}>
            {effect.prompt}
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.actions, { opacity: chrome }]}
        pointerEvents={expanding ? 'none' : 'auto'}
      >
        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.busyText}>Opening...</Text>
          </View>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={() => pick('camera')}
            >
              <Camera size={18} color={colors.bg} />
              <Text style={styles.primaryText}>Take photo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => pick('library')}
            >
              <ImageIcon size={18} color={colors.text} />
              <Text style={styles.secondaryText}>Choose from gallery</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 16,
    lineHeight: 20,
  },
  promptLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
  },
  prompt: {
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: 14,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  busyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
