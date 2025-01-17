import React, { useState, useEffect } from 'react';
import GameGrid from '../components/GameGrid';
import Legend from '../components/Legend';
import InfoBox from '../components/InfoBox';
import MessageBox from '../components/MessageBox';
import { GameState, TerrainType } from '../types/game';
import { useToast } from '@/hooks/use-toast.ts';
import { moveAllUnits } from '../lib/utils';
import { websocketService } from '../services/websocket';

const Index = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(12).fill(0).map(() => Array(12).fill('ground') as TerrainType[]),
    units: {},
    messages: ['Welcome Commander! Awaiting your orders...'],
  });

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
      ['ground', 'ground', 'ground', 'ground', 'ground', 'water', 'ground', 'ground', 'ground', 'ground', 'forest', 'ground'],
    ];

    setGameState(prev => ({
      ...prev,
      grid: fixedGrid,
      units: {
        'friendly-1': { id: 'friendly-1', type: 'friendly', target: {x: 1, y: 0}, location: {x: 1, y: 0}, name: 'AB', moveSafely: true, ammo: 100, health: 100},
        'enemy-1': { id: 'enemy-1', type: 'enemy', target: {x: 0, y: 0}, location: {x: 11, y: 11}, name: "enemy", moveSafely: true, ammo: 100 , health: 100},
      },
    }));
  }, []);


// Add this to your existing useEffect blocks:
useEffect(() => {
    websocketService.connect();
    
    websocketService.subscribe((message) => {
        setGameState(prev => ({
            ...prev,
            messages: [...prev.messages, `Server: ${message}`],
        }));
    });

    return () => {
        websocketService.disconnect();
    };
}, []);

  // Unit movement effect
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setGameState(prev => {
        const newState = moveAllUnits(prev);
        websocketService.sendGameState(newState);
        return newState;
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, []);


  // Enemy spawning
  // useEffect(() => {
  //   const spawnInterval = setInterval(() => {
  //     setGameState(prev => {
  //       const enemyId = `enemy-${Date.now()}`;
  //       const newUnits = {
  //         ...prev.units,
  //         [enemyId]: { id: enemyId, type: 'enemy' as const, target: {x: 0, y: 0}, location: {x: 11, y: 11}, name: "enemy", moveSafely: true, ammo: 100 },
  //       };
  //       return { ...prev, units: newUnits };
  //     });
  //   }, 20000);

  //   return () => clearInterval(spawnInterval);
  // }, []);


  const handleSendCommand = (command: string) => {
    websocketService.sendCommand(command);
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, `Command: ${command}`],
    }));
    
    toast({
      title: "Command sent",
      description: command,
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
            <MessageBox onSendMessage={handleSendCommand} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;