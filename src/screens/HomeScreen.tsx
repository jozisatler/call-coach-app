import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Effect, EffectCategory } from '../types';
import { CATEGORIES, getEffectsByCategory } from '../data/effects';
import EffectCard from '../components/EffectCard';
import { CardOrigin } from '../components/ExpandCardOverlay';
import { HomeIcon, CameraIcon, UserIcon } from '../components/TabIcons';
import { colors, sharedStyles } from '../styles/shared';

const CREATE_BORDER_COLORS = [
  'rgba(255,248,238,0.15)',
  'rgba(242,212,168,0.95)',
  'rgba(239,184,152,0.35)',
  'rgba(232,228,220,0.2)',
  'rgba(255,232,208,0.9)',
  'rgba(242,212,168,0.25)',
  'rgba(255,248,238,0.15)',
] as const;

function CreateEffectButton({ onPress }: { onPress: () => void }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.createBtnOuter, pressed && styles.createBtnPressed]}
      onPress={onPress}
    >
      <View style={styles.createBorder}>
        <View style={styles.createSpinClip} pointerEvents="none">
          <Animated.View style={[styles.createSpinLayer, { transform: [{ rotate }] }]}>
            <LinearGradient
              colors={CREATE_BORDER_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <View style={styles.createBtnInner}>
          <Plus size={14} color={colors.accent} strokeWidth={2.5} />
          <Text style={styles.createBtnText}>Create Effect</Text>
        </View>
      </View>
    </Pressable>
  );
}

interface HomeScreenProps {
  onSelectEffect: (effect: Effect, origin: CardOrigin) => void;
  onCreateEffect: () => void;
  onProfilePress?: () => void;
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

export default function HomeScreen({
  onSelectEffect,
  onCreateEffect,
  onProfilePress,
}: HomeScreenProps) {
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
          <Text style={styles.brand}>Story Snap</Text>
          <CreateEffectButton onPress={onCreateEffect} />
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

      <View style={styles.feedWrap}>
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

        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)', '#000']}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.bottomGradient}
        />

        <SafeAreaView edges={['bottom']} style={styles.bottomBarSafe}>
          <View style={styles.bottomBar}>
            <Pressable style={styles.tabBtn} hitSlop={8}>
              <HomeIcon size={26} color={colors.accent} strokeWidth={1.8} />
            </Pressable>

            <Pressable style={styles.tabBtn} hitSlop={8}>
              <CameraIcon size={26} color="rgba(244,244,244,0.55)" strokeWidth={1.5} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.tabBtn, pressed && styles.tabPressed]}
              onPress={onProfilePress}
              hitSlop={8}
            >
              <UserIcon size={26} color="rgba(244,244,244,0.55)" strokeWidth={1.5} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
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
  createBtnOuter: {
    borderRadius: 999,
  },
  createBorder: {
    borderRadius: 999,
    padding: 1.5,
    overflow: 'hidden',
    shadowColor: '#f2d4a8',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  createSpinClip: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSpinLayer: {
    width: 160,
    height: 160,
  },
  createBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
  },
  createBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  createBtnText: {
    color: colors.accent,
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
    paddingBottom: 120,
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
  feedWrap: {
    flex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  bottomBarSafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabBtn: {
    width: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPressed: {
    opacity: 0.75,
  },
});
