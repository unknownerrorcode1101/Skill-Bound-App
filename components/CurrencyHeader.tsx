import { View, Text, StyleSheet, TouchableOpacity, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Gem, Crown, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';

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

interface CurrencyHeaderProps {
  showDivider?: boolean;
}

export default function CurrencyHeader({ showDivider = true }: CurrencyHeaderProps) {
  const { gems, money, level, xpProgress, xpBarColors, xpBadgeColors } = useGame();
  
  const [showMoneyTooltip, setShowMoneyTooltip] = useState(false);
  const [showGemsTooltip, setShowGemsTooltip] = useState(false);

  return (
    <>
      <View style={[styles.header, showDivider && styles.headerWithBorder]}>
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
                colors={[xpBadgeColors[0], xpBadgeColors[1]]}
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
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  headerWithBorder: {
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
    borderColor: '#0f172a',
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
