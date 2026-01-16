import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, ScrollView } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Diamond, Gift, Check, Flame, Star, Clock, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 100, 240);
const WHEEL_RADIUS = WHEEL_SIZE / 2;

const DAILY_REWARDS = [
  { day: 1, gems: 10, money: 100 },
  { day: 2, gems: 15, money: 150 },
  { day: 3, gems: 25, money: 250 },
  { day: 4, gems: 35, money: 400 },
  { day: 5, gems: 50, money: 600 },
  { day: 6, gems: 75, money: 1000 },
  { day: 7, gems: 150, money: 2500 },
];

const WHEEL_SEGMENTS = [
  { id: 1, type: 'gems', amount: 5, color: '#3b82f6', label: '💎 5' },
  { id: 2, type: 'money', amount: 50, color: '#22c55e', label: '$50' },
  { id: 3, type: 'gems', amount: 10, color: '#60a5fa', label: '💎 10' },
  { id: 4, type: 'money', amount: 100, color: '#16a34a', label: '$100' },
  { id: 5, type: 'gems', amount: 25, color: '#2563eb', label: '💎 25' },
  { id: 6, type: 'money', amount: 250, color: '#15803d', label: '$250' },
  { id: 7, type: 'gems', amount: 50, color: '#1d4ed8', label: '💎 50' },
  { id: 8, type: 'money', amount: 500, color: '#166534', label: '$500' },
];

const createPieSlice = (index: number, total: number, radius: number) => {
  const anglePerSlice = (2 * Math.PI) / total;
  const startAngle = index * anglePerSlice - Math.PI / 2;
  const endAngle = startAngle + anglePerSlice;
  
  const x1 = radius + radius * Math.cos(startAngle);
  const y1 = radius + radius * Math.sin(startAngle);
  const x2 = radius + radius * Math.cos(endAngle);
  const y2 = radius + radius * Math.sin(endAngle);
  
  const largeArc = anglePerSlice > Math.PI ? 1 : 0;
  
  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const getLabelPosition = (index: number, total: number, radius: number) => {
  const anglePerSlice = (2 * Math.PI) / total;
  const midAngle = index * anglePerSlice - Math.PI / 2 + anglePerSlice / 2;
  const labelRadius = radius * 0.65;
  
  return {
    x: radius + labelRadius * Math.cos(midAngle),
    y: radius + labelRadius * Math.sin(midAngle),
    rotation: (midAngle * 180) / Math.PI + 90,
  };
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { 
    addGems, 
    addMoney, 
    canClaimDaily, 
    claimDailyReward, 
    dailyStreak,
    canSpin,
    getSpinCooldownRemaining,
    recordSpin
  } = useGame();

  const [activeTab, setActiveTab] = useState<'daily' | 'spin'>('daily');
  
  // Daily rewards state
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [rewardGems, setRewardGems] = useState(0);
  const [rewardMoney, setRewardMoney] = useState(0);
  
  // Spin state
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSpinResult, setShowSpinResult] = useState(false);
  const [resultSegment, setResultSegment] = useState<typeof WHEEL_SEGMENTS[0] | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Animations
  const dailyScaleAnim = useRef(new Animated.Value(1)).current;
  const dailyGlowAnim = useRef(new Animated.Value(0)).current;
  const dailyRewardScaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spinResultScaleAnim = useRef(new Animated.Value(0)).current;
  const spinGlowAnim = useRef(new Animated.Value(0)).current;

  const canClaim = canClaimDaily();

  useEffect(() => {
    if (canClaim && activeTab === 'daily') {
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
  }, [canClaim, activeTab, dailyGlowAnim]);

  useEffect(() => {
    const updateCooldown = () => {
      const remaining = getSpinCooldownRemaining();
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [getSpinCooldownRemaining]);

  useEffect(() => {
    if (canSpin && !isSpinning && activeTab === 'spin') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinGlowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(spinGlowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      spinGlowAnim.setValue(0);
    }
  }, [canSpin, isSpinning, activeTab, spinGlowAnim]);

  const handleClaimDaily = () => {
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

  const handleSpin = useCallback(() => {
    if (!canSpin || isSpinning) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSpinning(true);
    setShowSpinResult(false);
    spinResultScaleAnim.setValue(0);

    const randomSegmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const targetAngle = 360 - (randomSegmentIndex * segmentAngle) - (segmentAngle / 2);
    const fullRotations = 5;
    const finalRotation = (fullRotations * 360) + targetAngle;

    rotateAnim.setValue(0);
    
    Animated.timing(rotateAnim, {
      toValue: finalRotation,
      duration: 4000,
      useNativeDriver: true,
    }).start(() => {
      const segment = WHEEL_SEGMENTS[randomSegmentIndex];
      setResultSegment(segment);
      setIsSpinning(false);
      setShowSpinResult(true);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (segment.type === 'gems') {
        addGems(segment.amount);
      } else {
        addMoney(segment.amount);
      }

      recordSpin();

      Animated.spring(spinResultScaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    });
  }, [canSpin, isSpinning, rotateAnim, spinResultScaleAnim, addGems, addMoney, recordSpin]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const currentDay = Math.min(dailyStreak + (canClaim ? 1 : 0), 7);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2744', '#243555', '#1a2744']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <Gift size={26} color="#fbbf24" />
          <Text style={styles.title}>Rewards</Text>
        </View>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
            onPress={() => setActiveTab('daily')}
          >
            <Gift size={18} color={activeTab === 'daily' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Daily</Text>
            {canClaim && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'spin' && styles.tabActive]}
            onPress={() => setActiveTab('spin')}
          >
            <Sparkles size={18} color={activeTab === 'spin' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'spin' && styles.tabTextActive]}>Spin</Text>
            {canSpin && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'daily' ? (
          <>
            <View style={styles.streakContainer}>
              <Flame size={18} color="#f97316" fill="#f97316" />
              <Text style={styles.streakText}>{dailyStreak} Day Streak</Text>
            </View>

            <View style={styles.rewardsGrid}>
              {DAILY_REWARDS.map((reward, index) => {
                const isCurrentDay = index + 1 === currentDay;
                const isPast = index + 1 < currentDay || (index + 1 === currentDay && !canClaim);
                const isLocked = index + 1 > currentDay;

                return (
                  <View
                    key={reward.day}
                    style={[
                      styles.rewardCard,
                      isCurrentDay && canClaim && styles.rewardCardActive,
                      isPast && styles.rewardCardClaimed,
                      isLocked && styles.rewardCardLocked,
                    ]}
                  >
                    {isPast && (
                      <View style={styles.claimedOverlay}>
                        <Check size={20} color="#22c55e" strokeWidth={3} />
                      </View>
                    )}
                    <Text style={[styles.dayText, isLocked && styles.dayTextLocked]}>
                      Day {reward.day}
                    </Text>
                    <View style={styles.rewardItems}>
                      <View style={styles.rewardItem}>
                        <Diamond size={14} color={isLocked ? '#475569' : '#60a5fa'} fill={isLocked ? '#475569' : '#60a5fa'} />
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
                    {reward.day === 7 && (
                      <View style={styles.bonusBadge}>
                        <Star size={8} color="#fbbf24" fill="#fbbf24" />
                        <Text style={styles.bonusText}>BONUS</Text>
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
                      <Check size={22} color="#9ca3af" />
                      <Text style={styles.claimButtonTextDisabled}>CLAIMED TODAY</Text>
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
                      <Diamond size={22} color="#60a5fa" fill="#60a5fa" />
                      <Text style={styles.rewardPopupAmount}>+{rewardGems}</Text>
                    </View>
                    <View style={styles.rewardPopupItem}>
                      <View style={styles.moneyIconLarge}>
                        <Text style={styles.dollarIconLarge}>$</Text>
                      </View>
                      <Text style={styles.rewardPopupAmountGreen}>+{rewardMoney}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </>
        ) : (
          <>
            {!canSpin && (
              <View style={styles.cooldownContainer}>
                <Clock size={16} color="#94a3b8" />
                <Text style={styles.cooldownText}>Next spin in {formatTime(cooldownRemaining)}</Text>
              </View>
            )}

            <View style={styles.wheelSection}>
              <View style={styles.wheelContainerOuter}>
                <Animated.View
                  style={[
                    styles.wheelGlow,
                    {
                      opacity: spinGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 0.5],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wheel,
                    { transform: [{ rotate: spin }] },
                  ]}
                >
                  <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                    {WHEEL_SEGMENTS.map((segment, index) => (
                      <Path
                        key={segment.id}
                        d={createPieSlice(index, WHEEL_SEGMENTS.length, WHEEL_RADIUS)}
                        fill={segment.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                    {WHEEL_SEGMENTS.map((segment, index) => {
                      const pos = getLabelPosition(index, WHEEL_SEGMENTS.length, WHEEL_RADIUS);
                      return (
                        <SvgText
                          key={`label-${segment.id}`}
                          x={pos.x}
                          y={pos.y}
                          fill="#fff"
                          fontSize={10}
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                        >
                          {segment.label}
                        </SvgText>
                      );
                    })}
                  </Svg>
                  
                  <View style={styles.wheelCenter}>
                    <LinearGradient
                      colors={['#fbbf24', '#f59e0b']}
                      style={styles.wheelCenterGradient}
                    >
                      <Text style={styles.wheelCenterText}>SPIN</Text>
                    </LinearGradient>
                  </View>
                </Animated.View>

                <View style={styles.pointer}>
                  <View style={styles.pointerTriangle} />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.spinButton, (!canSpin || isSpinning) && styles.spinButtonDisabled]}
              onPress={handleSpin}
              activeOpacity={0.8}
              disabled={!canSpin || isSpinning}
            >
              <LinearGradient
                colors={canSpin && !isSpinning ? ['#fbbf24', '#f59e0b'] : ['#475569', '#374151']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.spinButtonGradient}
              >
                <Sparkles size={22} color={canSpin && !isSpinning ? '#000' : '#9ca3af'} />
                <Text style={[styles.spinButtonText, (!canSpin || isSpinning) && styles.spinButtonTextDisabled]}>
                  {isSpinning ? 'SPINNING...' : canSpin ? 'SPIN NOW!' : 'COOLDOWN'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {showSpinResult && resultSegment && (
              <Animated.View
                style={[
                  styles.spinResultContainer,
                  { transform: [{ scale: spinResultScaleAnim }] },
                ]}
              >
                <LinearGradient
                  colors={['#1e293b', '#0f172a']}
                  style={styles.spinResultGradient}
                >
                  <Text style={styles.spinResultTitle}>You Won!</Text>
                  <View style={styles.spinResultContent}>
                    {resultSegment.type === 'gems' ? (
                      <>
                        <Diamond size={28} color="#60a5fa" fill="#60a5fa" />
                        <Text style={styles.spinResultAmount}>+{resultSegment.amount}</Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.moneyIconLarge}>
                          <Text style={styles.dollarIconLarge}>$</Text>
                        </View>
                        <Text style={styles.spinResultAmountGreen}>+${resultSegment.amount}</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            <View style={styles.prizesInfo}>
              <Text style={styles.prizesTitle}>Possible Prizes</Text>
              <View style={styles.prizesGrid}>
                {WHEEL_SEGMENTS.map((segment) => (
                  <View key={segment.id} style={[styles.prizeItem, { borderColor: segment.color }]}>
                    {segment.type === 'gems' ? (
                      <Diamond size={12} color="#60a5fa" fill="#60a5fa" />
                    ) : (
                      <Text style={styles.prizeMoneyIcon}>$</Text>
                    )}
                    <Text style={styles.prizeText}>
                      {segment.type === 'gems' ? segment.amount : segment.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2744',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fbbf24',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    position: 'absolute',
    top: 6,
    right: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
    gap: 8,
    justifyContent: 'center',
  },
  rewardCard: {
    width: (SCREEN_WIDTH - 56) / 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  rewardCardActive: {
    borderColor: '#fbbf24',
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
  claimedOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  dayText: {
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  rewardAmountLocked: {
    color: '#475569',
  },
  moneyIcon: {
    fontSize: 11,
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
    borderRadius: 14,
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
    borderRadius: 14,
    overflow: 'hidden',
  },
  rewardPopupGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: 14,
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
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 8,
  },
  cooldownText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  wheelSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  wheelContainerOuter: {
    width: WHEEL_SIZE + 40,
    height: WHEEL_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelGlow: {
    position: 'absolute',
    width: WHEEL_SIZE + 20,
    height: WHEEL_SIZE + 20,
    borderRadius: (WHEEL_SIZE + 20) / 2,
    backgroundColor: '#fbbf24',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: 5,
    borderColor: '#fbbf24',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  wheelCenter: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    top: (WHEEL_SIZE - 40) / 2,
    left: (WHEEL_SIZE - 40) / 2,
    overflow: 'hidden',
  },
  wheelCenterGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  wheelCenterText: {
    fontSize: 9,
    fontWeight: '900' as const,
    color: '#000',
  },
  pointer: {
    position: 'absolute',
    top: -5,
    alignItems: 'center',
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fbbf24',
  },
  spinButton: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  spinButtonDisabled: {
    opacity: 0.7,
  },
  spinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  spinButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#000',
    letterSpacing: 1,
  },
  spinButtonTextDisabled: {
    color: '#9ca3af',
  },
  spinResultContainer: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  spinResultGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 14,
  },
  spinResultTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fbbf24',
    marginBottom: 8,
  },
  spinResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spinResultAmount: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#60a5fa',
  },
  spinResultAmountGreen: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#22c55e',
  },
  prizesInfo: {
    marginTop: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  prizesTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fbbf24',
    marginBottom: 10,
    textAlign: 'center',
  },
  prizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
  },
  prizeMoneyIcon: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  prizeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  footerSpace: {
    height: 20,
  },
});
