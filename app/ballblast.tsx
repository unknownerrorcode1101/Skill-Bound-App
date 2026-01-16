import { View, Text, StyleSheet, Dimensions, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import { X, Trophy, Zap, Clock, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 14;
const BALL_SIZE = 18;
const BLOCK_ROWS = 5;
const BLOCK_COLS = 7;
const BLOCK_PADDING = 6;
const MATCH_DURATION = 45;

const INITIAL_BALL_SPEED = 6;
const MAX_BALL_SPEED = 14;
const SPEED_INCREMENT = 0.15;

interface Block {
  id: string;
  row: number;
  col: number;
  health: number;
  maxHealth: number;
  color: string;
  glowColor: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

type GameMode = 'casual' | 'ranked';
type GameState = 'menu' | 'playing' | 'ended';

const NEON_COLORS = [
  { main: '#00f5ff', glow: '#00f5ff' },
  { main: '#ff00ff', glow: '#ff00ff' },
  { main: '#00ff88', glow: '#00ff88' },
  { main: '#ffff00', glow: '#ffff00' },
  { main: '#ff6600', glow: '#ff6600' },
];

export default function BrickBreaker() {
  const insets = useSafeAreaInsets();
  const { saveMatch, addCrowns } = useGame();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('casual');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(MATCH_DURATION);
  const [blocksDestroyed, setBlocksDestroyed] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  
  const [paddleX, setPaddleX] = useState<number>(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState<Ball>({
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT / 2,
    vx: 0,
    vy: 0,
    speed: INITIAL_BALL_SPEED,
  });
  const [blocks, setBlocks] = useState<Block[]>([]);

  const paddleXRef = useRef<number>(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
  const ballRef = useRef<Ball>(ball);
  const blocksRef = useRef<Block[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastHitTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const endGameRef = useRef<(won: boolean) => void>(() => {});

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  const PLAY_AREA_TOP = insets.top + 120;
  const PADDLE_Y = SCREEN_HEIGHT - 100 - insets.bottom;
  const BLOCK_WIDTH = (SCREEN_WIDTH - (BLOCK_COLS + 1) * BLOCK_PADDING) / BLOCK_COLS;
  const BLOCK_HEIGHT = 28;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  const generateBlocks = useCallback(() => {
    const newBlocks: Block[] = [];
    for (let row = 0; row < BLOCK_ROWS; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        const colorSet = NEON_COLORS[row % NEON_COLORS.length];
        const health = BLOCK_ROWS - row;
        newBlocks.push({
          id: `block-${row}-${col}`,
          row,
          col,
          health,
          maxHealth: health,
          color: colorSet.main,
          glowColor: colorSet.glow,
        });
      }
    }
    return newBlocks;
  }, []);

  const getBlockPosition = useCallback((block: Block) => {
    const x = BLOCK_PADDING + block.col * (BLOCK_WIDTH + BLOCK_PADDING);
    const y = PLAY_AREA_TOP + block.row * (BLOCK_HEIGHT + BLOCK_PADDING);
    return { x, y };
  }, [BLOCK_WIDTH, PLAY_AREA_TOP]);

  const startGame = useCallback((mode: GameMode) => {
    console.log('Starting game in', mode, 'mode');
    setGameMode(mode);
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(MATCH_DURATION);
    setBlocksDestroyed(0);
    setCombo(0);

    const newBlocks = generateBlocks();
    setBlocks(newBlocks);
    blocksRef.current = newBlocks;

    const startX = SCREEN_WIDTH / 2;
    const startY = PADDLE_Y - 100;
    const angle = (Math.random() * 60 + 60) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;

    const newBall: Ball = {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * INITIAL_BALL_SPEED * direction,
      vy: -Math.sin(angle) * INITIAL_BALL_SPEED,
      speed: INITIAL_BALL_SPEED,
    };
    setBall(newBall);
    ballRef.current = newBall;

    setPaddleX(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);
    paddleXRef.current = SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGameRef.current(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateBlocks, PADDLE_Y]);

  const endGame = useCallback((won: boolean) => {
    console.log('Game ended, won:', won, 'score:', scoreRef.current);
    setGameState('ended');

    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);

    setHighScore(prev => Math.max(prev, scoreRef.current));

    const crownsEarned = Math.floor(scoreRef.current / 200);
    if (crownsEarned > 0) {
      addCrowns(crownsEarned);
    }

    const moneyFromScore = scoreRef.current * 0.001;
    const match = {
      id: Date.now().toString(),
      gameName: 'Brick Breaker',
      gameMode: gameMode === 'ranked' ? 'Ranked' : 'Casual',
      placement: won ? 1 : 2,
      timeAgo: 'Just now',
      moneyEarned: moneyFromScore,
      won: false,
      timestamp: Date.now(),
    };
    saveMatch(match);

    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [gameMode, saveMatch, addCrowns, pulseAnim]);

  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);

  const gameLoop = useCallback(() => {
    const currentBall = ballRef.current;
    const currentBlocks = blocksRef.current;
    const currentPaddleX = paddleXRef.current;

    let newX = currentBall.x + currentBall.vx;
    let newY = currentBall.y + currentBall.vy;
    let newVx = currentBall.vx;
    let newVy = currentBall.vy;
    let newSpeed = Math.min(currentBall.speed + SPEED_INCREMENT * 0.01, MAX_BALL_SPEED);

    if (newX - BALL_SIZE / 2 <= 0) {
      newX = BALL_SIZE / 2;
      newVx = Math.abs(newVx);
    } else if (newX + BALL_SIZE / 2 >= SCREEN_WIDTH) {
      newX = SCREEN_WIDTH - BALL_SIZE / 2;
      newVx = -Math.abs(newVx);
    }

    if (newY - BALL_SIZE / 2 <= PLAY_AREA_TOP) {
      newY = PLAY_AREA_TOP + BALL_SIZE / 2;
      newVy = Math.abs(newVy);
    }

    if (
      newY + BALL_SIZE / 2 >= PADDLE_Y &&
      newY - BALL_SIZE / 2 <= PADDLE_Y + PADDLE_HEIGHT &&
      newX >= currentPaddleX - BALL_SIZE / 2 &&
      newX <= currentPaddleX + PADDLE_WIDTH + BALL_SIZE / 2
    ) {
      const hitPos = (newX - currentPaddleX) / PADDLE_WIDTH;
      const angle = (hitPos - 0.5) * 140 * (Math.PI / 180);
      const baseAngle = -Math.PI / 2;
      const reflectAngle = baseAngle + angle;

      newVx = Math.cos(reflectAngle) * newSpeed;
      newVy = Math.sin(reflectAngle) * newSpeed;

      if (newVy > -2) newVy = -2;

      newY = PADDLE_Y - BALL_SIZE / 2 - 1;

      console.log('Paddle hit! Angle:', (angle * 180 / Math.PI).toFixed(1), 'Speed:', newSpeed.toFixed(2));
    }

    if (newY - BALL_SIZE / 2 > PADDLE_Y + PADDLE_HEIGHT + 50) {
      console.log('Ball missed! Ending game');
      endGame(false);
      return;
    }

    let updatedBlocks = [...currentBlocks];
    let scoreIncrease = 0;
    let blockHit = false;

    for (let i = 0; i < updatedBlocks.length; i++) {
      const block = updatedBlocks[i];
      const pos = getBlockPosition(block);
      const blockLeft = pos.x;
      const blockRight = pos.x + BLOCK_WIDTH;
      const blockTop = pos.y;
      const blockBottom = pos.y + BLOCK_HEIGHT;

      if (
        newX + BALL_SIZE / 2 >= blockLeft &&
        newX - BALL_SIZE / 2 <= blockRight &&
        newY + BALL_SIZE / 2 >= blockTop &&
        newY - BALL_SIZE / 2 <= blockBottom
      ) {
        const overlapLeft = newX + BALL_SIZE / 2 - blockLeft;
        const overlapRight = blockRight - (newX - BALL_SIZE / 2);
        const overlapTop = newY + BALL_SIZE / 2 - blockTop;
        const overlapBottom = blockBottom - (newY - BALL_SIZE / 2);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          newVy = -newVy;
        } else {
          newVx = -newVx;
        }

        const newHealth = block.health - 1;
        if (newHealth <= 0) {
          updatedBlocks.splice(i, 1);
          i--;
          setBlocksDestroyed(prev => prev + 1);

          const now = Date.now();
          if (now - lastHitTimeRef.current < 1500) {
            setCombo(prev => prev + 1);
          } else {
            setCombo(1);
          }
          lastHitTimeRef.current = now;

          if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
          comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);

          scoreIncrease += 100 * (1 + combo * 0.25);
        } else {
          updatedBlocks[i] = { ...block, health: newHealth };
          scoreIncrease += 10;
        }

        blockHit = true;
        newSpeed = Math.min(newSpeed + SPEED_INCREMENT, MAX_BALL_SPEED);
        break;
      }
    }

    if (blockHit) {
      blocksRef.current = updatedBlocks;
      setBlocks(updatedBlocks);
    }

    if (scoreIncrease > 0) {
      const newScore = scoreRef.current + Math.floor(scoreIncrease);
      scoreRef.current = newScore;
      setScore(newScore);
    }

    if (updatedBlocks.length === 0) {
      console.log('All blocks destroyed! Victory!');
      endGame(true);
      return;
    }

    const magnitude = Math.sqrt(newVx * newVx + newVy * newVy);
    if (magnitude !== newSpeed) {
      newVx = (newVx / magnitude) * newSpeed;
      newVy = (newVy / magnitude) * newSpeed;
    }

    const updatedBall: Ball = {
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      speed: newSpeed,
    };
    ballRef.current = updatedBall;
    setBall(updatedBall);

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, PADDLE_Y, PLAY_AREA_TOP, getBlockPosition, BLOCK_WIDTH, endGame, combo]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    };
  }, []);

  const handlePaddleMove = (evt: any) => {
    if (gameState !== 'playing') return;
    const touchX = evt.nativeEvent.pageX;
    const newX = Math.max(0, Math.min(SCREEN_WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
    paddleXRef.current = newX;
    setPaddleX(newX);
  };

  const handleExit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    router.back();
  };

  const getHealthOpacity = (block: Block) => {
    return 0.4 + (block.health / block.maxHealth) * 0.6;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {gameState === 'menu' && (
        <View style={styles.menuContainer}>
          <View style={[styles.menuContent, { paddingTop: insets.top + 40 }]}>
            <Animated.View style={[styles.titleContainer, { opacity: glowAnim }]}>
              <Text style={styles.titleGlow}>BRICK</Text>
            </Animated.View>
            <Text style={styles.title}>BRICK</Text>
            <Text style={styles.subtitle}>BREAKER</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Trophy color="#ffd700" size={20} />
                <Text style={styles.statValue}>{highScore}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
            </View>

            <View style={styles.modeSelection}>
              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => startGame('casual')}
                activeOpacity={0.8}
              >
                <View style={[styles.modeButtonInner, styles.casualButton]}>
                  <Zap color="#00f5ff" size={28} />
                  <Text style={styles.modeButtonTitle}>CASUAL</Text>
                  <Text style={styles.modeButtonDesc}>Practice Mode</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => startGame('ranked')}
                activeOpacity={0.8}
              >
                <View style={[styles.modeButtonInner, styles.rankedButton]}>
                  <Trophy color="#ffd700" size={28} />
                  <Text style={styles.modeButtonTitle}>RANKED</Text>
                  <Text style={styles.modeButtonDesc}>Compete for Crowns</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={handleExit}>
              <Text style={styles.backButtonText}>← Back to Menu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridBackground}>
            {[...Array(20)].map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLine, { top: i * 40 }]} />
            ))}
            {[...Array(10)].map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineV, { left: i * 40 }]} />
            ))}
          </View>
        </View>
      )}

      {(gameState === 'playing' || gameState === 'ended') && (
        <View
          style={styles.gameArea}
          onTouchStart={handlePaddleMove}
          onTouchMove={handlePaddleMove}
        >
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
              <X color="#fff" size={22} />
            </TouchableOpacity>

            <View style={styles.timerContainer}>
              <Clock color={timeLeft <= 10 ? '#ff4444' : '#00f5ff'} size={18} />
              <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
                {timeLeft}s
              </Text>
            </View>

            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreValue}>{score}</Text>
              {combo > 1 && (
                <View style={styles.comboTag}>
                  <Text style={styles.comboText}>x{combo}</Text>
                </View>
              )}
            </View>

            <View style={styles.blocksCounter}>
              <Target color="#ff00ff" size={18} />
              <Text style={styles.blocksText}>{blocks.length}</Text>
            </View>
          </View>

          {blocks.map(block => {
            const pos = getBlockPosition(block);
            return (
              <View
                key={block.id}
                style={[
                  styles.block,
                  {
                    left: pos.x,
                    top: pos.y,
                    width: BLOCK_WIDTH,
                    height: BLOCK_HEIGHT,
                    backgroundColor: block.color,
                    opacity: getHealthOpacity(block),
                    shadowColor: block.glowColor,
                  },
                ]}
              >
                {block.health > 1 && (
                  <Text style={styles.blockHealth}>{block.health}</Text>
                )}
              </View>
            );
          })}

          <View
            style={[
              styles.ball,
              {
                left: ball.x - BALL_SIZE / 2,
                top: ball.y - BALL_SIZE / 2,
              },
            ]}
          />
          <View
            style={[
              styles.ballGlow,
              {
                left: ball.x - BALL_SIZE,
                top: ball.y - BALL_SIZE,
              },
            ]}
          />

          <View
            style={[
              styles.paddle,
              {
                left: paddleX,
                top: PADDLE_Y,
              },
            ]}
          >
            <View style={styles.paddleGlow} />
          </View>

          {gameState === 'ended' && (
            <View style={styles.endOverlay}>
              <Animated.View style={[styles.endContent, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={[styles.endTitle, blocks.length === 0 ? styles.winTitle : styles.loseTitle]}>
                  {blocks.length === 0 ? 'VICTORY!' : 'TIME UP!'}
                </Text>

                <View style={styles.endStats}>
                  <View style={styles.endStatRow}>
                    <Text style={styles.endStatLabel}>Final Score</Text>
                    <Text style={styles.endStatValue}>{score}</Text>
                  </View>
                  <View style={styles.endStatRow}>
                    <Text style={styles.endStatLabel}>Blocks Destroyed</Text>
                    <Text style={styles.endStatValue}>{blocksDestroyed}</Text>
                  </View>
                  <View style={styles.endStatRow}>
                    <Text style={styles.endStatLabel}>Mode</Text>
                    <Text style={[styles.endStatValue, styles.modeTag]}>
                      {gameMode.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {gameMode === 'ranked' && blocks.length === 0 && (
                  <View style={styles.rewardBox}>
                    <Trophy color="#ffd700" size={24} />
                    <Text style={styles.rewardText}>+1 Crown Earned!</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.playAgainButton}
                  onPress={() => startGame(gameMode)}
                >
                  <Text style={styles.playAgainText}>PLAY AGAIN</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => setGameState('menu')}>
                  <Text style={styles.menuButtonText}>Change Mode</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>
      )}
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
    position: 'relative',
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#00f5ff',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#00f5ff',
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleGlow: {
    fontSize: 52,
    fontWeight: '900' as const,
    color: '#00f5ff',
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    opacity: 0.5,
  },
  title: {
    fontSize: 52,
    fontWeight: '900' as const,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#00f5ff',
    textAlign: 'center',
    letterSpacing: 12,
    marginTop: 4,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#888',
    marginTop: 4,
  },
  modeSelection: {
    gap: 16,
  },
  modeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  modeButtonInner: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
  },
  casualButton: {
    backgroundColor: 'rgba(0,245,255,0.1)',
    borderColor: 'rgba(0,245,255,0.4)',
  },
  rankedButton: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  modeButtonTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 12,
    letterSpacing: 4,
  },
  modeButtonDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  backButton: {
    marginTop: 40,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600' as const,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0a0a0f',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#00f5ff',
  },
  timerWarning: {
    color: '#ff4444',
  },
  scoreDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
  },
  comboTag: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  comboText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
  },
  blocksCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blocksText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff00ff',
  },
  block: {
    position: 'absolute',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  blockHealth: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: 'rgba(0,0,0,0.6)',
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#fff',
    zIndex: 50,
  },
  ballGlow: {
    position: 'absolute',
    width: BALL_SIZE * 2,
    height: BALL_SIZE * 2,
    borderRadius: BALL_SIZE,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 49,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    backgroundColor: '#00f5ff',
    borderRadius: PADDLE_HEIGHT / 2,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  paddleGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: (PADDLE_HEIGHT + 16) / 2,
    backgroundColor: 'rgba(0,245,255,0.2)',
  },
  endOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,15,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  endContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  endTitle: {
    fontSize: 42,
    fontWeight: '900' as const,
    letterSpacing: 6,
    marginBottom: 32,
  },
  winTitle: {
    color: '#00ff88',
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  loseTitle: {
    color: '#ff4444',
    textShadowColor: '#ff4444',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  endStats: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  endStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  endStatLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600' as const,
  },
  endStatValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '800' as const,
  },
  modeTag: {
    color: '#00f5ff',
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffd700',
  },
  playAgainButton: {
    backgroundColor: '#00f5ff',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#0a0a0f',
    letterSpacing: 3,
  },
  menuButton: {
    paddingVertical: 14,
  },
  menuButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
});
