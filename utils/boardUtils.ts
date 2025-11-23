import { Coordinate, PlayerColor } from '../types';

const COLOR_PATTERN = [PlayerColor.BLUE, PlayerColor.YELLOW, PlayerColor.RED, PlayerColor.GREEN];

const generateTrack = (): Coordinate[] => {
  const coords: { x: number, y: number }[] = [];

  // 1. Left Arm Top (0,10) -> (3,10) [Right]
  for (let x = 0; x <= 3; x++) coords.push({ x, y: 10 });
  // 2. Top Arm Left (4,11) -> (4,14) [Up]
  for (let y = 11; y <= 14; y++) coords.push({ x: 4, y });
  // 3. Top Arm Top (5,14) -> (9,14) [Right]
  for (let x = 5; x <= 9; x++) coords.push({ x, y: 14 });
  // 4. Top Arm Right (10,14) -> (10,11) [Down]
  for (let y = 14; y >= 11; y--) coords.push({ x: 10, y });
  // 5. Right Arm Top (11,10) -> (14,10) [Right]
  for (let x = 11; x <= 14; x++) coords.push({ x, y: 10 });
  // 6. Right Arm Bottom (14,9) -> (14,5) [Down]
  for (let y = 9; y >= 5; y--) coords.push({ x: 14, y });
  // 7. Right Arm Bottom (14,4) -> (11,4) [Left]
  for (let x = 14; x >= 11; x--) coords.push({ x, y: 4 });
  // 8. Bottom Arm Right (10,3) -> (10,0) [Down]
  for (let y = 3; y >= 0; y--) coords.push({ x: 10, y });
  // 9. Bottom Arm Bottom (9,0) -> (5,0) [Left]
  for (let x = 9; x >= 5; x--) coords.push({ x, y: 0 });
  // 10. Bottom Arm Left (4,0) -> (4,3) [Up]
  for (let y = 0; y <= 3; y++) coords.push({ x: 4, y });
  // 11. Left Arm Bottom (3,4) -> (0,4) [Left]
  for (let x = 3; x >= 0; x--) coords.push({ x, y: 4 });
  // 12. Left Arm Top (0,5) -> (0,9) [Up]
  for (let y = 5; y <= 9; y++) coords.push({ x: 0, y });

  return coords.map((c, i) => ({
    x: c.x,
    y: c.y,
    color: COLOR_PATTERN[i % 4]
  }));
};

export const TRACK_COORDS: Coordinate[] = generateTrack();

export const getHomeCoordinates = (color: PlayerColor): Coordinate[] => {
  const center = { x: 7, y: 7, color: undefined };
  const path: Coordinate[] = [];

  if (color === PlayerColor.YELLOW) {
    for (let x = 1; x <= 6; x++) path.push({ x, y: 7, color: PlayerColor.YELLOW });
  } else if (color === PlayerColor.GREEN) {
    for (let x = 13; x >= 8; x--) path.push({ x, y: 7, color: PlayerColor.GREEN });
  } else if (color === PlayerColor.RED) {
    for (let y = 13; y >= 8; y--) path.push({ x: 7, y, color: PlayerColor.RED });
  } else if (color === PlayerColor.BLUE) {
    for (let y = 1; y <= 6; y++) path.push({ x: 7, y, color: PlayerColor.BLUE });
  }

  path.push(center);
  return path;
};

export const getLaunchCoordinate = (color: PlayerColor): Coordinate => {
  switch (color) {
    case PlayerColor.YELLOW: return { x: 0, y: 11 };
    case PlayerColor.RED: return { x: 11, y: 14 };
    case PlayerColor.BLUE: return { x: 3, y: 0 };
    case PlayerColor.GREEN: return { x: 14, y: 3 };
  }
};

export const getHangarZone = (color: PlayerColor) => {
  switch (color) {
    case PlayerColor.YELLOW: return { xMin: 1, xMax: 2, yMin: 12, yMax: 13 };
    case PlayerColor.RED: return { xMin: 12, xMax: 13, yMin: 12, yMax: 13 };
    case PlayerColor.GREEN: return { xMin: 12, xMax: 13, yMin: 1, yMax: 2 };
    case PlayerColor.BLUE: return { xMin: 1, xMax: 2, yMin: 1, yMax: 2 };
  }
};

export const getShortcutPath = (color: PlayerColor): Coordinate[] => {
  const path: Coordinate[] = [];
  if (color === PlayerColor.GREEN) {
    for (let y = 5; y <= 10; y++) path.push({ x: 3, y });
  }
  if (color === PlayerColor.BLUE) {
    for (let x = 5; x <= 10; x++) path.push({ x, y: 11 });
  }
  if (color === PlayerColor.YELLOW) {
    for (let y = 9; y >= 4; y--) path.push({ x: 11, y });
  }
  if (color === PlayerColor.RED) {
    for (let x = 9; x >= 4; x--) path.push({ x, y: 3 });
  }
  return path;
};