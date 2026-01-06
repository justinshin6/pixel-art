// Color types for the grid
export type Color = 'R' | 'B' | 'Y' | 'X'; // Red, Blue, Yellow, Empty
export type Grid = Color[][];

// Check if two grids can overlay without color conflicts
export function canOverlay(grid1: Grid, grid2: Grid): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const cell1 = grid1[i][j];
      const cell2 = grid2[i][j];
      
      // If both cells have colors (not X), it's a conflict
      if (cell1 !== 'X' && cell2 !== 'X') {
        return false;
      }
    }
  }
  return true;
}

// Overlay multiple grids to create a result
export function overlayGrids(grids: Grid[]): Grid {
  const result: Grid = [
    ['X', 'X', 'X'],
    ['X', 'X', 'X'],
    ['X', 'X', 'X']
  ];

  for (const grid of grids) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i][j] !== 'X') {
          result[i][j] = grid[i][j];
        }
      }
    }
  }

  return result;
}

// Check if two grids are equal
export function gridsEqual(grid1: Grid, grid2: Grid): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid1[i][j] !== grid2[i][j]) {
        return false;
      }
    }
  }
  return true;
}

// Validate if selected grids match the target
export function validateSolution(selectedGrids: Grid[], target: Grid): boolean {
  // Check if exactly 3 grids are selected
  if (selectedGrids.length !== 3) {
    return false;
  }

  // Check if all grids can overlay without conflicts
  for (let i = 0; i < selectedGrids.length; i++) {
    for (let j = i + 1; j < selectedGrids.length; j++) {
      if (!canOverlay(selectedGrids[i], selectedGrids[j])) {
        return false;
      }
    }
  }

  // Overlay all selected grids
  const result = overlayGrids(selectedGrids);

  // Check if result matches target
  return gridsEqual(result, target);
}

// Easy puzzle example
export const easyPuzzle = {
  target: [
    ['R', 'B', 'X'],
    ['R', 'B', 'Y'],
    ['X', 'X', 'Y']
  ] as Grid,
  
  availableGrids: [
    // Grid 0 - Part of solution (Red column)
    [
      ['R', 'X', 'X'],
      ['R', 'X', 'X'],
      ['X', 'X', 'X']
    ],
    // Grid 1 - Part of solution (Blue column)
    [
      ['X', 'B', 'X'],
      ['X', 'B', 'X'],
      ['X', 'X', 'X']
    ],
    // Grid 2 - Part of solution (Yellow corner)
    [
      ['X', 'X', 'X'],
      ['X', 'X', 'Y'],
      ['X', 'X', 'Y']
    ],
    // Grid 3 - Decoy
    [
      ['R', 'R', 'X'],
      ['X', 'X', 'X'],
      ['X', 'X', 'X']
    ],
    // Grid 4 - Decoy
    [
      ['X', 'X', 'X'],
      ['B', 'B', 'X'],
      ['X', 'X', 'X']
    ],
    // Grid 5 - Decoy
    [
      ['X', 'X', 'Y'],
      ['X', 'X', 'Y'],
      ['X', 'X', 'X']
    ],
    // Grid 6 - Decoy
    [
      ['R', 'X', 'X'],
      ['X', 'B', 'X'],
      ['X', 'X', 'Y']
    ],
    // Grid 7 - Decoy
    [
      ['X', 'X', 'X'],
      ['X', 'X', 'X'],
      ['R', 'B', 'Y']
    ],
    // Grid 8 - Decoy
    [
      ['X', 'B', 'Y'],
      ['X', 'X', 'X'],
      ['X', 'X', 'X']
    ]
  ] as Grid[],
  
  solution: [0, 1, 2] // Indices of the correct grids
};

