import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gem, Crown, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import FloatingGiftButton from '@/components/FloatingGiftButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const formatCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)}B`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return `${amount.toFixed(2)}`;
};

const formatFullAmount = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatGemsCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
};

const formatGemsFull = (amount: number): string => {
  return amount.toLocaleString('en-US');
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { gems, money, level, xpProgress, xpBarColors } = useGame();
  
  const [showMoneyTooltip, setShowMoneyTooltip] = useState(false);
  const [showGemsTooltip, setShowGemsTooltip] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePlayGame = () => {
    router.push('/ballblast' as any);
  };

  const handlePlayBallBlaster = () => {
    router.push('/ballblaster-survival' as any);
  };

  const handlePlayBlackjack = () => {
    router.push('/blackjack' as any);
  };



  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          style={styles.profileXpContainer}
          onPress={() => router.push('/profile' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWithXp}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.avatarSmall}
            >
              <Crown size={16} color="#fbbf24" fill="#fbbf24" />
            </LinearGradient>
            <View style={styles.levelBadgeOverlay}>
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.levelBadgeSmall}
              >
                <Text style={styles.levelNumberSmall}>{level}</Text>
              </LinearGradient>
            </View>
          </View>
          <View style={styles.xpBarVertical}>
            <View style={styles.progressBarBgSmall}>
              <LinearGradient
                colors={[xpBarColors[0], xpBarColors[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFillSmall, { width: `${xpProgress}%` }]}
              />
              <View style={styles.xpBarShimmer} />
            </View>
            <Text style={styles.xpLabel}>Lv.{level} • {xpProgress}%</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerDivider} />

        <View style={styles.currencyRow}>
          <Pressable 
            style={styles.currencyItem}
            onPress={() => router.push('/store' as any)}
            onLongPress={() => setShowGemsTooltip(true)}
            delayLongPress={300}
          >
            <View style={styles.gemIcon}>
              <Gem size={18} color="#60a5fa" fill="#60a5fa" />
            </View>
            <View style={styles.currencyValueContainer}>
              <Text style={styles.currencyText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatGemsCompact(gems)}
              </Text>
            </View>
            <View style={styles.addButtonBlue}>
              <Plus size={12} color="#fff" strokeWidth={3} />
            </View>
          </Pressable>
          <Pressable 
            style={styles.currencyItemGreen}
            onPress={() => router.push('/store' as any)}
            onLongPress={() => setShowMoneyTooltip(true)}
            delayLongPress={300}
          >
            <View style={styles.moneyIcon}>
              <Text style={styles.dollarIcon}>$</Text>
            </View>
            <View style={styles.currencyValueContainer}>
              <Text style={styles.currencyText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatCompact(money)}
              </Text>
            </View>
            <View style={styles.addButton}>
              <Plus size={12} color="#fff" strokeWidth={3} />
            </View>
          </Pressable>
        </View>

        <Modal
          visible={showMoneyTooltip}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMoneyTooltip(false)}
        >
          <Pressable 
            style={styles.tooltipOverlay} 
            onPress={() => setShowMoneyTooltip(false)}
          >
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipLabel}>Total Balance</Text>
              <Text style={styles.tooltipAmount}>${formatFullAmount(money)}</Text>
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showGemsTooltip}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGemsTooltip(false)}
        >
          <Pressable 
            style={styles.tooltipOverlay} 
            onPress={() => setShowGemsTooltip(false)}
          >
            <View style={styles.tooltipContainerBlue}>
              <Text style={styles.tooltipLabel}>Total Gems</Text>
              <View style={styles.tooltipGemsRow}>
                <Gem size={18} color="#60a5fa" fill="#60a5fa" />
                <Text style={styles.tooltipAmountBlue}>{formatGemsFull(gems)}</Text>
              </View>
            </View>
          </Pressable>
        </Modal>

      </View>

      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoText}>SKILL</Text>
          <View style={styles.logoBolt}>
            <Gem size={32} color="#60a5fa" fill="#60a5fa" />
          </View>
        </View>
        <Text style={styles.logoSubtext}>BOUND</Text>
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
      </View>

      <ScrollView 
        style={styles.gamesContainer}
        contentContainerStyle={styles.gamesContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gamesGrid}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePlayGame}
            style={styles.gameCardWrapper}
          >
            <Animated.View style={[styles.gameCard, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.gameTitle}>BRICK BREAKER</Text>
              
              <View style={styles.gamePreview}>
                <LinearGradient
                  colors={['#1e1b4b', '#312e81', '#1e1b4b']}
                  style={styles.previewBg}
                >
                  <View style={styles.starsContainer}>
                    {[...Array(12)].map((_, i) => (
                      <Animated.View 
                        key={i} 
                        style={[
                          styles.star,
                          { 
                            opacity: shimmerOpacity,
                            left: `${5 + (i * 8)}%`,
                            top: `${10 + ((i % 4) * 22)}%`,
                          }
                        ]} 
                      />
                    ))}
                  </View>
                  
                  <View style={styles.bricksContainer}>
                    <View style={styles.brickRow}>
                      <View style={[styles.brick, { backgroundColor: '#ef4444' }]} />
                      <View style={[styles.brick, { backgroundColor: '#f97316' }]} />
                      <View style={[styles.brick, { backgroundColor: '#eab308' }]} />
                    </View>
                    <View style={styles.brickRow}>
                      <View style={[styles.brick, { backgroundColor: '#22c55e' }]} />
                      <View style={[styles.brick, { backgroundColor: '#3b82f6' }]} />
                      <View style={[styles.brick, { backgroundColor: '#a855f7' }]} />
                    </View>
                    <View style={styles.brickRow}>
                      <View style={[styles.brick, { backgroundColor: '#ec4899' }]} />
                      <View style={[styles.impactBrick, { backgroundColor: '#06b6d4' }]}>
                        <View style={styles.impactRing1} />
                        <View style={styles.impactRing2} />
                        <View style={styles.impactRing3} />
                      </View>
                      <View style={[styles.brick, { backgroundColor: '#f43f5e' }]} />
                    </View>
                    <View style={styles.brickRow}>
                      <View style={[styles.brick, { backgroundColor: '#8b5cf6' }]} />
                      <View style={[styles.brick, { backgroundColor: '#10b981' }]} />
                      <View style={[styles.brick, { backgroundColor: '#f59e0b' }]} />
                    </View>
                  </View>

                  <View style={styles.ball}>
                    <View style={styles.ballGlow} />
                  </View>
                  <View style={styles.ballTrail}>
                    <View style={[styles.trailDot, { opacity: 0.2, width: 4, height: 4 }]} />
                    <View style={[styles.trailDot, { opacity: 0.4, width: 5, height: 5 }]} />
                    <View style={[styles.trailDot, { opacity: 0.6, width: 6, height: 6 }]} />
                    <View style={[styles.trailDot, { opacity: 0.8, width: 7, height: 7 }]} />
                  </View>
                  <View style={styles.motionLine} />
                  
                  <View style={styles.paddle}>
                    <LinearGradient
                      colors={['#22d3ee', '#06b6d4', '#0891b2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.paddleGradient}
                    />
                  </View>


                </LinearGradient>
              </View>
            </Animated.View>
          </TouchableOpacity>


          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePlayBallBlaster}
            style={styles.gameCardWrapper}
          >
            <Animated.View style={[styles.gameCard, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.gameTitle}>BALL BLASTER</Text>
              
              <View style={styles.gamePreview}>
                <LinearGradient
                  colors={['#0a0a0f', '#151520', '#0a0a0f']}
                  style={styles.previewBg}
                >
                  <View style={styles.starsContainer}>
                    {[...Array(8)].map((_, i) => (
                      <Animated.View 
                        key={i} 
                        style={[
                          styles.star,
                          { 
                            opacity: shimmerOpacity,
                            left: `${10 + (i * 11)}%`,
                            top: `${8 + ((i % 3) * 25)}%`,
                          }
                        ]} 
                      />
                    ))}
                  </View>

                  <View style={styles.fallingRocksContainer}>
                    <View style={[styles.fallingRock, styles.rockRed]}>
                      <Text style={styles.rockHealthText}>5</Text>
                    </View>
                    <View style={[styles.fallingRock, styles.rockBlue, { top: 25 }]}>
                      <Text style={styles.rockHealthText}>3</Text>
                    </View>
                    <View style={[styles.fallingRock, styles.rockGreen, { top: 50, left: 60 }]}>
                      <Text style={styles.rockHealthText}>7</Text>
                    </View>
                  </View>

                  <View style={styles.bulletTrail}>
                    <View style={styles.bulletDot} />
                    <View style={styles.bulletDot} />
                    <View style={styles.bulletDot} />
                  </View>

                  <View style={styles.blasterVehicle}>
                    <View style={styles.blasterCannon} />
                    <View style={styles.blasterBody} />
                    <View style={styles.blasterWheels}>
                      <View style={styles.blasterWheel} />
                      <View style={styles.blasterWheel} />
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePlayBlackjack}
            style={styles.gameCardWrapper}
          >
            <Animated.View style={[styles.gameCard, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.gameTitle}>BLACKJACK</Text>
              
              <View style={styles.gamePreview}>
                <LinearGradient
                  colors={['#0d3320', '#145a32', '#0d3320']}
                  style={styles.previewBg}
                >
                  <View style={styles.blackjackTable}>
                    <View style={styles.dealerCards}>
                      <View style={[styles.previewCard, styles.cardFaceDown]} />
                      <View style={[styles.previewCard, styles.cardFaceUp]}>
                        <Text style={styles.previewCardRank}>A</Text>
                        <Text style={styles.previewCardSuit}>♠</Text>
                      </View>
                    </View>
                    <View style={styles.chipStack}>
                      <View style={[styles.previewChip, { backgroundColor: '#ef4444' }]} />
                      <View style={[styles.previewChip, { backgroundColor: '#22c55e', marginTop: -8 }]} />
                      <View style={[styles.previewChip, { backgroundColor: '#1e1e1e', marginTop: -8 }]} />
                    </View>
                    <View style={styles.playerCards}>
                      <View style={[styles.previewCard, styles.cardFaceUp]}>
                        <Text style={styles.previewCardRank}>K</Text>
                        <Text style={[styles.previewCardSuit, { color: '#dc2626' }]}>♥</Text>
                      </View>
                      <View style={[styles.previewCard, styles.cardFaceUp, { marginLeft: -15 }]}>
                        <Text style={styles.previewCardRank}>10</Text>
                        <Text style={styles.previewCardSuit}>♣</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {[1, 2, 3].map((num) => (
            <View key={num} style={styles.gameCardWrapper}>
              <View style={styles.comingSoonCard}>
                <Text style={styles.comingSoonTitle}>GAME {num + 3}</Text>
                <View style={styles.comingSoonPreview}>
                  <LinearGradient
                    colors={['#1a1a2e', '#16213e', '#1a1a2e']}
                    style={styles.previewBg}
                  >
                    <View style={styles.comingSoonOverlay}>
                      <View style={styles.lockIcon}>
                        <View style={styles.lockBody} />
                        <View style={styles.lockShackle} />
                      </View>
                      <Text style={styles.comingSoonText}>COMING SOON</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <FloatingGiftButton bottomOffset={90} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(96, 165, 250, 0.2)',
  },
  profileXpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarWithXp: {
    position: 'relative',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  levelBadgeOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  levelBadgeSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1a2744',
  },
  levelNumberSmall: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
  },
  xpBarVertical: {
    alignItems: 'center',
    gap: 2,
  },
  progressBarBgSmall: {
    width: 48,
    height: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  progressBarFillSmall: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  xpBarShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xpLabel: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: '#c4b5fd',
  },
  currencyRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    minWidth: 110,
  },
  currencyItemGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingLeft: 6,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    minWidth: 110,
  },
  currencyValueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gemIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dollarIcon: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#fff',
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  addButtonBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  headerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    marginHorizontal: 4,
  },

  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(96, 165, 250, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  logoBolt: {
    marginLeft: 4,
    marginTop: -8,
  },
  logoSubtext: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#94a3b8',
    letterSpacing: 12,
    marginTop: -8,
  },
  gamesContainer: {
    flex: 1,
  },
  gamesContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  gameCardWrapper: {
    width: CARD_WIDTH,
  },
  gameCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.15)',
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gamePreview: {
    height: CARD_WIDTH * 0.85,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  previewBg: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  bricksContainer: {
    position: 'absolute',
    top: '10%',
    left: '8%',
    right: '8%',
    gap: 5,
  },
  brickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  brick: {
    width: 36,
    height: 16,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  ball: {
    position: 'absolute',
    bottom: '38%',
    left: '48%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  ballGlow: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: -4,
    left: -4,
  },
  ballTrail: {
    position: 'absolute',
    bottom: '26%',
    left: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    transform: [{ rotate: '-50deg' }],
    zIndex: 9,
  },
  trailDot: {
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  motionLine: {
    position: 'absolute',
    bottom: '30%',
    left: '22%',
    width: 35,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
    transform: [{ rotate: '-50deg' }],
    zIndex: 8,
  },
  paddle: {
    position: 'absolute',
    bottom: '10%',
    left: '22%',
    right: '22%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  paddleGradient: {
    flex: 1,
    borderRadius: 5,
  },
  impactBrick: {
    width: 36,
    height: 16,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactRing1: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(251, 146, 60, 0.7)',
  },
  impactRing2: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(251, 146, 60, 0.45)',
  },
  impactRing3: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(251, 146, 60, 0.2)',
  },
  fallingRocksContainer: {
    position: 'absolute',
    top: '8%',
    left: 0,
    right: 0,
    height: '50%',
  },
  fallingRock: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  rockRed: {
    backgroundColor: '#ef4444',
    left: 20,
    top: 5,
  },
  rockBlue: {
    backgroundColor: '#3b82f6',
    left: 80,
  },
  rockGreen: {
    backgroundColor: '#22c55e',
  },
  rockHealthText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bulletTrail: {
    position: 'absolute',
    bottom: '25%',
    left: '50%',
    marginLeft: -3,
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 12,
    backgroundColor: '#fbbf24',
    borderRadius: 3,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  blasterVehicle: {
    position: 'absolute',
    bottom: '8%',
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 35,
    alignItems: 'center',
  },
  blasterCannon: {
    width: 8,
    height: 18,
    backgroundColor: '#60a5fa',
    borderRadius: 3,
    marginBottom: -2,
  },
  blasterBody: {
    width: 50,
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  blasterWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 44,
    marginTop: 2,
  },
  blasterWheel: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#475569',
  },
  comingSoonCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    opacity: 0.7,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.2)',
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#64748b',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  comingSoonPreview: {
    height: CARD_WIDTH * 0.85,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  comingSoonOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  lockIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  lockBody: {
    width: 28,
    height: 22,
    backgroundColor: '#475569',
    borderRadius: 4,
    marginTop: -4,
  },
  lockShackle: {
    position: 'absolute',
    top: -10,
    width: 18,
    height: 14,
    borderWidth: 4,
    borderColor: '#475569',
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#64748b',
    letterSpacing: 1,
  },
  blackjackTable: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dealerCards: {
    flexDirection: 'row',
    gap: 4,
  },
  playerCards: {
    flexDirection: 'row',
  },
  previewCard: {
    width: 28,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  cardFaceDown: {
    backgroundColor: '#1e40af',
  },
  cardFaceUp: {
    backgroundColor: '#fff',
  },
  previewCardRank: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#1e1e1e',
  },
  previewCardSuit: {
    fontSize: 12,
    color: '#1e1e1e',
    marginTop: -2,
  },
  chipStack: {
    alignItems: 'center',
  },
  previewChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipContainerBlue: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tooltipAmount: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  tooltipAmountBlue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#60a5fa',
    marginLeft: 8,
  },
  tooltipGemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
