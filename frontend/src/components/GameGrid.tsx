import React from 'react';
import { TerrainType, UnitType } from '../types/game';
import {findAdjacentEnemies} from "@/lib/utils.ts";

interface GameGridProps {
  grid: (TerrainType | null)[][];
  units: Record<string, UnitType>;
}

const GameGrid: React.FC<GameGridProps> = ({ grid, units }) => {

  const renderCombatEffect = (fromX: number, fromY: number, toX: number, toY: number) => {
    const bullets: JSX.Element[] = [];
    const dx = (toX - fromX) * 48;
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

  const renderCell = (terrain: TerrainType | null, x: number, y: number, units: Record<string, UnitType>) => {
    const cellKey = `${x}-${y}`;
    const unit = Object.values(units).find(u => u.location.x === x && u.location.y === y);
    const adjacentEnemies = unit ? findAdjacentEnemies(x, y, unit.type, units) : [];
  
    return (
      <div 
        key={cellKey}
        className={`
          relative flex items-center justify-center
          w-full pb-[100%]
          cell-${terrain || 'ground'}
        `}
        data-coordinates={`${String.fromCharCode(65 + x)}${y + 1}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {unit && (
            <div className={`
              unit ${unit.type === 'friendly' ? 'unit-friendly' : 'unit-enemy'}
              animate-fade-in flex items-center justify-center
              text-white font-bold
              text-xs sm:text-sm md:text-base
            `}>
              {unit.type === 'friendly' && unit.name}
            </div>
          )}
          {unit && adjacentEnemies.map(enemy => 
            renderCombatEffect(x, y, enemy.location.x, enemy.location.y)
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-w-[320px] w-full max-w-[48rem] mx-auto">
      <div className="relative">
        {/* Column labels (A-L) */}
        <div className="absolute -top-6 left-6 right-0 flex text-xs sm:text-sm">
          {Array.from({length: 12}).map((_, i) => (
            <div key={`col-${i}`} className="flex-1 text-center">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
  
        {/* Row labels (1-12) */}
        <div className="absolute -left-6 top-6 bottom-0 flex flex-col text-xs sm:text-sm">
          {Array.from({length: 12}).map((_, i) => (
            <div key={`row-${i}`} className="flex-1 flex items-center justify-center">
              {i + 1}
            </div>
          ))}
        </div>
  
        {/* Grid */}
        <div className="grid grid-cols-12 gap-px ml-6 mt-6">
          {grid.map((row, y) => (
            <React.Fragment key={y}>
              {row.map((cell, x) => renderCell(cell, x, y, units))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameGrid;