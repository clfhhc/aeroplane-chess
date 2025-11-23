export enum PlayerColor {
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  RED = 'red',
}

export type PieceState = 'base' | 'launched' | 'active' | 'home' | 'finished';

export interface Piece {
  id: number; // 0-3
  position: number; // -1 (base), 0-51 (track), 100+ (home stretch relative index)
  state: PieceState;
}

export interface Player {
  id: number;
  color: PlayerColor;
  name: string;
  pieces: Piece[];
}

export interface Coordinate {
  x: number;
  y: number;
  color?: PlayerColor;
}

export interface CellData {
  type: 'track' | 'home' | 'base' | 'center' | 'empty';
  index?: number; // 0-51 for track
  color?: PlayerColor;
  isShortcut?: boolean;
  isLaunch?: boolean;
}

export interface LogEntry {
  turn: number;
  text: string;
  playerColor: PlayerColor;
}