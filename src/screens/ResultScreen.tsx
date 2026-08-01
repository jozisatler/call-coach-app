import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCcw, Home } from 'lucide-react-native';
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
}

export default function ResultScreen({
  effect,
  originalUri,
  resultBase64,
  resultMimeType,
  onBackHome,
  onTryAgain,
}: ResultScreenProps) {
  const resultUri = `data:${resultMimeType};base64,${resultBase64}`;

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
          beforeUri={originalUri}
          afterUri={resultUri}
          aspectRatio={3 / 4}
          borderRadius={18}
          hint="Hold to see original"
        />

        <Text style={styles.effectName}>{effect.name}</Text>
        <Text style={styles.caption}>Hold the image to compare before and after.</Text>

        <View style={styles.thumbs}>
          <View style={styles.thumbBlock}>
            <Image source={{ uri: originalUri }} style={styles.thumb} />
            <Text style={styles.thumbLabel}>Original</Text>
          </View>
          <View style={styles.thumbBlock}>
            <Image source={{ uri: resultUri }} style={styles.thumb} />
            <Text style={styles.thumbLabel}>Effect</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={onTryAgain}
        >
          <RotateCcw size={16} color={colors.bg} />
          <Text style={styles.primaryText}>Try another photo</Text>
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
  caption: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  thumbs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  thumbBlock: {
    flex: 1,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  thumbLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
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
});
