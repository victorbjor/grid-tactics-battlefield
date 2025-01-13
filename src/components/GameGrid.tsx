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
        className={`grid-cell cell-${terrain || 'ground'} relative flex items-center justify-center`}
        data-coordinates={`${String.fromCharCode(65 + x)}${y + 1}`}
      >
        {unit && (
          <div className={`unit ${unit.type === 'friendly' ? 'unit-friendly' : 'unit-enemy'} animate-fade-in flex items-center justify-center text-white font-bold`}>
            {unit.type === 'friendly' && unit.name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="inline-grid grid-cols-8">
      {grid.map((row, y) => (
        <React.Fragment key={y}>
          {row.map((cell, x) => renderCell(cell, x, y))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default GameGrid;