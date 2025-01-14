import React, { useState, useEffect } from 'react';
import GameGrid from '@/components/GameGrid';
import Legend from '@/components/Legend';
import InfoBox from '@/components/InfoBox';
import MessageBox from '@/components/MessageBox';
import { GameState, TerrainType, UnitType } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { moveEnemyUnits } from '@/lib/utils';

const Index = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(8).fill(null).map(() => Array(8).fill('ground')),
    units: {},
    messages: ['Welcome Commander! Awaiting your orders...'],
  });

  const [nextUnitLetter, setNextUnitLetter] = useState<string>('A');

  // Initialize the game board with a fixed map layout
  useEffect(() => {
    const fixedGrid: TerrainType[][] = [
      ['base', 'ground', 'ground', 'ground', 'forest', 'forest', 'forest', 'ground', 'ground', 'water', 'water', 'ground'],
      ['ground', 'ground', 'hill', 'ground', 'forest', 'forest', 'forest', 'ground', 'ground', 'water', 'water', 'water'],
      ['ground', 'water', 'water', 'ground', 'ground', 'forest', 'ground', 'ground', 'ground', 'ground', 'water', 'water'],
      ['ground', 'water', 'water', 'water', 'ground', 'ground', 'ground', 'hill', 'ground', 'ground', 'ground', 'ground'],
      ['ground', 'ground', 'water', 'water', 'ground', 'ground', 'ground', 'ground', 'forest', 'forest', 'forest', 'ground'],
      ['ground', 'ground', 'ground', 'ground', 'hill', 'ground', 'ground', 'ground', 'forest', 'forest', 'forest', 'ground'],
      ['ground', 'forest', 'forest', 'ground', 'ground', 'ground', 'water', 'water', 'ground', 'ground', 'ground', 'ground'],
      ['ground', 'forest', 'forest', 'forest', 'ground', 'ground', 'water', 'water', 'water', 'ground', 'hill', 'ground'],
      ['ground', 'ground', 'forest', 'forest', 'ground', 'ground', 'ground', 'water', 'ground', 'ground', 'ground', 'ground'],
      ['ground', 'ground', 'ground', 'ground', 'water', 'water', 'ground', 'ground', 'ground', 'forest', 'forest', 'ground'],
      ['ground', 'hill', 'ground', 'ground', 'water', 'water', 'water', 'ground', 'ground', 'forest', 'forest', 'forest'],
      ['ground', 'ground', 'ground', 'ground', 'ground', 'water', 'ground', 'ground', 'ground', 'ground', 'forest', 'forest'],
    ];

    setGameState(prev => ({
      ...prev,
      grid: fixedGrid,
      units: {
        'friendly-1': { id: 'friendly-1', type: 'friendly', x: 1, y: 0, name: 'A' },
        'enemy-1': { id: 'enemy-1', type: 'enemy', x: 11, y: 11, name: "1" },
      },
    }));
  }, []);

  // Enemy movement effect
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setGameState(moveEnemyUnits);
    }, 5000);

    return () => clearInterval(moveInterval);
  }, []);

  // Enemy spawning
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setGameState(prev => {
        const enemyId = `enemy-${Date.now()}`;
        const newUnits = {
          ...prev.units,
          [enemyId]: { id: enemyId, type: 'enemy' as const, x: 11, y: 11, name: "1" },
        };
        return { ...prev, units: newUnits };
      });
    }, 20000);

    return () => clearInterval(spawnInterval);
  }, []);

  const handleSendMessage = (message: string) => {
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, `Command: ${message}`],
    }));
    
    toast({
      title: "Command sent",
      description: message,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Strategic Command</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GameGrid grid={gameState.grid} units={gameState.units} />
          </div>
          
          <div className="space-y-8">
            <Legend />
            <InfoBox messages={gameState.messages} />
            <MessageBox onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;