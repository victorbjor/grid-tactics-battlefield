import React from 'react';
import { TerrainType, UnitType } from '../types/game';

interface GameGridProps {
  grid: (TerrainType | null)[][];
  units: Record<string, UnitType>;
}

const GameGrid: React.FC<GameGridProps> = ({ grid, units }) => {
  const renderCell = (terrain: TerrainType | null, x: number, y: number) => {
    const cellKey = `${x}-${y}`;
    const unit = Object.values(units).find(u => u.x === x && u.y === y);
    
    return (
      <div 
        key={cellKey}
        className={`grid-cell cell-${terrain || 'ground'} relative border-r border-b border-gray-200 last:border-r-0`}
        data-coordinates={`${String.fromCharCode(65 + x)}${y + 1}`}
      >
        {unit && (
          <div className={`unit ${unit.type === 'friendly' ? 'unit-friendly' : 'unit-enemy'} animate-fade-in`} />
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-8 border-l border-t border-gray-200">
      {grid.map((row, y) => (
        <React.Fragment key={y}>
          {row.map((cell, x) => renderCell(cell, x, y))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default GameGrid;