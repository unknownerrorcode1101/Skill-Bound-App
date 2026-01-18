import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Star, Zap, Gift, Award, Palette, Check, Pencil } from 'lucide-react-native';
import { useGame, XP_BAR_COLORS } from '@/contexts/GameContext';
import CurrencyHeader from '@/components/CurrencyHeader';

const RANKS = [
  { name: 'Rookie', minLevel: 1, maxLevel: 5, color: '#94a3b8', icon: '🌱' },
  { name: 'Bronze', minLevel: 6, maxLevel: 10, color: '#cd7f32', icon: '🥉' },
  { name: 'Silver', minLevel: 11, maxLevel: 20, color: '#c0c0c0', icon: '🥈' },
  { name: 'Gold', minLevel: 21, maxLevel: 35, color: '#ffd700', icon: '🥇' },
  { name: 'Platinum', minLevel: 36, maxLevel: 50, color: '#e5e4e2', icon: '💎' },
  { name: 'Diamond', minLevel: 51, maxLevel: 75, color: '#b9f2ff', icon: '💠' },
  { name: 'Master', minLevel: 76, maxLevel: 100, color: '#ff6b6b', icon: '🏆' },
  { name: 'Legend', minLevel: 101, maxLevel: 999, color: '#fbbf24', icon: '👑' },
];



export default function XPScreen() {
  const insets = useSafeAreaInsets();
  const { 
    level, 
    xp, 
    xpProgress, 
    currentLevelXp, 
    xpRequiredForNextLevel,
    xpBarColorId,
    xpBarColors,
    setXpBarColor,
  } = useGame();

  const currentRank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[0];
  const nextRank = RANKS.find(r => r.minLevel > level) || null;
  const levelsToNextRank = nextRank ? nextRank.minLevel - level : 0;

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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXPERIENCE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.levelSection}>
          <View style={styles.levelCircleWrapper}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
              style={styles.levelCircle}
            >
              <Text style={styles.levelNumber}>{level}</Text>
              <Text style={styles.levelLabel}>LEVEL</Text>
            </LinearGradient>
            <View style={styles.levelGlow} />
            <TouchableOpacity 
              style={styles.levelEditButton}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Pencil size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.xpBarSection}>
          <View style={styles.xpBarHeader}>
            <View style={styles.xpInfo}>
              <Zap size={18} color={xpBarColors[0]} fill={xpBarColors[0]} />
              <Text style={styles.xpText}>{currentLevelXp.toLocaleString()} XP</Text>
            </View>
            <Text style={styles.xpNeeded}>{xpRequiredForNextLevel.toLocaleString()} XP needed</Text>
          </View>
          
          <View style={styles.xpBarContainer}>
            <View style={styles.xpBarBg}>
              <LinearGradient
                colors={[xpBarColors[0], xpBarColors[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpBarFill, { width: `${xpProgress}%` }]}
              />
              <View style={styles.xpBarShine} />
            </View>
            <View style={styles.xpBarLabels}>
              <Text style={styles.xpBarLabelLeft}>0</Text>
              <Text style={styles.xpBarPercent}>{xpProgress}%</Text>
              <Text style={styles.xpBarLabelRight}>{xpRequiredForNextLevel.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.xpRemaining}>
            <Text style={styles.xpRemainingText}>
              {(xpRequiredForNextLevel - currentLevelXp).toLocaleString()} XP to Level {level + 1}
            </Text>
          </View>
        </View>

        <View style={styles.rankSection}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#fbbf24" />
            <Text style={styles.sectionTitle}>CURRENT RANK</Text>
          </View>
          
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.02)']}
            style={styles.rankCard}
          >
            <View style={styles.rankMain}>
              <Text style={styles.rankIcon}>{currentRank.icon}</Text>
              <View style={styles.rankInfo}>
                <Text style={[styles.rankName, { color: currentRank.color }]}>{currentRank.name}</Text>
                <Text style={styles.rankLevelRange}>
                  Level {currentRank.minLevel} - {currentRank.maxLevel}
                </Text>
              </View>
            </View>
            
            {nextRank && (
              <View style={styles.nextRankInfo}>
                <Text style={styles.nextRankText}>
                  {levelsToNextRank} level{levelsToNextRank !== 1 ? 's' : ''} to {nextRank.name} {nextRank.icon}
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.allRanks}>
            <Text style={styles.allRanksTitle}>All Ranks</Text>
            <View style={styles.ranksGrid}>
              {RANKS.map((rank, index) => {
                const isCurrentRank = rank.name === currentRank.name;
                const isUnlocked = level >= rank.minLevel;
                return (
                  <View 
                    key={rank.name} 
                    style={[
                      styles.rankBadge,
                      isCurrentRank && styles.rankBadgeActive,
                      !isUnlocked && styles.rankBadgeLocked,
                    ]}
                  >
                    <Text style={[styles.rankBadgeIcon, !isUnlocked && styles.rankBadgeIconLocked]}>
                      {rank.icon}
                    </Text>
                    <Text style={[
                      styles.rankBadgeName, 
                      { color: isUnlocked ? rank.color : '#475569' }
                    ]}>
                      {rank.name}
                    </Text>
                    <Text style={styles.rankBadgeLevel}>Lv.{rank.minLevel}+</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.rewardsSection}>
          <View style={styles.sectionHeader}>
            <Gift size={20} color="#22c55e" />
            <Text style={styles.sectionTitle}>LEVEL UP REWARDS</Text>
          </View>
          
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.02)']}
            style={styles.rewardsCard}
          >
            <View style={styles.rewardItem}>
              <View style={styles.rewardIconContainer}>
                <Zap size={24} color="#60a5fa" fill="#60a5fa" />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>50 Gems</Text>
                <Text style={styles.rewardDescription}>Earned every level up</Text>
              </View>
              <View style={styles.rewardCheck}>
                <Check size={18} color="#22c55e" />
              </View>
            </View>
            
            <View style={styles.rewardDivider} />
            
            <View style={styles.rewardItem}>
              <View style={[styles.rewardIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                <Star size={24} color="#a855f7" fill="#a855f7" />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>Rank Progress</Text>
                <Text style={styles.rewardDescription}>Level up to unlock new ranks</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.cosmeticsSection}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>XP BAR COLORS</Text>
          </View>
          
          <LinearGradient
            colors={['rgba(236, 72, 153, 0.1)', 'rgba(236, 72, 153, 0.02)']}
            style={styles.cosmeticsCard}
          >
            <Text style={styles.cosmeticsSubtitle}>Customize your XP bar appearance</Text>
            
            <View style={styles.colorsGrid}>
              {XP_BAR_COLORS.map((colorOption) => {
                const isSelected = xpBarColorId === colorOption.id;
                return (
                  <TouchableOpacity
                    key={colorOption.id}
                    style={[styles.colorOption, isSelected && styles.colorOptionSelected]}
                    onPress={() => setXpBarColor(colorOption.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[colorOption.colors[0], colorOption.colors[1]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.colorPreview}
                    />
                    <Text style={[styles.colorName, isSelected && styles.colorNameSelected]}>
                      {colorOption.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.colorCheck}>
                        <Check size={14} color="#22c55e" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewBar}>
                <LinearGradient
                  colors={[xpBarColors[0], xpBarColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.previewBarFill, { width: '65%' }]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.totalXpSection}>
          <Text style={styles.totalXpLabel}>TOTAL XP EARNED</Text>
          <Text style={styles.totalXpValue}>{xp.toLocaleString()} XP</Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
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
  levelSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  levelCircleWrapper: {
    position: 'relative',
  },
  levelCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  levelGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  levelEditButton: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a2744',
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#fff',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
    marginTop: -4,
  },
  xpBarSection: {
    marginBottom: 24,
  },
  xpBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  xpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
  },
  xpNeeded: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  xpBarContainer: {
    marginBottom: 8,
  },
  xpBarBg: {
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 14,
  },
  xpBarShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  xpBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  xpBarLabelLeft: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  xpBarPercent: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
  },
  xpBarLabelRight: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  xpRemaining: {
    alignItems: 'center',
    marginTop: 4,
  },
  xpRemainingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#94a3b8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#94a3b8',
    letterSpacing: 1,
  },
  rankSection: {
    marginBottom: 24,
  },
  rankCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    marginBottom: 16,
  },
  rankMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankIcon: {
    fontSize: 48,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 28,
    fontWeight: '900' as const,
    marginBottom: 2,
  },
  rankLevelRange: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  nextRankInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextRankText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    textAlign: 'center',
  },
  allRanks: {
    marginTop: 8,
  },
  allRanksTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#64748b',
    marginBottom: 12,
  },
  ranksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankBadge: {
    width: '23%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  rankBadgeActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  rankBadgeLocked: {
    opacity: 0.5,
  },
  rankBadgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  rankBadgeIconLocked: {
    opacity: 0.5,
  },
  rankBadgeName: {
    fontSize: 10,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  rankBadgeLevel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#475569',
  },
  rewardsSection: {
    marginBottom: 24,
  },
  rewardsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  rewardCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 14,
  },
  cosmeticsSection: {
    marginBottom: 24,
  },
  cosmeticsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  cosmeticsSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#64748b',
    marginBottom: 16,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: '23%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  colorOptionSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  colorPreview: {
    width: 40,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  colorName: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#94a3b8',
  },
  colorNameSelected: {
    color: '#22c55e',
  },
  colorCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  previewSection: {
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
  },
  previewBar: {
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  totalXpSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalXpLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 6,
  },
  totalXpValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
  },
});
