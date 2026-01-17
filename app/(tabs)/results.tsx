import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Trophy, XCircle, Coins, Clock, Gamepad2, MinusCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import CurrencyHeader from '@/components/CurrencyHeader';

const BrickBreakerPreview = () => (
  <LinearGradient colors={['#1e1b4b', '#312e81', '#1e1b4b']} style={styles.gameImagePreview}>
    <View style={styles.miniBricksContainer}>
      <View style={styles.miniBrickRow}>
        <View style={[styles.miniBrick, { backgroundColor: '#ef4444' }]} />
        <View style={[styles.miniBrick, { backgroundColor: '#f97316' }]} />
        <View style={[styles.miniBrick, { backgroundColor: '#eab308' }]} />
      </View>
      <View style={styles.miniBrickRow}>
        <View style={[styles.miniBrick, { backgroundColor: '#22c55e' }]} />
        <View style={[styles.miniBrick, { backgroundColor: '#3b82f6' }]} />
        <View style={[styles.miniBrick, { backgroundColor: '#a855f7' }]} />
      </View>
    </View>
    <View style={styles.miniBall} />
    <View style={styles.miniPaddle} />
  </LinearGradient>
);

const BallBlasterPreview = () => (
  <LinearGradient colors={['#0a0a0f', '#151520', '#0a0a0f']} style={styles.gameImagePreview}>
    <View style={styles.miniRocksContainer}>
      <View style={[styles.miniRock, { backgroundColor: '#ef4444', left: 6 }]}>
        <Text style={styles.miniRockText}>5</Text>
      </View>
      <View style={[styles.miniRock, { backgroundColor: '#3b82f6', left: 24, top: 8 }]}>
        <Text style={styles.miniRockText}>3</Text>
      </View>
      <View style={[styles.miniRock, { backgroundColor: '#22c55e', left: 40, top: 2 }]}>
        <Text style={styles.miniRockText}>7</Text>
      </View>
    </View>
    <View style={styles.miniBlaster}>
      <View style={styles.miniBlasterCannon} />
      <View style={styles.miniBlasterBody} />
    </View>
  </LinearGradient>
);

const BlackjackPreview = () => (
  <LinearGradient colors={['#0d3320', '#145a32', '#0d3320']} style={styles.gameImagePreview}>
    <View style={styles.miniCardsContainer}>
      <View style={[styles.miniCard, { backgroundColor: '#1e40af' }]} />
      <View style={[styles.miniCard, { backgroundColor: '#fff', marginLeft: -4 }]}>
        <Text style={styles.miniCardText}>A</Text>
      </View>
    </View>
    <View style={styles.miniChipStack}>
      <View style={[styles.miniChip, { backgroundColor: '#ef4444' }]} />
      <View style={[styles.miniChip, { backgroundColor: '#22c55e', marginTop: -4 }]} />
    </View>
  </LinearGradient>
);

const DefaultGamePreview = () => (
  <LinearGradient colors={['#1a1a2e', '#16213e', '#1a1a2e']} style={styles.gameImagePreview}>
    <Gamepad2 size={24} color="#475569" />
  </LinearGradient>
);

const getGamePreview = (gameName: string) => {
  switch (gameName) {
    case 'Ball Blast':
    case 'Brick Breaker':
      return <BrickBreakerPreview />;
    case 'Ball Blaster Survival':
    case 'Ball Blaster':
      return <BallBlasterPreview />;
    case 'Blackjack':
      return <BlackjackPreview />;
    default:
      return <DefaultGamePreview />;
  }
};

const formatMoney = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    const millions = amount / 1000000;
    return millions.toFixed(2) + 'M';
  } else if (absAmount >= 1000) {
    const thousands = amount / 1000;
    return thousands.toFixed(2) + 'K';
  }
  return amount.toFixed(2);
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { matches, loadMatches } = useGame();

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);



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
          <Trophy size={24} color="#fbbf24" />
          <Text style={styles.title}>Results</Text>
        </View>
        <Text style={styles.subtitle}>Your game history</Text>
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Gamepad2 size={64} color="#475569" />
            <Text style={styles.emptyTitle}>No Games Played Yet</Text>
            <Text style={styles.emptySubtitle}>Play some games to see your results here!</Text>
          </View>
        ) : (
          matches.map((match) => (
            <View key={match.id} style={styles.resultCard}>
              <View style={styles.gameImageWrapper}>
                {getGamePreview(match.gameName)}
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.topRow}>
                  <Text style={styles.gameName} numberOfLines={1}>{match.gameName}</Text>
                  <View style={[
                    styles.resultBadge,
                    match.won ? styles.winBadge : match.pushed ? styles.pushBadge : styles.lossBadge
                  ]}>
                    {match.won ? (
                      <Trophy size={10} color="#fff" />
                    ) : match.pushed ? (
                      <MinusCircle size={10} color="#1e1e1e" />
                    ) : (
                      <XCircle size={10} color="#fff" />
                    )}
                    <Text style={[styles.badgeText, match.pushed && styles.pushBadgeText]}>
                      {match.won ? 'WIN' : match.pushed ? 'PUSH' : 'LOSS'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.bottomRow}>
                  <View style={styles.timeRow}>
                    <Clock size={12} color="#64748b" />
                    <Text style={styles.timeText}>{formatTimeAgo(match.timestamp)}</Text>
                  </View>
                  
                  <View style={styles.moneyRow}>
                    <Coins size={14} color="#fbbf24" />
                    <Text style={[
                      styles.moneyText,
                      match.won ? styles.moneyPositive : styles.moneyNegative
                    ]}>
                      {match.won ? '+' : ''}${formatMoney(match.moneyEarned)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>
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
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    marginLeft: 32,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.15)',
  },
  gameImageWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginLeft: 10,
    marginVertical: 10,
    overflow: 'hidden',
  },
  gameImagePreview: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniBricksContainer: {
    position: 'absolute',
    top: 6,
    gap: 2,
  },
  miniBrickRow: {
    flexDirection: 'row',
    gap: 2,
  },
  miniBrick: {
    width: 14,
    height: 6,
    borderRadius: 1,
  },
  miniBall: {
    position: 'absolute',
    bottom: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  miniPaddle: {
    position: 'absolute',
    bottom: 6,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22d3ee',
  },
  miniRocksContainer: {
    position: 'absolute',
    top: 6,
    width: '100%',
    height: 24,
  },
  miniRock: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniRockText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '900' as const,
  },
  miniBlaster: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
  },
  miniBlasterCannon: {
    width: 4,
    height: 8,
    backgroundColor: '#60a5fa',
    borderRadius: 2,
    marginBottom: -1,
  },
  miniBlasterBody: {
    width: 20,
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  miniCardsContainer: {
    position: 'absolute',
    top: 8,
    flexDirection: 'row',
  },
  miniCard: {
    width: 14,
    height: 20,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#1e1e1e',
  },
  miniChipStack: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
  },
  miniChip: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 48,
  },
  winBadge: {
    backgroundColor: '#22c55e',
  },
  lossBadge: {
    backgroundColor: '#ef4444',
  },
  pushBadge: {
    backgroundColor: '#fbbf24',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  pushBadgeText: {
    color: '#1e1e1e',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moneyText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  moneyPositive: {
    color: '#22c55e',
  },
  moneyNegative: {
    color: '#94a3b8',
  },
  footerSpace: {
    height: 100,
  },
});
