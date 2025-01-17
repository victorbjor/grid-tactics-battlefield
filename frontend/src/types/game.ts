export type TerrainType = 'ground' | 'hill' | 'forest' | 'water' | 'base';

export type Position = {x: number, y: number};

export type UnitType = {
  id: string;
  type: 'friendly' | 'enemy';
  target: Position;
  location: Position;
  ammo: number;
  health: number;
  name: string;
  moveSafely: boolean;
};

export type GameState = {
  grid: (TerrainType)[][];
  units: Record<string, UnitType>;
  messages: string[];
};