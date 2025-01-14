import { GameState, TerrainType, UnitType } from "@/types/game";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

  // Pathfinding helper functions
  const getHeuristic = (x: number, y: number) => Math.abs(x) + Math.abs(y); // Manhattan distance to base

  const getTerrainCost = (grid: TerrainType[][], x: number, y: number) => {
    const terrain = grid[y]?.[x];
    if (!terrain || terrain === 'water') return Infinity;
    if (terrain === 'hill' || terrain === 'forest') return 0.1; // Prefer hills and forest
    return 1;
  };

  const getValidNeighbors = (grid: TerrainType[][], unit: UnitType) => {
    return [
      {x: unit.x-1, y: unit.y},
      {x: unit.x+1, y: unit.y}, 
      {x: unit.x, y: unit.y-1},
      {x: unit.x, y: unit.y+1}
    ].filter(pos => {
      const terrain = grid[pos.y]?.[pos.x];
      return terrain && terrain !== 'water' && pos.x >= 0 && pos.y >= 0;
    });
  };

  const findBestMove = (grid: TerrainType[][], unit: UnitType) => {
    type PosWithCost = { x: number; y: number; cost: number };
    const neighbors = getValidNeighbors(grid, unit);
    return neighbors.reduce<PosWithCost>((best, pos) => {
      const cost = getTerrainCost(grid, pos.x, pos.y) + getHeuristic(pos.x, pos.y);
      if (cost < best.cost) {
        return {x: pos.x, y: pos.y, cost};
      }
      return best;
    }, {x: unit.x, y: unit.y, cost: Infinity});
  };

  export const moveEnemyUnits = (prevState: GameState) => {
    const newUnits = { ...prevState.units };
    
    Object.values(newUnits)
      .filter(unit => unit.type === 'enemy')
      .forEach(enemy => {
        const bestMove = findBestMove(prevState.grid, enemy);
        newUnits[enemy.id] = { ...enemy, x: bestMove.x, y: bestMove.y };
      });

    return { ...prevState, units: newUnits };
  };