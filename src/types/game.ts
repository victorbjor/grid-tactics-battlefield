export type TerrainType = 'ground' | 'hill' | 'forest' | 'water' | 'base';

export type UnitType = {
  id: string;
  type: 'friendly' | 'enemy';
  x: number;
  y: number;
};

export type GameState = {
  grid: (TerrainType | null)[][];
  units: Record<string, UnitType>;
  messages: string[];
};