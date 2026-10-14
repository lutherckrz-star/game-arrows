# Game Design Document: Arrow Escape — Elemental

## Game Overview
**Title:** Arrow Escape — Elemental  
**Genre:** Puzzle / Strategy  
**Platform:** HTML5 Web (CrazyGames, Playgama)  
**Target:** Mobile-first (portrait 9:16), Desktop  
**Monetization:** Rewarded Video + Interstitial (CrazyGames SDK v3)  
**Rating:** PEGI 12  

## Core Loop
1. **Enter Level** → See grid with arrows
2. **Tap Arrow** → If path clear, arrow exits with juice
3. **Chain Reactions** → Element combos trigger bonus effects
4. **Clear Board** → Level complete, earn stars/crystals
5. **Progress** → Unlock elements, modes, upgrades

## Mechanics

### Core Mechanic
- Grid-based puzzle (4x4 to 7x7)
- Arrows occupy 1 cell, point in 4 directions
- Tap to launch: only moves if path to edge is clear
- Blocked arrows: shake feedback, combo resets

### Element System (4 Elements)
| Element | Color | Base Ability | Evolution (3 Tiers) |
|---------|-------|--------------|---------------------|
| **FIRE** | #ff4757 | Destroys 1 ICE in path | T1: 1 ICE, T2: 2 ICE, T3: All ICE in row/col |
| **WATER** | #3498db | Passes through 1 blocker | T1: 1, T2: 2, T3: 3 blockers |
| **ICE** | #74b9ff | Freezes adjacent 4-dir (1s) | T1: 4-dir, T2: 8-dir, T3: Whole board 1s |
| **ELECTRIC** | #feca57 | Zaps same-element in row/col | T1: 2, T2: 4, T3: All ELECTRIC on board |

### Chain Reactions (Unique Selling Point)
| Reaction | Trigger | Effect | Particles |
|----------|---------|--------|-----------|
| **STEAM** | FIRE + ICE | Opens 2 cells around destroyed ICE | White circles, float up |
| **CONDUCTOR** | WATER + ELECTRIC | Chains to 3 nearby ELECTRIC | Blue lightning branches |
| **DEEP FREEZE** | ICE + WATER | Freezes entire row + col (2s) | Ice wave spread |
| **EXPLOSION** | ELECTRIC + FIRE | Destroys 1 blocker near FIRE | Orange explosion, screen shake |

### Crystal Economy
- **Earn:** No mistakes (+1), Speed <30s (+1), Daily (+5), Ads (2x)
- **Spend:** Upgrade element (10), Extra undo (3), Hint (5), Skip (15, max 3), Revive (15)

### Scoring
- Plain arrow: 10 pts
- Element arrow: 20 pts
- Reaction bonus: +30/reaction
- Combo (every 3): +50 pts
- Speed bonus: +1/sec under 60s

### Star Rating (per level)
- ⭐ Complete
- ⭐⭐ No mistakes
- ⭐⭐⭐ No mistakes + under 30s

## Progression

### Campaign (50 Levels)
| Levels | Grid | Arrows | Elements | Notes |
|--------|------|--------|----------|-------|
| 1-3 | 4x4 | 6 | None | Tutorial |
| 4-10 | 4x4 | 8-10 | None | Basics |
| 11-20 | 5x5 | 12-15 | FIRE, ICE | First elements |
| 21-30 | 5x5 | 15-18 | +WATER | 3 elements |
| 31-40 | 6x6 | 20-25 | All 4 | Full complexity |
| 41-50 | 6x6 | 25 | All + Boss | Boss every 10 |

### Boss Battles (Every 10 Levels)
| Level | Boss | Attack (every 5s, final 3s) | HP |
|-------|------|----------------------------|-----|
| 10 | FIRE | Burns 1 random arrow (5 burns = lose) | 2 |
| 20 | WATER | Shifts random row left/right | 2 |
| 30 | ICE | Freezes 2 random arrows (3s) | 2 |
| 40 | ELECTRIC | Rotates 1 random arrow 90° | 2 |
| 50 | FINAL | All above, alternating every 3s | 3 |

### Additional Modes
- **Endless** (unlock L50): 7x7, high score chase
- **Daily Challenge** (unlock L10): Seeded puzzle, 5 crystals reward
- **Boss Rush** (unlock L50): All 5 bosses, timer

## Visual Style
- **Theme:** Neon arcade dark
- **BG:** #1a1a2e, Board: #16213e, Empty: #0f3460
- **Accents:** Element colors (neon glow)
- **Particles:** Per-element shapes (fire=triangle, water=circle, ice=diamond, electric=zigzag)
- **Juice:** Hit-stop (50ms), trauma-based screen shake, squash/stretch (200ms)

## Audio
- **SFX:** 12 procedural/Web Audio (arrow_out, blocked, combo, level_complete, button, reaction, upgrade, boss_warning, boss_defeat, deadend, achievement, combo_escalation)
- **Music:** 2 loops (ambient 80BPM, boss 120BPM) seamless crossfade
- **Volumes:** Per-config (0.3-0.8)

## Technical
- Vanilla ES6+, no framework
- Canvas rendering, DPR handling
- Fixed timestep (60Hz)
- LocalStorage save (versioned, checksummed)
- Service Worker PWA
- CrazyGames SDK v3 integration

## Accessibility
- Colorblind mode (patterns + letters)
- Reduced motion toggle
- High contrast support
- ARIA labels, screen reader announcements
- Keyboard controls (arrows, WASD, Space, U, H, Esc)

## Anti-Cheat
- Score validation (max arrows × 50)
- Time validation (0-3600s)
- Save checksum
- DevTools detection
- Analytics rate limiting