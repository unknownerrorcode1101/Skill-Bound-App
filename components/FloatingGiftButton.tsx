import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, Modal, Pressable, PanResponder } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gem, Gift, Check, Flame, Star, Clock, Crown, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 56;
const EDGE_PADDING = 16;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const FIRST_OPEN_KEY = 'daily_popup_first_open';

const DAILY_REWARDS = [
  { day: 1, gems: 10, money: 100 },
  { day: 2, gems: 15, money: 150 },
  { day: 3, gems: 25, money: 250 },
  { day: 4, gems: 35, money: 400 },
  { day: 5, gems: 50, money: 600 },
  { day: 6, gems: 75, money: 1000 },
  { day: 7, gems: 150, money: 2500 },
];

const formatDailyTimer = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface FloatingGiftButtonProps {
  bottomOffset?: number;
}

export default function FloatingGiftButton({ bottomOffset = 90 }: FloatingGiftButtonProps) {
  const insets = useSafeAreaInsets();
  const { 
    addGems, 
    addMoney, 
    canClaimDaily, 
    claimDailyReward, 
    dailyStreak,
    giftButtonPosition,
    setGiftButtonPosition,
  } = useGame();

  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [rewardGems, setRewardGems] = useState(0);
  const [rewardMoney, setRewardMoney] = useState(0);
  const [dailyTimer, setDailyTimer] = useState(0);
  const [isOnRight, setIsOnRight] = useState(true);
  const [hasCheckedFirstOpen, setHasCheckedFirstOpen] = useState(false);

  const canClaim = canClaimDaily();
  const currentDay = Math.min(dailyStreak + (canClaim ? 1 : 0), 7);

  const defaultX = SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING;
  const defaultY = insets.top + 120;
  
  const initialX = giftButtonPosition?.x ?? defaultX;
  const initialY = giftButtonPosition?.y ?? defaultY;
  
  const pan = useRef(new Animated.ValueXY({ 
    x: initialX, 
    y: initialY 
  })).current;
  
  const hasInitialized = useRef(false);
  
  const floatingButtonPulse = useRef(new Animated.Value(1)).current;
  const dailyScaleAnim = useRef(new Animated.Value(1)).current;
  const dailyGlowAnim = useRef(new Animated.Value(0)).current;
  const dailyRewardScaleAnim = useRef(new Animated.Value(0)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        
        const screenCenter = SCREEN_WIDTH / 2;
        const buttonCenter = currentX + BUTTON_SIZE / 2;
        
        const targetX = buttonCenter < screenCenter 
          ? EDGE_PADDING 
          : SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING;
        
        const minY = insets.top + 60;
        const maxY = SCREEN_HEIGHT - bottomOffset - insets.bottom - BUTTON_SIZE - 20;
        const clampedY = Math.max(minY, Math.min(maxY, currentY));
        
        setIsOnRight(targetX > screenCenter);
        setGiftButtonPosition({ x: targetX, y: clampedY });
        
        Animated.spring(pan, {
          toValue: { x: targetX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (giftButtonPosition && !hasInitialized.current) {
      hasInitialized.current = true;
      pan.setValue({ x: giftButtonPosition.x, y: giftButtonPosition.y });
      setIsOnRight(giftButtonPosition.x > SCREEN_WIDTH / 2);
    }
  }, [giftButtonPosition, pan]);

  useEffect(() => {
    if (giftButtonPosition && hasInitialized.current) {
      pan.setValue({ x: giftButtonPosition.x, y: giftButtonPosition.y });
      setIsOnRight(giftButtonPosition.x > SCREEN_WIDTH / 2);
    }
  }, [giftButtonPosition, pan]);

  useEffect(() => {
    const updateTimer = async () => {
      const lastClaim = await AsyncStorage.getItem('last_daily_claim_time');
      if (lastClaim) {
        const elapsed = Date.now() - parseInt(lastClaim, 10);
        if (elapsed < DAILY_COOLDOWN) {
          setDailyTimer(DAILY_COOLDOWN - elapsed);
        } else {
          setDailyTimer(0);
        }
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dailyClaimed]);

  useEffect(() => {
    const checkFirstOpen = async () => {
      if (hasCheckedFirstOpen) return;
      
      const hasOpened = await AsyncStorage.getItem(FIRST_OPEN_KEY);
      if (!hasOpened) {
        await AsyncStorage.setItem(FIRST_OPEN_KEY, 'true');
        setTimeout(() => {
          setShowDailyPopup(true);
        }, 500);
      }
      setHasCheckedFirstOpen(true);
    };
    
    checkFirstOpen();
  }, [hasCheckedFirstOpen]);

  useEffect(() => {
    if (canClaim) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dailyGlowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(dailyGlowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canClaim, dailyGlowAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingButtonPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingButtonPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 0.95,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatingButtonPulse, buttonPulseAnim]);

  const handleClaimDaily = async () => {
    if (!canClaim || dailyClaimed) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newStreak = claimDailyReward();
    const dayIndex = Math.min(newStreak - 1, 6);
    const reward = DAILY_REWARDS[dayIndex];

    setRewardGems(reward.gems);
    setRewardMoney(reward.money);
    addGems(reward.gems);
    addMoney(reward.money);
    setDailyClaimed(true);

    await AsyncStorage.setItem('last_daily_claim_time', Date.now().toString());

    Animated.sequence([
      Animated.timing(dailyScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(dailyScaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setShowDailyReward(true);
      Animated.spring(dailyRewardScaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const handlePress = useCallback(() => {
    setShowDailyPopup(true);
  }, []);

  return (
    <>
      <Animated.View
        style={[
          styles.floatingDailyButton,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          style={styles.touchable}
        >
          <Animated.View style={[styles.floatingButtonInner, { transform: [{ scale: canClaim ? floatingButtonPulse : 1 }] }]}>
            <LinearGradient
              colors={canClaim ? ['#fbbf24', '#f59e0b'] : ['#475569', '#374151']}
              style={styles.floatingButtonGradient}
            >
              <Gift size={20} color={canClaim ? '#000' : '#9ca3af'} />
              {canClaim && <View style={styles.floatingNotificationDot} />}
            </LinearGradient>
          </Animated.View>
          {!canClaim && dailyTimer > 0 && (
            <View style={[styles.floatingTimerBadge, isOnRight ? styles.timerBadgeRight : styles.timerBadgeLeft]}>
              <Text style={styles.floatingTimerText}>{formatDailyTimer(dailyTimer)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showDailyPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDailyPopup(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => !showDailyReward && setShowDailyPopup(false)}
        >
          <Pressable style={styles.dailyModalContent} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={styles.dailyModalGradient}
            >
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDailyPopup(false)}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>

              <View style={styles.dailyModalHeader}>
                <Gift size={32} color="#fbbf24" />
                <Text style={styles.dailyModalTitle}>Daily Rewards</Text>
              </View>

              <View style={styles.streakContainer}>
                <Flame size={18} color="#f97316" fill="#f97316" />
                <Text style={styles.streakText}>{dailyStreak} Day Streak</Text>
              </View>

              <View style={styles.rewardsGrid}>
                {DAILY_REWARDS.map((reward, index) => {
                  const isCurrentDay = index + 1 === currentDay;
                  const isPast = index + 1 < currentDay || (index + 1 === currentDay && !canClaim);
                  const isLocked = index + 1 > currentDay;
                  const isDay7 = reward.day === 7;

                  return (
                    <View
                      key={reward.day}
                      style={[
                        styles.rewardCard,
                        isCurrentDay && canClaim && styles.rewardCardActive,
                        isPast && styles.rewardCardClaimed,
                        isLocked && styles.rewardCardLocked,
                        isDay7 && styles.rewardCardDay7,
                      ]}
                    >
                      {isPast && (
                        <View style={styles.claimedOverlay}>
                          <Check size={16} color="#22c55e" strokeWidth={3} />
                        </View>
                      )}
                      {isDay7 && (
                        <View style={styles.day7Crown}>
                          <Crown size={14} color="#fbbf24" fill="#fbbf24" />
                        </View>
                      )}
                      <Text style={[styles.dayText, isLocked && styles.dayTextLocked]}>
                        Day {reward.day}
                      </Text>
                      <View style={styles.rewardItems}>
                        <View style={styles.rewardItem}>
                          <Gem size={12} color={isLocked ? '#475569' : '#60a5fa'} fill={isLocked ? '#475569' : '#60a5fa'} />
                          <Text style={[styles.rewardAmount, isLocked && styles.rewardAmountLocked]}>
                            {reward.gems}
                          </Text>
                        </View>
                        <View style={styles.rewardItem}>
                          <Text style={[styles.moneyIcon, isLocked && styles.moneyIconLocked]}>$</Text>
                          <Text style={[styles.rewardAmount, isLocked && styles.rewardAmountLocked]}>
                            {reward.money}
                          </Text>
                        </View>
                      </View>
                      {isDay7 && (
                        <View style={styles.bonusBadge}>
                          <Star size={8} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.bonusText}>JACKPOT</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <Animated.View style={[styles.claimButtonContainer, { transform: [{ scale: dailyScaleAnim }] }]}>
                <TouchableOpacity
                  style={[styles.claimButton, !canClaim && styles.claimButtonDisabled]}
                  onPress={handleClaimDaily}
                  activeOpacity={0.8}
                  disabled={!canClaim || dailyClaimed}
                >
                  <Animated.View
                    style={[
                      styles.claimButtonGlow,
                      {
                        opacity: dailyGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.8],
                        }),
                      },
                    ]}
                  />
                  <LinearGradient
                    colors={canClaim ? ['#fbbf24', '#f59e0b'] : ['#475569', '#374151']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.claimButtonGradient}
                  >
                    {canClaim ? (
                      <>
                        <Gift size={22} color="#000" />
                        <Text style={styles.claimButtonText}>CLAIM REWARD</Text>
                      </>
                    ) : (
                      <>
                        <Clock size={22} color="#9ca3af" />
                        <Text style={styles.claimButtonTextDisabled}>{formatDailyTimer(dailyTimer)}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {showDailyReward && (
                <Animated.View
                  style={[
                    styles.rewardPopup,
                    { transform: [{ scale: dailyRewardScaleAnim }] },
                  ]}
                >
                  <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={styles.rewardPopupGradient}
                  >
                    <Text style={styles.rewardPopupTitle}>Rewards Claimed!</Text>
                    <View style={styles.rewardPopupItems}>
                      <View style={styles.rewardPopupItem}>
                        <Gem size={22} color="#60a5fa" fill="#60a5fa" />
                        <Text style={styles.rewardPopupAmount}>+{rewardGems}</Text>
                      </View>
                      <View style={styles.rewardPopupItem}>
                        <View style={styles.moneyIconLarge}>
                          <Text style={styles.dollarIconLarge}>$</Text>
                        </View>
                        <Text style={styles.rewardPopupAmountGreen}>+{rewardMoney}</Text>
                      </View>
                    </View>
                    <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
                      <TouchableOpacity
                        style={styles.closeRewardButton}
                        onPress={() => {
                          setShowDailyReward(false);
                          setShowDailyPopup(false);
                        }}
                      >
                        <Text style={styles.closeRewardButtonText}>AWESOME!</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </LinearGradient>
                </Animated.View>
              )}
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingDailyButton: {
    position: 'absolute',
    zIndex: 100,
  },
  touchable: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  floatingButtonInner: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingNotificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  floatingTimerBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
  },
  timerBadgeRight: {
    left: -10,
    right: -10,
  },
  timerBadgeLeft: {
    left: -10,
    right: -10,
  },
  floatingTimerText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dailyModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
  },
  dailyModalGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  dailyModalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyModalTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#fff',
    marginTop: 8,
    letterSpacing: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#f97316',
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  rewardCard: {
    width: 72,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  rewardCardActive: {
    borderColor: '#fbbf24',
    borderWidth: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardCardClaimed: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    opacity: 0.7,
  },
  rewardCardLocked: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(71, 85, 105, 0.3)',
    opacity: 0.5,
  },
  rewardCardDay7: {
    width: 80,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderWidth: 2,
  },
  day7Crown: {
    position: 'absolute',
    top: -6,
    right: -4,
  },
  claimedOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  dayText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  dayTextLocked: {
    color: '#475569',
  },
  rewardItems: {
    gap: 2,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rewardAmount: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  rewardAmountLocked: {
    color: '#475569',
  },
  moneyIcon: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  moneyIconLocked: {
    color: '#475569',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  bonusText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#fbbf24',
  },
  claimButtonContainer: {
    marginTop: 16,
  },
  claimButton: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: '#fbbf24',
    borderRadius: 34,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#000',
    letterSpacing: 1,
  },
  claimButtonTextDisabled: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#9ca3af',
    letterSpacing: 1,
  },
  rewardPopup: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rewardPopupGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: 12,
  },
  rewardPopupTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fbbf24',
    marginBottom: 10,
  },
  rewardPopupItems: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  rewardPopupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardPopupAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#60a5fa',
  },
  rewardPopupAmountGreen: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  moneyIconLarge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dollarIconLarge: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
  },
  closeRewardButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeRewardButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#000',
  },
});
