import { GameState } from '@/types/game';

export function handleGameCommand(command: string, currentState: GameState): GameState {
  // Parse command like "unit A to C4"
  const match = command.match(/unit (\w+) to ([A-L])(\d+)/i);
  
  if (!match) {
    throw new Error('Invalid command format. Use: unit [NAME] to [COORDINATE]');
  }

  const [_, unitName, colStr, rowStr] = match;
  const targetX = colStr.charCodeAt(0) - 65; // Convert A-L to 0-11
  const targetY = parseInt(rowStr) - 1; // Convert 1-based to 0-based

  // Find the unit
  const unitId = Object.keys(currentState.units).find(
    id => currentState.units[id].type === 'friendly' && currentState.units[id].name === unitName
  );

  if (!unitId) {
    throw new Error(`Unit ${unitName} not found`);
  }

  // Create new state with updated unit position
  const newState = {
    ...currentState,
    units: {
      ...currentState.units,
      [unitId]: {
        ...currentState.units[unitId],
        x: targetX,
        y: targetY,
      },
    },
  };

  return newState;
} 