import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gem, DollarSign, Check, Gift, Play, Clock, Ticket, ArrowDownCircle, CreditCard, X, Sparkles } from 'lucide-react-native';
import { useGame } from '@/contexts/GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CurrencyHeader from '@/components/CurrencyHeader';



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

const FREE_GEMS_COOLDOWN = 4 * 60 * 60 * 1000;
const FREE_GEMS_AMOUNT = 25;
const AD_GEMS_AMOUNT = 10;

const formatAdCooldown = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
};

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { 
    addMoney, 
    addGems, 
    money,
    canWatchAd,
    getAdCooldownRemaining,
    recordAdWatch,
    getAdsRemaining
  } = useGame();
  
  const [promoCode, setPromoCode] = useState('');
  const [freeGemsAvailable, setFreeGemsAvailable] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [adCooldown, setAdCooldown] = useState(0);
  const [adsLeft, setAdsLeft] = useState(2);
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    checkFreeGemsCooldown();
    const interval = setInterval(() => {
      checkFreeGemsCooldown();
      setAdCooldown(getAdCooldownRemaining());
      setAdsLeft(getAdsRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [getAdCooldownRemaining, getAdsRemaining]);

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

  const showThemedNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  const handleClaimFreeGems = async () => {
    if (!freeGemsAvailable) return;
    
    try {
      await AsyncStorage.setItem('lastFreeGemsClaim', Date.now().toString());
      addGems(FREE_GEMS_AMOUNT);
      setFreeGemsAvailable(false);
      setTimeRemaining(FREE_GEMS_COOLDOWN);
      showThemedNotification('Free Gems!', `You received ${FREE_GEMS_AMOUNT} gems!`, 'success');
    } catch (e) {
      console.log('Error claiming free gems:', e);
    }
  };

  const handleWatchVideo = () => {
    if (!canWatchAd()) {
      showThemedNotification('Ad Limit Reached', `You can watch more ads in ${formatAdCooldown(adCooldown)}`, 'info');
      return;
    }
    
    recordAdWatch();
    addGems(AD_GEMS_AMOUNT);
    showThemedNotification('Reward Earned!', `You received ${AD_GEMS_AMOUNT} gems for watching!`, 'success');
  };

  const handleRedeemPromo = () => {
    if (!promoCode.trim()) {
      showThemedNotification('Error', 'Please enter a promo code', 'error');
      return;
    }
    
    const code = promoCode.trim().toUpperCase();
    if (code === 'SKILLBOUND100') {
      addGems(100);
      showThemedNotification('Success!', 'You received 100 gems!', 'success');
      setPromoCode('');
    } else if (code === 'WELCOME50') {
      addGems(50);
      showThemedNotification('Success!', 'You received 50 gems!', 'success');
      setPromoCode('');
    } else {
      showThemedNotification('Invalid Code', 'This promo code is invalid or expired', 'error');
    }
  };

  const handleWithdraw = () => {
    if (money < 10) {
      showThemedNotification('Minimum Withdrawal', 'You need at least $10 to withdraw', 'info');
      return;
    }
    setWithdrawAmount(money.toFixed(2));
    setShowWithdrawModal(true);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ').substring(0, 19) : '';
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleSubmitWithdrawal = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      showThemedNotification('Invalid Card', 'Please enter a valid card number', 'error');
      return;
    }
    if (!expiryDate || expiryDate.length < 5) {
      showThemedNotification('Invalid Expiry', 'Please enter a valid expiry date', 'error');
      return;
    }
    if (!cvv || cvv.length < 3) {
      showThemedNotification('Invalid CVV', 'Please enter a valid CVV', 'error');
      return;
    }
    if (!cardholderName.trim()) {
      showThemedNotification('Missing Name', 'Please enter the cardholder name', 'error');
      return;
    }

    setShowWithdrawModal(false);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
    
    setTimeout(() => {
      showThemedNotification('Request Submitted', 'Your withdrawal request has been submitted for review. Funds will arrive within 24-48 hours.', 'success');
    }, 300);
  };

  const handleBuyCash = (item: PurchaseItem) => {
    const totalAmount = item.amount + (item.bonus || 0);
    addMoney(totalAmount);
    showThemedNotification('Purchase Complete!', `You received $${totalAmount} cash!`, 'success');
  };

  const handleBuyDiamonds = (item: PurchaseItem) => {
    const totalAmount = item.amount + (item.bonus || 0);
    addGems(totalAmount);
    showThemedNotification('Purchase Complete!', `You received ${totalAmount} gems!`, 'success');
  };

  const canWatch = canWatchAd();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <CurrencyHeader showDivider={false} />
      </View>

      <View style={styles.titleSection}>
        <Sparkles size={24} color="#fbbf24" />
        <Text style={styles.headerTitle}>STORE</Text>
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.withdrawButton}
          onPress={handleWithdraw}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8b5cf6', '#6d28d9', '#5b21b6']}
            style={styles.withdrawGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ArrowDownCircle size={22} color="#fff" />
            <Text style={styles.withdrawText}>WITHDRAW FUNDS</Text>
            <View style={styles.withdrawBadge}>
              <CreditCard size={12} color="#8b5cf6" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.freeSection}>
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.15)', 'rgba(245, 158, 11, 0.05)']}
            style={styles.freeSectionBg}
          />
          <View style={styles.freeSectionHeader}>
            <Gift size={20} color="#fbbf24" />
            <Text style={styles.freeSectionTitle}>FREE GEMS</Text>
            {adsLeft < 2 && (
              <View style={styles.adsRemainingBadge}>
                <Text style={styles.adsRemainingText}>{adsLeft}/2 ads left</Text>
              </View>
            )}
          </View>
          
          <View style={styles.freeOptionsRow}>
            <TouchableOpacity 
              style={[styles.freeCard, !freeGemsAvailable && styles.freeCardDisabled]}
              onPress={handleClaimFreeGems}
              activeOpacity={0.8}
              disabled={!freeGemsAvailable}
            >
              <LinearGradient
                colors={freeGemsAvailable ? ['#1e293b', '#334155'] : ['#1e293b', '#1e293b']}
                style={styles.freeCardBg}
              />
              <View style={styles.freeCardIcon}>
                {freeGemsAvailable ? (
                  <Gift size={24} color="#fbbf24" />
                ) : (
                  <Clock size={24} color="#64748b" />
                )}
              </View>
              <Text style={styles.freeCardAmount}>+{FREE_GEMS_AMOUNT}</Text>
              <Gem size={14} color="#60a5fa" fill="#60a5fa" style={styles.freeCardDiamond} />
              {freeGemsAvailable ? (
                <View style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>CLAIM</Text>
                </View>
              ) : (
                <Text style={styles.cooldownText}>{formatTimeRemaining(timeRemaining)}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.freeCard, !canWatch && styles.freeCardDisabled]}
              onPress={handleWatchVideo}
              activeOpacity={0.8}
              disabled={!canWatch}
            >
              <LinearGradient
                colors={canWatch ? ['#1e293b', '#334155'] : ['#1e293b', '#1e293b']}
                style={styles.freeCardBg}
              />
              <View style={styles.videoCardIcon}>
                <Play size={24} color={canWatch ? '#ef4444' : '#64748b'} fill={canWatch ? '#ef4444' : '#64748b'} />
              </View>
              <Text style={styles.freeCardAmount}>+{AD_GEMS_AMOUNT}</Text>
              <Gem size={14} color="#60a5fa" fill="#60a5fa" style={styles.freeCardDiamond} />
              {canWatch ? (
                <View style={styles.watchButton}>
                  <Text style={styles.watchButtonText}>WATCH</Text>
                </View>
              ) : (
                <Text style={styles.cooldownText}>{formatAdCooldown(adCooldown)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.promoSection}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(22, 163, 74, 0.05)']}
            style={styles.promoSectionBg}
          />
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
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.promoButtonGradient}
              >
                <Text style={styles.promoButtonText}>REDEEM</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.sectionIconGreen}
            >
              <DollarSign size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>CASH</Text>
          </View>

          <View style={styles.itemsRow}>
            {moneyItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <LinearGradient
                  colors={['#1e293b', '#0f172a']}
                  style={styles.itemCardBg}
                />
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
                  {item.bonus ? (
                    <Text style={styles.bonusText}>+${item.bonus} FREE</Text>
                  ) : (
                    <Text style={styles.placeholderText}>.</Text>
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
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.sectionIconBlue}
            >
              <Gem size={18} color="#fff" fill="#fff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>GEMS</Text>
          </View>

          <View style={styles.itemsRow}>
            {diamondItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <LinearGradient
                  colors={['#1e293b', '#0f172a']}
                  style={styles.itemCardBg}
                />
                {item.popular && (
                  <View style={styles.popularBadgeBlue}>
                    <Text style={styles.popularText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.itemContent}>
                  <View style={styles.itemIconBlue}>
                    <Gem size={20} color="#60a5fa" fill="#60a5fa" />
                  </View>
                  <Text style={styles.itemAmountBlue}>{item.amount}</Text>
                  {item.bonus ? (
                    <Text style={styles.bonusTextBlue}>+{item.bonus} FREE</Text>
                  ) : (
                    <Text style={styles.placeholderText}>.</Text>
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

      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowWithdrawModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Withdraw Funds</Text>
                <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                  <X size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.withdrawAmountContainer}>
                <Text style={styles.withdrawAmountLabel}>Amount to withdraw</Text>
                <Text style={styles.withdrawAmountValue}>${withdrawAmount}</Text>
              </View>

              <View style={styles.cardForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputContainer}>
                    <CreditCard size={18} color="#64748b" />
                    <TextInput
                      style={styles.cardInput}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#475569"
                      value={cardNumber}
                      onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Expiry</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="MM/YY"
                      placeholderTextColor="#475569"
                      value={expiryDate}
                      onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="123"
                      placeholderTextColor="#475569"
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="John Doe"
                    placeholderTextColor="#475569"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitWithdrawal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6d28d9']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>REQUEST WITHDRAWAL</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.withdrawNote}>
                Withdrawals are processed within 24-48 hours
              </Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showNotification}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotification(false)}
      >
        <Pressable 
          style={styles.notificationOverlay}
          onPress={() => setShowNotification(false)}
        >
          <Pressable style={styles.notificationContent} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={[
                styles.notificationGradient,
                notificationType === 'success' && styles.notificationSuccess,
                notificationType === 'error' && styles.notificationError,
                notificationType === 'info' && styles.notificationInfo,
              ]}
            >
              <View style={styles.notificationIconContainer}>
                {notificationType === 'success' && (
                  <View style={styles.notificationIconSuccess}>
                    <Check size={28} color="#fff" strokeWidth={3} />
                  </View>
                )}
                {notificationType === 'error' && (
                  <View style={styles.notificationIconError}>
                    <X size={28} color="#fff" strokeWidth={3} />
                  </View>
                )}
                {notificationType === 'info' && (
                  <View style={styles.notificationIconInfo}>
                    <Clock size={28} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.notificationTitle}>{notificationTitle}</Text>
              <Text style={styles.notificationMessage}>{notificationMessage}</Text>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => setShowNotification(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    notificationType === 'success' ? ['#22c55e', '#16a34a'] :
                    notificationType === 'error' ? ['#ef4444', '#dc2626'] :
                    ['#3b82f6', '#2563eb']
                  }
                  style={styles.notificationButtonGradient}
                >
                  <Text style={styles.notificationButtonText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 2,
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
  },
  withdrawButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  withdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  withdrawBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginLeft: 4,
  },
  freeSection: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    overflow: 'hidden',
  },
  freeSectionBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
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
    color: '#fbbf24',
    letterSpacing: 1,
    flex: 1,
  },
  adsRemainingBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adsRemainingText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fbbf24',
  },
  freeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freeCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    overflow: 'hidden',
  },
  freeCardBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  freeCardDisabled: {
    opacity: 0.7,
  },
  freeCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  videoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  freeCardAmount: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#fff',
  },
  freeCardDiamond: {
    marginTop: 2,
    marginBottom: 10,
  },
  claimButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#000',
  },
  watchButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    overflow: 'hidden',
  },
  promoSectionBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  promoButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  promoButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    gap: 10,
  },
  sectionIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconBlue: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  itemCardBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 10,
  },
  popularBadgeBlue: {
    position: 'absolute',
    top: -1,
    right: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
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
    minHeight: 95,
    justifyContent: 'center',
  },
  itemIconGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  itemIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  itemAmountGreen: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#22c55e',
  },
  itemAmountBlue: {
    fontSize: 24,
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
  placeholderText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'transparent',
    marginTop: 4,
  },
  buyButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  buyButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#fff',
  },
  infoSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
  },
  withdrawAmountContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  withdrawAmountLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  withdrawAmountValue: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#8b5cf6',
  },
  cardForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  cardInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inputRow: {
    flexDirection: 'row',
  },
  smallInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  withdrawNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
  },
  notificationGradient: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
  },
  notificationSuccess: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  notificationError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  notificationInfo: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  notificationIconContainer: {
    marginBottom: 16,
  },
  notificationIconSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconError: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconInfo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  notificationButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  notificationButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  notificationButtonText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#fff',
  },
});
