export interface GameMatch {
  id: string;
  gameName: string;
  gameMode: string;
  placement: number;
  timeAgo: string;
  moneyEarned: number;
  won: boolean;
  timestamp: number;
  pushed?: boolean;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  value: number;
  width: number;
  height: number;
  destroyed: boolean;
}

export interface Ball {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}
