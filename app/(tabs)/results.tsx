import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Trophy, XCircle, Coins, Clock, Gamepad2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

const GAME_IMAGES: Record<string, string> = {
  'Blackjack': 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100&h=100&fit=crop',
  'Ball Blast': 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=100&h=100&fit=crop',
  'Ball Blaster Survival': 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=100&h=100&fit=crop',
  'default': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop',
};

const formatMoney = (amount: number): string => {
  const rounded = Math.floor(amount * 100) / 100;
  return rounded.toFixed(2);
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

  const getGameImage = (gameName: string): string => {
    return GAME_IMAGES[gameName] || GAME_IMAGES['default'];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2744', '#243555', '#1a2744']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <Trophy size={26} color="#fbbf24" />
          <Text style={styles.title}>Results</Text>
        </View>
        <Text style={styles.subtitle}>Your game history</Text>
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
              <Image 
                source={{ uri: getGameImage(match.gameName) }}
                style={styles.gameImage}
              />
              
              <View style={styles.cardContent}>
                <View style={styles.topRow}>
                  <Text style={styles.gameName} numberOfLines={1}>{match.gameName}</Text>
                  <View style={[
                    styles.resultBadge,
                    match.won ? styles.winBadge : styles.lossBadge
                  ]}>
                    {match.won ? (
                      <Trophy size={10} color="#fff" />
                    ) : (
                      <XCircle size={10} color="#fff" />
                    )}
                    <Text style={styles.badgeText}>{match.won ? 'WIN' : 'LOSS'}</Text>
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
    backgroundColor: '#1a2744',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.15)',
  },
  gameImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    margin: 10,
    backgroundColor: '#0f172a',
  },
  cardContent: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  winBadge: {
    backgroundColor: '#22c55e',
  },
  lossBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.3,
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
    fontWeight: '500' as const,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moneyText: {
    fontSize: 14,
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
