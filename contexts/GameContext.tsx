import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { GameMatch } from '@/types/game';

const STORAGE_KEY = 'game_matches';
const CROWNS_KEY = 'game_crowns';
const XP_KEY = 'game_xp';
const GEMS_KEY = 'game_gems';
const LEVEL_KEY = 'game_level';
const XP_BAR_COLOR_KEY = 'xp_bar_color';
const XP_BADGE_COLOR_KEY = 'xp_badge_color';
const LAST_SPIN_KEY = 'last_spin_time';
const LAST_DAILY_CLAIM_KEY = 'last_daily_claim';
const DAILY_STREAK_KEY = 'daily_streak';
const PROFILE_PICTURE_KEY = 'profile_picture';
const USERNAME_KEY = 'username';
const AD_WATCH_KEY = 'ad_watch_data';
const GIFT_BUTTON_POSITION_KEY = 'gift_button_position';

const AD_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_ADS_PER_PERIOD = 2;

const SPIN_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export const XP_BAR_COLORS = [
  { id: 'green', name: 'Emerald', colors: ['#22c55e', '#16a34a'] },
  { id: 'blue', name: 'Ocean', colors: ['#3b82f6', '#2563eb'] },
  { id: 'red', name: 'Ruby', colors: ['#ef4444', '#dc2626'] },
  { id: 'purple', name: 'Amethyst', colors: ['#8b5cf6', '#7c3aed'] },
  { id: 'orange', name: 'Flame', colors: ['#f97316', '#ea580c'] },
  { id: 'pink', name: 'Rose', colors: ['#ec4899', '#db2777'] },
  { id: 'cyan', name: 'Arctic', colors: ['#06b6d4', '#0891b2'] },
  { id: 'gold', name: 'Gold', colors: ['#fbbf24', '#f59e0b'] },
] as const;

const XP_WIN = 100;
const XP_LOSE = 50;
const LEVEL_UP_GEM_REWARD = 50;
const MAX_XP_REQUIREMENT = 10000;

const getXpRequiredForLevel = (level: number): number => {
  if (level <= 1) return 100;
  
  let xpRequired = 100;
  for (let i = 2; i <= level; i++) {
    if (i % 2 === 0) {
      xpRequired += 100;
    } else {
      xpRequired *= 2;
    }
    if (xpRequired > MAX_XP_REQUIREMENT) {
      xpRequired = MAX_XP_REQUIREMENT;
    }
  }
  return xpRequired;
};

const getTotalXpForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXpRequiredForLevel(i);
  }
  return total;
};

const getLevelFromTotalXp = (totalXp: number): number => {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    const required = getXpRequiredForLevel(level);
    if (xpNeeded + required > totalXp) break;
    xpNeeded += required;
    level++;
  }
  return level;
};

export const [GameProvider, useGame] = createContextHook(() => {
  const [matches, setMatches] = useState<GameMatch[]>([]);
  const [gems, setGems] = useState<number>(100);
  const [money, setMoney] = useState<number>(0);
  const [crowns, setCrowns] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);
  const [newLevel, setNewLevel] = useState<number>(1);
  const [xpBarColorId, setXpBarColorId] = useState<string>('green');
  const [xpBadgeColorId, setXpBadgeColorId] = useState<string>('purple');
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [lastDailyClaim, setLastDailyClaim] = useState<string | null>(null);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [profilePicture, setProfilePictureState] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string>('Player');
  const [adWatchCount, setAdWatchCount] = useState<number>(0);
  const [adCooldownStart, setAdCooldownStart] = useState<number | null>(null);
  const [giftButtonPosition, setGiftButtonPositionState] = useState<{ x: number; y: number } | null>(null);
  const previousLevelRef = useRef<number>(1);

  const level = getLevelFromTotalXp(xp);
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const xpRequiredForNextLevel = getXpRequiredForLevel(level);
  const currentLevelXp = xp - xpForCurrentLevel;
  const xpProgress = Math.round((currentLevelXp / xpRequiredForNextLevel) * 100);

  const loadCrowns = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CROWNS_KEY);
      if (stored) {
        setCrowns(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading crowns:', error);
    }
  }, []);

  const loadXp = useCallback(async () => {
    try {
      const storedXp = await AsyncStorage.getItem(XP_KEY);
      const storedGems = await AsyncStorage.getItem(GEMS_KEY);
      const storedLevel = await AsyncStorage.getItem(LEVEL_KEY);
      
      if (storedXp) {
        const parsedXp = JSON.parse(storedXp);
        setXp(parsedXp);
        const currentLevel = getLevelFromTotalXp(parsedXp);
        previousLevelRef.current = currentLevel;
      }
      if (storedGems) {
        setGems(JSON.parse(storedGems));
      }
      if (storedLevel) {
        previousLevelRef.current = JSON.parse(storedLevel);
      }
      
      const storedColor = await AsyncStorage.getItem(XP_BAR_COLOR_KEY);
      if (storedColor) {
        setXpBarColorId(JSON.parse(storedColor));
      }

      const storedBadgeColor = await AsyncStorage.getItem(XP_BADGE_COLOR_KEY);
      if (storedBadgeColor) {
        setXpBadgeColorId(JSON.parse(storedBadgeColor));
      }

      const storedLastSpin = await AsyncStorage.getItem(LAST_SPIN_KEY);
      if (storedLastSpin) {
        setLastSpinTime(JSON.parse(storedLastSpin));
      }

      const storedLastDaily = await AsyncStorage.getItem(LAST_DAILY_CLAIM_KEY);
      if (storedLastDaily) {
        setLastDailyClaim(JSON.parse(storedLastDaily));
      }

      const storedStreak = await AsyncStorage.getItem(DAILY_STREAK_KEY);
      if (storedStreak) {
        setDailyStreak(JSON.parse(storedStreak));
      }

      const storedProfilePic = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      if (storedProfilePic) {
        setProfilePictureState(JSON.parse(storedProfilePic));
      }

      const storedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      if (storedUsername) {
        setUsernameState(JSON.parse(storedUsername));
      }

      const storedAdData = await AsyncStorage.getItem(AD_WATCH_KEY);
      if (storedAdData) {
        const adData = JSON.parse(storedAdData);
        const elapsed = Date.now() - (adData.cooldownStart || 0);
        if (elapsed >= AD_COOLDOWN_MS) {
          setAdWatchCount(0);
          setAdCooldownStart(null);
        } else {
          setAdWatchCount(adData.count || 0);
          setAdCooldownStart(adData.cooldownStart);
        }
      }

      const storedGiftPos = await AsyncStorage.getItem(GIFT_BUTTON_POSITION_KEY);
      if (storedGiftPos) {
        setGiftButtonPositionState(JSON.parse(storedGiftPos));
      }
    } catch (error) {
      console.log('Error loading XP:', error);
    }
  }, []);

  const pendingLevelUp = useRef<{ oldLevel: number; newLevel: number } | null>(null);

  const addXp = useCallback((won: boolean) => {
    const xpGain = won ? XP_WIN : XP_LOSE;
    setXp(prev => {
      const newXp = prev + xpGain;
      const oldLevel = getLevelFromTotalXp(prev);
      const updatedLevel = getLevelFromTotalXp(newXp);
      
      AsyncStorage.setItem(XP_KEY, JSON.stringify(newXp)).catch(error => {
        console.log('Error saving XP:', error);
      });
      
      if (updatedLevel > oldLevel) {
        console.log('Level up detected! Old:', oldLevel, 'New:', updatedLevel);
        pendingLevelUp.current = { oldLevel, newLevel: updatedLevel };
      }
      
      return newXp;
    });
  }, []);

  useEffect(() => {
    if (pendingLevelUp.current) {
      const { newLevel: updatedLevel } = pendingLevelUp.current;
      pendingLevelUp.current = null;
      
      setNewLevel(updatedLevel);
      setShowLevelUp(true);
      previousLevelRef.current = updatedLevel;
      
      setGems(prevGems => {
        const newGems = prevGems + LEVEL_UP_GEM_REWARD;
        AsyncStorage.setItem(GEMS_KEY, JSON.stringify(newGems)).catch(error => {
          console.log('Error saving gems:', error);
        });
        return newGems;
      });
      
      AsyncStorage.setItem(LEVEL_KEY, JSON.stringify(updatedLevel)).catch(error => {
        console.log('Error saving level:', error);
      });
    }
  }, [xp]);

  const loadMatches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMatches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading matches:', error);
    }
  }, []);

  const saveMatch = useCallback(async (match: GameMatch) => {
    setMatches(prev => {
      const updated = [match, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(error => {
        console.log('Error saving match:', error);
      });
      return updated;
    });
    
    if (match.moneyEarned > 0) {
      setMoney(prev => prev + match.moneyEarned);
    }
    
    if (match.won) {
      setCrowns(prev => {
        const newCrowns = prev + 10;
        AsyncStorage.setItem(CROWNS_KEY, JSON.stringify(newCrowns)).catch(error => {
          console.log('Error saving crowns:', error);
        });
        return newCrowns;
      });
    }
    
    addXp(match.won);
  }, [addXp]);

  const addGems = useCallback((amount: number) => {
    setGems(prev => {
      const newGems = prev + amount;
      AsyncStorage.setItem(GEMS_KEY, JSON.stringify(newGems)).catch(error => {
        console.log('Error saving gems:', error);
      });
      return newGems;
    });
  }, []);

  const addMoney = useCallback((amount: number) => {
    setMoney(prev => prev + amount);
  }, []);

  const addCrowns = useCallback((amount: number) => {
    setCrowns(prev => {
      const newCrowns = prev + amount;
      AsyncStorage.setItem(CROWNS_KEY, JSON.stringify(newCrowns)).catch(error => {
        console.log('Error saving crowns:', error);
      });
      return newCrowns;
    });
  }, []);

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  const spendMoney = useCallback((amount: number) => {
    setMoney(prev => Math.max(0, prev - amount));
  }, []);

  const setXpBarColor = useCallback((colorId: string) => {
    setXpBarColorId(colorId);
    AsyncStorage.setItem(XP_BAR_COLOR_KEY, JSON.stringify(colorId)).catch(error => {
      console.log('Error saving XP bar color:', error);
    });
  }, []);

  const setXpBadgeColor = useCallback((colorId: string) => {
    setXpBadgeColorId(colorId);
    AsyncStorage.setItem(XP_BADGE_COLOR_KEY, JSON.stringify(colorId)).catch(error => {
      console.log('Error saving XP badge color:', error);
    });
  }, []);

  const xpBarColors = XP_BAR_COLORS.find(c => c.id === xpBarColorId)?.colors || XP_BAR_COLORS[0].colors;
  const xpBadgeColors = XP_BAR_COLORS.find(c => c.id === xpBadgeColorId)?.colors || XP_BAR_COLORS[3].colors;

  const canSpin = !lastSpinTime || (Date.now() - lastSpinTime >= SPIN_COOLDOWN_MS);
  
  const getSpinCooldownRemaining = useCallback(() => {
    if (!lastSpinTime) return 0;
    const remaining = SPIN_COOLDOWN_MS - (Date.now() - lastSpinTime);
    return Math.max(0, remaining);
  }, [lastSpinTime]);

  const recordSpin = useCallback(() => {
    const now = Date.now();
    setLastSpinTime(now);
    AsyncStorage.setItem(LAST_SPIN_KEY, JSON.stringify(now)).catch(error => {
      console.log('Error saving spin time:', error);
    });
  }, []);

  const canClaimDaily = useCallback(() => {
    if (!lastDailyClaim) return true;
    const lastDate = new Date(lastDailyClaim).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  }, [lastDailyClaim]);

  const setProfilePicture = useCallback((uri: string | null) => {
    setProfilePictureState(uri);
    if (uri) {
      AsyncStorage.setItem(PROFILE_PICTURE_KEY, JSON.stringify(uri)).catch(error => {
        console.log('Error saving profile picture:', error);
      });
    } else {
      AsyncStorage.removeItem(PROFILE_PICTURE_KEY).catch(error => {
        console.log('Error removing profile picture:', error);
      });
    }
  }, []);

  const setUsername = useCallback((name: string) => {
    const trimmedName = name.trim() || 'Player';
    setUsernameState(trimmedName);
    AsyncStorage.setItem(USERNAME_KEY, JSON.stringify(trimmedName)).catch(error => {
      console.log('Error saving username:', error);
    });
  }, []);

  const claimDailyReward = useCallback(() => {
    const today = new Date().toISOString();
    
    let newStreak = 1;
    if (lastDailyClaim) {
      const lastDate = new Date(lastDailyClaim);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate.toDateString() === yesterday.toDateString()) {
        newStreak = dailyStreak + 1;
      }
    }
    
    setLastDailyClaim(today);
    setDailyStreak(newStreak);
    
    AsyncStorage.setItem(LAST_DAILY_CLAIM_KEY, JSON.stringify(today)).catch(error => {
      console.log('Error saving daily claim:', error);
    });
    AsyncStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(newStreak)).catch(error => {
      console.log('Error saving streak:', error);
    });
    
    return newStreak;
  }, [lastDailyClaim, dailyStreak]);

  const canWatchAd = useCallback(() => {
    if (adCooldownStart) {
      const elapsed = Date.now() - adCooldownStart;
      if (elapsed >= AD_COOLDOWN_MS) {
        return true;
      }
      return adWatchCount < MAX_ADS_PER_PERIOD;
    }
    return true;
  }, [adCooldownStart, adWatchCount]);

  const getAdCooldownRemaining = useCallback(() => {
    if (!adCooldownStart || adWatchCount < MAX_ADS_PER_PERIOD) return 0;
    const remaining = AD_COOLDOWN_MS - (Date.now() - adCooldownStart);
    return Math.max(0, remaining);
  }, [adCooldownStart, adWatchCount]);

  const recordAdWatch = useCallback(() => {
    const now = Date.now();
    let newCount = adWatchCount + 1;
    let newCooldownStart = adCooldownStart;

    if (!adCooldownStart || (now - adCooldownStart >= AD_COOLDOWN_MS)) {
      newCount = 1;
      newCooldownStart = now;
    }

    setAdWatchCount(newCount);
    setAdCooldownStart(newCooldownStart);

    AsyncStorage.setItem(AD_WATCH_KEY, JSON.stringify({
      count: newCount,
      cooldownStart: newCooldownStart,
    })).catch(error => {
      console.log('Error saving ad data:', error);
    });
  }, [adWatchCount, adCooldownStart]);

  const getAdsRemaining = useCallback(() => {
    if (!adCooldownStart) return MAX_ADS_PER_PERIOD;
    const elapsed = Date.now() - adCooldownStart;
    if (elapsed >= AD_COOLDOWN_MS) return MAX_ADS_PER_PERIOD;
    return Math.max(0, MAX_ADS_PER_PERIOD - adWatchCount);
  }, [adCooldownStart, adWatchCount]);

  const setGiftButtonPosition = useCallback((position: { x: number; y: number }) => {
    setGiftButtonPositionState(position);
    AsyncStorage.setItem(GIFT_BUTTON_POSITION_KEY, JSON.stringify(position)).catch(error => {
      console.log('Error saving gift button position:', error);
    });
  }, []);

  return {
    matches,
    level,
    gems,
    money,
    crowns,
    xp,
    xpProgress,
    currentLevelXp,
    xpRequiredForNextLevel,
    showLevelUp,
    newLevel,
    xpBarColorId,
    xpBarColors,
    xpBadgeColorId,
    xpBadgeColors,
    profilePicture,
    username,
    loadMatches,
    loadCrowns,
    loadXp,
    saveMatch,
    addGems,
    addMoney,
    addCrowns,
    addXp,
    spendMoney,
    dismissLevelUp,
    setXpBarColor,
    setXpBadgeColor,
    setProfilePicture,
    setUsername,
    canSpin,
    getSpinCooldownRemaining,
    recordSpin,
    lastSpinTime,
    canClaimDaily,
    claimDailyReward,
    dailyStreak,
    canWatchAd,
    getAdCooldownRemaining,
    recordAdWatch,
    getAdsRemaining,
    giftButtonPosition,
    setGiftButtonPosition,
  };
});
