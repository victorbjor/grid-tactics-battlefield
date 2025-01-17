import {GameState, Position, TerrainType, UnitType} from "../types/game";
import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pathfinding helper functions
const getHeuristic = (pos: Position, target: Position) => 
  Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y);

const tileHasSoldier = (x: number, y: number, units: Record<string, UnitType>) => {
  return Object.values(units).some(u => {
      return u.location.x === x && u.location.y === y
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
  if (hasEnemyUnit) cost *= 10;
  return cost;
};

const getValidNeighbors = (grid: TerrainType[][], unit: UnitType) => {
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
           pos.y >= 0;
  });
};

const findBestMove = (
    grid: TerrainType[][],
    unit: UnitType,
    units: Record<string, UnitType>
): Position => {
  const start = unit.location;
  const target = unit.target;

  // Early exit if already at target
  if (start.x === target.x && start.y === target.y) {
    return start;
  }

  // Priority queue (array) for open positions
  const openSet: Position[] = [start];
  // Closed set to avoid revisiting already-processed nodes
  const closedSet: Set<string> = new Set();

  const cameFrom: Record<string, Position | null> = {};
  cameFrom[`${start.x},${start.y}`] = null;

  // Cost to reach a node
  const gScore: Record<string, number> = {};
  gScore[`${start.x},${start.y}`] = 0;

  // Estimated total cost (g + heuristic)
  const fScore: Record<string, number> = {};
  fScore[`${start.x},${start.y}`] = getHeuristic(start, target);

  while (openSet.length > 0) {
    // Find the node in the open set with the lowest f-score
    openSet.sort(
        (a, b) =>
            (fScore[`${a.x},${a.y}`] || Infinity) -
            (fScore[`${b.x},${b.y}`] || Infinity)
    );
    const current = openSet.shift()!;

    // If we've reached the target, reconstruct the path
    if (current.x === target.x && current.y === target.y) {
      // Reconstruct the path by going backwards
      const fullPath: Position[] = [];
      let node: Position | null = current;
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

      // Now fullPath is [target, ..., start], so reverse it:
      fullPath.reverse(); // becomes [start, ..., target]

      // If you just want the first step from 'start':
      return fullPath[1] || start;
    }

    // Mark current node as closed (visited)
    closedSet.add(`${current.x},${current.y}`);

    // Explore neighbors
    const neighbors = getValidNeighbors(grid, { location: current } as UnitType);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      // Skip if neighbor is already in closed set
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Tentative g-score
      const tentativeGScore =
          (gScore[`${current.x},${current.y}`] ?? Infinity) +
          getTerrainCost(grid, neighbor.x, neighbor.y, unit, units, unit.moveSafely);

      // If this path to neighbor is better, store it
      if (tentativeGScore < (gScore[neighborKey] ?? Infinity)) {
        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + getHeuristic(neighbor, target);

        // If neighbor not in openSet, add it
        if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // If we exit the loop, there's no valid path
  return start;
};

export const moveAllUnits = (prevState: GameState) => {
  const newUnits: Record<string, UnitType> = { ...prevState.units };
  
  Object.values(newUnits).forEach(unit => {
    const updatedUnit: UnitType = {...unit};

    // Get current terrain type
    const currentTerrain = prevState.grid[unit.location.y][unit.location.x];

    let moveChance = 1;
    let healthLoss = 0;

    const isFighting = findAdjacentEnemies(unit.location.x, unit.location.y, unit.type, prevState.units).length > 0;
    if (isFighting) {
      console.log(`unit ${unit.id} is fighting`)
      moveChance *= .75;
      healthLoss += 40;
    }

    // Only move if unit is not in slow terrain, or if it's in slow terrain but they are lucky.
    const isInSlowTerrain = currentTerrain === 'forest' || currentTerrain === 'hill';
    const isSafeTerrain = currentTerrain === 'forest' || currentTerrain === 'hill' || currentTerrain === 'base';
    if (isInSlowTerrain) {
      moveChance *= .5;
    }
    if (isSafeTerrain) {
      healthLoss *= .1;
    }
    if (healthLoss > unit.health || unit.health <= 0) {
      delete newUnits[unit.id];
      return;
    }
    updatedUnit.health -= healthLoss;
    const shouldMove = Math.random() < moveChance;
    
    if (shouldMove) {
      const bestMove = findBestMove(prevState.grid, unit, prevState.units);
      if (!tileHasSoldier(bestMove.x, bestMove.y, newUnits)) {
        updatedUnit.location = bestMove;
      }
    }

    newUnits[unit.id] = {...updatedUnit};
  });

  return { ...prevState, units: newUnits };
};

export const getUnitByPosition = (position: Position, gameState: GameState): string | undefined => {
  return Object.keys(gameState.units).find(id => 
    gameState.units[id].location.x === position.x && gameState.units[id].location.y === position.y
  );
};

export const getUnitByName = (name: string, gameState: GameState): string | undefined => {
  return Object.keys(gameState.units).find(id => gameState.units[id].name === name);
};

export const setUnitTarget = (
  unitId: string,
  target: Position,
  moveSafely: boolean,
  gameState: GameState
): GameState => {
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
