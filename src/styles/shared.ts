import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0c0c0c',
  surface: '#161616',
  surfaceRaised: '#1c1c1c',
  surfacePressed: '#262626',
  border: '#2a2a2a',
  borderLight: '#3f3f3f',
  text: '#f4f4f4',
  textMuted: '#a3a3a3',
  textSubtle: '#737373',
  accent: '#e8e4dc',
  accentDim: 'rgba(232, 228, 220, 0.12)',
  danger: '#f87171',
};

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
});
