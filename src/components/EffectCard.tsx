import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Effect } from '../types';
import { formatUses } from '../data/effects';
import BeforeAfterPeek from './BeforeAfterPeek';
import { colors } from '../styles/shared';

interface EffectCardProps {
  effect: Effect;
  onSelect: (effect: Effect) => void;
  aspectRatio?: number;
  compact?: boolean;
}

export default function EffectCard({
  effect,
  onSelect,
  aspectRatio = 3 / 4,
  compact = false,
}: EffectCardProps) {
  return (
    <View style={styles.card}>
      <BeforeAfterPeek
        beforeSource={effect.beforeImage}
        afterSource={effect.afterImage}
        aspectRatio={aspectRatio}
        borderRadius={compact ? 12 : 16}
      />

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
          style={({ pressed }) => [styles.useBtn, pressed && styles.useBtnPressed]}
          onPress={() => onSelect(effect)}
        >
          <Text style={styles.useBtnText}>Use</Text>
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
  useBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  useBtnPressed: {
    opacity: 0.85,
  },
  useBtnText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
  },
});
