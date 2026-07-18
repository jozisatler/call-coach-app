import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0a0a0a',
  surface: '#171717',
  surfacePressed: '#262626',
  border: '#262626',
  borderLight: '#404040',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  textSubtle: '#737373',
};

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoMark: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoMarkInner: {
    width: 8,
    height: 12,
    borderLeftWidth: 2,
    borderColor: '#e5e5e5',
  },
  brandText: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  radialBackground: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: 600,
    height: 600,
    marginLeft: -300,
    marginTop: -300,
    borderRadius: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    padding: 12,
    backgroundColor: 'rgba(38, 38, 38, 0.95)',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  toastText: {
    color: '#f5f5f5',
    fontSize: 14,
    fontWeight: '500',
  },
});
