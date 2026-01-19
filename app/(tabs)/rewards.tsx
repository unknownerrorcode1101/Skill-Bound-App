import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gem, Clock, Sparkles, Star, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';
import CurrencyHeader from '@/components/CurrencyHeader';
import FloatingGiftButton from '@/components/FloatingGiftButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLOT_ITEMS = [
  { id: 1, type: 'gems', amount: 5, color: '#3b82f6', label: '💎 5' },
  { id: 2, type: 'money', amount: 50, color: '#22c55e', label: '$50' },
  { id: 3, type: 'gems', amount: 10, color: '#60a5fa', label: '💎 10' },
  { id: 4, type: 'money', amount: 100, color: '#16a34a', label: '$100' },
  { id: 5, type: 'gems', amount: 25, color: '#2563eb', label: '💎 25' },
  { id: 6, type: 'money', amount: 250, color: '#15803d', label: '$250' },
  { id: 7, type: 'gems', amount: 50, color: '#1d4ed8', label: '💎 50' },
  { id: 8, type: 'money', amount: 500, color: '#166534', label: '$500' },
];

const ITEM_HEIGHT = 70;
const VISIBLE_ITEMS = 3;
const SLOT_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

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
    canSpin,
    getSpinCooldownRemaining,
    recordSpin
  } = useGame();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSpinResult, setShowSpinResult] = useState(false);
  const [resultSegment, setResultSegment] = useState<typeof SLOT_ITEMS[0] | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showWinPopup, setShowWinPopup] = useState(false);

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const winPopupScaleAnim = useRef(new Animated.Value(0)).current;
  const spinResultScaleAnim = useRef(new Animated.Value(0)).current;
  const spinGlowAnim = useRef(new Animated.Value(0)).current;

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
    if (canSpin && !isSpinning) {
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
  }, [canSpin, isSpinning, spinGlowAnim]);



  const handleSpin = useCallback(() => {
    if (!canSpin || isSpinning) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSpinning(true);
    setShowSpinResult(false);
    spinResultScaleAnim.setValue(0);

    const winningIndex = Math.floor(Math.random() * SLOT_ITEMS.length);
    const winningPrize = SLOT_ITEMS[winningIndex];
    
    const totalItems = SLOT_ITEMS.length;
    const fullSpins = 4;
    
    // To show item at winningIndex in the MIDDLE slot:
    // - At scrollAnim = 0, item 0 is at top, item 1 is at middle
    // - To have item N in middle, item N-1 must be at top
    // - So scroll to position (N-1) * ITEM_HEIGHT (plus full spins)
    const targetPosition = (fullSpins * totalItems + winningIndex) * ITEM_HEIGHT;

    scrollAnim.setValue(0);
    
    console.log(`Spinning to win: ${winningPrize.label} (index ${winningIndex})`);
    
    Animated.timing(scrollAnim, {
      toValue: targetPosition,
      duration: 3500,
      useNativeDriver: true,
    }).start(() => {
      setResultSegment(winningPrize);
      setIsSpinning(false);
      setShowSpinResult(true);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (winningPrize.type === 'gems') {
        addGems(winningPrize.amount);
      } else {
        addMoney(winningPrize.amount);
      }

      recordSpin();
      console.log(`Prize awarded: ${winningPrize.label}`);

      Animated.spring(spinResultScaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        setShowWinPopup(true);
        winPopupScaleAnim.setValue(0);
        Animated.spring(winPopupScaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 200);
    });
  }, [canSpin, isSpinning, scrollAnim, spinResultScaleAnim, winPopupScaleAnim, addGems, addMoney, recordSpin]);

  const extendedItems = [...SLOT_ITEMS, ...SLOT_ITEMS, ...SLOT_ITEMS, ...SLOT_ITEMS, ...SLOT_ITEMS, ...SLOT_ITEMS];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <CurrencyHeader />
      </View>

      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Sparkles size={24} color="#fbbf24" />
          <Text style={styles.title}>Lucky Spin</Text>
        </View>
        <Text style={styles.subtitle}>Spin to win amazing rewards!</Text>
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!canSpin && (
          <View style={styles.cooldownContainer}>
            <Clock size={16} color="#94a3b8" />
            <Text style={styles.cooldownText}>Next spin in {formatTime(cooldownRemaining)}</Text>
          </View>
        )}

        <View style={styles.slotSection}>
          <View style={styles.slotMachineContainer}>
            <Animated.View
              style={[
                styles.slotGlow,
                {
                  opacity: spinGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.5],
                  }),
                },
              ]}
            />
            
            <LinearGradient
              colors={['#1e293b', '#0f172a', '#1e293b']}
              style={styles.slotMachineFrame}
            >
              <View style={styles.slotMachineTop}>
                <Text style={styles.slotMachineTitle}>🎰 LUCKY SLOTS 🎰</Text>
              </View>

              <View style={styles.slotWindowContainer}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                  style={styles.slotWindowGradient}
                  pointerEvents="none"
                />
                
                <View style={styles.slotWindow}>
                  <Animated.View
                    style={[
                      styles.slotReel,
                      {
                        transform: [{
                          translateY: scrollAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -1],
                          }),
                        }],
                      },
                    ]}
                  >
                    {extendedItems.map((item, index) => (
                      <View key={`${item.id}-${index}`} style={styles.slotItem}>
                        <LinearGradient
                          colors={[item.color, `${item.color}99`]}
                          style={styles.slotItemGradient}
                        >
                          {item.type === 'gems' ? (
                            <View style={styles.slotItemContent}>
                              <Gem size={28} color="#fff" fill="#fff" />
                              <Text style={styles.slotItemAmount}>{item.amount}</Text>
                            </View>
                          ) : (
                            <View style={styles.slotItemContent}>
                              <View style={styles.moneyIconSlot}>
                                <Text style={styles.dollarIconSlot}>$</Text>
                              </View>
                              <Text style={styles.slotItemAmount}>{item.amount}</Text>
                            </View>
                          )}
                        </LinearGradient>
                      </View>
                    ))}
                  </Animated.View>
                </View>

                <View style={styles.slotPointerLeft}>
                  <View style={styles.pointerArrowLeft} />
                </View>
                <View style={styles.slotPointerRight}>
                  <View style={styles.pointerArrowRight} />
                </View>
                
                <View style={styles.winLine} />
              </View>

              <View style={styles.slotDecorations}>
                <View style={styles.slotLight} />
                <View style={styles.slotLight} />
                <View style={styles.slotLight} />
              </View>
            </LinearGradient>
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
                    <Gem size={28} color="#60a5fa" fill="#60a5fa" />
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
            {SLOT_ITEMS.map((segment) => (
              <View key={segment.id} style={[styles.prizeItem, { borderColor: segment.color }]}>
                {segment.type === 'gems' ? (
                  <Gem size={12} color="#60a5fa" fill="#60a5fa" />
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

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>FOLLOW US FOR GEMS</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <LinearGradient
                colors={['#E1306C', '#C13584', '#833AB4']}
                style={styles.socialButtonGradient}
              >
                <Text style={styles.socialIcon}>📷</Text>
                <View style={styles.socialButtonContent}>
                  <Text style={styles.socialButtonLabel}>Instagram</Text>
                  <View style={styles.socialReward}>
                    <Gem size={12} color="#fff" fill="#fff" />
                    <Text style={styles.socialRewardText}>+25</Text>
                  </View>
                </View>
                <ExternalLink size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <LinearGradient
                colors={['#5865F2', '#4752C4', '#3C45A5']}
                style={styles.socialButtonGradient}
              >
                <Text style={styles.socialIcon}>💬</Text>
                <View style={styles.socialButtonContent}>
                  <Text style={styles.socialButtonLabel}>Discord</Text>
                  <View style={styles.socialReward}>
                    <Gem size={12} color="#fff" fill="#fff" />
                    <Text style={styles.socialRewardText}>+25</Text>
                  </View>
                </View>
                <ExternalLink size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
            style={styles.reviewCard}
          >
            <View style={styles.reviewHeader}>
              <Star size={22} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.reviewTitle}>LEAVE A REVIEW</Text>
            </View>
            <Text style={styles.reviewDescription}>Rate us 5 stars and get rewarded!</Text>
            <View style={styles.reviewRewards}>
              <View style={styles.reviewRewardItem}>
                <Gem size={16} color="#60a5fa" fill="#60a5fa" />
                <Text style={styles.reviewRewardText}>+50 Gems</Text>
              </View>
              <View style={styles.reviewRewardItem}>
                <View style={styles.reviewMoneyIcon}>
                  <Text style={styles.reviewDollarIcon}>$</Text>
                </View>
                <Text style={styles.reviewRewardTextGreen}>+$2.00</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.reviewButton} activeOpacity={0.8}>
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']}
                style={styles.reviewButtonGradient}
              >
                <Star size={16} color="#000" fill="#000" />
                <Text style={styles.reviewButtonText}>RATE NOW</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      <FloatingGiftButton bottomOffset={90} />

      <Modal
        visible={showWinPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWinPopup(false)}
      >
        <Pressable 
          style={styles.winModalOverlay}
          onPress={() => setShowWinPopup(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.winModalContent,
                { transform: [{ scale: winPopupScaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.winModalGradient}
              >
                <View style={styles.winModalHeader}>
                  <Text style={styles.winModalEmoji}>🎉</Text>
                  <Text style={styles.winModalTitle}>You Won!</Text>
                </View>
                
                {resultSegment && (
                  <View style={styles.winModalPrize}>
                    {resultSegment.type === 'gems' ? (
                      <>
                        <Gem size={36} color="#60a5fa" fill="#60a5fa" />
                        <Text style={styles.winModalAmount}>+{resultSegment.amount}</Text>
                        <Text style={styles.winModalLabel}>Diamonds</Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.winMoneyIcon}>
                          <Text style={styles.winDollarIcon}>$</Text>
                        </View>
                        <Text style={styles.winModalAmountGreen}>+${resultSegment.amount}</Text>
                        <Text style={styles.winModalLabel}>Cash</Text>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.awesomeButton}
                  onPress={() => setShowWinPopup(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.awesomeButtonText}>AWESOME!</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 0,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    textAlign: 'center' as const,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  sectionDivider: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dividerLine: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 160,
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
  slotSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  slotMachineContainer: {
    width: SCREEN_WIDTH - 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: 320,
    borderRadius: 20,
    backgroundColor: '#fbbf24',
  },
  slotMachineFrame: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  slotMachineTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  slotMachineTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fbbf24',
    letterSpacing: 2,
  },
  slotWindowContainer: {
    height: SLOT_HEIGHT,
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#374151',
    position: 'relative',
  },
  slotWindowGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  slotWindow: {
    height: SLOT_HEIGHT,
    overflow: 'hidden',
  },
  slotReel: {
    paddingTop: 0,
  },
  slotItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slotItemGradient: {
    width: '100%',
    height: ITEM_HEIGHT - 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotItemAmount: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  moneyIconSlot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dollarIconSlot: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#fff',
  },
  slotPointerLeft: {
    position: 'absolute',
    left: -2,
    top: '50%',
    marginTop: -12,
    zIndex: 20,
  },
  pointerArrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fbbf24',
  },
  slotPointerRight: {
    position: 'absolute',
    right: -2,
    top: '50%',
    marginTop: -12,
    zIndex: 20,
  },
  pointerArrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderRightWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#fbbf24',
  },
  winLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '50%',
    marginTop: -1,
    height: 2,
    backgroundColor: '#fbbf24',
    zIndex: 15,
    opacity: 0.6,
  },
  slotDecorations: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  slotLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  spinButton: {
    marginTop: 12,
    borderRadius: 12,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  spinResultGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 12,
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
  winModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  winModalContent: {
    width: 300,
    borderRadius: 20,
    overflow: 'hidden',
  },
  winModalGradient: {
    padding: 28,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fbbf24',
    borderRadius: 24,
  },
  winModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  winModalEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  winModalTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#fbbf24',
    letterSpacing: 2,
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  winModalPrize: {
    alignItems: 'center',
    marginBottom: 24,
  },
  winModalAmount: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#60a5fa',
    marginTop: 8,
  },
  winModalAmountGreen: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#22c55e',
    marginTop: 8,
  },
  winModalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 4,
  },
  winMoneyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winDollarIcon: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#fff',
  },
  awesomeButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 56,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  awesomeButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  socialSection: {
    marginTop: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  socialButtons: {
    gap: 10,
  },
  socialButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  socialButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  socialIcon: {
    fontSize: 24,
  },
  socialButtonContent: {
    flex: 1,
  },
  socialButtonLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  socialReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  socialRewardText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  reviewSection: {
    marginTop: 16,
  },
  reviewCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fbbf24',
    letterSpacing: 1,
  },
  reviewDescription: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#94a3b8',
    marginBottom: 12,
  },
  reviewRewards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 14,
  },
  reviewRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reviewRewardText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#60a5fa',
  },
  reviewRewardTextGreen: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#22c55e',
  },
  reviewMoneyIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewDollarIcon: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
  },
  reviewButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  reviewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 1,
  },
});
