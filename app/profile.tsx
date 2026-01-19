import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, ChevronLeft, Trophy, DollarSign, Gamepad2, TrendingUp, Award, Zap, ChevronRight, Camera, ImageIcon, X, Trash2, Pencil, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGame } from '@/contexts/GameContext';
import CurrencyHeader from '@/components/CurrencyHeader';

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

const PRESET_AVATARS = [
  'https://r2-pub.rork.com/generated-images/fdbb28f5-161e-4516-81ab-88f2f2ce916e.png',
  'https://r2-pub.rork.com/generated-images/1c031575-a6a2-4be5-9ad7-735b37a18dda.png',
  'https://r2-pub.rork.com/generated-images/4155fec4-057f-4918-8111-1929f9a51c24.png',
  'https://r2-pub.rork.com/generated-images/76b19f76-5731-4312-866c-aa38d00a9939.png',
  'https://r2-pub.rork.com/generated-images/652e4797-9130-4ed1-99ed-348ac43144f1.png',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { 
    matches, money, crowns, level, xpProgress, xpBarColors, xpBadgeColors,
    currentLevelXp, xpRequiredForNextLevel, profilePicture, setProfilePicture,
    username, setUsername
  } = useGame();
  
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);

  const gamesPlayed = matches.length;
  const gamesWon = matches.filter(m => m.won).length;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.log('Camera permission denied');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
    setShowImagePicker(false);
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Gallery permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
    setShowImagePicker(false);
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
    setShowImagePicker(false);
  };

  const handleSelectPreset = (presetUrl: string) => {
    setProfilePicture(presetUrl);
    setShowImagePicker(false);
  };

  const handleEditUsername = () => {
    setEditedUsername(username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = () => {
    if (editedUsername.trim()) {
      setUsername(editedUsername.trim());
    }
    setIsEditingUsername(false);
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={() => setShowImagePicker(true)}
            activeOpacity={0.8}
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                style={styles.avatarLarge}
              >
                <Crown size={48} color="#fbbf24" fill="#fbbf24" />
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Camera size={14} color="#fff" />
            </View>
            <View style={styles.levelBadgeLarge}>
              <LinearGradient
                colors={[xpBadgeColors[0], xpBadgeColors[1]]}
                style={styles.levelBadgeInner}
              >
                <Text style={styles.levelTextLarge}>{level}</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
          {isEditingUsername ? (
            <View style={styles.usernameEditContainer}>
              <TextInput
                style={styles.usernameInput}
                value={editedUsername}
                onChangeText={setEditedUsername}
                autoFocus
                maxLength={20}
                placeholder="Enter username"
                placeholderTextColor="#64748b"
                onSubmitEditing={handleSaveUsername}
              />
              <TouchableOpacity 
                style={styles.saveUsernameButton}
                onPress={handleSaveUsername}
              >
                <Check size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.usernameContainer}
              onPress={handleEditUsername}
              activeOpacity={0.7}
            >
              <Text style={styles.playerName}>{username}</Text>
              <Pencil size={16} color="#64748b" style={styles.editIcon} />
            </TouchableOpacity>
          )}
          <Text style={styles.playerTag}>#BRICK2024</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <Crown size={24} color="#fbbf24" fill="#fbbf24" />
              </View>
              <Text style={styles.statValue}>{crowns}</Text>
              <Text style={styles.statLabel}>CROWNS</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <DollarSign size={24} color="#22c55e" />
              </View>
              <Text style={styles.statValue}>${formatCompact(money)}</Text>
              <Text style={styles.statLabel}>MONEY</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(96, 165, 250, 0.15)', 'rgba(96, 165, 250, 0.05)']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                <Gamepad2 size={24} color="#60a5fa" />
              </View>
              <Text style={styles.statValue}>{gamesPlayed}</Text>
              <Text style={styles.statLabel}>GAMES PLAYED</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                <Trophy size={24} color="#a855f7" />
              </View>
              <Text style={styles.statValue}>{gamesWon}</Text>
              <Text style={styles.statLabel}>WINS</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.winRateCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.1)', 'rgba(96, 165, 250, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.winRateGradient}
          >
            <View style={styles.winRateHeader}>
              <TrendingUp size={20} color="#22c55e" />
              <Text style={styles.winRateTitle}>WIN RATE</Text>
            </View>
            <View style={styles.winRateContent}>
              <Text style={styles.winRateValue}>{winRate}%</Text>
              <View style={styles.winRateBar}>
                <View style={styles.winRateBarBg}>
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.winRateBarFill, { width: `${winRate}%` }]}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity 
          style={styles.xpSection}
          onPress={() => router.push('/xp' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.08)']}
            style={styles.xpCard}
          >
            <View style={styles.xpCardHeader}>
              <View style={styles.xpIconContainer}>
                <Zap size={22} color={xpBarColors[0]} fill={xpBarColors[0]} />
              </View>
              <View style={styles.xpCardInfo}>
                <Text style={styles.xpCardTitle}>EXPERIENCE</Text>
                <Text style={styles.xpCardLevel}>Level {level}</Text>
              </View>
              <ChevronRight size={24} color="#64748b" />
            </View>
            <View style={styles.xpCardBarContainer}>
              <View style={styles.xpCardBarBg}>
                <LinearGradient
                  colors={[xpBarColors[0], xpBarColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpCardBarFill, { width: `${xpProgress}%` }]}
                />
              </View>
              <View style={styles.xpCardBarLabels}>
                <Text style={styles.xpCardXpText}>{currentLevelXp.toLocaleString()} XP</Text>
                <Text style={styles.xpCardXpNeeded}>{xpRequiredForNextLevel.toLocaleString()} XP</Text>
              </View>
            </View>
            <Text style={styles.xpCardSubtext}>Tap to view rewards & customize</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.rankSection}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.rankCard}
          >
            <View style={styles.rankHeader}>
              <Award size={20} color="#8b5cf6" />
              <Text style={styles.rankTitle}>CURRENT RANK</Text>
            </View>
            <View style={styles.rankContent}>
              <Text style={styles.rankName}>Bronze I</Text>
              <Text style={styles.rankSubtext}>Keep earning crowns to rank up!</Text>
            </View>
            <View style={styles.rankProgress}>
              <View style={styles.rankProgressBar}>
                <LinearGradient
                  colors={['#8b5cf6', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.rankProgressFill, { width: `${Math.min((crowns / 200) * 100, 100)}%` }]}
                />
              </View>
              <Text style={styles.rankProgressText}>{crowns}/200 to Silver</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      <Modal
        visible={showImagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={handleTakePhoto}>
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Camera size={24} color="#3b82f6" />
              </View>
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleChooseFromGallery}>
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <ImageIcon size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <View style={styles.presetSection}>
              <Text style={styles.presetTitle}>Choose a Preset</Text>
              <View style={styles.presetGrid}>
                {PRESET_AVATARS.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.presetItem,
                      profilePicture === avatar && styles.presetItemSelected
                    ]}
                    onPress={() => handleSelectPreset(avatar)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: avatar }} style={styles.presetImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {profilePicture && (
              <TouchableOpacity style={styles.modalOption} onPress={handleRemovePhoto}>
                <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Trash2 size={24} color="#ef4444" />
                </View>
                <Text style={[styles.modalOptionText, { color: '#ef4444' }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#60a5fa',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#60a5fa',
  },
  editBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a2744',
  },
  levelBadgeLarge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  levelBadgeInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a2744',
  },
  levelTextLarge: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
  },
  playerName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  playerTag: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#64748b',
    letterSpacing: 1,
  },
  winRateCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  winRateGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  winRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  winRateTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#94a3b8',
    letterSpacing: 1,
  },
  winRateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  winRateValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  winRateBar: {
    flex: 1,
  },
  winRateBarBg: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  winRateBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  rankSection: {
    marginBottom: 16,
  },
  rankCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rankTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#94a3b8',
    letterSpacing: 1,
  },
  rankContent: {
    marginBottom: 16,
  },
  rankName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#cd7f32',
  },
  rankSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  rankProgress: {
    gap: 8,
  },
  rankProgressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rankProgressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    textAlign: 'right',
  },
  xpSection: {
    marginBottom: 12,
  },
  xpCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  xpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  xpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  xpCardInfo: {
    flex: 1,
  },
  xpCardTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    letterSpacing: 1,
  },
  xpCardLevel: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
  },
  xpCardBarContainer: {
    marginBottom: 10,
  },
  xpCardBarBg: {
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  xpCardBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  xpCardBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpCardXpText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#a78bfa',
  },
  xpCardXpNeeded: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  xpCardSubtext: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 150,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  saveUsernameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: 4,
  },
  presetSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    borderColor: '#3b82f6',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
});
