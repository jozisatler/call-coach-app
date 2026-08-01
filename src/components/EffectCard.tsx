import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Effect } from '../types';
import { formatUses } from '../data/effects';
import BeforeAfterPeek from './BeforeAfterPeek';
import { PhotoIcon } from './TabIcons';
import { colors } from '../styles/shared';
import { CardOrigin } from './ExpandCardOverlay';

interface EffectCardProps {
  effect: Effect;
  onSelect: (effect: Effect, origin: CardOrigin) => void;
  aspectRatio?: number;
  compact?: boolean;
}

export default function EffectCard({
  effect,
  onSelect,
  aspectRatio = 3 / 4,
  compact = false,
}: EffectCardProps) {
  const mediaRef = useRef<View>(null);

  const handleTry = () => {
    mediaRef.current?.measureInWindow((x, y, width, height) => {
      onSelect(effect, { x, y, width, height });
    });
  };

  return (
    <View style={styles.card}>
      <View ref={mediaRef} collapsable={false}>
        <BeforeAfterPeek
          beforeSource={effect.beforeImage}
          afterSource={effect.afterImage}
          aspectRatio={aspectRatio}
          borderRadius={compact ? 12 : 16}
        />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaText}>
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
            {effect.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {formatUses(effect.uses)} uses · @{effect.creator}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [pressed && styles.photoBtnPressed]}
          onPress={handleTry}
          hitSlop={6}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(0,0,0,0.82)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.photoBtn}
          >
            <PhotoIcon size={16} color={colors.text} strokeWidth={1.8} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  meta: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  nameCompact: {
    fontSize: 13,
  },
  sub: {
    color: colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  photoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  photoBtnPressed: {
    opacity: 0.85,
  },
});
