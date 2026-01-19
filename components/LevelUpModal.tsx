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
import { Gem, ChevronUp, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onDismiss: () => void;
}

export default function LevelUpModal({ visible, level, onDismiss }: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const gemScaleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      scaleAnim.setValue(0);
      gemScaleAnim.setValue(0);
      shimmerAnim.setValue(0);

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();

      Animated.spring(gemScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        delay: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible, scaleAnim, gemScaleAnim, shimmerAnim]);

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
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0f172a', '#1e3a5f', '#0f172a']}
            style={styles.modalContent}
          >
            <View style={styles.headerAccent} />
            
            <View style={styles.levelUpHeader}>
              <ChevronUp size={28} color="#22c55e" />
              <Text style={styles.levelUpText}>LEVEL UP!</Text>
              <ChevronUp size={28} color="#22c55e" />
            </View>

            <View style={styles.levelBadgeContainer}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                style={styles.levelBadge}
              >
                <Text style={styles.levelNumber}>{level}</Text>
              </LinearGradient>
              <View style={styles.levelGlow} />
            </View>

            <View style={styles.divider} />

            <View style={styles.rewardSection}>
              <View style={styles.rewardHeader}>
                <Sparkles size={16} color="#fbbf24" />
                <Text style={styles.rewardTitle}>REWARD</Text>
                <Sparkles size={16} color="#fbbf24" />
              </View>
              
              <Animated.View
                style={[
                  styles.gemReward,
                  { transform: [{ scale: gemScaleAnim }] },
                ]}
              >
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.15)', 'rgba(96, 165, 250, 0.05)']}
                  style={styles.gemContainer}
                >
                  <View style={styles.gemIconWrapper}>
                    <Gem size={32} color="#60a5fa" fill="#60a5fa" />
                  </View>
                  <Text style={styles.gemAmount}>+50</Text>
                  <Text style={styles.gemLabel}>DIAMONDS</Text>
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
                <Text style={styles.continueText}>CONTINUE</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    overflow: 'hidden',
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#22c55e',
  },
  levelUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
    gap: 8,
  },
  levelUpText: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#22c55e',
    letterSpacing: 2,
  },
  levelBadgeContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  levelBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  levelNumber: {
    fontSize: 44,
    fontWeight: '900' as const,
    color: '#fff',
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 1,
    marginBottom: 16,
  },
  rewardSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fbbf24',
    letterSpacing: 2,
  },
  gemReward: {
    width: '100%',
  },
  gemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  gemIconWrapper: {
    marginBottom: 8,
  },
  gemAmount: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#60a5fa',
  },
  gemLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    letterSpacing: 1,
    marginTop: 2,
  },
  continueButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
});
