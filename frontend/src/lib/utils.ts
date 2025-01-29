import { Fallback } from "@radix-ui/react-avatar";
import {GameState, PositionCart, TerrainType, UnitType} from "../types/game";
import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pathfinding helper functions
const getHeuristic = (pos: PositionCart, target: PositionCart) => 
  Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y);

export const tileHasSoldier = (x: number, y: number, units: Record<string, UnitType>) => {
  return Object.values(units).some(u => {
      return u.location.x === x && u.location.y === y
    }
  );
}

export const tileHasFriendlySoldier = (x: number, y: number, unit: UnitType, units: Record<string, UnitType>) => {
  return Object.values(units).some(u => {
      return u.type === unit.type && u.location.x === x && u.location.y === y
    }
  );
}

const isAdjacent = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
};

export const findAdjacentEnemies = (x: number, y: number, unitType: 'friendly' | 'enemy', units: Record<string, UnitType>): UnitType[] => {
  return Object.values(units).filter(u =>
      u.type !== unitType &&
      isAdjacent(x, y, u.location.x, u.location.y)
  );
};

const getTerrainCost = (grid: TerrainType[][], x: number, y: number, unit: UnitType, units: Record<string, UnitType>, moveSafely: boolean = true) => {
  const terrain = grid[y]?.[x];
  let cost = 1;
  if (!terrain || terrain === 'water') cost = Infinity;
  if (terrain === 'hill' || terrain === 'forest') cost = moveSafely ? 0.1 : 2;
  const hasEnemyUnit = findAdjacentEnemies(x,y,unit.type, units).length > 0;
  const hasFriendlyUnit =(tileHasFriendlySoldier(x, y, unit, units));
  if (hasEnemyUnit) cost *= 10;
  if (hasFriendlyUnit) cost *= 1000;
  return cost;
};

const getValidNeighbors = (grid: TerrainType[][], unit: UnitType, units: Record<string, UnitType>) => {
  return [
    {x: unit.location.x-1, y: unit.location.y},
    {x: unit.location.x+1, y: unit.location.y}, 
    {x: unit.location.x, y: unit.location.y-1},
    {x: unit.location.x, y: unit.location.y+1}
  ].filter(pos => {
    const terrain = grid[pos.y]?.[pos.x];
    return terrain && 
           terrain !== 'water' &&
           pos.x >= 0 && 
           pos.y >= 0 &&
           !tileHasFriendlySoldier(pos.x, pos.y, unit, units);
  });
};

const findBestMove = (
    grid: TerrainType[][],
    unit: UnitType,
    units: Record<string, UnitType> // Accept updated units
): PositionCart => {
  const start = unit.location;
  const target = unit.target;

  if (start.x === target.x && start.y === target.y) {
    return start;
  }

  const openSet: PositionCart[] = [start];
  const closedSet: Set<string> = new Set();

  const cameFrom: Record<string, PositionCart | null> = {};
  cameFrom[`${start.x},${start.y}`] = null;

  const gScore: Record<string, number> = {};
  gScore[`${start.x},${start.y}`] = 0;

  const fScore: Record<string, number> = {};
  fScore[`${start.x},${start.y}`] = getHeuristic(start, target);

  while (openSet.length > 0) {
    openSet.sort(
        (a, b) =>
            (fScore[`${a.x},${a.y}`] || Infinity) -
            (fScore[`${b.x},${b.y}`] || Infinity)
    );
    const current = openSet.shift()!;

    if (current.x === target.x && current.y === target.y) {
      const fullPath: PositionCart[] = [];
      let node: PositionCart | null = current;
      let iterations = 0;
      const maxIterations = grid.length * grid[0].length;

      while (node) {
        fullPath.push(node);
        node = cameFrom[`${node.x},${node.y}`] || null;

        iterations++;
        if (iterations > maxIterations) {
          console.error(`Path reconstruction failed: exceeded maximum ${maxIterations} iterations`);
          return start; // fallback
        }
      }

      fullPath.reverse();
      return fullPath[1] || start;
    }

    closedSet.add(`${current.x},${current.y}`);

    const neighbors = getValidNeighbors(grid, { location: current } as UnitType, units);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeGScore =
          (gScore[`${current.x},${current.y}`] ?? Infinity) +
          getTerrainCost(grid, neighbor.x, neighbor.y, unit, units, unit.moveSafely);

      if (tentativeGScore < (gScore[neighborKey] ?? Infinity)) {
        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + getHeuristic(neighbor, target);

        if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return start;
};

export const moveAllUnits = (prevState: GameState) => {
  const newUnits: Record<string, UnitType> = { ...prevState.units };
  const messages: string[] = [];

  Object.values(newUnits).forEach(unit => {
    const updatedUnit: UnitType = { ...unit };

    // Get current terrain type
    const currentTerrain = prevState.grid[unit.location.y][unit.location.x];

    let moveChance = 1;
    let healthLoss = 0;
    
    const wasFighting = unit.isFighting;
    const isFighting = findAdjacentEnemies(unit.location.x, unit.location.y, unit.type, prevState.units).length > 0;
    if (!wasFighting && isFighting && unit.type === 'friendly') {
      messages.push(`${unit.name} has engaged the enemy!`);
    }
    if (isFighting) {
      updatedUnit.isFighting = true; 
      moveChance *= 0.75;
      healthLoss += 40;
    }

    // Only move if unit is not in slow terrain, or if it's in slow terrain but they are lucky.
    const isInSlowTerrain = currentTerrain === 'forest' || currentTerrain === 'hill';
    const isSafeTerrain = currentTerrain === 'forest' || currentTerrain === 'hill' || currentTerrain === 'base';
    if (isInSlowTerrain) {
      moveChance *= 0.5;
    }
    if (isSafeTerrain) {
      healthLoss *= 0.1;
    }
    if (healthLoss > unit.health || unit.health <= 0) {
      delete newUnits[unit.id];
      if (unit.type === 'friendly') {
        messages.push(`${unit.name} just died!`);
      }
      return;
    }
    updatedUnit.health -= healthLoss;
    
    if (unit.type === 'friendly'  && healthLoss > updatedUnit.health) {
      messages.push(`${unit.name} is critically injured and may die next turn.`);
    }

    const alreadyAtTarget = updatedUnit.location.x === updatedUnit.target.x && updatedUnit.location.y === updatedUnit.target.y;
    const shouldMove = Math.random() < moveChance && !alreadyAtTarget;

    if (shouldMove) {
      const bestMove = findBestMove(prevState.grid, updatedUnit, newUnits); // Pass `newUnits` here
      if (!tileHasSoldier(bestMove.x, bestMove.y, newUnits)) {
        updatedUnit.location = bestMove;
        if (unit.type === 'friendly' && bestMove.x === updatedUnit.target.x && bestMove.y === updatedUnit.target.y) {
          messages.push(`${unit.name} has reached its target!`);
        }
      }
    }

    newUnits[unit.id] = { ...updatedUnit };
  });

  return { ...prevState, units: newUnits, messages: messages };
};

export type FlatOrder = {
  unitName: string;
  targetRow: string;
  targetColumn: number;
  method: string;
};

export function flattenOrder(order: {
  unit: { id: { name: string } };
  target: { row: string; column: number };
  method: { method: string };
}): FlatOrder {
  return {
    unitName: order.unit.id.name,
    targetRow: order.target.row,
    targetColumn: order.target.column,
    method: order.method.method,
  };
}

export function algToCart(file: string, rank: number): { x: number; y: number } | null {
  /**
   * Convert chess algebraic notation components (file and rank) to Cartesian coordinates on a 12x12 board.
   *
   * Parameters:
   *   file (string): The file (A-L) as a single uppercase letter.
   *   rank (number): The rank (1-12) as a number.
   *
   * Returns:
   *   An object containing the Cartesian coordinates { x, y }.
   */
  if (!/^[A-L]$/.test(file) || rank < 1 || rank > 12) {
      return null
  }

  const x = file.charCodeAt(0) - 'A'.charCodeAt(0); // Convert file to x (0-11)
  const y = rank - 1;                               // Convert rank to y (0-11)

  return { x, y };
}

export const getUnitByName = (name: string, gameState: GameState): string | undefined => {
  return Object.keys(gameState.units).find(id => gameState.units[id].name === name);
};

export const setUnitTarget = (
  unitName: string,
  target: PositionCart,
  moveSafely: boolean,
  gameState: GameState
): GameState => {
  const unitId = getUnitByName(unitName, gameState);
  if (!unitId) {
    return gameState;
  }
  return {
    ...gameState,
    units: {
      ...gameState.units,
      [unitId]: {
        ...gameState.units[unitId],
        target,
        moveSafely
      }
    }
  };
};
