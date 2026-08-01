import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { Effect, EffectCategory } from '../types';
import { CATEGORIES, getEffectsByCategory } from '../data/effects';
import EffectCard from '../components/EffectCard';
import { CardOrigin } from '../components/ExpandCardOverlay';
import { colors, sharedStyles } from '../styles/shared';

interface HomeScreenProps {
  onSelectEffect: (effect: Effect, origin: CardOrigin) => void;
  onCreateEffect: () => void;
}

/** Cycle of shapes so the feed never feels like a uniform brick wall. */
const ASPECT_CYCLE = [3 / 4, 1, 4 / 5, 2 / 3, 5 / 6] as const;

type MasonryItem = {
  effect: Effect;
  aspectRatio: number;
  estimatedHeight: number;
};

function buildMasonryColumns(
  effects: Effect[],
  columnWidth: number
): { left: MasonryItem[]; right: MasonryItem[] } {
  const left: MasonryItem[] = [];
  const right: MasonryItem[] = [];
  let leftH = 0;
  let rightH = 0;

  effects.forEach((effect, index) => {
    const aspectRatio = ASPECT_CYCLE[index % ASPECT_CYCLE.length];
    const estimatedHeight = columnWidth / aspectRatio + 56;
    const item: MasonryItem = { effect, aspectRatio, estimatedHeight };

    if (leftH <= rightH) {
      left.push(item);
      leftH += estimatedHeight + 14;
    } else {
      right.push(item);
      rightH += estimatedHeight + 14;
    }
  });

  return { left, right };
}

export default function HomeScreen({ onSelectEffect, onCreateEffect }: HomeScreenProps) {
  const [category, setCategory] = useState<EffectCategory | 'all'>('all');
  const { width } = useWindowDimensions();
  const gap = 12;
  const horizontalPad = 20;
  const columnWidth = (width - horizontalPad * 2 - gap) / 2;

  const effects = useMemo(() => getEffectsByCategory(category), [category]);
  const columns = useMemo(
    () => buildMasonryColumns(effects, columnWidth),
    [effects, columnWidth]
  );

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Effectory</Text>
          <Pressable
            style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
            onPress={onCreateEffect}
          >
            <Plus size={14} color={colors.bg} strokeWidth={2.5} />
            <Text style={styles.createBtnText}>Create Effect</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {CATEGORIES.map((item) => {
            const active = category === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.masonry, { gap }]}>
          <View style={{ width: columnWidth }}>
            {columns.left.map((item) => (
              <EffectCard
                key={item.effect.id}
                effect={item.effect}
                onSelect={onSelectEffect}
                aspectRatio={item.aspectRatio}
                compact
              />
            ))}
          </View>
          <View style={{ width: columnWidth }}>
            {columns.right.map((item) => (
              <EffectCard
                key={item.effect.id}
                effect={item.effect}
                onSelect={onSelectEffect}
                aspectRatio={item.aspectRatio}
                compact
              />
            ))}
          </View>
        </View>

        {effects.length === 0 && (
          <Text style={styles.empty}>No effects in this category yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    flexShrink: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
  },
  createBtnPressed: {
    opacity: 0.85,
  },
  createBtnText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  tabsWrap: {
    marginTop: 16,
    marginBottom: 4,
    height: 48,
    justifyContent: 'center',
  },
  tabs: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    height: 48,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  tabTextActive: {
    color: colors.bg,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  masonry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  empty: {
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: 40,
  },
});
