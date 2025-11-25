import { PlayerColor } from './types';

export const BOARD_SIZE = 15;
export const TRACK_LENGTH = 52;
export const HOME_LENGTH = 6;

export const COLOR_MAP = {
  [PlayerColor.YELLOW]: { bg: 'bg-yellow-500', bg10: 'bg-yellow-500/10', bg20: 'bg-yellow-500/20', bg60: 'bg-yellow-500/60', text: 'text-yellow-500', border: 'border-yellow-500', glow: 'shadow-yellow-500/50', from: 'from-yellow-500', to: 'to-yellow-700' },
  [PlayerColor.BLUE]: { bg: 'bg-blue-500', bg10: 'bg-blue-500/10', bg20: 'bg-blue-500/20', bg60: 'bg-blue-500/60', text: 'text-blue-500', border: 'border-blue-500', glow: 'shadow-blue-500/50', from: 'from-blue-500', to: 'to-blue-700' },
  [PlayerColor.GREEN]: { bg: 'bg-emerald-500', bg10: 'bg-emerald-500/10', bg20: 'bg-emerald-500/20', bg60: 'bg-emerald-500/60', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'shadow-emerald-500/50', from: 'from-emerald-500', to: 'to-emerald-700' },
  [PlayerColor.RED]: { bg: 'bg-rose-500', bg10: 'bg-rose-500/10', bg20: 'bg-rose-500/20', bg60: 'bg-rose-500/60', text: 'text-rose-500', border: 'border-rose-500', glow: 'shadow-rose-500/50', from: 'from-rose-500', to: 'to-rose-700' },
};

export const START_INDICES = {
  [PlayerColor.YELLOW]: 0,
  [PlayerColor.RED]: 13,
  [PlayerColor.GREEN]: 26,
  [PlayerColor.BLUE]: 39,
};

export const GATEWAY_INDICES = {
  [PlayerColor.YELLOW]: 49,
  [PlayerColor.RED]: 10,
  [PlayerColor.GREEN]: 23,
  [PlayerColor.BLUE]: 36,
};

export const SHORTCUTS = {
  [PlayerColor.BLUE]: { start: 4, end: 16 },
  [PlayerColor.YELLOW]: { start: 17, end: 29 },
  [PlayerColor.RED]: { start: 30, end: 42 },
  [PlayerColor.GREEN]: { start: 43, end: 3 },
};

export const PLAYER_ORDER = [PlayerColor.YELLOW, PlayerColor.RED, PlayerColor.GREEN, PlayerColor.BLUE];