import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Effect, EffectCategory } from '../types';
import { CATEGORIES, getEffectsByCategory } from '../data/effects';
import EffectCard from '../components/EffectCard';
import { colors, sharedStyles } from '../styles/shared';

interface HomeScreenProps {
  onSelectEffect: (effect: Effect) => void;
}

export default function HomeScreen({ onSelectEffect }: HomeScreenProps) {
  const [category, setCategory] = useState<EffectCategory | 'all'>('all');
  const { width } = useWindowDimensions();
  const gap = 12;
  const horizontalPad = 20;
  const cardWidth = (width - horizontalPad * 2 - gap) / 2;

  const effects = useMemo(() => getEffectsByCategory(category), [category]);

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brand}>Effectory</Text>
        <Text style={styles.subtitle}>Image effects from the community</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
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

      <FlatList
        data={effects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <EffectCard effect={item} onSelect={onSelectEffect} />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No effects in this category yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brand: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  tabsScroll: {
    flexGrow: 0,
    marginTop: 18,
    marginBottom: 8,
  },
  tabs: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tab: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
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
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabTextActive: {
    color: colors.bg,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  empty: {
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: 40,
  },
});
