import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Play, Zap, Target, Clock, Trophy, ArrowLeft, Gem } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 40;
const PLAYER_BODY_HEIGHT = 28;
const WHEEL_HEIGHT = 16;
const WHEEL_MARGIN = 2;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;
const BULLET_SPEED = 14;
const BASE_FIRE_RATE = 60;
const ROUND_DURATION = 60;

const GRAVITY = 0.045;
const BASE_RESTITUTION = 0.95;
const BIG_BALL_RESTITUTION = 0.98;
const WALL_RESTITUTION = 0.9;

const PLAYER_DRIFT_SMALL = 0.008;
const PLAYER_DRIFT_MEDIUM = 0.015;
const PLAYER_DRIFT_BIG = 0.025;
const MAX_DRIFT_VELOCITY = 1.2;

const MAX_SMALL_BALLS = 5;
const MAX_MEDIUM_BALLS = 3;
const MAX_BIG_BALLS = 2;
const MAX_TOTAL_BALLS = 8;

const SPAWN_PAUSE_THRESHOLD = 8;
const SPAWN_RESUME_THRESHOLD = 6;

const BIG_BALL_BASE_CHANCE = 0.10;
const BIG_BALL_MAX_CHANCE = 0.35;
const MEDIUM_BALL_BASE_CHANCE = 0.30;
const MEDIUM_BALL_MAX_CHANCE = 0.45;

const SPAWN_INTERVAL_START_MIN = 1200;
const SPAWN_INTERVAL_START_MAX = 1600;
const SPAWN_INTERVAL_FLOOR = 750;
const SPAWN_INTERVAL_DECREASE = 50;
const DIFFICULTY_INCREASE_INTERVAL = 15;

const BIG_BALL_COOLDOWN = 9000;
const MAX_CONSECUTIVE_MEDIUM = 3;
const PLAYER_SAFE_ZONE_PERCENT = 0.18;

const SMALL_BALL_SIZE = 30;
const MEDIUM_BALL_SIZE = 50;
const LARGE_BALL_SIZE = 80;

const SMALL_THRESHOLD = 38;
const LARGE_THRESHOLD = 65;

const SMALL_BALL_HEALTH = 3;
const MEDIUM_BALL_HEALTH = 8;
const LARGE_BALL_HEALTH = 15;

interface Rock {
  id: string;
  x: number;
  y: number;
  size: number;
  health: number;
  maxHealth: number;
  velocityX: number;
  velocityY: number;
  color: string;
  tier: 'large' | 'medium' | 'small';
}

interface Bullet {
  id: string;
  x: number;
  y: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  life: number;
}

interface Upgrades {
  fireRate: number;
  bulletSize: number;
  bulletDamage: number;
}

const ROCK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

const getRandomColor = () => ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)];

export default function BallBlasterSurvival() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saveMatch, gems, money, addGems, spendMoney } = useGame();
  const GAME_TOP = insets.top + 60;
  const GAME_BOTTOM = SCREEN_HEIGHT - insets.bottom - 40;
  const PLAYER_Y = GAME_BOTTOM - PLAYER_HEIGHT - 80;
  const WHEEL_BOTTOM_Y = PLAYER_Y + PLAYER_BODY_HEIGHT + WHEEL_MARGIN + WHEEL_HEIGHT;
  const GROUND_Y = WHEEL_BOTTOM_Y;

  const [gameState, setGameState] = useState<'menu' | 'wager' | 'playing' | 'gameover' | 'upgrades'>('menu');
  const [wagerType, setWagerType] = useState<'diamonds' | 'money'>('diamonds');
  const [wagerAmount, setWagerAmount] = useState<number>(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [playerX, setPlayerX] = useState(SCREEN_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [objectsDestroyed, setObjectsDestroyed] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({
    fireRate: 0,
    bulletSize: 0,
    bulletDamage: 0,
  });
  const [totalGems, setTotalGems] = useState(100);

  const playerXRef = useRef(playerX);
  const gameLoopRef = useRef<number | null>(null);
  const bulletTimerRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const timeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rocksRef = useRef<Rock[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const objectsDestroyedRef = useRef(0);
  const frameCountRef = useRef(0);
  const difficultyRef = useRef(1);
  const spawnIntervalRef = useRef(SPAWN_INTERVAL_START_MAX);
  const lastBigBallSpawnRef = useRef(0);
  const spawnPausedRef = useRef(false);
  const gameTimeRef = useRef(0);
  const lastDifficultyIncreaseRef = useRef(0);
  const consecutiveMediumSpawnsRef = useRef(0);

  const wheelAnim = useRef(new Animated.Value(0)).current;
  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);

  useEffect(() => {
    rocksRef.current = rocks;
  }, [rocks]);

  useEffect(() => {
    bulletsRef.current = bullets;
  }, [bullets]);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      newParticles.push({
        id: `particle-${Date.now()}-${Math.random()}-${i}`,
        x,
        y,
        velocityX: Math.cos(angle) * (2 + Math.random() * 2),
        velocityY: Math.sin(angle) * (2 + Math.random() * 2),
        color,
        life: 1,
      });
    }
    return newParticles;
  }, []);

  const getHealthMultiplier = useCallback((): number => {
    const elapsedTime = gameTimeRef.current;
    
    if (elapsedTime < 15) {
      return 1.0;
    } else if (elapsedTime < 30) {
      const progress = (elapsedTime - 15) / 15;
      return 1.0 + progress * 0.30;
    } else if (elapsedTime < 45) {
      const progress = (elapsedTime - 30) / 15;
      return 1.30 + progress * 0.25;
    } else {
      const progress = Math.min((elapsedTime - 45) / 15, 1);
      return 1.55 + progress * 0.15;
    }
  }, []);

  const getHealthForTier = useCallback((tier: 'large' | 'medium' | 'small'): number => {
    const multiplier = getHealthMultiplier();
    
    switch (tier) {
      case 'large': 
        return Math.floor((LARGE_BALL_HEALTH + difficultyRef.current * 0.5) * multiplier);
      case 'medium': 
        return Math.floor((MEDIUM_BALL_HEALTH + difficultyRef.current * 0.3) * multiplier);
      case 'small': 
        return Math.floor((SMALL_BALL_HEALTH + difficultyRef.current * 0.15) * (1 + (multiplier - 1) * 0.4));
    }
  }, [getHealthMultiplier]);

  const getSizeForTier = useCallback((tier: 'large' | 'medium' | 'small'): number => {
    switch (tier) {
      case 'large': return LARGE_BALL_SIZE + Math.random() * 15;
      case 'medium': return MEDIUM_BALL_SIZE + Math.random() * 10;
      case 'small': return SMALL_BALL_SIZE + Math.random() * 8;
    }
  }, []);

  const getSpeedMultiplier = useCallback((tier: 'large' | 'medium' | 'small'): number => {
    switch (tier) {
      case 'large': return 0.7;
      case 'medium': return 1.0;
      case 'small': return 1.4;
    }
  }, []);

  const getBallTier = useCallback((size: number): 'large' | 'medium' | 'small' => {
    if (size >= LARGE_THRESHOLD) return 'large';
    if (size <= SMALL_THRESHOLD) return 'small';
    return 'medium';
  }, []);

  const countBallsByTier = useCallback((rocks: Rock[]) => {
    let big = 0;
    let medium = 0;
    let small = 0;
    
    rocks.forEach(rock => {
      const tier = getBallTier(rock.size);
      if (tier === 'large') big++;
      else if (tier === 'medium') medium++;
      else small++;
    });
    
    return { big, medium, small, total: rocks.length };
  }, [getBallTier]);

  const canSpawnTier = useCallback((tier: 'large' | 'medium' | 'small', counts: { big: number; medium: number; small: number; total: number }) => {
    if (counts.total >= MAX_TOTAL_BALLS) return false;
    
    switch (tier) {
      case 'large':
        if (counts.big >= MAX_BIG_BALLS) return false;
        if (Date.now() - lastBigBallSpawnRef.current < BIG_BALL_COOLDOWN) return false;
        return true;
      case 'medium':
        if (counts.medium >= MAX_MEDIUM_BALLS) return false;
        if (consecutiveMediumSpawnsRef.current >= MAX_CONSECUTIVE_MEDIUM) return false;
        return true;
      case 'small':
        return counts.small < MAX_SMALL_BALLS;
    }
  }, []);

  const selectSpawnTier = useCallback((counts: { big: number; medium: number; small: number; total: number }): 'large' | 'medium' | 'small' | null => {
    const gameProgress = Math.min(gameTimeRef.current / 45, 1);
    
    const bigChance = BIG_BALL_BASE_CHANCE + gameProgress * (BIG_BALL_MAX_CHANCE - BIG_BALL_BASE_CHANCE);
    const mediumChance = MEDIUM_BALL_BASE_CHANCE + gameProgress * (MEDIUM_BALL_MAX_CHANCE - MEDIUM_BALL_BASE_CHANCE);
    
    const roll = Math.random();
    
    if (roll < bigChance && canSpawnTier('large', counts)) {
      return 'large';
    }
    
    if (roll < bigChance + mediumChance && canSpawnTier('medium', counts)) {
      return 'medium';
    }
    
    if (canSpawnTier('small', counts)) {
      return 'small';
    }
    
    if (canSpawnTier('medium', counts)) return 'medium';
    if (canSpawnTier('large', counts)) return 'large';
    
    return null;
  }, [canSpawnTier]);

  const findSafeSpawnPosition = useCallback((size: number, existingRocks: Rock[], newRocks: Rock[]): { x: number; y: number } | null => {
    const currentPlayerX = playerXRef.current + PLAYER_WIDTH / 2;
    const safeZoneHalf = SCREEN_WIDTH * PLAYER_SAFE_ZONE_PERCENT;
    const safeZoneLeft = currentPlayerX - safeZoneHalf;
    const safeZoneRight = currentPlayerX + safeZoneHalf;
    
    const margin = 25;
    const minX = margin;
    const maxX = SCREEN_WIDTH - size - margin;
    
    for (let attempt = 0; attempt < 15; attempt++) {
      let spawnX: number;
      
      if (attempt < 10) {
        spawnX = minX + Math.random() * (maxX - minX);
        const centerX = spawnX + size / 2;
        if (centerX > safeZoneLeft && centerX < safeZoneRight) {
          if (Math.random() < 0.5) {
            spawnX = Math.max(minX, safeZoneLeft - size / 2 - 20 - Math.random() * 40);
          } else {
            spawnX = Math.min(maxX, safeZoneRight + 20 + Math.random() * 40);
          }
        }
      } else {
        spawnX = minX + Math.random() * (maxX - minX);
      }
      
      const spawnY = GAME_TOP - size - 20 - Math.random() * 30;
      
      const allRocks = [...existingRocks, ...newRocks];
      const nearTopRocks = allRocks.filter(rock => rock.y < GAME_TOP + 100);
      
      let hasOverlap = false;
      for (const rock of nearTopRocks) {
        const dx = Math.abs((spawnX + size / 2) - (rock.x + rock.size / 2));
        const dy = Math.abs((spawnY + size / 2) - (rock.y + rock.size / 2));
        const minDist = (size + rock.size) / 2 + 30;
        if (dx < minDist && dy < minDist) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        return { x: spawnX, y: spawnY };
      }
    }
    
    return null;
  }, [GAME_TOP]);

  const spawnRock = useCallback(() => {
    const existingRocks = rocksRef.current;
    const counts = countBallsByTier(existingRocks);
    
    if (counts.total >= SPAWN_PAUSE_THRESHOLD) {
      if (!spawnPausedRef.current) {
        console.log('Spawn PAUSED: total balls at max');
        spawnPausedRef.current = true;
      }
      return;
    }
    
    if (spawnPausedRef.current && counts.total <= SPAWN_RESUME_THRESHOLD) {
      console.log('Spawn RESUMED: balls cleared');
      spawnPausedRef.current = false;
    }
    
    if (spawnPausedRef.current) {
      return;
    }
    
    const tier = selectSpawnTier(counts);
    if (!tier) {
      console.log('No valid tier to spawn');
      return;
    }
    
    const size = getSizeForTier(tier);
    const position = findSafeSpawnPosition(size, existingRocks, []);
    
    if (!position) {
      console.log('Could not find safe spawn position');
      return;
    }
    
    const health = getHealthForTier(tier);
    const speedMult = getSpeedMultiplier(tier);
    
    const newRock: Rock = {
      id: `rock-${Date.now()}-${Math.random()}`,
      x: position.x,
      y: position.y,
      size,
      health,
      maxHealth: health,
      velocityX: (Math.random() - 0.5) * 1.5 * speedMult,
      velocityY: 0.3 + Math.random() * 0.4,
      color: getRandomColor(),
      tier,
    };
    
    if (tier === 'large') {
      lastBigBallSpawnRef.current = Date.now();
      consecutiveMediumSpawnsRef.current = 0;
    } else if (tier === 'medium') {
      consecutiveMediumSpawnsRef.current++;
    } else {
      consecutiveMediumSpawnsRef.current = 0;
    }
    
    rocksRef.current = [...rocksRef.current, newRock];
    setRocks(rocksRef.current);
    const healthMult = getHealthMultiplier();
    console.log(`Spawned ${tier} ball (HP mult: ${healthMult.toFixed(2)}x) | Big: ${counts.big + (tier === 'large' ? 1 : 0)}/${MAX_BIG_BALLS}, Med: ${counts.medium + (tier === 'medium' ? 1 : 0)}/${MAX_MEDIUM_BALLS}, Small: ${counts.small + (tier === 'small' ? 1 : 0)}/${MAX_SMALL_BALLS}, Total: ${counts.total + 1}/${MAX_TOTAL_BALLS}`);
  }, [countBallsByTier, selectSpawnTier, getSizeForTier, getHealthForTier, getSpeedMultiplier, findSafeSpawnPosition, getHealthMultiplier]);

  const splitRock = useCallback((rock: Rock): Rock[] => {
    if (rock.tier !== 'large') {
      return [];
    }
    
    const existingRocks = rocksRef.current;
    const counts = countBallsByTier(existingRocks);
    
    if (counts.total >= MAX_TOTAL_BALLS - 1) {
      console.log('Cannot split: would exceed max total balls');
      return [];
    }
    
    const potentialMediumCount = counts.medium + 2;
    if (potentialMediumCount > MAX_MEDIUM_BALLS + 2) {
      console.log('Cannot split: too many medium balls');
      return [];
    }
    
    const nextTier: 'medium' = 'medium';
    const newSize = getSizeForTier(nextTier);
    const newHealth = getHealthForTier(nextTier);
    
    const currentPlayerCenterX = playerXRef.current + PLAYER_WIDTH / 2;
    
    const mildHorizontalVel = 0.8 + Math.random() * 0.6;
    
    let leftX = rock.x + rock.size * 0.2 - newSize * 0.5;
    let rightX = rock.x + rock.size * 0.8 - newSize * 0.5;
    
    const playerSafeMargin = PLAYER_WIDTH + newSize;
    const playerLeft = currentPlayerCenterX - playerSafeMargin / 2;
    const playerRight = currentPlayerCenterX + playerSafeMargin / 2;
    
    if (leftX + newSize > playerLeft && leftX < playerRight && rock.y + newSize > PLAYER_Y - 50) {
      leftX = Math.max(0, playerLeft - newSize - 10);
    }
    if (rightX + newSize > playerLeft && rightX < playerRight && rock.y + newSize > PLAYER_Y - 50) {
      rightX = Math.min(SCREEN_WIDTH - newSize, playerRight + 10);
    }
    
    leftX = Math.max(0, Math.min(SCREEN_WIDTH - newSize, leftX));
    rightX = Math.max(0, Math.min(SCREEN_WIDTH - newSize, rightX));
    
    const splitRocks: Rock[] = [
      {
        id: `rock-${Date.now()}-split-left`,
        x: leftX,
        y: rock.y,
        size: newSize,
        health: newHealth,
        maxHealth: newHealth,
        velocityX: -mildHorizontalVel,
        velocityY: 0.5,
        color: getRandomColor(),
        tier: nextTier,
      },
      {
        id: `rock-${Date.now()}-split-right`,
        x: rightX,
        y: rock.y,
        size: newSize,
        health: newHealth,
        maxHealth: newHealth,
        velocityX: mildHorizontalVel,
        velocityY: 0.5,
        color: getRandomColor(),
        tier: nextTier,
      },
    ];
    
    console.log('Big ball split into 2 medium balls (gentle split)');
    return splitRocks;
  }, [getSizeForTier, getHealthForTier, countBallsByTier, PLAYER_Y]);

  const fireBullet = useCallback(() => {
    const bulletX = playerXRef.current + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2;
    const bulletY = PLAYER_Y - BULLET_HEIGHT;
    
    const newBullet: Bullet = {
      id: `bullet-${Date.now()}-${Math.random()}`,
      x: bulletX,
      y: bulletY,
    };
    
    setBullets(prev => [...prev, newBullet]);
    
    Animated.sequence([
      Animated.timing(muzzleFlashAnim, {
        toValue: 1,
        duration: 25,
        useNativeDriver: true,
      }),
      Animated.timing(muzzleFlashAnim, {
        toValue: 0,
        duration: 25,
        useNativeDriver: true,
      }),
    ]).start();
  }, [PLAYER_Y, muzzleFlashAnim]);

  const checkCollision = useCallback((
    bullet: Bullet,
    rock: Rock,
    bulletSize: number
  ): boolean => {
    const bulletCenterX = bullet.x + bulletSize / 2;
    const bulletCenterY = bullet.y + BULLET_HEIGHT / 2;
    const rockCenterX = rock.x + rock.size / 2;
    const rockCenterY = rock.y + rock.size / 2;
    
    const dx = bulletCenterX - rockCenterX;
    const dy = bulletCenterY - rockCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (rock.size / 2 + bulletSize / 2);
  }, []);

  const checkPlayerCollision = useCallback((rock: Rock): boolean => {
    const playerCenterX = playerXRef.current + PLAYER_WIDTH / 2;
    const playerCenterY = PLAYER_Y + PLAYER_HEIGHT / 2;
    const rockCenterX = rock.x + rock.size / 2;
    const rockCenterY = rock.y + rock.size / 2;
    
    const dx = playerCenterX - rockCenterX;
    const dy = playerCenterY - rockCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (rock.size / 2 + Math.min(PLAYER_WIDTH, PLAYER_HEIGHT) / 2 - 5);
  }, [PLAYER_Y]);

  const gameLoop = useCallback(() => {
    frameCountRef.current++;
    
    const currentBulletSize = BULLET_WIDTH + upgrades.bulletSize * 2;
    const bulletDamage = 1;
    const currentPlayerCenterX = playerXRef.current + PLAYER_WIDTH / 2;
    
    let updatedBullets = bulletsRef.current.map(bullet => ({
      ...bullet,
      y: bullet.y - BULLET_SPEED,
    })).filter(bullet => bullet.y > GAME_TOP - 50);
    
    let updatedRocks = rocksRef.current.map(rock => {
      const speedMult = getSpeedMultiplier(rock.tier);
      let newVelocityX = rock.velocityX;
      let newVelocityY = rock.velocityY + GRAVITY;
      
      const rockCenterX = rock.x + rock.size / 2;
      const directionToPlayer = currentPlayerCenterX - rockCenterX;
      
      let driftStrength = 0;
      switch (rock.tier) {
        case 'small':
          driftStrength = PLAYER_DRIFT_SMALL;
          break;
        case 'medium':
          driftStrength = PLAYER_DRIFT_MEDIUM;
          break;
        case 'large':
          driftStrength = PLAYER_DRIFT_BIG;
          break;
      }
      
      const driftInfluence = Math.sign(directionToPlayer) * driftStrength;
      newVelocityX += driftInfluence;
      
      const driftCap = MAX_DRIFT_VELOCITY * speedMult;
      if (Math.abs(newVelocityX) > driftCap + 2) {
        newVelocityX = Math.sign(newVelocityX) * (driftCap + 2);
      }
      
      newVelocityY = Math.min(newVelocityY, 8 * speedMult);
      
      let newX = rock.x + newVelocityX;
      let newY = rock.y + newVelocityY;
      
      if (newX <= 0) {
        newX = 0;
        newVelocityX = Math.abs(newVelocityX) * WALL_RESTITUTION;
      } else if (newX + rock.size >= SCREEN_WIDTH) {
        newX = SCREEN_WIDTH - rock.size;
        newVelocityX = -Math.abs(newVelocityX) * WALL_RESTITUTION;
      }
      
      const groundY = GROUND_Y - rock.size;
      if (newY >= groundY) {
        newY = groundY;
        
        const restitution = rock.tier === 'large' ? BIG_BALL_RESTITUTION : BASE_RESTITUTION;
        const minBounce = rock.tier === 'large' ? 3.5 : 2.5;
        
        newVelocityY = -Math.abs(newVelocityY) * restitution;
        
        if (Math.abs(newVelocityY) < minBounce) {
          newVelocityY = -minBounce;
        }
      }
      
      return { 
        ...rock, 
        x: newX, 
        y: newY, 
        velocityX: newVelocityX, 
        velocityY: newVelocityY 
      };
    });
    
    let newParticles: Particle[] = [];
    let scoreGain = 0;
    let destroyedCount = 0;
    
    const bulletsToRemove = new Set<string>();
    const rocksToRemove = new Set<string>();
    const rocksToAdd: Rock[] = [];
    
    updatedBullets.forEach(bullet => {
      updatedRocks.forEach(rock => {
        if (rocksToRemove.has(rock.id) || bulletsToRemove.has(bullet.id)) return;
        
        if (checkCollision(bullet, rock, currentBulletSize)) {
          bulletsToRemove.add(bullet.id);
          rock.health -= bulletDamage;
          scoreGain += 1;
          
          if (rock.health <= 0) {
            rocksToRemove.add(rock.id);
            destroyedCount++;
            scoreGain += rock.maxHealth * 5;
            newParticles.push(...createParticles(rock.x + rock.size / 2, rock.y + rock.size / 2, rock.color, 10));
            triggerHaptic();
            
            const splitRocks = splitRock(rock);
            rocksToAdd.push(...splitRocks);
          } else {
            newParticles.push(...createParticles(bullet.x, bullet.y, rock.color, 3));
          }
        }
      });
    });
    
    updatedBullets = updatedBullets.filter(b => !bulletsToRemove.has(b.id));
    updatedRocks = updatedRocks.filter(r => !rocksToRemove.has(r.id));
    updatedRocks.push(...rocksToAdd);
    
    let gameOver = false;
    
    updatedRocks.forEach(rock => {
      if (checkPlayerCollision(rock)) {
        gameOver = true;
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    });
    
    let updatedParticles = [...particlesRef.current, ...newParticles].map(p => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      velocityY: p.velocityY + 0.15,
      life: p.life - 0.04,
    })).filter(p => p.life > 0);
    
    setBullets(updatedBullets);
    setRocks(updatedRocks);
    setParticles(updatedParticles);
    
    if (scoreGain > 0) {
      scoreRef.current += scoreGain;
      setScore(scoreRef.current);
    }
    
    if (destroyedCount > 0) {
      objectsDestroyedRef.current += destroyedCount;
      setObjectsDestroyed(objectsDestroyedRef.current);
    }
    
    if (gameOver) {
      endGame(false);
      return;
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GAME_TOP, GAME_BOTTOM, checkCollision, checkPlayerCollision, createParticles, splitRock, triggerHaptic, upgrades, getSpeedMultiplier, spawnRock]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(ROUND_DURATION);
    setRocks([]);
    setBullets([]);
    setParticles([]);
    setObjectsDestroyed(0);
    setPlayerX(SCREEN_WIDTH / 2 - PLAYER_WIDTH / 2);
    
    scoreRef.current = 0;
    objectsDestroyedRef.current = 0;
    frameCountRef.current = 0;
    difficultyRef.current = 1;
    spawnIntervalRef.current = SPAWN_INTERVAL_START_MIN + Math.random() * (SPAWN_INTERVAL_START_MAX - SPAWN_INTERVAL_START_MIN);
    lastBigBallSpawnRef.current = 0;
    spawnPausedRef.current = false;
    gameTimeRef.current = 0;
    lastDifficultyIncreaseRef.current = 0;
    consecutiveMediumSpawnsRef.current = 0;
    
    console.log('Game started - Ball Blast mode');
    
    Animated.loop(
      Animated.timing(wheelAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ).start();
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    const fireRate = BASE_FIRE_RATE - (upgrades.fireRate * 8);
    bulletTimerRef.current = setInterval(() => {
      if (isTouchingRef.current) {
        fireBullet();
      }
    }, fireRate) as unknown as number;
    
    const scheduleSpawn = () => {
      const variance = (Math.random() - 0.5) * 200;
      const currentInterval = Math.max(SPAWN_INTERVAL_FLOOR, spawnIntervalRef.current + variance);
      console.log(`Spawn interval: ${currentInterval.toFixed(0)}ms, Base: ${spawnIntervalRef.current.toFixed(0)}ms`);
      
      spawnTimerRef.current = setTimeout(() => {
        spawnRock();
        scheduleSpawn();
      }, currentInterval) as ReturnType<typeof setTimeout> as unknown as number;
    };
    
    setTimeout(() => {
      spawnRock();
      scheduleSpawn();
    }, 800);
    
    timeTimerRef.current = setInterval(() => {
      gameTimeRef.current += 1;
      
      if (gameTimeRef.current - lastDifficultyIncreaseRef.current >= DIFFICULTY_INCREASE_INTERVAL) {
        lastDifficultyIncreaseRef.current = gameTimeRef.current;
        difficultyRef.current = Math.min(10, difficultyRef.current + 1);
        
        const newInterval = Math.max(
          SPAWN_INTERVAL_FLOOR,
          spawnIntervalRef.current - SPAWN_INTERVAL_DECREASE - Math.random() * 30
        );
        spawnIntervalRef.current = newInterval;
        console.log(`Difficulty increased to ${difficultyRef.current}, spawn interval now ${newInterval.toFixed(0)}ms`);
      }
      
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameLoop, fireBullet, spawnRock, upgrades, wheelAnim]);

  const endGame = useCallback((survived: boolean) => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    if (bulletTimerRef.current) {
      clearInterval(bulletTimerRef.current);
    }
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
    }
    if (timeTimerRef.current) {
      clearInterval(timeTimerRef.current);
    }
    
    wheelAnim.stopAnimation();
    
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    
    const gemsEarned = Math.floor(finalScore / 10);
    setTotalGems(prev => prev + gemsEarned);
    
    const moneyFromScore = scoreRef.current * 0.001;
    const match = {
      id: Date.now().toString(),
      gameName: 'Ball Blaster',
      gameMode: 'Survival',
      placement: survived ? 1 : 2,
      timeAgo: 'Just now',
      moneyEarned: moneyFromScore,
      won: survived,
      timestamp: Date.now(),
    };
    saveMatch(match);
    console.log(`Game ended - Survived: ${survived}, XP earned: ${survived ? 100 : 50}`);
    
    setGameState('gameover');
  }, [highScore, wheelAnim, saveMatch]);

  const lastMoveX = useRef(0);
  const isTouchingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        lastMoveX.current = evt.nativeEvent.pageX;
        isTouchingRef.current = true;
      },
      onPanResponderMove: (evt) => {
        const currentX = evt.nativeEvent.pageX;
        const deltaX = currentX - lastMoveX.current;
        lastMoveX.current = currentX;
        
        const newX = Math.max(0, Math.min(
          SCREEN_WIDTH - PLAYER_WIDTH,
          playerXRef.current + deltaX
        ));
        setPlayerX(newX);
      },
      onPanResponderRelease: () => {
        isTouchingRef.current = false;
      },
      onPanResponderTerminate: () => {
        isTouchingRef.current = false;
      },
    })
  ).current;

  const handleUpgrade = (type: keyof Upgrades) => {
    const cost = (upgrades[type] + 1) * 25;
    if (totalGems >= cost && upgrades[type] < 5) {
      setTotalGems(prev => prev - cost);
      setUpgrades(prev => ({ ...prev, [type]: prev[type] + 1 }));
      triggerHaptic();
    }
  };

  const wheelRotation = wheelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getBallColor = (rock: Rock) => {
    const healthPercent = rock.health / rock.maxHealth;
    if (healthPercent > 0.6) return rock.color;
    if (healthPercent > 0.3) {
      return rock.color;
    }
    return rock.color;
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <TouchableOpacity
        style={[styles.homeButton, { top: insets.top + 16 }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.menuContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.menuTitle}>BALL</Text>
          <Text style={styles.menuTitleAccent}>BLASTER</Text>
        </View>
        
        <View style={styles.menuStats}>
          <View style={styles.statItem}>
            <Trophy size={20} color="#fbbf24" />
            <Text style={styles.statLabel}>High Score</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
          <View style={styles.statItem}>
            <Zap size={20} color="#60a5fa" />
            <Text style={styles.statLabel}>Gems</Text>
            <Text style={styles.statValue}>{totalGems}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setGameState('wager')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.playButtonGradient}
          >
            <Play size={32} color="#fff" fill="#fff" />
            <Text style={styles.playButtonText}>PLAY</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.upgradesButton}
          onPress={() => setGameState('upgrades')}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradesButtonText}>UPGRADES</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const WAGER_OPTIONS = [
    { amount: 1, color: '#3b82f6' },
    { amount: 10, color: '#22c55e' },
    { amount: 25, color: '#f97316' },
    { amount: 50, color: '#ec4899' },
    { amount: 100, color: '#8b5cf6' },
    { amount: 100000, color: '#fbbf24', isGold: true },
  ];

  const canAffordWager = wagerType === 'diamonds' ? gems >= wagerAmount : money >= wagerAmount;

  const handleStartWithWager = () => {
    if (!canAffordWager) return;
    
    if (wagerType === 'diamonds') {
      addGems(-wagerAmount);
    } else {
      spendMoney(wagerAmount);
    }
    
    startGame();
  };

  const renderWager = () => (
    <View style={styles.menuContainer}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <TouchableOpacity
        style={[styles.homeButton, { top: insets.top + 16 }]}
        onPress={() => setGameState('menu')}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.wagerContent}>
        <Text style={styles.wagerTitle}>SET YOUR WAGER</Text>
        
        <View style={styles.wagerTypeToggle}>
          <TouchableOpacity
            style={[
              styles.wagerTypeButton,
              wagerType === 'diamonds' && styles.wagerTypeButtonActive,
            ]}
            onPress={() => setWagerType('diamonds')}
          >
            <Gem size={20} color={wagerType === 'diamonds' ? '#60a5fa' : '#64748b'} fill={wagerType === 'diamonds' ? '#60a5fa' : 'transparent'} />
            <Text style={[styles.wagerTypeText, wagerType === 'diamonds' && styles.wagerTypeTextActive]}>
              Diamonds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.wagerTypeButton,
              wagerType === 'money' && styles.wagerTypeButtonActiveMoney,
            ]}
            onPress={() => setWagerType('money')}
          >
            <Text style={[styles.wagerDollarIcon, wagerType === 'money' && styles.wagerDollarIconActive]}>$</Text>
            <Text style={[styles.wagerTypeText, wagerType === 'money' && styles.wagerTypeTextActiveMoney]}>
              Money
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wagerBalanceRow}>
          {wagerType === 'diamonds' ? (
            <>
              <Gem size={16} color="#60a5fa" fill="#60a5fa" />
              <Text style={styles.wagerBalanceText}>{gems.toLocaleString()}</Text>
            </>
          ) : (
            <>
              <Text style={styles.wagerBalanceDollar}>$</Text>
              <Text style={styles.wagerBalanceTextMoney}>{money.toFixed(2)}</Text>
            </>
          )}
        </View>
        
        <View style={styles.wagerOptionsGrid}>
          {WAGER_OPTIONS.map((option) => {
            const isSelected = wagerAmount === option.amount;
            const canAfford = wagerType === 'diamonds' ? gems >= option.amount : money >= option.amount;
            
            return (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.wagerOption,
                  isSelected && styles.wagerOptionSelected,
                  option.isGold && styles.wagerOptionGold,
                  !canAfford && styles.wagerOptionDisabled,
                ]}
                onPress={() => canAfford && setWagerAmount(option.amount)}
                disabled={!canAfford}
              >
                {option.isGold && (
                  <View style={styles.wagerGoldBadge}>
                    <Text style={styles.wagerGoldBadgeText}>JACKPOT</Text>
                  </View>
                )}
                <Text style={[
                  styles.wagerOptionAmount,
                  isSelected && styles.wagerOptionAmountSelected,
                  option.isGold && styles.wagerOptionAmountGold,
                  !canAfford && styles.wagerOptionAmountDisabled,
                ]}>
                  {option.amount >= 1000 ? `${(option.amount / 1000)}K` : option.amount}
                </Text>
                <View style={styles.wagerOptionIconRow}>
                  {wagerType === 'diamonds' ? (
                    <Gem size={14} color={!canAfford ? '#475569' : option.isGold ? '#fbbf24' : '#60a5fa'} fill={!canAfford ? '#475569' : option.isGold ? '#fbbf24' : '#60a5fa'} />
                  ) : (
                    <Text style={[styles.wagerOptionDollar, !canAfford && styles.wagerOptionDollarDisabled, option.isGold && styles.wagerOptionDollarGold]}>$</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.wagerPotentialWin}>
          <Text style={styles.wagerPotentialLabel}>Potential Win (2x)</Text>
          <View style={styles.wagerPotentialValue}>
            {wagerType === 'diamonds' ? (
              <Gem size={18} color="#60a5fa" fill="#60a5fa" />
            ) : (
              <Text style={styles.wagerPotentialDollar}>$</Text>
            )}
            <Text style={[styles.wagerPotentialAmount, wagerType === 'money' && styles.wagerPotentialAmountMoney]}>
              {(wagerAmount * 2).toLocaleString()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.wagerPlayButton, !canAffordWager && styles.wagerPlayButtonDisabled]}
          onPress={handleStartWithWager}
          activeOpacity={0.8}
          disabled={!canAffordWager}
        >
          <LinearGradient
            colors={canAffordWager ? ['#22c55e', '#16a34a'] : ['#475569', '#374151']}
            style={styles.wagerPlayButtonGradient}
          >
            <Play size={28} color="#fff" fill="#fff" />
            <Text style={styles.wagerPlayButtonText}>START GAME</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUpgrades = () => (
    <View style={styles.menuContainer}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.upgradesContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.upgradesHeader}>
          <Text style={styles.upgradesTitle}>UPGRADES</Text>
          <View style={styles.gemsBadge}>
            <Zap size={16} color="#60a5fa" fill="#60a5fa" />
            <Text style={styles.gemsText}>{totalGems}</Text>
          </View>
        </View>
        
        <Text style={styles.upgradesNote}>Disabled in Ranked Mode</Text>
        
        <View style={styles.upgradesList}>
          {[
            { key: 'fireRate' as const, icon: <Zap size={24} color="#f97316" />, name: 'Fire Rate', desc: 'Shoot faster' },
            { key: 'bulletSize' as const, icon: <Target size={24} color="#3b82f6" />, name: 'Bullet Size', desc: 'Larger projectiles' },
            { key: 'bulletDamage' as const, icon: <Zap size={24} color="#ef4444" />, name: 'Damage', desc: 'More damage per hit' },
          ].map(upgrade => {
            const level = upgrades[upgrade.key];
            const cost = (level + 1) * 25;
            const canAfford = totalGems >= cost && level < 5;
            const maxed = level >= 5;
            
            return (
              <View key={upgrade.key} style={styles.upgradeItem}>
                <View style={styles.upgradeIcon}>{upgrade.icon}</View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{upgrade.name}</Text>
                  <Text style={styles.upgradeDesc}>{upgrade.desc}</Text>
                  <View style={styles.levelBar}>
                    {[...Array(5)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.levelDot,
                          i < level && styles.levelDotFilled,
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    !canAfford && styles.upgradeButtonDisabled,
                    maxed && styles.upgradeButtonMaxed,
                  ]}
                  onPress={() => handleUpgrade(upgrade.key)}
                  disabled={!canAfford}
                >
                  {maxed ? (
                    <Text style={styles.upgradeButtonText}>MAX</Text>
                  ) : (
                    <>
                      <Zap size={12} color="#60a5fa" />
                      <Text style={styles.upgradeButtonText}>{cost}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setGameState('menu')}
        >
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGameOver = () => (
    <View style={styles.gameOverContainer}>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.95)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.gameOverContent}>
        <Text style={styles.gameOverTitle}>GAME OVER</Text>
        
        <View style={styles.resultsContainer}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Score</Text>
            <Text style={styles.resultValue}>{score}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Balls Destroyed</Text>
            <Text style={styles.resultValue}>{objectsDestroyed}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Time Survived</Text>
            <Text style={styles.resultValue}>{ROUND_DURATION - timeLeft}s</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Gems Earned</Text>
            <View style={styles.gemsEarned}>
              <Zap size={16} color="#60a5fa" fill="#60a5fa" />
              <Text style={styles.gemsEarnedText}>+{Math.floor(score / 10)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.gameOverButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={startGame}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.retryButtonGradient}
            >
              <Play size={20} color="#fff" fill="#fff" />
              <Text style={styles.retryButtonText}>PLAY AGAIN</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setGameState('menu')}
          >
            <Text style={styles.menuButtonText}>MENU</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderGame = () => (
    <View style={styles.gameContainer} {...panResponder.panHandlers}>
      <LinearGradient
        colors={['#0a0a0f', '#151520', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.gameHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            endGame(false);
            setGameState('menu');
          }}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.scoreContainer}>
          <Target size={18} color="#22c55e" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Clock size={18} color="#f97316" />
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerTextWarning]}>
            {timeLeft}s
          </Text>
        </View>
      </View>
      
      {rocks.map(rock => (
        <View
          key={rock.id}
          style={[
            styles.rock,
            {
              left: rock.x,
              top: rock.y,
              width: rock.size,
              height: rock.size,
              borderRadius: rock.size / 2,
              backgroundColor: getBallColor(rock),
              borderWidth: rock.tier === 'large' ? 3 : rock.tier === 'medium' ? 2 : 1,
              borderColor: 'rgba(255,255,255,0.3)',
            },
          ]}
        >
          <Text style={[
            styles.rockHealth, 
            { 
              fontSize: rock.tier === 'large' ? 22 : rock.tier === 'medium' ? 18 : 14,
              fontWeight: '900' as const,
            }
          ]}>
            {rock.health}
          </Text>
        </View>
      ))}
      
      {bullets.map(bullet => (
        <View
          key={bullet.id}
          style={[
            styles.bullet,
            {
              left: bullet.x,
              top: bullet.y,
              width: BULLET_WIDTH + upgrades.bulletSize * 2,
            },
          ]}
        />
      ))}
      
      {particles.map(particle => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: [{ scale: particle.life }],
            },
          ]}
        />
      ))}
      
      <View style={[styles.player, { left: playerX, top: PLAYER_Y }]}>
        <View style={styles.playerBody}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.playerGradient}
          />
          <View style={styles.cannon}>
            <LinearGradient
              colors={['#60a5fa', '#3b82f6']}
              style={styles.cannonGradient}
            />
          </View>
          <Animated.View style={[styles.muzzleFlash, { opacity: muzzleFlashAnim }]} />
        </View>
        
        <View style={styles.wheelsContainer}>
          <Animated.View style={[styles.wheel, { transform: [{ rotate: wheelRotation }] }]}>
            <View style={styles.wheelSpoke} />
            <View style={[styles.wheelSpoke, { transform: [{ rotate: '90deg' }] }]} />
          </Animated.View>
          <Animated.View style={[styles.wheel, { transform: [{ rotate: wheelRotation }] }]}>
            <View style={styles.wheelSpoke} />
            <View style={[styles.wheelSpoke, { transform: [{ rotate: '90deg' }] }]} />
          </Animated.View>
        </View>
      </View>
      
      <Text style={[styles.dragHint, { bottom: insets.bottom + 10 }]}>
        ← Drag to move →
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'wager' && renderWager()}
      {gameState === 'upgrades' && renderUpgrades()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  menuTitle: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 8,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  menuTitleAccent: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#3b82f6',
    letterSpacing: 6,
    marginTop: -10,
    textShadowColor: 'rgba(59, 130, 246, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  menuStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 120,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600' as const,
    marginTop: 8,
  },
  statValue: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '800' as const,
    marginTop: 4,
  },
  playButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 48,
    paddingVertical: 18,
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  upgradesButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  upgradesButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#60a5fa',
    letterSpacing: 1,
  },
  upgradesContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  upgradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradesTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  gemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  gemsText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  upgradesNote: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '600' as const,
    marginBottom: 24,
  },
  upgradesList: {
    gap: 16,
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  upgradeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  upgradeDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  levelBar: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  levelDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
  },
  levelDotFilled: {
    backgroundColor: '#22c55e',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  upgradeButtonDisabled: {
    opacity: 0.4,
  },
  upgradeButtonMaxed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  backButton: {
    marginTop: 32,
    alignSelf: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  gameContainer: {
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
  },
  timerTextWarning: {
    color: '#ef4444',
  },
  rock: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  rockHealth: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  bullet: {
    position: 'absolute',
    height: BULLET_HEIGHT,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  player: {
    position: 'absolute',
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  },
  playerBody: {
    width: PLAYER_WIDTH,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
  },
  playerGradient: {
    flex: 1,
  },
  cannon: {
    position: 'absolute',
    top: -16,
    left: PLAYER_WIDTH / 2 - 6,
    width: 12,
    height: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cannonGradient: {
    flex: 1,
  },
  muzzleFlash: {
    position: 'absolute',
    top: -24,
    left: PLAYER_WIDTH / 2 - 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  wheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  wheel: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelSpoke: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#475569',
  },
  dragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.5)',
    fontWeight: '600' as const,
  },
  gameOverContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#ef4444',
    letterSpacing: 4,
    marginBottom: 32,
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  resultsContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600' as const,
  },
  resultValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '800' as const,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 8,
  },
  gemsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gemsEarnedText: {
    fontSize: 20,
    color: '#60a5fa',
    fontWeight: '800' as const,
  },
  gameOverButtons: {
    gap: 12,
    width: '100%',
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  menuButton: {
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  homeButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  wagerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  wagerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 24,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  wagerTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  wagerTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  wagerTypeButtonActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  wagerTypeButtonActiveMoney: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  wagerTypeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  wagerTypeTextActive: {
    color: '#60a5fa',
  },
  wagerTypeTextActiveMoney: {
    color: '#22c55e',
  },
  wagerDollarIcon: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#64748b',
  },
  wagerDollarIconActive: {
    color: '#22c55e',
  },
  wagerBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  wagerBalanceText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#60a5fa',
  },
  wagerBalanceDollar: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  wagerBalanceTextMoney: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#22c55e',
  },
  wagerOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  wagerOption: {
    width: 90,
    height: 80,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  wagerOptionSelected: {
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  wagerOptionGold: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  wagerOptionDisabled: {
    opacity: 0.4,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  wagerGoldBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  wagerGoldBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 0.5,
  },
  wagerOptionAmount: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
  },
  wagerOptionAmountSelected: {
    color: '#60a5fa',
  },
  wagerOptionAmountGold: {
    color: '#fbbf24',
  },
  wagerOptionAmountDisabled: {
    color: '#475569',
  },
  wagerOptionIconRow: {
    marginTop: 4,
  },
  wagerOptionDollar: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  wagerOptionDollarDisabled: {
    color: '#475569',
  },
  wagerOptionDollarGold: {
    color: '#fbbf24',
  },
  wagerPotentialWin: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  wagerPotentialLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
  },
  wagerPotentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wagerPotentialDollar: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#22c55e',
  },
  wagerPotentialAmount: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#60a5fa',
  },
  wagerPotentialAmountMoney: {
    color: '#22c55e',
  },
  wagerPlayButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  wagerPlayButtonDisabled: {
    opacity: 0.6,
  },
  wagerPlayButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 48,
    paddingVertical: 18,
  },
  wagerPlayButtonText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 2,
  },
});
