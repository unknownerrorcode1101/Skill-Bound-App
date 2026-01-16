import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Trophy, XCircle, Coins, Clock, Gamepad2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

const GAME_IMAGES: Record<string, string> = {
  'Blackjack': 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=400&h=300&fit=crop',
  'Ball Blast': 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&h=300&fit=crop',
  'Ball Blaster Survival': 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&h=300&fit=crop',
  'default': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
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
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.imageOverlay}
              />
              
              <View style={styles.resultBadge}>
                {match.won ? (
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.badgeGradient}
                  >
                    <Trophy size={14} color="#fff" />
                    <Text style={styles.badgeText}>WIN</Text>
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.badgeGradient}
                  >
                    <XCircle size={14} color="#fff" />
                    <Text style={styles.badgeText}>LOSS</Text>
                  </LinearGradient>
                )}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.gameName}>{match.gameName}</Text>
                <Text style={styles.gameMode}>{match.gameMode}</Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Coins size={16} color="#fbbf24" />
                    <Text style={[
                      styles.statValue,
                      match.moneyEarned > 0 ? styles.statValuePositive : styles.statValueNegative
                    ]}>
                      {match.moneyEarned > 0 ? `+$${match.moneyEarned}` : '$0'}
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Trophy size={16} color="#60a5fa" />
                    <Text style={styles.statValue}>#{match.placement}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Clock size={16} color="#94a3b8" />
                    <Text style={styles.timeText}>{formatTimeAgo(match.timestamp)}</Text>
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  gameImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#0f172a',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  resultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
  },
  gameName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 2,
  },
  gameMode: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statValuePositive: {
    color: '#22c55e',
  },
  statValueNegative: {
    color: '#94a3b8',
  },
  timeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  footerSpace: {
    height: 100,
  },
});
