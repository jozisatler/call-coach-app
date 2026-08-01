import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Effect } from '../types';
import { formatUses } from '../data/effects';
import BeforeAfterPeek from './BeforeAfterPeek';
import { colors } from '../styles/shared';

interface EffectCardProps {
  effect: Effect;
  onSelect: (effect: Effect) => void;
}

export default function EffectCard({ effect, onSelect }: EffectCardProps) {
  return (
    <View style={styles.card}>
      <BeforeAfterPeek
        beforeUri={effect.beforeImage}
        afterUri={effect.afterImage}
        aspectRatio={3 / 4}
        borderRadius={14}
        showHint
      />

      <View style={styles.meta}>
        <View style={styles.metaText}>
          <Text style={styles.name} numberOfLines={1}>
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
    flex: 1,
    marginBottom: 18,
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
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
