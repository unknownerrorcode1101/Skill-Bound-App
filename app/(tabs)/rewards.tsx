import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gem, Clock, Sparkles, Star, ExternalLink, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';
import CurrencyHeader from '@/components/CurrencyHeader';
import FloatingGiftButton from '@/components/FloatingGiftButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLOT_ITEMS = [
  { id: 1, type: 'gems', amount: 5, color: '#3b82f6', icon: '💎' },
  { id: 2, type: 'money', amount: 50, color: '#22c55e', icon: '$' },
  { id: 3, type: 'gems', amount: 10, color: '#60a5fa', icon: '💎' },
  { id: 4, type: 'money', amount: 100, color: '#16a34a', icon: '$' },
  { id: 5, type: 'gems', amount: 25, color: '#2563eb', icon: '💎' },
  { id: 6, type: 'money', amount: 250, color: '#15803d', icon: '$' },
  { id: 7, type: 'gems', amount: 50, color: '#1d4ed8', icon: '💎' },
  { id: 8, type: 'money', amount: 500, color: '#166534', icon: '$' },
];

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
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [resultSegment, setResultSegment] = useState<typeof SLOT_ITEMS[0] | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [displayedItems, setDisplayedItems] = useState([
    SLOT_ITEMS[0],
    SLOT_ITEMS[1],
    SLOT_ITEMS[2],
  ]);

  useState(() => {
    const updateCooldown = () => {
      const remaining = getSpinCooldownRemaining();
      setCooldownRemaining(remaining);
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  });

  const handleSpin = useCallback(() => {
    if (!canSpin || isSpinning) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSpinning(true);

    const winningIndex = Math.floor(Math.random() * SLOT_ITEMS.length);
    const winningPrize = SLOT_ITEMS[winningIndex];
    
    let spinCount = 0;
    const totalSpins = 20;
    
    const spinInterval = setInterval(() => {
      spinCount++;
      
      const randomTop = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
      const randomMiddle = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
      const randomBottom = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
      
      setDisplayedItems([randomTop, randomMiddle, randomBottom]);
      
      if (spinCount >= totalSpins) {
        clearInterval(spinInterval);
        
        const topItem = SLOT_ITEMS[(winningIndex - 1 + SLOT_ITEMS.length) % SLOT_ITEMS.length];
        const bottomItem = SLOT_ITEMS[(winningIndex + 1) % SLOT_ITEMS.length];
        
        setDisplayedItems([topItem, winningPrize, bottomItem]);
        setResultSegment(winningPrize);
        setIsSpinning(false);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (winningPrize.type === 'gems') {
          addGems(winningPrize.amount);
        } else {
          addMoney(winningPrize.amount);
        }

        recordSpin();
        console.log(`Prize awarded: ${winningPrize.icon} ${winningPrize.amount}`);

        setTimeout(() => {
          setShowWinPopup(true);
        }, 300);
      }
    }, 80);
  }, [canSpin, isSpinning, addGems, addMoney, recordSpin]);

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

        <View style={styles.slotMachineOuter}>
          <LinearGradient
            colors={['#2a1810', '#1a0f0a', '#2a1810']}
            style={styles.slotMachineBody}
          >
            <View style={styles.slotMachineTop}>
              <View style={styles.casinoLightsRow}>
                {[...Array(7)].map((_, i) => (
                  <View key={i} style={[styles.casinoLight, { backgroundColor: i % 2 === 0 ? '#fbbf24' : '#ef4444' }]} />
                ))}
              </View>
              <Text style={styles.slotMachineTitle}>★ JACKPOT ★</Text>
              <View style={styles.casinoLightsRow}>
                {[...Array(7)].map((_, i) => (
                  <View key={i} style={[styles.casinoLight, { backgroundColor: i % 2 === 0 ? '#ef4444' : '#fbbf24' }]} />
                ))}
              </View>
            </View>

            <View style={styles.slotWindowOuter}>
              <LinearGradient
                colors={['#4a3728', '#2a1810', '#4a3728']}
                style={styles.slotWindowFrame}
              >
                <View style={styles.slotWindowInner}>
                  {displayedItems.map((item, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.slotRow,
                        index === 1 && styles.slotRowMiddle,
                      ]}
                    >
                      <LinearGradient
                        colors={index === 1 ? ['#fbbf24', '#f59e0b'] : ['#1e293b', '#0f172a']}
                        style={styles.slotItemBg}
                      >
                        {item.type === 'gems' ? (
                          <View style={styles.slotItemContent}>
                            <Gem size={24} color={index === 1 ? '#1e293b' : '#60a5fa'} fill={index === 1 ? '#1e293b' : '#60a5fa'} />
                            <Text style={[styles.slotItemAmount, index === 1 && styles.slotItemAmountHighlight]}>
                              {item.amount}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.slotItemContent}>
                            <View style={[styles.dollarCircle, index === 1 && styles.dollarCircleHighlight]}>
                              <Text style={[styles.dollarSign, index === 1 && styles.dollarSignHighlight]}>$</Text>
                            </View>
                            <Text style={[styles.slotItemAmount, index === 1 && styles.slotItemAmountHighlight]}>
                              {item.amount}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </View>
                  ))}
                </View>
                
                <View style={styles.winIndicatorLeft}>
                  <View style={styles.arrowRight} />
                </View>
                <View style={styles.winIndicatorRight}>
                  <View style={styles.arrowLeft} />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.slotMachineBottom}>
              <View style={styles.coinSlot} />
              <View style={styles.decorativePlate}>
                <Text style={styles.decorativeText}>777</Text>
              </View>
              <View style={styles.coinSlot} />
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={[styles.spinLever, (!canSpin || isSpinning) && styles.spinLeverDisabled]}
          onPress={handleSpin}
          activeOpacity={0.8}
          disabled={!canSpin || isSpinning}
        >
          <LinearGradient
            colors={canSpin && !isSpinning ? ['#dc2626', '#991b1b'] : ['#475569', '#374151']}
            style={styles.spinLeverGradient}
          >
            <Trophy size={22} color="#fff" />
            <Text style={styles.spinLeverText}>
              {isSpinning ? 'SPINNING...' : canSpin ? 'PULL TO SPIN!' : 'COOLDOWN'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.prizesInfo}>
          <Text style={styles.prizesTitle}>Possible Prizes</Text>
          <View style={styles.prizesGrid}>
            {SLOT_ITEMS.map((item) => (
              <View key={item.id} style={styles.prizeItem}>
                {item.type === 'gems' ? (
                  <>
                    <Gem size={14} color="#60a5fa" fill="#60a5fa" />
                    <Text style={styles.prizeTextBlue}>{item.amount}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.prizeMoneyIcon}>$</Text>
                    <Text style={styles.prizeTextGreen}>{item.amount}</Text>
                  </>
                )}
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
            <View style={styles.winModalContent}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.winModalGradient}
              >
                <View style={styles.winModalHeader}>
                  <Text style={styles.winModalEmoji}>🎉</Text>
                  <Text style={styles.winModalTitle}>WINNER!</Text>
                </View>
                
                {resultSegment && (
                  <View style={styles.winModalPrize}>
                    {resultSegment.type === 'gems' ? (
                      <>
                        <Gem size={48} color="#60a5fa" fill="#60a5fa" />
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
            </View>
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
  slotMachineOuter: {
    alignItems: 'center',
    marginVertical: 12,
  },
  slotMachineBody: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 20,
    padding: 16,
    borderWidth: 4,
    borderColor: '#8b6914',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  slotMachineTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  casinoLightsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  casinoLight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  slotMachineTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#fbbf24',
    letterSpacing: 3,
    textShadowColor: '#fbbf24',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginVertical: 8,
  },
  slotWindowOuter: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  slotWindowFrame: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#8b6914',
    position: 'relative',
  },
  slotWindowInner: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    overflow: 'hidden',
  },
  slotRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  slotRowMiddle: {
    borderBottomWidth: 0,
  },
  slotItemBg: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  slotItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  slotItemAmount: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#fff',
  },
  slotItemAmountHighlight: {
    color: '#1e293b',
  },
  dollarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dollarCircleHighlight: {
    backgroundColor: '#1e293b',
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#fff',
  },
  dollarSignHighlight: {
    color: '#22c55e',
  },
  winIndicatorLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -10,
  },
  winIndicatorRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
  },
  arrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fbbf24',
  },
  arrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#fbbf24',
  },
  slotMachineBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  coinSlot: {
    width: 30,
    height: 6,
    backgroundColor: '#1a0f0a',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#8b6914',
  },
  decorativePlate: {
    backgroundColor: '#8b6914',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 4,
  },
  decorativeText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#fbbf24',
    letterSpacing: 2,
  },
  spinLever: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  spinLeverDisabled: {
    opacity: 0.7,
  },
  spinLeverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  spinLeverText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  prizesInfo: {
    marginTop: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 105, 20, 0.4)',
  },
  prizesTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fbbf24',
    marginBottom: 12,
    textAlign: 'center' as const,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 105, 20, 0.3)',
  },
  prizeMoneyIcon: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  prizeTextBlue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#60a5fa',
  },
  prizeTextGreen: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#22c55e',
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
    marginBottom: 20,
  },
  winModalEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  winModalTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#fbbf24',
    letterSpacing: 3,
  },
  winModalPrize: {
    alignItems: 'center',
    marginBottom: 24,
  },
  winModalAmount: {
    fontSize: 40,
    fontWeight: '900' as const,
    color: '#60a5fa',
    marginTop: 12,
  },
  winModalAmountGreen: {
    fontSize: 40,
    fontWeight: '900' as const,
    color: '#22c55e',
    marginTop: 12,
  },
  winModalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 4,
  },
  winMoneyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winDollarIcon: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
  },
  awesomeButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 56,
    paddingVertical: 16,
    borderRadius: 14,
  },
  awesomeButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  socialSection: {
    marginTop: 20,
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
