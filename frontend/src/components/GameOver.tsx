import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

type Score = {
    name: string;
    score: number;
}

const GameOver = ({ survivalTime, onRestart }) => {
    const [leaderBoard, setLeaderBoard] = useState<Score[]>([]);
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [playerName, setPlayerName] = useState('');

    useEffect(() => {
        fetch('http://localhost:8000/leaderboard')
            .then(res => {
                if (!res.ok) {
                    console.log('Failed to fetch leaderbord');
                    return;
                }
                res.json()
                    .then((scores: Score[]) => {
                        setLeaderBoard(scores);
                        // Check if current score would make it to the leaderboard
                        if (scores.length < 10 || survivalTime > scores[scores.length - 1].score) {
                            setShowNamePrompt(true);
                        }
                    })
                    .catch(() => console.error('Error parsing leaderboard'));
            });
    }, [survivalTime]);

    const handleSubmitScore = async () => {
        if (!playerName.trim()) return;

        try {
            const response = await fetch('http://localhost:8000/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: playerName,
                    score: survivalTime
                })
            });

            if (response.ok) {
                const updatedLeaderboard = await response.json();
                setLeaderBoard(updatedLeaderboard);
                setShowNamePrompt(false);
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center animate-fade-in">
            {/* Game Over and Controls */}
            <div className="h-screen w-screen flex gap-8 items-center justify-center">
                <div className="text-center text-white space-y-12">
                    <h2 className="text-4xl font-bold mb-4">Game Over</h2>
                    <p className="text-2xl">You survived for {survivalTime} seconds</p>

                    {showNamePrompt ? (
                        <div className="flex flex-col items-center justify-center space-y-8">
                            <p className="text-lg text-yellow-400">Congratulations! You made it to the leaderboard!</p>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your name"
                                maxLength={20}
                                className="w-5/6 px-4 py-2 rounded bg-gray-800 text-center text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSubmitScore();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSubmitScore}
                                className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Submit Score
                            </button>
                            <button
                                onClick={()=>setShowNamePrompt(false)}
                                className="block w-1/2 px-6 py-3 bg-green-600/30 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onRestart}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            New Game
                        </button>
                    )}
                </div>
            </div>

            {/* Leaderboard */}
            <div className="absolute left-12 h-1/2 bg-gray-800 p-6 rounded-lg min-w-64">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="text-yellow-400" size={24} />
                    <h3 className="text-2xl font-bold text-white">Leaderboard</h3>
                </div>

                <div className="space-y-2">
                    {leaderBoard.map((score, index) => (
                        <div
                            key={index}
                            className={`flex justify-between items-center p-2 rounded ${
                                score.score === survivalTime ? 'bg-blue-900' : 'bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 w-6">{index + 1}.</span>
                                <span className="text-white font-medium">{score.name}</span>
                            </div>
                            <span className="text-gray-300">{score.score}s</span>
                        </div>
                    ))}

                    {leaderBoard.length === 0 && (
                        <p className="text-gray-400 text-center">Loading leaderboard...</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default GameOver;