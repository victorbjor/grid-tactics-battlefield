import React, { useEffect, useState } from 'react';

const GameOver = () => {
    const [showSplash, setShowSplash] = useState<boolean>(true);
    if (!showSplash) {
        return null;
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center animate-fade-in">
            {/* Game Over and Controls */}
            <div className="h-screen w-screen flex gap-8 items-center justify-center">
                <div className="flex flex-col gap-5 items-center justify-around text-center text-white space-y-12">
                    <h2 className="text-4xl font-bold mb-4">Grid Tactics Battlefield</h2>
                    <div className={`flex flex-col gap-10 w-1/2 text-2xl`}>
                        <p>
                            This is a simple game, the goal is to protect a command base for as long as possible.
                            But you are not in charge of the troops. 
                        </p>
                        <p>
                            You give strategic orders to Lieutenant GPT, who will then give orders to the troops.
                        </p>
                        <p>
                            In the game, hills, forests, and the base are easier to defend and troops take less damage there.
                            They also move slower there. The lieutenant will order troops to go to different locations, and tell
                            them whether to prefer either a safe or fast route.
                        </p>
                    </div>
                    <button
                            onClick={()=>setShowSplash(false)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            New Game
                        </button>
                </div>
            </div>
        </div>
    );
};

export default GameOver;