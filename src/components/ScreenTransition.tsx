import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { Screen } from '../types';

type TransitionPreset = 'fade' | 'slideUp' | 'slideRight' | 'fadeUp';

const ENTER_PRESET: Record<Screen['name'], TransitionPreset> = {
  home: 'fade',
  create: 'slideUp',
  capture: 'fade',
  processing: 'fade',
  result: 'fadeUp',
};

function startOffset(preset: TransitionPreset) {
  return {
    opacity: 0,
    translateY: preset === 'slideUp' ? 28 : preset === 'fadeUp' ? 16 : 0,
    translateX: preset === 'slideRight' ? 28 : 0,
  };
}

interface ScreenTransitionProps {
  screenKey: string;
  screenName: Screen['name'];
  instant?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export default function ScreenTransition({
  screenKey,
  screenName,
  instant = false,
  style,
  children,
}: ScreenTransitionProps) {
  const preset = ENTER_PRESET[screenName];
  const start = instant ? { opacity: 1, translateY: 0, translateX: 0 } : startOffset(preset);
  const opacity = useRef(new Animated.Value(start.opacity)).current;
  const translateY = useRef(new Animated.Value(start.translateY)).current;
  const translateX = useRef(new Animated.Value(start.translateX)).current;

  useEffect(() => {
    if (instant) {
      opacity.setValue(1);
      translateY.setValue(0);
      translateX.setValue(0);
      return;
    }

    opacity.setValue(startOffset(preset).opacity);
    translateY.setValue(startOffset(preset).translateY);
    translateX.setValue(startOffset(preset).translateX);

    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [instant, opacity, preset, screenKey, translateX, translateY]);

  return (
    <Animated.View
      style={[
        styles.fill,
        style,
        {
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
