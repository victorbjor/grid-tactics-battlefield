import React from 'react';
import { TerrainType, UnitType } from '../types/game';

interface GameGridProps {
  grid: (TerrainType | null)[][];
  units: Record<string, UnitType>;
}

const GameGrid: React.FC<GameGridProps> = ({ grid, units }) => {
  const isAdjacent = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
  };

  const findAdjacentEnemies = (x: number, y: number, unitType: 'friendly' | 'enemy') => {
    return Object.values(units).filter(u => 
      u.type !== unitType && 
      isAdjacent(x, y, u.x, u.y)
    );
  };

  const renderCombatEffect = (fromX: number, fromY: number, toX: number, toY: number) => {
    const bullets = [];
    const dx = (toX - fromX) * 48; // 48px is the cell width
    const dy = (toY - fromY) * 48;
    
    for (let i = 0; i < 3; i++) {
      bullets.push(
        <div
          key={`bullet-${i}`}
          className="combat-bullet"
          style={{
            '--tx': `${dx}px`,
            '--ty': `${dy}px`,
            animationDelay: `${i * 0.2}s`
          } as React.CSSProperties}
        />
      );
    }
    return bullets;
  };

  const renderCell = (terrain: TerrainType | null, x: number, y: number) => {
    const cellKey = `${x}-${y}`;
    const unit = Object.values(units).find(u => u.x === x && u.y === y);
    const adjacentEnemies = unit ? findAdjacentEnemies(x, y, unit.type) : [];
    
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
        {unit && adjacentEnemies.map(enemy => 
          renderCombatEffect(x, y, enemy.x, enemy.y)
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Column labels (A-L) */}
      <div className="absolute -top-6 left-6 right-0 flex">
        {Array.from({length: 12}).map((_, i) => (
          <div key={`col-${i}`} className="w-12 text-center">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>

      {/* Row labels (1-12) */}
      <div className="absolute -left-6 top-6 bottom-0 flex flex-col justify-between">
        {Array.from({length: 12}).map((_, i) => (
          <div key={`row-${i}`} className="h-12 flex items-center justify-center">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="inline-grid grid-cols-12 ml-6 mt-6">
        {grid.map((row, y) => (
          <React.Fragment key={y}>
            {row.map((cell, x) => renderCell(cell, x, y))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default GameGrid;