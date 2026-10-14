# Puzzle Dependency Graph

## Element Unlock Progression
```
Level 1-10:    PLAIN only
Level 11:      FIRE, ICE unlock
Level 21:      WATER unlock
Level 31:      ELECTRIC unlock
Level 35+:     Evolution Tier 2 available (10 crystals)
Level 45+:     Evolution Tier 3 available (10 crystals)
```

## Reaction Discovery Order
```
Level 15:  STEAM (FIRE + ICE) - First reaction, tooltip
Level 22:  CONDUCTOR (WATER + ELECTRIC) - Tooltip
Level 24:  DEEP FREEZE (ICE + WATER) - Tooltip
Level 33:  EXPLOSION (ELECTRIC + FIRE) - Tooltip
```

## Mode Unlocks
```
Campaign:     Level 1 (default)
Daily Challenge:  Level 10
Endless:      Level 50
Boss Rush:    Level 50 (after Final Boss)
```

## Crystal Economy Flow
```
Sources:
  ├─ No-mistake clear: +1/level
  ├─ Speed bonus (<30s): +1/level
  ├─ Daily reward: +5/day
  ├─ Rewarded ad (2x crystals): variable
  └─ Achievements: one-time

Sinks:
  ├─ Element upgrade: 10/level (max 3 per element = 120 total)
  ├─ Extra undo: 3 each
  ├─ Hint: 5 each
  ├─ Skip level: 15 (max 3/campaign = 45)
  └─ Boss revive: 15
```

## Boss Progression
```
L10  FIRE    → Burns arrows (5 = lose)
L20  WATER   → Row shift
L30  ICE     → Freeze 2 arrows (3s)
L40  ELECTRIC → Rotate 1 arrow 90°
L50  FINAL   → All above, 3s interval, 3 HP
```

## Achievement Dependency Graph
```
first_blood (1 level) 
    → combo_apprentice (combo 3)
        → combo_master (combo 10)
    → reaction_rookie (1 reaction)
        → reaction_king (50 reactions)
    → elementalist (any element L2)
        → master_of_elements (all elements L3)
    → boss_slayer (5 bosses)
    → perfectionist (10× 3-star)
    → speed_demon (<10s any level)
```

## Difficulty Curve (Arrow Count)
```
L1-3:   6
L4-10:  8→10
L11-20: 12→15
L21-30: 15→18
L31-40: 20→25
L41-50: 25
Endless: 45 (7×7 - 4)
```

## Grid Size Progression
```
4×4:  L1-10
5×5:  L11-30
6×6:  L31-50, Bosses
7×7:  Endless
```

## Save Data Dependencies
```
currentLevel → unlocks modes, next level
elementLevels → affects abilities, achievements
crystals → spent on upgrades/items
starRatings → perfectionist achievement
bestTimes → speed_demon achievement
achievements → UI display, progression
unlockedModes → menu access
dailyStreak → daily reward multiplier
```