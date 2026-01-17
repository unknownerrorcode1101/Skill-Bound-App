import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Diamond, DollarSign, Check, Gift, Play, Clock, Ticket, ArrowDownCircle } from 'lucide-react-native';
import { useGame } from '@/contexts/GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  } else if (amount >= 100) {
    return `${amount.toFixed(0)}`;
  }
  return `${amount.toFixed(2)}`;
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

interface PurchaseItem {
  id: string;
  amount: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const moneyItems: PurchaseItem[] = [
  { id: 'm1', amount: 5, price: 4.99 },
  { id: 'm2', amount: 10, price: 9.99, bonus: 1, popular: true },
  { id: 'm3', amount: 25, price: 24.99, bonus: 2 },
  { id: 'm4', amount: 50, price: 49.99, bonus: 5 },
];

const diamondItems: PurchaseItem[] = [
  { id: 'd1', amount: 100, price: 0.99 },
  { id: 'd2', amount: 300, price: 2.99, bonus: 25, popular: true },
  { id: 'd3', amount: 600, price: 5.99, bonus: 50 },
  { id: 'd4', amount: 1500, price: 14.99, bonus: 150 },
];

const FREE_GEMS_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const FREE_GEMS_AMOUNT = 25;

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { addMoney, addGems, gems, money } = useGame();
  const [promoCode, setPromoCode] = useState('');
  const [freeGemsAvailable, setFreeGemsAvailable] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    checkFreeGemsCooldown();
    const interval = setInterval(() => {
      checkFreeGemsCooldown();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkFreeGemsCooldown = async () => {
    try {
      const lastClaim = await AsyncStorage.getItem('lastFreeGemsClaim');
      if (lastClaim) {
        const elapsed = Date.now() - parseInt(lastClaim, 10);
        if (elapsed < FREE_GEMS_COOLDOWN) {
          setFreeGemsAvailable(false);
          setTimeRemaining(FREE_GEMS_COOLDOWN - elapsed);
        } else {
          setFreeGemsAvailable(true);
          setTimeRemaining(0);
        }
      } else {
        setFreeGemsAvailable(true);
        setTimeRemaining(0);
      }
    } catch (e) {
      console.log('Error checking cooldown:', e);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleClaimFreeGems = async () => {
    if (!freeGemsAvailable) return;
    
    try {
      await AsyncStorage.setItem('lastFreeGemsClaim', Date.now().toString());
      addGems(FREE_GEMS_AMOUNT);
      setFreeGemsAvailable(false);
      setTimeRemaining(FREE_GEMS_COOLDOWN);
      Alert.alert('Free Gems!', `You received ${FREE_GEMS_AMOUNT} gems!`);
    } catch (e) {
      console.log('Error claiming free gems:', e);
    }
  };

  const handleWatchVideo = () => {
    addGems(10);
    Alert.alert('Reward Earned!', 'You received 10 gems for watching!');
  };

  const handleRedeemPromo = () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }
    
    const code = promoCode.trim().toUpperCase();
    if (code === 'SKILLBOUND100') {
      addGems(100);
      Alert.alert('Success!', 'You received 100 gems!');
      setPromoCode('');
    } else if (code === 'WELCOME50') {
      addGems(50);
      Alert.alert('Success!', 'You received 50 gems!');
      setPromoCode('');
    } else {
      Alert.alert('Invalid Code', 'This promo code is invalid or expired');
    }
  };

  const handleWithdraw = () => {
    if (money < 10) {
      Alert.alert('Minimum Withdrawal', 'You need at least $10 to withdraw');
      return;
    }
    Alert.alert(
      'Withdraw Funds',
      `You have $${formatCompact(money)} available for withdrawal. Withdrawals are processed within 24-48 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Withdrawal', onPress: () => Alert.alert('Request Submitted', 'Your withdrawal request has been submitted for review.') }
      ]
    );
  };

  const handleBuyCash = (item: PurchaseItem) => {
    const totalAmount = item.amount + (item.bonus || 0);
    addMoney(totalAmount);
    console.log(`Purchased $${totalAmount} cash`);
  };

  const handleBuyDiamonds = (item: PurchaseItem) => {
    const totalAmount = item.amount + (item.bonus || 0);
    addGems(totalAmount);
    console.log(`Purchased ${totalAmount} diamonds`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>STORE</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Diamond size={18} color="#60a5fa" fill="#60a5fa" />
            <Text style={styles.balanceText} numberOfLines={1}>{formatGemsCompact(gems)}</Text>
          </View>
          <View style={styles.balanceItemGreen}>
            <Text style={styles.dollarIcon}>$</Text>
            <Text style={styles.balanceText} numberOfLines={1}>{formatCompact(money)}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Withdraw Button */}
        <TouchableOpacity 
          style={styles.withdrawButton}
          onPress={handleWithdraw}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.withdrawGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ArrowDownCircle size={22} color="#fff" />
            <Text style={styles.withdrawText}>WITHDRAW FUNDS</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Free Gems Section */}
        <View style={styles.freeSection}>
          <View style={styles.freeSectionHeader}>
            <Gift size={20} color="#f59e0b" />
            <Text style={styles.freeSectionTitle}>FREE GEMS</Text>
          </View>
          
          <View style={styles.freeOptionsRow}>
            {/* 4 Hour Free Gems */}
            <TouchableOpacity 
              style={[styles.freeCard, !freeGemsAvailable && styles.freeCardDisabled]}
              onPress={handleClaimFreeGems}
              activeOpacity={0.8}
              disabled={!freeGemsAvailable}
            >
              <View style={styles.freeCardIcon}>
                {freeGemsAvailable ? (
                  <Gift size={24} color="#f59e0b" />
                ) : (
                  <Clock size={24} color="#64748b" />
                )}
              </View>
              <Text style={styles.freeCardAmount}>+{FREE_GEMS_AMOUNT}</Text>
              <Diamond size={14} color="#60a5fa" fill="#60a5fa" style={styles.freeCardDiamond} />
              {freeGemsAvailable ? (
                <View style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>CLAIM</Text>
                </View>
              ) : (
                <Text style={styles.cooldownText}>{formatTimeRemaining(timeRemaining)}</Text>
              )}
            </TouchableOpacity>

            {/* Watch Video */}
            <TouchableOpacity 
              style={styles.freeCard}
              onPress={handleWatchVideo}
              activeOpacity={0.8}
            >
              <View style={styles.videoCardIcon}>
                <Play size={24} color="#ef4444" fill="#ef4444" />
              </View>
              <Text style={styles.freeCardAmount}>+10</Text>
              <Diamond size={14} color="#60a5fa" fill="#60a5fa" style={styles.freeCardDiamond} />
              <View style={styles.watchButton}>
                <Text style={styles.watchButtonText}>WATCH</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Code Section */}
        <View style={styles.promoSection}>
          <View style={styles.promoHeader}>
            <Ticket size={18} color="#22c55e" />
            <Text style={styles.promoTitle}>PROMO CODE</Text>
          </View>
          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code..."
              placeholderTextColor="#64748b"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.promoButton}
              onPress={handleRedeemPromo}
              activeOpacity={0.8}
            >
              <Text style={styles.promoButtonText}>REDEEM</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconGreen}>
              <DollarSign size={18} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>CASH</Text>
          </View>

          <View style={styles.itemsRow}>
            {moneyItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                <View style={styles.itemContent}>
                  <View style={styles.itemIconGreen}>
                    <DollarSign size={20} color="#22c55e" />
                  </View>
                  <Text style={styles.itemAmountGreen}>${item.amount}</Text>
                  {item.bonus && (
                    <Text style={styles.bonusText}>+${item.bonus} FREE</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleBuyCash(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.buyButtonGradient}
                  >
                    <Text style={styles.buyButtonText}>${item.price.toFixed(2)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBlue}>
              <Diamond size={18} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.sectionTitle}>DIAMONDS</Text>
          </View>

          <View style={styles.itemsRow}>
            {diamondItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {item.popular && (
                  <View style={styles.popularBadgeBlue}>
                    <Text style={styles.popularText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.itemContent}>
                  <View style={styles.itemIconBlue}>
                    <Diamond size={20} color="#60a5fa" fill="#60a5fa" />
                  </View>
                  <Text style={styles.itemAmountBlue}>{item.amount}</Text>
                  {item.bonus && (
                    <Text style={styles.bonusTextBlue}>+{item.bonus} FREE</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleBuyDiamonds(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={styles.buyButtonGradient}
                  >
                    <Text style={styles.buyButtonText}>${item.price.toFixed(2)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Check size={16} color="#22c55e" />
            <Text style={styles.infoText}>Instant delivery to your account</Text>
          </View>
          <View style={styles.infoRow}>
            <Check size={16} color="#22c55e" />
            <Text style={styles.infoText}>Secure payment processing</Text>
          </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    minWidth: 95,
  },
  balanceItemGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    minWidth: 95,
  },
  dollarIcon: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  withdrawButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  withdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  freeSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  freeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  freeSectionTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#f59e0b',
    letterSpacing: 1,
  },
  freeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freeCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  freeCardDisabled: {
    opacity: 0.7,
  },
  freeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeCardAmount: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#fff',
  },
  freeCardDiamond: {
    marginTop: 2,
    marginBottom: 8,
  },
  claimButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
  },
  watchButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watchButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
  },
  cooldownText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  promoSection: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#22c55e',
    letterSpacing: 1,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  promoInput: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  promoButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconBlue: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  popularBadgeBlue: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  popularText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  itemContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemIconGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIconBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemAmountGreen: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#22c55e',
  },
  itemAmountBlue: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#60a5fa',
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#22c55e',
    marginTop: 4,
  },
  bonusTextBlue: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#60a5fa',
    marginTop: 4,
  },
  buyButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  buyButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
  },
  infoSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  footerSpace: {
    height: 30,
  },
});
