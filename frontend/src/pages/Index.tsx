import React, { useState, useEffect, useRef } from 'react';
import GameGrid from '../components/GameGrid';
import Legend from '../components/Legend';
import InfoBox from '../components/InfoBox';
import MessageBox from '../components/MessageBox';
import {GameState, Orders, TerrainType, UnitType} from '../types/game';
import { useToast } from '@/hooks/use-toast.ts';
import {algToCart, flattenOrder, moveAllUnits, setUnitTarget, tileHasSoldier} from '../lib/utils';
import { websocketService } from '../services/websocket';
import GameOver from '../components/GameOver';
import SplashScreen from '@/components/SplashScreen';

const Index = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(12).fill(0).map(() => Array(12).fill('ground') as TerrainType[]),
    units: {},
    messages: [],
  });
  const [uiMessages, setUiMessages] = useState<string[]>(['Welcome Commander! Awaiting your orders...']);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const elapsedTime = useRef<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const gamePaused = useRef<boolean>(true);
  const [socketConnected, setSocketConnected] = useState(websocketService.connected);

  useEffect(() => {
      const unsubscribe = websocketService.subscribeToConnection(setSocketConnected);
      return () => {unsubscribe()}; // Cleanup on unmount
  }, []);

// Initialize the game board with a fixed map layout
  useEffect(() => {
    initGameState();
  }, []);


  const parseOrders = (rawOrders: string) => {
    const parsedOrders: Orders = JSON.parse(rawOrders) as Orders
    parsedOrders.orders.forEach(order => {
      const flatOrder = flattenOrder(order);
      setUiMessages(prev => [...prev, `ORDER: ${flatOrder.unitName} go to ${flatOrder.targetRow}${flatOrder.targetColumn}, travel ${flatOrder.method}!`]);
      const cartPos = algToCart(flatOrder.targetRow, flatOrder.targetColumn);
      if (!cartPos) return;  // Skip invalid positions
      console.log(flatOrder.unitName, cartPos)
      const moveSafely = flatOrder.method === 'safe'; 
      setGameState(prev => {
        const newGameState = setUnitTarget(flatOrder.unitName, cartPos, moveSafely, prev);
        return newGameState;
      });
    });
  }

// Add this to your existing useEffect blocks:
useEffect(() => {
    websocketService.connect();
    
    websocketService.subscribe((message: string) => {
      console.log('Received message from server:', message); 
      parseOrders(message);
      gamePaused.current = false; 
        setGameState(prev => ({
            ...prev,
            messages: [...prev.messages, `Server: ${message}`],
        }));
    });

    return () => {
        websocketService.disconnect();
    };
}, []);

  const handleRestart = () => {
    window.location.reload();
  };

  const initGameState = () => {
    setIsGameOver(false);
    elapsedTime.current = 0;
    
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

    // Reset
    setGameState(prev => ({
      messages: [],
      grid: fixedGrid,
      units: {},
    }));

    // Add units
    addUnit('friendly', {x: 4, y: 0});
    addUnit('friendly', {x: 3, y: 0});
    addUnit('friendly', {x: 8, y: 1});
    addUnit('friendly', {x: 8, y: 0});
    addUnit('friendly', {x: 0, y: 5});
    addUnit('friendly', {x: 1, y: 6});
    addUnit('enemy', {x: 11, y: 11})
    addUnit('enemy', {x: 11, y: 10});
    addUnit('enemy', {x: 8, y: 11});
    addUnit('enemy', {x:8, y: 9});
    addUnit('enemy', {x: 10, y: 9});

    websocketService.sendGameState(gameState);

    // Start the game loop
    const moveInterval = setInterval(() => {
      if (gamePaused.current) return;
      elapsedTime.current += 500;
      setGameState(prev => {
        const newState = moveAllUnits(prev);
        setUiMessages((prev)=>[...prev, ...newState.messages]);
        
        // Check for game over condition
        const isBaseReached = Object.values(newState.units).some(
            unit => unit.type === 'enemy' && unit.location.x === 0 && unit.location.y === 0
        );

        if (isBaseReached) {
          setIsGameOver(true);
          clearInterval(moveInterval);
        }
        if (newState.messages.length > 0) {
          gamePaused.current = true;
          websocketService.sendGameState(newState);
        }
        return newState;
      });
    }, 500);
  }

  function generateUniqueName(units: Record<string, UnitType>): string {
    const existingNames = new Set(Object.values(units).map((unit) => unit.name));
    let name: string;
    do {
      name = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
          String.fromCharCode(65 + Math.floor(Math.random() * 26));
    } while (existingNames.has(name));
    return name;
  }

  function addUnit(type: 'friendly' | 'enemy', location: {x: number, y: number} | null = null): void {
    const units = gameState.units;
    const nextNumber = Object.values(units)
        .filter((unit) => unit.type === type)
        .length + 1;
    const id = `${type}-${nextNumber}`;
    location ??= type === 'enemy' ? { x: 11, y: 11 } : { x: 0, y: 0 };
    const target = type === 'enemy' ? { x: 0, y: 0 } : location;
    const name = generateUniqueName(units);

    if (tileHasSoldier(location.x, location.y, units)) return;

    const newUnit: UnitType = {
      id,
      type,
      target,
      location,
      name,
      moveSafely: true,
      ammo: 100,
      health: 100,
      isFighting: false
    };
  
    units[newUnit.id] = newUnit;
    setGameState((prev)=> {
      return {...prev, units: units}
    })

  }

  // Enemy spawning
  useEffect(() => {
  const spawnInterval = setInterval(() => {
      addUnit('enemy');
    }, 200);

    return () => clearInterval(spawnInterval);
  }, [gameState.units]);


  const handleSendCommand = (command: string) => {
    websocketService.sendCommand(command);
    // setGameState(prev => ({
    //   ...prev,
    //   messages: [...prev.messages, `Command: ${command}`],
    // }));
    
    toast({
      title: "Command sent",
      description: command,
    });
  };


  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-12 ">Strategic Command</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex items-center justify-center lg:col-span-2">
              <GameGrid grid={gameState.grid} units={gameState.units} />
            </div>

            <div className="space-y-8">
              <Legend />
              <InfoBox messages={uiMessages} />
            </div>
            <MessageBox onSendMessage={handleSendCommand} />
          </div>

          {isGameOver && (
              <GameOver
                  survivalTime={elapsedTime.current / 1000}
                  onRestart={handleRestart}
              />
          )}
          <SplashScreen connected={socketConnected}/>
        </div>
      </div>
  );
};

export default Index;