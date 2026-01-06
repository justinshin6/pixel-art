'use client';

import { useState, useEffect } from 'react';
import { Grid, Color, validateSolution, overlayGrids } from '@/lib/gameLogic';
import { Puzzle, addPuzzleToRecentQueue } from '@/lib/supabase';

interface GameProps {
  puzzle: Puzzle;
  userId: string | null;
  difficulty: string;
  onBack: () => void;
  onNextPuzzle: () => void;
  onGuestPuzzlePlayed?: (puzzleId: string) => void;
}

export default function Game({ puzzle, userId, difficulty, onBack, onNextPuzzle, onGuestPuzzlePlayed }: GameProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: none, 1: blur, 2: show squares, 3: move first, 4: move second, 5: move third, 6: success
  const [showIncorrectShake, setShowIncorrectShake] = useState(false);

  // Convert puzzle data from database format
  const gamePuzzle = {
    target: puzzle.target_grid as Grid,
    availableGrids: puzzle.available_grids as Grid[],
    solution: puzzle.solution_indices
  };

  // Track this puzzle as seen when the component mounts
  useEffect(() => {
    const trackPuzzle = async () => {
      if (userId && puzzle.id) {
        // Logged-in user: Track in database
        try {
          console.log('=== TRACKING PUZZLE (Logged In) ===');
          console.log('User ID:', userId);
          console.log('Puzzle ID:', puzzle.id);
          console.log('Puzzle ID type:', typeof puzzle.id);
          const result = await addPuzzleToRecentQueue(userId, puzzle.id);
          console.log('Tracking result - queue now contains:', result.length, 'puzzles');
          console.log('===================================');
        } catch (err) {
          console.error('Error tracking puzzle on mount:', err);
        }
      } else if (!userId && onGuestPuzzlePlayed && puzzle.id) {
        // Guest user: Track in memory
        console.log('=== TRACKING PUZZLE (Guest) ===');
        console.log('Puzzle ID:', puzzle.id);
        onGuestPuzzlePlayed(puzzle.id);
        console.log('Guest puzzle tracked in memory');
        console.log('================================');
      }
    };
    
    trackPuzzle();
  }, [userId, puzzle.id, onGuestPuzzlePlayed]);

  const handleGridClick = (index: number) => {
    if (selectedIndices.includes(index)) {
      // Deselect
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else if (selectedIndices.length < 3) {
      // Select (max 3)
      setSelectedIndices([...selectedIndices, index]);
    }
    setShowResult(false);
  };

  const handleSubmit = async () => {
    const selectedGrids = selectedIndices.map(i => gamePuzzle.availableGrids[i]);
    const correct = validateSolution(selectedGrids, gamePuzzle.target);
    setIsCorrect(correct);
    setIsAnimating(true);

    if (correct) {
      // Correct answer: Play overlay animation
      setTimeout(() => setAnimationPhase(1), 100); // Blur
      setTimeout(() => setAnimationPhase(2), 500); // Show all 3 squares side-by-side
      setTimeout(() => setAnimationPhase(3), 1100); // Move first square to center
      setTimeout(() => setAnimationPhase(4), 1700); // Move second square to center
      setTimeout(() => setAnimationPhase(5), 2300); // Move third square to center
      setTimeout(() => {
        setAnimationPhase(6); // Success modal
        setShowResult(true);
        setIsAnimating(false);
      }, 3000);
    } else {
      // Incorrect answer: Shake animation
      setShowIncorrectShake(true);
      setTimeout(() => {
        setShowIncorrectShake(false);
        setIsAnimating(false);
        setSelectedIndices([]); // Clear selections after shake
      }, 1000);
    }
  };

  const handleReset = () => {
    setSelectedIndices([]);
    setShowResult(false);
    setIsCorrect(false);
    setIsAnimating(false);
    setAnimationPhase(0);
    setShowIncorrectShake(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6 relative">
      {/* Main Content - blur when animating */}
      <div className={`transition-all duration-500 ${isAnimating && animationPhase >= 1 ? 'blur-sm' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white font-mono text-sm transition-colors"
            disabled={isAnimating}
          >
            ← Back
          </button>
          <h2 className="text-2xl font-black font-mono text-[#e94560]">
            {difficulty.toUpperCase()} MODE
          </h2>
          <div className="w-16"></div> {/* Spacer */}
        </div>

        {/* Instructions */}
        <div className="bg-[#0f3460] border-2 border-[#533483] rounded-xl p-3 mb-6 max-w-4xl mx-auto">
          <p className="text-white font-mono text-sm text-center">
            Select <span className="text-[#e94560] font-bold">3 squares</span> that overlay to match the target pattern
          </p>
        </div>

        {/* Main Layout: Target on Left, Available Squares on Right */}
        <div className="flex gap-12 mx-auto items-start justify-center">
        {/* Left Side - Target */}
        <div className="flex-shrink-0">
          <h3 className="text-white font-mono text-2xl mb-4 text-center">TARGET</h3>
          <div className="bg-[#0f3460] border-4 border-[#e94560] rounded-xl p-8">
            <GridDisplay grid={gamePuzzle.target} size="large" />
          </div>
        </div>

        {/* Right Side - Available Squares */}
        <div className="flex-shrink-0">
          <div className="grid grid-cols-3 gap-5">
            {gamePuzzle.availableGrids.map((grid, index) => {
              const isSelected = selectedIndices.includes(index);
              const shouldShake = showIncorrectShake && isSelected;
              
              return (
                <div
                  key={index}
                  onClick={() => !isAnimating && handleGridClick(index)}
                  className={`cursor-pointer transition-all bg-[#0f3460] rounded-lg p-3 ${
                    isSelected
                      ? 'border-2 border-[#e94560] scale-105'
                      : 'hover:scale-105 border-2 border-[#533483]'
                  } ${shouldShake ? 'animate-shake-flash' : ''}`}
                >
                  <GridDisplay grid={grid} size="small" />
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleSubmit}
              disabled={selectedIndices.length !== 3 || isAnimating}
              className={`px-8 py-3 rounded-lg font-bold font-mono text-white transition-all ${
                selectedIndices.length === 3 && !isAnimating
                  ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] hover:shadow-lg hover:shadow-[#e94560]/50 cursor-pointer'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              SUBMIT
            </button>
            <button
              onClick={handleReset}
              disabled={isAnimating}
              className="px-8 py-3 rounded-lg font-bold font-mono text-white bg-[#533483] hover:bg-[#6b4a9e] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              RESET
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Animation Overlay - Correct Answer */}
      {isCorrect && animationPhase >= 1 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/70 p-4">
          <div className="relative flex items-center justify-center gap-12 max-w-6xl">
            
            {/* Center: Progressive Result Square */}
            {animationPhase >= 2 && (
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="bg-[#0f3460] p-3 rounded-xl border-4 border-[#e94560]">
                  <GridDisplay 
                    grid={animationPhase >= 3 
                      ? overlayGrids(
                          selectedIndices
                            .slice(0, Math.min(animationPhase - 2, 3))
                            .map(idx => gamePuzzle.availableGrids[idx])
                        )
                      : [
                          ['X', 'X', 'X'],
                          ['X', 'X', 'X'],
                          ['X', 'X', 'X']
                        ] as Grid
                    } 
                    size="large" 
                  />
                </div>
              </div>
            )}
            
            {/* Right: Source Squares */}
            {animationPhase >= 2 && (
              <div className="flex flex-col gap-3">
                {selectedIndices.map((index, i) => {
                  const hasMovedToCenter = animationPhase >= i + 3;
                  
                  return (
                    <div
                      key={index}
                      className="transition-all duration-700 ease-in-out"
                      style={{
                        opacity: hasMovedToCenter ? 0.3 : 1,
                        transform: hasMovedToCenter ? 'scale(0.85)' : 'scale(1)',
                      }}
                    >
                      <div className="bg-[#0f3460] p-2 rounded-lg border-2 border-[#533483]">
                        <GridDisplay grid={gamePuzzle.availableGrids[index]} size="small" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showResult && isCorrect && animationPhase === 6 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gradient-to-b from-[#0f3460] to-[#1a1a2e] border-4 border-green-500 rounded-2xl p-8 max-w-md animate-scale-in">
            <p className="text-4xl font-bold font-mono text-green-400 text-center mb-4">
              🎉 CORRECT!
            </p>
            <p className="text-white font-mono text-center mb-6">
              You found the right combination!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onNextPuzzle}
                className="w-full px-8 py-3 rounded-lg font-bold font-mono text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] hover:shadow-lg transition-all cursor-pointer"
              >
                NEXT PUZZLE
              </button>
              <button
                onClick={handleReset}
                className="w-full px-8 py-3 rounded-lg font-bold font-mono text-white bg-[#533483] hover:bg-[#6b4a9e] transition-all cursor-pointer"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shake-flash {
          0%, 100% { transform: translateX(0); background-color: rgba(15, 52, 96, 1); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); background-color: rgba(239, 68, 68, 0.5); }
          20%, 40%, 60%, 80% { transform: translateX(10px); background-color: rgba(239, 68, 68, 0.8); }
        }
        .animate-shake-flash {
          animation: shake-flash 0.8s ease-in-out;
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Component to display a single grid
function GridDisplay({ grid, size }: { grid: Grid; size: 'small' | 'large' }) {
  const cellSize = size === 'large' ? 'w-28 h-28' : 'w-12 h-12';
  const gap = size === 'large' ? 'gap-3' : 'gap-1.5';
  
  const getColorClass = (color: Color) => {
    switch (color) {
      case 'R':
        return 'bg-red-500';
      case 'B':
        return 'bg-blue-500';
      case 'Y':
        return 'bg-yellow-500';
      case 'X':
        return 'bg-gray-800 border border-gray-700';
      default:
        return 'bg-gray-800';
    }
  };

  return (
    <div className={`flex flex-col ${gap}`}>
      {grid.map((row, i) => (
        <div key={i} className={`flex ${gap}`}>
          {row.map((cell, j) => (
            <div
              key={j}
              className={`${cellSize} ${getColorClass(cell)} rounded transition-all`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

