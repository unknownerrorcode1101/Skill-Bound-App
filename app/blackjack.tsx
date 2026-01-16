import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, PanResponder } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isStood: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
}

type GamePhase = 'betting' | 'dealing' | 'player_turn' | 'dealer_turn' | 'settlement' | 'game_over';

interface SideBetResult {
  perfectPairs: { won: boolean; payout: number; type: string | null };
  twentyOnePlus3: { won: boolean; payout: number; type: string | null };
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DECKS_IN_SHOE = 6;
const RESHUFFLE_THRESHOLD = 0.25;

const CHIP_VALUES = [1, 5, 25, 100, 500, 1000, 5000, 10000, 100000];
const CHIP_COLORS: Record<number, readonly [string, string]> = {
  1: ['#e0e0e0', '#b0b0b0'] as const,
  5: ['#ef4444', '#b91c1c'] as const,
  25: ['#22c55e', '#15803d'] as const,
  100: ['#1e1e1e', '#000000'] as const,
  500: ['#a855f7', '#7e22ce'] as const,
  1000: ['#3b82f6', '#1d4ed8'] as const,
  5000: ['#f97316', '#ea580c'] as const,
  10000: ['#ec4899', '#db2777'] as const,
  100000: ['#fbbf24', '#d97706'] as const,
};



const PERFECT_PAIRS_PAYOUTS = {
  mixed: 5,
  colored: 10,
  perfect: 30,
};

const TWENTY_ONE_PLUS_3_PAYOUTS = {
  flush: 5,
  straight: 10,
  threeOfAKind: 30,
  straightFlush: 40,
  suitedTrips: 100,
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: true, id: `${suit}-${rank}-${Math.random()}` });
    }
  }
  return deck;
};

const createShoe = (): Card[] => {
  const shoe: Card[] = [];
  for (let i = 0; i < DECKS_IN_SHOE; i++) {
    shoe.push(...createDeck());
  }
  return shuffleArray(shoe);
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getCardValue = (card: Card): number[] => {
  if (card.rank === 'A') return [1, 11];
  if (['K', 'Q', 'J'].includes(card.rank)) return [10];
  return [parseInt(card.rank)];
};

const calculateHandValue = (cards: Card[]): { value: number; isSoft: boolean } => {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (!card.faceUp) continue;
    const values = getCardValue(card);
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else {
      total += values[0];
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isSoft = aces > 0 && total <= 21;
  return { value: total, isSoft };
};

const getHandDisplay = (cards: Card[]): string => {
  const { value, isSoft } = calculateHandValue(cards);
  if (isSoft && value <= 21) {
    const hardValue = value - 10;
    if (hardValue !== value) {
      return `${hardValue} / ${value}`;
    }
  }
  return value.toString();
};

const isBlackjack = (cards: Card[]): boolean => {
  if (cards.length !== 2) return false;
  const { value } = calculateHandValue(cards);
  return value === 21;
};

const isBusted = (cards: Card[]): boolean => {
  const { value } = calculateHandValue(cards);
  return value > 21;
};

const getSuitColor = (suit: Suit): string => {
  return suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#1e1e1e';
};

const getSuitSymbol = (suit: Suit): string => {
  const symbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return symbols[suit];
};

const evaluatePerfectPairs = (cards: Card[]): { type: string | null; payout: number } => {
  if (cards.length < 2) return { type: null, payout: 0 };
  
  const [card1, card2] = cards;
  if (card1.rank !== card2.rank) return { type: null, payout: 0 };

  if (card1.suit === card2.suit) {
    return { type: 'Perfect Pair', payout: PERFECT_PAIRS_PAYOUTS.perfect };
  }

  const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';
  if (isRed(card1.suit) === isRed(card2.suit)) {
    return { type: 'Colored Pair', payout: PERFECT_PAIRS_PAYOUTS.colored };
  }

  return { type: 'Mixed Pair', payout: PERFECT_PAIRS_PAYOUTS.mixed };
};

const evaluate21Plus3 = (playerCards: Card[], dealerUpcard: Card): { type: string | null; payout: number } => {
  if (playerCards.length < 2) return { type: null, payout: 0 };

  const threeCards = [playerCards[0], playerCards[1], dealerUpcard];
  const ranks = threeCards.map(c => RANKS.indexOf(c.rank));
  const suits = threeCards.map(c => c.suit);

  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
  const sortedRanks = [...ranks].sort((a, b) => a - b);
  const isStraight = 
    (sortedRanks[2] - sortedRanks[1] === 1 && sortedRanks[1] - sortedRanks[0] === 1) ||
    (sortedRanks.includes(0) && sortedRanks.includes(11) && sortedRanks.includes(12));
  const isThreeOfAKind = threeCards[0].rank === threeCards[1].rank && threeCards[1].rank === threeCards[2].rank;

  if (isThreeOfAKind && isFlush) {
    return { type: 'Suited Trips', payout: TWENTY_ONE_PLUS_3_PAYOUTS.suitedTrips };
  }
  if (isStraight && isFlush) {
    return { type: 'Straight Flush', payout: TWENTY_ONE_PLUS_3_PAYOUTS.straightFlush };
  }
  if (isThreeOfAKind) {
    return { type: 'Three of a Kind', payout: TWENTY_ONE_PLUS_3_PAYOUTS.threeOfAKind };
  }
  if (isStraight) {
    return { type: 'Straight', payout: TWENTY_ONE_PLUS_3_PAYOUTS.straight };
  }
  if (isFlush) {
    return { type: 'Flush', payout: TWENTY_ONE_PLUS_3_PAYOUTS.flush };
  }

  return { type: null, payout: 0 };
};

const CardComponent = ({ card, style, animatedStyle }: { card: Card; style?: any; animatedStyle?: any }) => {
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);

  if (!card.faceUp) {
    return (
      <Animated.View style={[styles.card, styles.cardBack, style, animatedStyle]}>
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackInner} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, style, animatedStyle]}>
      <View style={styles.cardCorner}>
        <Text style={[styles.cardRank, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.cardSuitSmall, { color: suitColor }]}>{suitSymbol}</Text>
      </View>
      <Text style={[styles.cardSuitLarge, { color: suitColor }]}>{suitSymbol}</Text>
      <View style={[styles.cardCorner, styles.cardCornerBottom]}>
        <Text style={[styles.cardRank, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.cardSuitSmall, { color: suitColor }]}>{suitSymbol}</Text>
      </View>
    </Animated.View>
  );
};

const formatChipValue = (value: number): string => {
  if (value >= 100000) return `${value / 1000}K`;
  if (value >= 1000) return `${value / 1000}K`;
  return `${value}`;
};

interface DropZone {
  id: 'main' | 'perfectPairs' | '21+3';
  x: number;
  y: number;
  width: number;
  height: number;
}

const DraggableChip = ({ 
  value, 
  disabled, 
  onDrop,
  dropZones,
  triggerHaptic,
  onTap,
}: { 
  value: number; 
  disabled?: boolean;
  onDrop: (value: number, zone: 'main' | 'perfectPairs' | '21+3') => void;
  dropZones: DropZone[];
  triggerHaptic: () => void;
  onTap: (value: number) => void;
}) => {
  const colors = CHIP_COLORS[value] || ['#666', '#444'] as const;
  const size = 48;
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);
  const dragDistance = useRef(0);
  const dropZonesRef = useRef<DropZone[]>(dropZones);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    dropZonesRef.current = dropZones;
  }, [dropZones]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return !disabledRef.current && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5);
      },
      onPanResponderGrant: () => {
        dragDistance.current = 0;
        triggerHaptic();
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        dragDistance.current = Math.sqrt(gesture.dx * gesture.dx + gesture.dy * gesture.dy);
        if (dragDistance.current > 10) {
          setIsDragging(true);
        }
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const wasDragging = dragDistance.current > 10;
        setIsDragging(false);
        
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (wasDragging) {
          const dropX = gesture.moveX;
          const dropY = gesture.moveY;
          const currentDropZones = dropZonesRef.current;

          let droppedZone: DropZone | null = null;
          for (const zone of currentDropZones) {
            if (
              dropX >= zone.x &&
              dropX <= zone.x + zone.width &&
              dropY >= zone.y &&
              dropY <= zone.y + zone.height
            ) {
              droppedZone = zone;
              break;
            }
          }

          if (droppedZone) {
            triggerHaptic();
            onDrop(value, droppedZone.id);
          }
        } else {
          onTap(value);
        }

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableChipWrapper,
        {
          width: size,
          height: size,
          opacity: disabled ? 0.4 : 1,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
          zIndex: isDragging ? 1000 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        style={[styles.chip, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={[styles.chipInnerSolid, { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }]}>
          <Text style={[styles.chipValue, { fontSize: value >= 1000 ? 9 : 12 }]}>{formatChipValue(value)}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function BlackjackScreen() {
  const insets = useSafeAreaInsets();
  const { money, spendMoney, addMoney, addCrowns, saveMatch } = useGame();

  const [shoe, setShoe] = useState<Card[]>(() => createShoe());
  const [playerHands, setPlayerHands] = useState<Hand[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [currentBet, setCurrentBet] = useState(0);
  const [perfectPairsBet, setPerfectPairsBet] = useState(0);
  const [twentyOnePlus3Bet, setTwentyOnePlus3Bet] = useState(0);
  const [sideBetResults, setSideBetResults] = useState<SideBetResult | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastBet, setLastBet] = useState(0);
  const [lastPerfectPairsBet, setLastPerfectPairsBet] = useState(0);
  const [lastTwentyOnePlus3Bet, setLastTwentyOnePlus3Bet] = useState(0);

  const resultAnimation = useRef(new Animated.Value(0)).current;
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const mainBetRef = useRef<View>(null);
  const perfectPairsRef = useRef<View>(null);
  const twentyOnePlus3Ref = useRef<View>(null);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const measureDropZones = useCallback(() => {
    const zones: DropZone[] = [];
    let measured = 0;
    const padding = 20;
    
    const checkComplete = () => {
      measured++;
      if (measured === 3 && zones.length === 3) {
        console.log('Drop zones measured:', zones);
        setDropZones([...zones]);
      }
    };
    
    if (mainBetRef.current) {
      mainBetRef.current.measureInWindow((x, y, width, height) => {
        zones.push({ 
          id: 'main', 
          x: x - padding, 
          y: y - padding, 
          width: width + padding * 2, 
          height: height + padding * 2 
        });
        checkComplete();
      });
    } else {
      measured++;
    }
    
    if (perfectPairsRef.current) {
      perfectPairsRef.current.measureInWindow((x, y, width, height) => {
        zones.push({ 
          id: 'perfectPairs', 
          x: x - padding, 
          y: y - padding, 
          width: width + padding * 2, 
          height: height + padding * 2 
        });
        checkComplete();
      });
    } else {
      measured++;
    }
    
    if (twentyOnePlus3Ref.current) {
      twentyOnePlus3Ref.current.measureInWindow((x, y, width, height) => {
        zones.push({ 
          id: '21+3', 
          x: x - padding, 
          y: y - padding, 
          width: width + padding * 2, 
          height: height + padding * 2 
        });
        checkComplete();
      });
    } else {
      measured++;
    }
  }, []);

  useEffect(() => {
    if (gamePhase === 'betting') {
      const timer = setTimeout(measureDropZones, 300);
      const timer2 = setTimeout(measureDropZones, 600);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [gamePhase, measureDropZones]);

  const drawCard = useCallback((faceUp: boolean = true): Card | null => {
    if (shoe.length === 0) return null;
    
    const totalCards = DECKS_IN_SHOE * 52;
    if (shoe.length < totalCards * RESHUFFLE_THRESHOLD) {
      console.log('Reshuffling shoe...');
      setShoe(createShoe());
    }

    const card = { ...shoe[0], faceUp, id: `${shoe[0].suit}-${shoe[0].rank}-${Date.now()}-${Math.random()}` };
    setShoe(prev => prev.slice(1));
    return card;
  }, [shoe]);

  const addChipToBet = useCallback((value: number, betType: 'main' | 'perfectPairs' | '21+3') => {
    triggerHaptic();
    
    if (betType === 'main') {
      if (currentBet + value <= money) {
        setCurrentBet(prev => prev + value);
      }
    } else if (betType === 'perfectPairs') {
      if (perfectPairsBet + value <= money - currentBet - twentyOnePlus3Bet) {
        setPerfectPairsBet(prev => prev + value);
      }
    } else if (betType === '21+3') {
      if (twentyOnePlus3Bet + value <= money - currentBet - perfectPairsBet) {
        setTwentyOnePlus3Bet(prev => prev + value);
      }
    }
  }, [currentBet, perfectPairsBet, twentyOnePlus3Bet, money, triggerHaptic]);

  const handleChipDrop = useCallback((value: number, zone: 'main' | 'perfectPairs' | '21+3') => {
    addChipToBet(value, zone);
  }, [addChipToBet]);

  const handleChipTap = useCallback((value: number) => {
    addChipToBet(value, 'main');
  }, [addChipToBet]);

  const clearBets = useCallback(() => {
    triggerHaptic();
    setCurrentBet(0);
    setPerfectPairsBet(0);
    setTwentyOnePlus3Bet(0);
  }, [triggerHaptic]);

  const rebet = useCallback(() => {
    triggerHaptic();
    const totalLastBet = lastBet + lastPerfectPairsBet + lastTwentyOnePlus3Bet;
    if (totalLastBet <= money) {
      setCurrentBet(lastBet);
      setPerfectPairsBet(lastPerfectPairsBet);
      setTwentyOnePlus3Bet(lastTwentyOnePlus3Bet);
    }
  }, [lastBet, lastPerfectPairsBet, lastTwentyOnePlus3Bet, money, triggerHaptic]);

  const maxBet = useCallback(() => {
    triggerHaptic();
    const maxMainBet = Math.min(money, 10000);
    setCurrentBet(maxMainBet);
    setPerfectPairsBet(0);
    setTwentyOnePlus3Bet(0);
  }, [money, triggerHaptic]);

  const deal = useCallback(async () => {
    if (currentBet === 0) return;
    
    triggerHaptic();
    setLastBet(currentBet);
    setLastPerfectPairsBet(perfectPairsBet);
    setLastTwentyOnePlus3Bet(twentyOnePlus3Bet);
    
    const totalBet = currentBet + perfectPairsBet + twentyOnePlus3Bet;
    spendMoney(totalBet);
    
    setGamePhase('dealing');
    setSideBetResults(null);
    setResultMessage('');
    setTotalWinnings(0);

    const newShoe = [...shoe];
    const playerCard1 = { ...newShoe[0], faceUp: true, id: `p1-${Date.now()}` };
    const dealerCard1 = { ...newShoe[1], faceUp: true, id: `d1-${Date.now()}` };
    const playerCard2 = { ...newShoe[2], faceUp: true, id: `p2-${Date.now()}` };
    const dealerCard2 = { ...newShoe[3], faceUp: false, id: `d2-${Date.now()}` };
    
    setShoe(newShoe.slice(4));
    
    const newPlayerHand: Hand = {
      cards: [playerCard1, playerCard2],
      bet: currentBet,
      isDoubled: false,
      isStood: false,
      isBusted: false,
      isBlackjack: false,
    };
    
    setPlayerHands([newPlayerHand]);
    setDealerCards([dealerCard1, dealerCard2]);
    setCurrentHandIndex(0);

    await new Promise(resolve => setTimeout(resolve, 800));

    let sideBets: SideBetResult = {
      perfectPairs: { won: false, payout: 0, type: null },
      twentyOnePlus3: { won: false, payout: 0, type: null },
    };

    if (perfectPairsBet > 0) {
      const ppResult = evaluatePerfectPairs([playerCard1, playerCard2]);
      if (ppResult.type) {
        sideBets.perfectPairs = {
          won: true,
          payout: perfectPairsBet * ppResult.payout,
          type: ppResult.type,
        };
        addMoney(perfectPairsBet * ppResult.payout + perfectPairsBet);
      }
    }

    if (twentyOnePlus3Bet > 0) {
      const t3Result = evaluate21Plus3([playerCard1, playerCard2], dealerCard1);
      if (t3Result.type) {
        sideBets.twentyOnePlus3 = {
          won: true,
          payout: twentyOnePlus3Bet * t3Result.payout,
          type: t3Result.type,
        };
        addMoney(twentyOnePlus3Bet * t3Result.payout + twentyOnePlus3Bet);
      }
    }

    if (sideBets.perfectPairs.won || sideBets.twentyOnePlus3.won) {
      setSideBetResults(sideBets);
    }

    const playerHasBlackjack = isBlackjack([playerCard1, playerCard2]);
    const dealerShowsTenOrAce = dealerCard1.rank === 'A' || ['10', 'J', 'Q', 'K'].includes(dealerCard1.rank);

    if (dealerShowsTenOrAce) {
      const dealerHasBlackjack = isBlackjack([dealerCard1, { ...dealerCard2, faceUp: true }]);
      
      if (dealerHasBlackjack) {
        setDealerCards([dealerCard1, { ...dealerCard2, faceUp: true }]);
        
        if (playerHasBlackjack) {
          setResultMessage('Push - Both Blackjack!');
          addMoney(currentBet);
          saveMatch({
            id: `blackjack-${Date.now()}`,
            gameName: 'Blackjack',
            gameMode: 'Standard',
            placement: 1,
            timeAgo: 'Just now',
            moneyEarned: 0,
            won: false,
            timestamp: Date.now(),
          });
        } else {
          setResultMessage('Dealer Blackjack!');
          saveMatch({
            id: `blackjack-${Date.now()}`,
            gameName: 'Blackjack',
            gameMode: 'Standard',
            placement: 2,
            timeAgo: 'Just now',
            moneyEarned: -currentBet,
            won: false,
            timestamp: Date.now(),
          });
        }
        setGamePhase('game_over');
        return;
      }
    }

    if (playerHasBlackjack) {
      setPlayerHands([{ ...newPlayerHand, isBlackjack: true }]);
      setDealerCards([dealerCard1, { ...dealerCard2, faceUp: true }]);
      const blackjackPayout = Math.floor(currentBet * 2.5);
      addMoney(blackjackPayout);
      setTotalWinnings(blackjackPayout - currentBet);
      setResultMessage('Blackjack! 3:2 Payout!');
      saveMatch({
        id: `blackjack-${Date.now()}`,
        gameName: 'Blackjack',
        gameMode: 'Standard',
        placement: 1,
        timeAgo: 'Just now',
        moneyEarned: blackjackPayout - currentBet,
        won: true,
        timestamp: Date.now(),
      });
      setGamePhase('game_over');
      return;
    }

    setGamePhase('player_turn');
  }, [currentBet, perfectPairsBet, twentyOnePlus3Bet, shoe, spendMoney, addMoney, triggerHaptic, saveMatch]);

  const hit = useCallback(() => {
    triggerHaptic();
    const card = drawCard(true);
    if (!card) return;

    setPlayerHands(prev => {
      const updated = [...prev];
      const hand = { ...updated[currentHandIndex] };
      hand.cards = [...hand.cards, card];
      
      if (isBusted(hand.cards)) {
        hand.isBusted = true;
      }
      
      updated[currentHandIndex] = hand;
      return updated;
    });
  }, [currentHandIndex, drawCard, triggerHaptic]);

  const stand = useCallback(() => {
    triggerHaptic();
    setPlayerHands(prev => {
      const updated = [...prev];
      updated[currentHandIndex] = { ...updated[currentHandIndex], isStood: true };
      return updated;
    });

    if (currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(prev => prev + 1);
    } else {
      setGamePhase('dealer_turn');
    }
  }, [currentHandIndex, playerHands.length, triggerHaptic]);

  const doubleDown = useCallback(() => {
    const hand = playerHands[currentHandIndex];
    if (hand.bet > money) return;

    triggerHaptic();
    spendMoney(hand.bet);

    const card = drawCard(true);
    if (!card) return;

    setPlayerHands(prev => {
      const updated = [...prev];
      const currentHand = { ...updated[currentHandIndex] };
      currentHand.cards = [...currentHand.cards, card];
      currentHand.bet *= 2;
      currentHand.isDoubled = true;
      currentHand.isStood = true;
      
      if (isBusted(currentHand.cards)) {
        currentHand.isBusted = true;
      }
      
      updated[currentHandIndex] = currentHand;
      return updated;
    });

    if (currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(prev => prev + 1);
    } else {
      setTimeout(() => setGamePhase('dealer_turn'), 500);
    }
  }, [currentHandIndex, playerHands, money, spendMoney, drawCard, triggerHaptic]);

  const split = useCallback(() => {
    const hand = playerHands[currentHandIndex];
    if (hand.cards.length !== 2) return;
    if (hand.cards[0].rank !== hand.cards[1].rank) return;
    if (hand.bet > money) return;
    if (playerHands.length >= 4) return;

    triggerHaptic();
    spendMoney(hand.bet);

    const card1 = drawCard(true);
    const card2 = drawCard(true);
    if (!card1 || !card2) return;

    const isAces = hand.cards[0].rank === 'A';

    setPlayerHands(prev => {
      const updated = [...prev];
      const hand1: Hand = {
        cards: [hand.cards[0], card1],
        bet: hand.bet,
        isDoubled: false,
        isStood: isAces,
        isBusted: false,
        isBlackjack: false,
      };
      const hand2: Hand = {
        cards: [hand.cards[1], card2],
        bet: hand.bet,
        isDoubled: false,
        isStood: isAces,
        isBusted: false,
        isBlackjack: false,
      };

      updated.splice(currentHandIndex, 1, hand1, hand2);
      return updated;
    });

    if (isAces) {
      setTimeout(() => setGamePhase('dealer_turn'), 500);
    }
  }, [currentHandIndex, playerHands, money, spendMoney, drawCard, triggerHaptic]);

  useEffect(() => {
    const hand = playerHands[currentHandIndex];
    if (!hand || gamePhase !== 'player_turn') return;

    if (hand.isBusted || hand.isStood) {
      if (currentHandIndex < playerHands.length - 1) {
        setCurrentHandIndex(prev => prev + 1);
      } else {
        const allBusted = playerHands.every(h => h.isBusted);
        if (allBusted) {
          setDealerCards(prev => prev.map(c => ({ ...c, faceUp: true })));
          setResultMessage('Busted!');
          const totalLost = playerHands.reduce((sum, h) => sum + h.bet, 0);
          saveMatch({
            id: `blackjack-${Date.now()}`,
            gameName: 'Blackjack',
            gameMode: 'Standard',
            placement: 2,
            timeAgo: 'Just now',
            moneyEarned: -totalLost,
            won: false,
            timestamp: Date.now(),
          });
          setGamePhase('game_over');
        } else {
          setGamePhase('dealer_turn');
        }
      }
    }
  }, [playerHands, currentHandIndex, gamePhase, saveMatch]);

  useEffect(() => {
    if (gamePhase !== 'dealer_turn') return;

    const playDealerTurn = async () => {
      setDealerCards(prev => prev.map(c => ({ ...c, faceUp: true })));

      await new Promise(resolve => setTimeout(resolve, 600));

      let currentDealerCards = dealerCards.map(c => ({ ...c, faceUp: true }));
      let currentShoe = [...shoe];

      while (true) {
        const { value, isSoft } = calculateHandValue(currentDealerCards);
        
        if (value > 21) break;
        if (value > 17) break;
        if (value === 17 && !isSoft) break;

        await new Promise(resolve => setTimeout(resolve, 500));

        const newCard = { ...currentShoe[0], faceUp: true, id: `dealer-${Date.now()}-${Math.random()}` };
        currentShoe = currentShoe.slice(1);
        currentDealerCards = [...currentDealerCards, newCard];
        
        setDealerCards([...currentDealerCards]);
        setShoe([...currentShoe]);
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      settleHands(currentDealerCards);
    };

    playDealerTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase]);

  const settleHands = useCallback((finalDealerCards: Card[]) => {
    const dealerValue = calculateHandValue(finalDealerCards).value;
    const dealerBusted = dealerValue > 21;

    let totalWin = 0;
    let handsWon = 0;
    const results: string[] = [];

    playerHands.forEach((hand, index) => {
      if (hand.isBusted) {
        results.push(`Hand ${index + 1}: Busted`);
        return;
      }

      const playerValue = calculateHandValue(hand.cards).value;

      if (dealerBusted) {
        const winAmount = hand.bet * 2;
        addMoney(winAmount);
        totalWin += hand.bet;
        handsWon++;
        results.push(`Hand ${index + 1}: Win ${hand.bet}`);
      } else if (playerValue > dealerValue) {
        const winAmount = hand.bet * 2;
        addMoney(winAmount);
        totalWin += hand.bet;
        handsWon++;
        results.push(`Hand ${index + 1}: Win ${hand.bet}`);
      } else if (playerValue === dealerValue) {
        addMoney(hand.bet);
        results.push(`Hand ${index + 1}: Push`);
      } else {
        results.push(`Hand ${index + 1}: Lose`);
      }
    });

    if (handsWon > 0) {
      addCrowns(10);
    }

    setTotalWinnings(totalWin);
    
    const totalBetAmount = playerHands.reduce((sum, h) => sum + h.bet, 0);
    
    const playerWon = totalWin > 0;
    const isPush = results.every(r => r.includes('Push'));
    
    const formatWinAmount = (amount: number): string => {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
      return `${amount}`;
    };

    if (dealerBusted) {
      setResultMessage(`Dealer Busts! ${totalWin > 0 ? `+${formatWinAmount(totalWin)}` : ''}`);
    } else if (totalWin > 0) {
      setResultMessage(`You Win ${formatWinAmount(totalWin)}!`);
    } else if (isPush) {
      setResultMessage('Push!');
    } else {
      setResultMessage('Dealer Wins');
    }
    
    saveMatch({
      id: `blackjack-${Date.now()}`,
      gameName: 'Blackjack',
      gameMode: 'Standard',
      placement: playerWon ? 1 : (isPush ? 1 : 2),
      timeAgo: 'Just now',
      moneyEarned: playerWon ? totalWin : (isPush ? 0 : -totalBetAmount),
      won: playerWon,
      timestamp: Date.now(),
    });

    setGamePhase('game_over');
    
    Animated.spring(resultAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [playerHands, addMoney, addCrowns, resultAnimation, saveMatch]);

  const newRound = useCallback(() => {
    triggerHaptic();
    setPlayerHands([]);
    setDealerCards([]);
    setCurrentHandIndex(0);
    setGamePhase('betting');
    setCurrentBet(0);
    setPerfectPairsBet(0);
    setTwentyOnePlus3Bet(0);
    setSideBetResults(null);
    setResultMessage('');
    setTotalWinnings(0);
    resultAnimation.setValue(0);

    const totalCards = DECKS_IN_SHOE * 52;
    if (shoe.length < totalCards * RESHUFFLE_THRESHOLD) {
      setShoe(createShoe());
    }
  }, [shoe.length, resultAnimation, triggerHaptic]);

  const currentHand = playerHands[currentHandIndex];
  const canHit = gamePhase === 'player_turn' && currentHand && !currentHand.isBusted && !currentHand.isStood;
  const canStand = canHit;
  const canDouble = canHit && currentHand?.cards.length === 2 && currentHand.bet <= money;
  const canSplit = canHit && 
    currentHand?.cards.length === 2 && 
    currentHand.cards[0].rank === currentHand.cards[1].rank && 
    currentHand.bet <= money &&
    playerHands.length < 4;

  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return `${amount.toFixed(0)}`;
  };

  const formatBetAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return `${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d3320', '#145a32', '#0d3320']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.feltPattern}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={[styles.feltLine, { top: `${i * 5}%` }]} />
        ))}
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>{formatMoney(money)}</Text>
        </View>

        <TouchableOpacity 
          onPress={() => setSoundEnabled(!soundEnabled)} 
          style={styles.headerButton}
        >
          {soundEnabled ? <Volume2 size={24} color="#fff" /> : <VolumeX size={24} color="#fff" />}
        </TouchableOpacity>
      </View>

      <View style={styles.tableArea}>
        <View style={styles.dealerArea}>
          <Text style={styles.dealerLabel}>DEALER</Text>
          <View style={styles.cardsRow}>
            {dealerCards.map((card, index) => (
              <CardComponent 
                key={card.id} 
                card={card} 
                style={{ marginLeft: index > 0 ? -30 : 0 }}
              />
            ))}
          </View>
          {dealerCards.length > 0 && dealerCards.some(c => c.faceUp) && (
            <View style={styles.handValueBadge}>
              <Text style={styles.handValueText}>
                {dealerCards.every(c => c.faceUp) 
                  ? getHandDisplay(dealerCards)
                  : getHandDisplay(dealerCards.filter(c => c.faceUp))}
              </Text>
            </View>
          )}
        </View>

        {sideBetResults && (sideBetResults.perfectPairs.won || sideBetResults.twentyOnePlus3.won) && (
          <View style={styles.sideBetResultsContainer}>
            {sideBetResults.perfectPairs.won && (
              <View style={styles.sideBetResultBadge}>
                <Text style={styles.sideBetResultText}>
                  {sideBetResults.perfectPairs.type}! +{formatBetAmount(sideBetResults.perfectPairs.payout)}
                </Text>
              </View>
            )}
            {sideBetResults.twentyOnePlus3.won && (
              <View style={styles.sideBetResultBadge}>
                <Text style={styles.sideBetResultText}>
                  {sideBetResults.twentyOnePlus3.type}! +{formatBetAmount(sideBetResults.twentyOnePlus3.payout)}
                </Text>
              </View>
            )}
          </View>
        )}

        {resultMessage !== '' && (
          <Animated.View 
            style={[
              styles.resultContainer,
              {
                transform: [{ scale: resultAnimation }],
                opacity: resultAnimation,
              }
            ]}
          >
            <LinearGradient
              colors={totalWinnings > 0 ? ['#fbbf24', '#f59e0b'] : ['#64748b', '#475569']}
              style={styles.resultBadge}
            >
              <Text style={styles.resultText}>{resultMessage}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={styles.playerArea}>
          {playerHands.map((hand, handIndex) => (
            <View 
              key={handIndex} 
              style={[
                styles.playerHand,
                handIndex === currentHandIndex && gamePhase === 'player_turn' && styles.activeHand,
                playerHands.length > 1 && { marginHorizontal: 4 },
              ]}
            >
              <View style={styles.cardsRow}>
                {hand.cards.map((card, cardIndex) => (
                  <CardComponent 
                    key={card.id} 
                    card={card} 
                    style={{ marginLeft: cardIndex > 0 ? -25 : 0 }}
                  />
                ))}
              </View>
              <View style={[
                styles.handValueBadge,
                hand.isBusted && styles.bustedBadge,
                hand.isBlackjack && styles.blackjackBadge,
              ]}>
                <Text style={styles.handValueText}>
                  {hand.isBusted ? 'BUST' : hand.isBlackjack ? 'BJ!' : getHandDisplay(hand.cards)}
                </Text>
              </View>
              {playerHands.length > 1 && (
                <Text style={styles.handBetText}>{formatBetAmount(hand.bet)}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {gamePhase === 'betting' && (
        <View style={styles.bettingArea}>
          <View style={styles.dropZonesContainer}>
            <Text style={styles.dragInstructions}>Drag chips to bet circles</Text>
            <View style={styles.sideBetsRow}>
              <View style={styles.sideBetSection}>
                <Text style={styles.sideBetLabel}>Perfect Pairs</Text>
                <View 
                  ref={perfectPairsRef}
                  collapsable={false}
                  onLayout={() => setTimeout(measureDropZones, 100)}
                >
                  <TouchableOpacity 
                    style={[styles.sideBetCircle, perfectPairsBet > 0 && styles.sideBetActive]}
                    onPress={() => perfectPairsBet > 0 && setPerfectPairsBet(0)}
                  >
                    {perfectPairsBet > 0 && (
                      <Text style={styles.sideBetAmount}>{formatBetAmount(perfectPairsBet)}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.mainBetSection}>
                <Text style={styles.mainBetLabel}>Main Bet</Text>
                <View 
                  ref={mainBetRef}
                  style={[styles.mainBetCircle, currentBet > 0 && styles.mainBetActive]}
                  onLayout={() => setTimeout(measureDropZones, 100)}
                  collapsable={false}
                >
                  {currentBet > 0 && (
                    <Text style={styles.mainBetAmount}>{formatBetAmount(currentBet)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.sideBetSection}>
                <Text style={styles.sideBetLabel}>21+3</Text>
                <View 
                  ref={twentyOnePlus3Ref}
                  collapsable={false}
                  onLayout={() => setTimeout(measureDropZones, 100)}
                >
                  <TouchableOpacity 
                    style={[styles.sideBetCircle, twentyOnePlus3Bet > 0 && styles.sideBetActive]}
                    onPress={() => twentyOnePlus3Bet > 0 && setTwentyOnePlus3Bet(0)}
                  >
                    {twentyOnePlus3Bet > 0 && (
                      <Text style={styles.sideBetAmount}>{formatBetAmount(twentyOnePlus3Bet)}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.chipRackContainer}>
            <View style={styles.chipRackRow}>
              {CHIP_VALUES.slice(0, 5).map(value => (
                <DraggableChip 
                  key={value} 
                  value={value}
                  disabled={value > money - currentBet - perfectPairsBet - twentyOnePlus3Bet}
                  onDrop={handleChipDrop}
                  onTap={handleChipTap}
                  dropZones={dropZones}
                  triggerHaptic={triggerHaptic}
                />
              ))}
            </View>
            <View style={styles.chipRackRow}>
              {CHIP_VALUES.slice(5).map(value => (
                <DraggableChip 
                  key={value} 
                  value={value}
                  disabled={value > money - currentBet - perfectPairsBet - twentyOnePlus3Bet}
                  onDrop={handleChipDrop}
                  onTap={handleChipTap}
                  dropZones={dropZones}
                  triggerHaptic={triggerHaptic}
                />
              ))}
            </View>
          </View>

          <View style={styles.betButtonsRow}>
            <TouchableOpacity style={styles.betButton} onPress={clearBets}>
              <Text style={styles.betButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.betButton} 
              onPress={rebet}
              disabled={lastBet === 0}
            >
              <Text style={[styles.betButtonText, lastBet === 0 && styles.disabledText]}>Rebet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.betButton} onPress={maxBet}>
              <Text style={styles.betButtonText}>Max</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.dealButton, currentBet === 0 && styles.dealButtonDisabled]}
            onPress={deal}
            disabled={currentBet === 0}
          >
            <LinearGradient
              colors={currentBet > 0 ? ['#fbbf24', '#f59e0b'] : ['#475569', '#334155']}
              style={styles.dealButtonGradient}
            >
              <Text style={styles.dealButtonText}>DEAL</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {gamePhase === 'player_turn' && (
        <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={[styles.actionButton, !canHit && styles.actionButtonDisabled]}
            onPress={hit}
            disabled={!canHit}
          >
            <Text style={styles.actionButtonText}>HIT</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.standButton, !canStand && styles.actionButtonDisabled]}
            onPress={stand}
            disabled={!canStand}
          >
            <Text style={styles.actionButtonText}>STAND</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.doubleButton, !canDouble && styles.actionButtonDisabled]}
            onPress={doubleDown}
            disabled={!canDouble}
          >
            <Text style={styles.actionButtonText}>DOUBLE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.splitButton, !canSplit && styles.actionButtonDisabled]}
            onPress={split}
            disabled={!canSplit}
          >
            <Text style={styles.actionButtonText}>SPLIT</Text>
          </TouchableOpacity>
        </View>
      )}

      {(gamePhase === 'dealing' || gamePhase === 'dealer_turn') && (
        <View style={[styles.waitingArea, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.waitingText}>
            {gamePhase === 'dealing' ? 'Dealing...' : 'Dealer\'s Turn...'}
          </Text>
        </View>
      )}

      {gamePhase === 'game_over' && (
        <View style={[styles.gameOverArea, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.newRoundButton} onPress={newRound}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.newRoundGradient}
            >
              <RotateCcw size={20} color="#fff" />
              <Text style={styles.newRoundText}>NEW HAND</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.shoeIndicator}>
        <Text style={styles.shoeText}>
          Cards: {shoe.length}/{DECKS_IN_SHOE * 52}
        </Text>
        <View style={styles.shoeBar}>
          <View style={[styles.shoeFill, { width: `${(shoe.length / (DECKS_IN_SHOE * 52)) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d3320',
  },
  feltPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  feltLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600' as const,
  },
  balanceAmount: {
    fontSize: 24,
    color: '#fbbf24',
    fontWeight: '800' as const,
  },
  tableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  dealerArea: {
    alignItems: 'center',
    paddingTop: 8,
  },
  dealerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 70,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: '#1e40af',
  },
  cardBackPattern: {
    width: '90%',
    height: '90%',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackInner: {
    width: '80%',
    height: '80%',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardCorner: {
    position: 'absolute',
    top: 6,
    left: 6,
    alignItems: 'center',
  },
  cardCornerBottom: {
    top: undefined,
    left: undefined,
    bottom: 6,
    right: 6,
    transform: [{ rotate: '180deg' }],
  },
  cardRank: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  cardSuitSmall: {
    fontSize: 12,
    marginTop: -2,
  },
  cardSuitLarge: {
    fontSize: 32,
  },
  handValueBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bustedBadge: {
    backgroundColor: '#dc2626',
  },
  blackjackBadge: {
    backgroundColor: '#fbbf24',
  },
  handValueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  playerArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  playerHand: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  activeHand: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  handBetText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  sideBetResultsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  sideBetResultBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sideBetResultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  resultBadge: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  resultText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bettingArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sideBetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sideBetSection: {
    alignItems: 'center',
    flex: 1,
  },
  sideBetLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  sideBetCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBetActive: {
    borderColor: '#fbbf24',
    borderStyle: 'solid',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  sideBetAmount: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800' as const,
  },
  mainBetSection: {
    alignItems: 'center',
    flex: 1.5,
  },
  mainBetLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  mainBetCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mainBetActive: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  mainBetAmount: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '900' as const,
  },
  dropZonesContainer: {
    marginBottom: 12,
  },
  dragInstructions: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  chipRackContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  chipRackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  draggableChipWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  chipWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipInnerSolid: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  chipValue: {
    color: '#fff',
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  betButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  betButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  betButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  disabledText: {
    opacity: 0.4,
  },
  dealButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dealButtonDisabled: {
    opacity: 0.6,
  },
  dealButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dealButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900' as const,
    letterSpacing: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  standButton: {
    backgroundColor: '#2563eb',
  },
  doubleButton: {
    backgroundColor: '#7c3aed',
  },
  splitButton: {
    backgroundColor: '#059669',
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  waitingArea: {
    alignItems: 'center',
    paddingTop: 24,
  },
  waitingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  gameOverArea: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  newRoundButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  newRoundGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  newRoundText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  shoeIndicator: {
    position: 'absolute',
    top: 100,
    right: 12,
    alignItems: 'flex-end',
  },
  shoeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  shoeBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  shoeFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
});
