import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Diamond, DollarSign, Check } from 'lucide-react-native';
import { useGame } from '@/contexts/GameContext';

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
  { id: 'm3', amount: 25, price: 19.99, bonus: 5 },
  { id: 'm4', amount: 50, price: 39.99, bonus: 15 },
  { id: 'm5', amount: 100000, price: 99.99, bonus: 25000 },
];

const diamondItems: PurchaseItem[] = [
  { id: 'd1', amount: 100, price: 0.99 },
  { id: 'd2', amount: 300, price: 2.99, bonus: 50, popular: true },
  { id: 'd3', amount: 600, price: 4.99, bonus: 150 },
  { id: 'd4', amount: 1500, price: 9.99, bonus: 500 },
  { id: 'd5', amount: 1000000, price: 99.99, bonus: 250000 },
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { addMoney, addGems, gems, money } = useGame();

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
                  <Text style={styles.itemAmountGreen}>${item.amount >= 1000 ? (item.amount >= 1000000 ? `${(item.amount / 1000000).toFixed(0)}M` : `${(item.amount / 1000).toFixed(0)}K`) : item.amount}</Text>
                  {item.bonus && (
                    <Text style={styles.bonusText}>+${item.bonus >= 1000 ? (item.bonus >= 1000000 ? `${(item.bonus / 1000000).toFixed(0)}M` : `${(item.bonus / 1000).toFixed(0)}K`) : item.bonus} FREE</Text>
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
                  <Text style={styles.itemAmountBlue}>{item.amount >= 1000 ? (item.amount >= 1000000 ? `${(item.amount / 1000000).toFixed(0)}M` : `${(item.amount / 1000).toFixed(0)}K`) : item.amount}</Text>
                  {item.bonus && (
                    <Text style={styles.bonusTextBlue}>+{item.bonus >= 1000 ? (item.bonus >= 1000000 ? `${(item.bonus / 1000000).toFixed(0)}M` : `${(item.bonus / 1000).toFixed(0)}K`) : item.bonus} FREE</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 3,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    minWidth: 100,
  },
  balanceItemGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    minWidth: 100,
  },
  dollarIcon: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconBlue: {
    width: 32,
    height: 32,
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
    gap: 10,
  },
  itemCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
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
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
