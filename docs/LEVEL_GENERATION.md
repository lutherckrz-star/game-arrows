# Level Generation Documentation

## Algorithm: Reverse-Solve (Guaranteed Solvable)

### Core Concept
Instead of placing arrows randomly and hoping it's solvable, we build the solution **backwards**:
1. Start with empty board
2. Place arrows that **can immediately exit** (path to edge clear)
3. Each placed arrow becomes a blocker for future arrows
4. Result: Every arrow has at least one valid exit order

### Implementation (level.js)

```javascript
function generateBoardReverseSolve(config) {
    const board = new Board(config.size);
    const positions = shuffle(allPositions);
    
    for (const pos of positions) {
        if (placed >= config.arrowCount) break;
        
        const validDirs = getValidDirections(board, pos.row, pos.col);
        if (validDirs.length === 0) continue;
        
        const dir = randomChoice(validDirs);
        board.placeArrow(pos.row, pos.col, dir, ELEMENTS.PLAIN);
        placed++;
    }
    return board;
}
```

### Valid Direction Check
A direction is valid if **all cells between arrow and edge are empty**:
```javascript
// For UP: check rows 0 to row-1 in same column
// For DOWN: check rows row+1 to size-1
// For LEFT: check cols 0 to col-1 in same row
// For RIGHT: check cols col+1 to size-1
```

### Element Assignment (Post-Generation)
After solvable plain board is created:
1. Get all active arrows
2. Shuffle arrows
3. Assign elements based on level config:
   - L1-10: None
   - L11-20: FIRE, ICE (30% of arrows)
   - L21-30: +WATER (40%)
   - L31-50: All 4 (50%)
4. Re-validate solvability (elements don't block paths)

### Solvability Validation
Greedy solver simulates play:
```javascript
function checkSolvable() {
    const testBoard = this.clone();
    while (!testBoard.isEmpty()) {
        let moved = false;
        for (const arrow of testBoard.getActiveArrows()) {
            if (arrow.canExit(testBoard)) {
                testBoard.tryExitArrow(arrow);
                moved = true;
                break;
            }
        }
        if (!moved) return false; // Deadend
    }
    return true;
}
```

### Retry Logic
- Max 50 generation attempts per level
- Fallback: `generateSimpleLevel()` (less strict, still validated)

## Level Config by Number

```javascript
function getLevelConfig(levelNum) {
    if (levelNum <= 3)      { size=4; arrows=6; elements=[]; }
    else if (levelNum <= 10){ size=4; arrows=8-10; elements=[]; }
    else if (levelNum <= 20){ size=5; arrows=12-15; elements=[FIRE,ICE]; }
    else if (levelNum <= 30){ size=5; arrows=15-18; elements=[FIRE,ICE,WATER]; }
    else if (levelNum <= 40){ size=6; arrows=20-25; elements=[FIRE,ICE,WATER,ELECTRIC]; }
    else                    { size=6; arrows=25; elements=[FIRE,ICE,WATER,ELECTRIC]; }
    
    if (isBossLevel) { size=6; arrows+=5; }
}
```

## Boss Level Generation
1. Generate base board (6×6, more arrows)
2. Place 2×2 boss arrow in center (4 cells)
3. Boss arrow has HP (2 or 3), type based on level
4. Ensure remaining arrows still solvable

## Daily Challenge (Seeded)
- Seed = date string (YYYY-MM-DD)
- Seeded PRNG (LCG) for deterministic generation
- Same puzzle for all players each day
- 5 crystals reward

## Endless Mode
- 7×7 grid, ~45 arrows
- All elements, random distribution
- No level cap, score-based

## Testing Generation
```javascript
// Test 100 levels
for (let i = 1; i <= 100; i++) {
    const board = generateLevel(i);
    if (!board.checkSolvable()) console.error(`Level ${i} UNSOLVABLE!`);
}
```

## Extensibility
To add new level types:
1. Add config in `getLevelConfig()`
2. Add element unlock in `ELEMENT_UNLOCK_LEVELS`
3. Update `generateLevel()` for special rules