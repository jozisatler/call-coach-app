import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCcw, Home, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Effect } from '../types';
import BeforeAfterPeek from '../components/BeforeAfterPeek';
import { colors, sharedStyles } from '../styles/shared';

interface ResultScreenProps {
  effect: Effect;
  originalUri: string;
  resultBase64: string;
  resultMimeType: string;
  onBackHome: () => void;
  onTryAgain: () => void;
  showToast: (msg: string) => void;
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

export default function ResultScreen({
  effect,
  originalUri,
  resultBase64,
  resultMimeType,
  onBackHome,
  onTryAgain,
  showToast,
}: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const resultUri = `data:${resultMimeType};base64,${resultBase64}`;

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);

      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        showToast('Photo library permission is required to save');
        return;
      }

      const ext = extensionForMime(resultMimeType);
      const fileUri = `${FileSystem.cacheDirectory}effectory-${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(fileUri, resultBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(fileUri);
      showToast('Saved to your photos');
    } catch (error: any) {
      console.log('[Effectory] save failed:', error?.message || error);
      showToast(error?.message || 'Could not save photo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBackHome} style={styles.iconBtn} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Result</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BeforeAfterPeek
          beforeSource={{ uri: originalUri }}
          afterSource={{ uri: resultUri }}
          aspectRatio={3 / 4}
          borderRadius={18}
          hint="Hold to see original"
          showHint={false}
        />

        <Text style={styles.effectName}>{effect.name}</Text>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Download size={16} color={colors.bg} />
          )}
          <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save photo'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={onTryAgain}
        >
          <RotateCcw size={16} color={colors.text} />
          <Text style={styles.secondaryText}>Try another photo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={onBackHome}
        >
          <Home size={16} color={colors.text} />
          <Text style={styles.secondaryText}>Back to library</Text>
        </Pressable>
      </View>
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
  iconBtn: {
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  effectName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 18,
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
  disabled: {
    opacity: 0.7,
  },
});
