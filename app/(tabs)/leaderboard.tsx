import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import CurrencyHeader from '@/components/CurrencyHeader';

const PLACEHOLDER_AVATARS = [
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=pixel&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=rocket&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=zigzag&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=bubble&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=cosmic&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=spark&backgroundColor=c1f4c5',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=zippy&backgroundColor=ffeaa7',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=blitz&backgroundColor=dfe6e9',
  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=flash&backgroundColor=fab1a0',
];

const PLACEHOLDER_NAMES = [
  'CaptainCrunch',
  'PixelPanda',
  'WackyWombat',
  'TurboTaco',
  'NinjaNoodle',
  'CosmicCookie',
  'BubbleBee',
  'ZiggyZap',
  'SparkySpud',
];

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  crowns: number;
  isPlayer: boolean;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { crowns: playerCrowns, profilePicture, username } = useGame();

  const generateLeaderboard = (): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];
    
    entries.push({
      id: 'player',
      name: username || 'Player',
      avatar: profilePicture || 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=player&backgroundColor=fbbf24',
      crowns: playerCrowns,
      isPlayer: true,
    });

    for (let i = 0; i < 9; i++) {
      const crownValue = i * 10;
      entries.push({
        id: `bot-${i}`,
        name: PLACEHOLDER_NAMES[i],
        avatar: PLACEHOLDER_AVATARS[i],
        crowns: crownValue,
        isPlayer: false,
      });
    }

    entries.sort((a, b) => b.crowns - a.crowns);

    return entries;
  };

  const leaderboard = generateLeaderboard();

  const getRankStyle = (rank: number) => {
    if (rank === 1) return styles.rank1;
    if (rank === 2) return styles.rank2;
    if (rank === 3) return styles.rank3;
    return null;
  };

  const getRankColors = (rank: number): [string, string] => {
    if (rank === 1) return ['#fbbf24', '#f59e0b'];
    if (rank === 2) return ['#94a3b8', '#64748b'];
    if (rank === 3) return ['#cd7f32', '#b87333'];
    return ['#1e293b', '#0f172a'];
  };

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
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        <Text style={styles.subtitle}>Compete for the top spot!</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {leaderboard.slice(0, 3).length > 0 && (
          <View style={styles.topThreeContainer}>
            {leaderboard.slice(0, 3).map((entry, index) => {
              const rank = index + 1;
              const podiumOrder = rank === 1 ? 1 : rank === 2 ? 0 : 2;
              const podiumHeight = rank === 1 ? 80 : rank === 2 ? 60 : 50;
              
              return (
                <View 
                  key={entry.id} 
                  style={[
                    styles.topThreeItem,
                    { order: podiumOrder }
                  ]}
                >
                  <View style={[styles.topThreeAvatarContainer, entry.isPlayer && styles.playerHighlight]}>
                    {rank === 1 && (
                      <View style={styles.crownBadge}>
                        <Crown size={16} color="#fbbf24" fill="#fbbf24" />
                      </View>
                    )}
                    <Image 
                      source={{ uri: entry.avatar }} 
                      style={[styles.topThreeAvatar, getRankStyle(rank)]}
                    />
                  </View>
                  <Text style={[styles.topThreeName, entry.isPlayer && styles.playerName]} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <View style={styles.topThreeCrowns}>
                    <Crown size={14} color="#fbbf24" />
                    <Text style={styles.topThreeCrownsText}>{entry.crowns}</Text>
                  </View>
                  <LinearGradient
                    colors={getRankColors(rank)}
                    style={[styles.podium, { height: podiumHeight }]}
                  >
                    <Text style={styles.podiumRank}>#{rank}</Text>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.listContainer}>
          {leaderboard.slice(3).map((entry, index) => {
            const rank = index + 4;
            return (
              <View 
                key={entry.id} 
                style={[styles.listItem, entry.isPlayer && styles.listItemPlayer]}
              >
                <Text style={styles.rankNumber}>#{rank}</Text>
                <Image 
                  source={{ uri: entry.avatar }} 
                  style={[styles.listAvatar, entry.isPlayer && styles.listAvatarPlayer]}
                />
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, entry.isPlayer && styles.playerName]} numberOfLines={1}>
                    {entry.name}
                  </Text>
                </View>
                <View style={styles.listCrowns}>
                  <Crown size={16} color="#fbbf24" />
                  <Text style={styles.listCrownsText}>{entry.crowns}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Crown size={20} color="#fbbf24" />
          <Text style={styles.infoText}>Win games to earn crowns and climb the leaderboard!</Text>
        </View>

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
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  topThreeItem: {
    alignItems: 'center',
    width: 100,
  },
  topThreeAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  crownBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -8,
    zIndex: 10,
  },
  topThreeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#374151',
  },
  rank1: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#fbbf24',
  },
  rank2: {
    borderColor: '#94a3b8',
  },
  rank3: {
    borderColor: '#cd7f32',
  },
  playerHighlight: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  topThreeName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
    maxWidth: 90,
    textAlign: 'center',
  },
  playerName: {
    color: '#fbbf24',
  },
  topThreeCrowns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  topThreeCrownsText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fbbf24',
  },
  podium: {
    width: 70,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fff',
  },
  listContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.2)',
  },
  listItemPlayer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
    width: 32,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  listAvatarPlayer: {
    borderColor: '#fbbf24',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  listCrowns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  listCrownsText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fbbf24',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  footerSpace: {
    height: 20,
  },
});
