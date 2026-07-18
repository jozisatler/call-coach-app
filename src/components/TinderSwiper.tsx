import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Pressable } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { RefreshCcw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * width;
const SWIPE_OUT_DURATION = 250;

interface CardData {
  title: string;
  content: string;
}

interface TinderSwiperProps {
  cards: CardData[];
  markdownStyles: any;
}

export default function TinderSwiper({ cards, markdownStyles }: TinderSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  
  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
  }, [currentIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? width * 1.5 : -width * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => onSwipeComplete());
  };

  const onSwipeComplete = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-width * 1.5, 0, width * 1.5],
      outputRange: ['-30deg', '0deg', '30deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  if (currentIndex >= cards.length) {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneText}>All caught up!</Text>
        <Pressable onPress={() => setCurrentIndex(0)} style={styles.resetButton}>
          <RefreshCcw size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.resetButtonText}>Review again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cards.map((item, idx) => {
        if (idx < currentIndex) return null;

        if (idx === currentIndex) {
          return (
            <Animated.View
              key={idx}
              style={[getCardStyle(), styles.cardWrapper, { zIndex: 100 }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <Markdown style={markdownStyles}>{item.content}</Markdown>
              </View>
            </Animated.View>
          );
        }

        const scale = position.x.interpolate({
          inputRange: [-width / 2, 0, width / 2],
          outputRange: [1, 0.95, 1],
          extrapolate: 'clamp'
        });

        const nextOpacity = position.x.interpolate({
          inputRange: [-width / 2, 0, width / 2],
          outputRange: [1, 0.8, 1],
          extrapolate: 'clamp'
        });

        return (
          <Animated.View
            key={idx}
            style={[styles.cardWrapper, { opacity: nextOpacity, transform: [{ scale }], zIndex: 90 - idx }]}
          >
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Markdown style={markdownStyles}>{item.content}</Markdown>
            </View>
          </Animated.View>
        );
      }).reverse()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    marginTop: 16,
    position: 'relative'
  },
  cardWrapper: {
    position: 'absolute',
    width: width - 48,
    marginHorizontal: 24,
    height: 380, // fixed height so they stack identically
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24, 
    padding: 24,
    flex: 1,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  doneContainer: {
    height: 400,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15
  }
});
