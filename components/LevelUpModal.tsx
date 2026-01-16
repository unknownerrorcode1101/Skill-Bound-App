import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Star, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onDismiss: () => void;
}

export default function LevelUpModal({ visible, level, onDismiss }: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const gemScaleAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      gemScaleAnim.setValue(0);
      starAnims.forEach(anim => anim.setValue(0));
      glowAnim.setValue(0);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(glowAnim, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
      ]).start();

      Animated.spring(gemScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        delay: 300,
        useNativeDriver: true,
      }).start();

      starAnims.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible, scaleAnim, rotateAnim, gemScaleAnim, starAnims, glowAnim]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          {starAnims.map((anim, index) => {
            const angle = (index / 8) * Math.PI * 2;
            const radius = 140;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.floatingStar,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      { scale: anim },
                      { 
                        rotate: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Star size={20} color="#fbbf24" fill="#fbbf24" />
              </Animated.View>
            );
          })}

          <LinearGradient
            colors={['#1e1b4b', '#312e81', '#4c1d95']}
            style={styles.modalContent}
          >
            <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
            
            <View style={styles.levelUpHeader}>
              <ChevronUp size={32} color="#22c55e" />
              <Text style={styles.levelUpText}>LEVEL UP!</Text>
              <ChevronUp size={32} color="#22c55e" />
            </View>

            <View style={styles.levelBadgeContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
                style={styles.levelBadge}
              >
                <Text style={styles.levelNumber}>{level}</Text>
              </LinearGradient>
            </View>

            <View style={styles.rewardSection}>
              <Text style={styles.rewardTitle}>REWARD</Text>
              
              <Animated.View
                style={[
                  styles.gemReward,
                  { transform: [{ scale: gemScaleAnim }] },
                ]}
              >
                <LinearGradient
                  colors={['#1e3a5f', '#2563eb', '#1e3a5f']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gemContainer}
                >
                  <View style={styles.gemIconWrapper}>
                    <Zap size={28} color="#60a5fa" fill="#60a5fa" />
                  </View>
                  <Text style={styles.gemAmount}>+50</Text>
                  <Text style={styles.gemLabel}>GEMS</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>AWESOME!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingStar: {
    position: 'absolute',
    zIndex: 10,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8b5cf6',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 200,
    borderWidth: 30,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  levelUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  levelUpText: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#22c55e',
    letterSpacing: 3,
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  levelBadgeContainer: {
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  levelBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#a78bfa',
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  rewardSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 12,
  },
  gemReward: {
    width: '100%',
  },
  gemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  gemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gemAmount: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#60a5fa',
    textShadowColor: 'rgba(96, 165, 250, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gemLabel: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#93c5fd',
    letterSpacing: 1,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 2,
  },
});
