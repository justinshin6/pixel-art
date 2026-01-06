'use client';

import { useState, useEffect } from 'react';
import { Grid, Color, overlayGrids, easyPuzzle } from '@/lib/gameLogic';

export default function Tutorial() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const puzzle = easyPuzzle;
  const selectedIndices = puzzle.solution; // [0, 1, 2]

  useEffect(() => {
    // Loop the animation continuously
    const phases = [
      { phase: 0, delay: 0 },
      { phase: 1, delay: 500 },   // Show initial state
      { phase: 2, delay: 1500 },  // First overlay
      { phase: 3, delay: 2500 },  // Second overlay
      { phase: 4, delay: 3500 },  // Third overlay (complete)
      { phase: 5, delay: 4500 },  // Hold complete
      { phase: 0, delay: 6000 },  // Reset and loop
    ];

    const timeouts: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      phases.forEach(({ phase, delay }) => {
        const timeout = setTimeout(() => setAnimationPhase(phase), delay);
        timeouts.push(timeout);
      });
    };

    runAnimation();
    const loopInterval = setInterval(runAnimation, 6000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(loopInterval);
    };
  }, []);

  return (
    <div className="bg-[#0f3460] border-2 border-[#533483] rounded-xl p-4">
      <h4 className="text-white font-mono text-sm mb-3 text-center">How to Play</h4>
      
      <div className="flex items-center justify-center gap-6">
        {/* Center: Progressive Result */}
        <div className="flex flex-col items-center">
          <div className="text-gray-400 font-mono text-[10px] mb-2">TARGET</div>
          <div className="bg-[#1a1a2e] p-2 rounded-lg border-2 border-[#e94560]">
            <GridDisplay 
              grid={animationPhase >= 2 
                ? overlayGrids(
                    selectedIndices
                      .slice(0, Math.min(animationPhase - 1, 3))
                      .map(idx => puzzle.availableGrids[idx])
                  )
                : [
                    ['X', 'X', 'X'],
                    ['X', 'X', 'X'],
                    ['X', 'X', 'X']
                  ] as Grid
              } 
              size="tutorial" 
            />
          </div>
        </div>

        {/* Right: Source Squares */}
        <div className="flex flex-col gap-2">
          {selectedIndices.map((index, i) => {
            const hasMovedToCenter = animationPhase >= i + 2;
            
            return (
              <div
                key={index}
                className="transition-all duration-500 ease-in-out"
                style={{
                  opacity: hasMovedToCenter ? 0.3 : 1,
                  transform: hasMovedToCenter ? 'scale(0.85)' : 'scale(1)',
                }}
              >
                <div className="bg-[#1a1a2e] p-1.5 rounded border border-[#533483]">
                  <GridDisplay grid={puzzle.availableGrids[index]} size="tutorial" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-gray-400 font-mono text-[10px] text-center mt-3">
        Overlay 3 squares to match the target
      </p>
    </div>
  );
}

// Component to display a single grid
function GridDisplay({ grid, size }: { grid: Grid; size: 'tutorial' }) {
  const cellSize = 'w-4 h-4';
  const gap = 'gap-0.5';
  const padding = 'p-1';
  
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
    <div className={`inline-flex flex-col ${gap} bg-[#0f3460] ${padding} rounded`}>
      {grid.map((row, i) => (
        <div key={i} className={`flex ${gap}`}>
          {row.map((cell, j) => (
            <div
              key={j}
              className={`${cellSize} ${getColorClass(cell)} rounded-sm transition-all`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

