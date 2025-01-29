export type TerrainType = 'ground' | 'hill' | 'forest' | 'water' | 'base';

export type PositionCart = {x: number, y: number};

export type UnitType = {
  id: string;
  type: 'friendly' | 'enemy';
  target: PositionCart;
  location: PositionCart;
  ammo: number;
  health: number;
  name: string;
  moveSafely: boolean;
  isFighting: boolean
};

export type GameState = {
  grid: (TerrainType)[][];
  units: Record<string, UnitType>;
  messages: string[];
};

type UnitName = {
  name: string; // Two capital letters A-Z
};

type Position = {
  row: string; // A capital letter A-L
  column: number; // A number 1-12
};

type UnitID = {
  id: UnitName;
};

type MovementMethod = {
  method: "safe" | "fast"; // Movement method pattern
};

type Order = {
  unit: UnitID;
  target: Position;
  method: MovementMethod;
};

export type Orders = {
  orders: Order[];
};