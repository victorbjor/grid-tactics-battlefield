import React, { useEffect, useRef, useState } from 'react';

const SplashScreen = ({connected}: {connected: boolean}) => {
    const [showSplash, setShowSplash] = useState<boolean>(true);
    const [gameRequested, setGameRequested] = useState<boolean>(false);

    useEffect(()=>{
        if (connected && gameRequested) {
            setShowSplash(false);
        }
    }, [connected, gameRequested])

    if (!showSplash) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center animate-fade-in">
            {/* Game Over and Controls */}
            <div className="h-screen w-screen flex flex-col gap-8 items-center justify-center">
                <div className="flex flex-col gap-5 items-center justify-around text-center text-white space-y-12">
                    <h2 className="text-4xl font-bold mb-4">Grid Tactics Battlefield</h2>
                    <div className={`flex flex-col gap-1 sm:gap-4 md:gap-10 w-1/2 text-sm sm:text-base md:text-lg overflow-hidden text-ellipsis line-clamp-3`}>
                        <p>
                            The goal of this game is to protect a command base for as long as possible.
                            However, you are not in charge of the troops. 
                        </p>
                        <p>
                            You give strategic orders to an Agent, who will then think about how to play the game
                            and give direct orders to the troops, while following your orders.
                        </p>
                        <p>
                            In the game, hills, forests, and the base are easier to defend and troops take less damage there.
                            They also move slower there. The Agent will order troops to go to different locations, and tell
                            them whether to prefer a safe or fast route.
                        </p>
                        <p>
                            The game starts when you send your first command.
                        </p>
                    </div>
                    {!gameRequested &&
                        <button
                            onClick={()=>setGameRequested(true)}
                            className="w-full sm:w-auto px-6 py-3 text-lg fixed bottom-4 sm:bottom-5 md:bottom-[10%] left-1/2 transform -translate-x-1/2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            New Game
                        </button>
                    }
                    {gameRequested && !connected &&
                        <p className={`text-2xl`}>
                            <b>Waking up server...</b><br /><br />
                            <i>(This may take up to 50s)</i>
                        </p>
                    }
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;