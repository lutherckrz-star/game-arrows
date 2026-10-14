# Puzzle Specifications

## Level Generation Algorithm: Reverse-Solve

### Algorithm
1. Start with empty N×N grid
2. Create list of all positions, shuffle
3. For each position, find valid exit directions (path to edge clear)
4. Place arrow with random valid direction
5. Repeat until target arrow count reached
6. Assign elements based on level config
7. Validate with `checkSolvable()` greedy solver
8. If unsolvable, regenerate (max 50 attempts)

### Solvability Check
Greedy algorithm: repeatedly find any arrow that can exit, remove it. If board clears → solvable.

## Level Specs (Campaign 1-50)

### Levels 1-3: Tutorial (4×4, 6 arrows, no elements)
| Level | Arrows | New Mechanic | Solution Hint |
|-------|--------|--------------|---------------|
| 1 | 4 | Basic tap | All arrows point to edge |
| 2 | 5 | Blocking | Clear center first |
| 3 | 6 | Chain thinking | Corners last |

### Levels 4-10: Basics (4×4, 8-10 arrows, no elements)
| Level | Arrows | Difficulty | Notes |
|-------|--------|------------|-------|
| 4 | 8 | Easy | Simple dependencies |
| 5 | 8 | Easy | Cross blocking |
| 6 | 9 | Medium | Loop detection |
| 7 | 9 | Medium | Multiple paths |
| 8 | 9 | Medium | Center congestion |
| 9 | 10 | Hard | Tight packing |
| 10 | 10 | **BOSS FIRE** | 6×6, 2×2 boss arrow |

### Levels 11-20: Fire & Ice (5×5, 12-15 arrows, FIRE + ICE)
| Level | Arrows | Elements | New |
|-------|--------|----------|-----|
| 11 | 12 | FIRE, ICE | FIRE tutorial tooltip |
| 12 | 12 | FIRE, ICE | FIRE destroys ICE |
| 13 | 13 | FIRE, ICE | ICE freezes adjacent |
| 14 | 13 | FIRE, ICE | Frozen arrows unclickable |
| 15 | 14 | FIRE, ICE | **STEAM reaction** tooltip |
| 16 | 14 | FIRE, ICE | Multiple STEAM |
| 17 | 14 | FIRE, ICE | ICE evolution preview |
| 18 | 15 | FIRE, ICE | Complex chains |
| 19 | 15 | FIRE, ICE | Near-miss feedback |
| 20 | 15 | **BOSS WATER** | 6×6, row shift attack |

### Levels 21-30: +Water (5×5, 15-18 arrows, FIRE + ICE + WATER)
| Level | Arrows | Elements | New |
|-------|--------|----------|-----|
| 21 | 15 | +WATER | WATER passes blockers |
| 22 | 15 | +WATER | WATER + ELECTRIC = CONDUCTOR |
| 23 | 16 | +WATER | CONDUCTOR chains |
| 24 | 16 | +WATER | ICE + WATER = DEEP FREEZE |
| 25 | 16 | +WATER | Row/col freeze strategy |
| 26 | 17 | +WATER | Element evolution unlocks |
| 27 | 17 | +WATER | Combo escalation |
| 28 | 17 | +WATER | Crystal economy intro |
| 29 | 18 | +WATER | Pre-boss complexity |
| 30 | 18 | **BOSS ICE** | 6×6, freeze attack |

### Levels 31-40: All Elements (6×6, 20-25 arrows, all 4)
| Level | Arrows | New |
|-------|--------|-----|
| 31 | 20 | ELECTRIC introduced |
| 32 | 20 | ELECTRIC chains same row/col |
| 33 | 21 | EXPLOSION reaction (ELEC+FIRE) |
| 34 | 21 | All 4 reactions possible |
| 35 | 22 | Evolution tier 2 available |
| 36 | 22 | Complex multi-reaction |
| 37 | 23 | Boss prep |
| 38 | 23 | High density |
| 39 | 24 | Speed run potential |
| 40 | 24 | **BOSS ELECTRIC** |

### Levels 41-50: Mastery (6×6, 25 arrows, all elements)
| Level | Notes |
|-------|-------|
| 41-49 | Progressive difficulty, all mechanics |
| 50 | **BOSS FINAL** - all attacks, 3 HP |

## Failure Modes
- **Deadend:** No arrow can exit → modal (Undo/Restart/Menu)
- **Boss loss:** 5 burns / frozen too long / rotated into deadend
- **Mistake:** Click blocked arrow → combo reset, vibration

## Solution Paths
Each level has at least 1 valid solution path. Generator ensures this via reverse-solve.