# Changelog

All notable changes to Arrow Escape — Elemental.

## [1.0.0] - 2026-10-14

### Added
- **Core Gameplay:** Arrow puzzle mechanic with 4-directional grid
- **Element System:** FIRE, WATER, ICE, ELECTRIC with unique abilities
- **Chain Reactions:** STEAM, CONDUCTOR, DEEP FREEZE, EXPLOSION
- **Element Evolution:** 3 tiers per element, upgrade with crystals
- **50 Campaign Levels:** Progressive difficulty, reverse-solve generation
- **Boss Battles:** 5 unique bosses (L10,20,30,40,50)
- **Game Modes:** Campaign, Endless, Daily Challenge, Boss Rush
- **Crystal Economy:** Earn/spend for upgrades, items, continues
- **Achievements:** 10 achievements with toast notifications
- **Star Rating:** 3-star system per level (complete, no-mistake, speed)
- **Combo System:** Escalating rewards at 3, 5, 10+ combos

### Technical
- **Vanilla ES6+:** Zero dependencies, no build step
- **Canvas Rendering:** DPR-aware, 60fps fixed timestep
- **Game Juice:** Hit-stop, trauma shake, squash/stretch, particles
- **Audio:** Web Audio API procedural SFX + seamless music loops
- **Save System:** LocalStorage with versioning, checksum, migration
- **PWA:** Service Worker, manifest, offline support, installable
- **i18n:** English + Indonesian, auto-detect, live switch
- **Accessibility:** Colorblind, reduced motion, high contrast, ARIA, screen reader
- **CrazyGames SDK v3:** Gameplay events, rewarded/interstitial ads, mute sync

### UI/UX
- **Mobile-first:** Portrait 9:16, safe areas, touch optimized
- **Menus:** Main, Level Select, Mode Select, Element Lab, Achievements, Settings, Pause
- **Settings:** Sound, Music, Vibration, Colorblind, Reduced Motion, Language, Data management
- **Keyboard:** Arrows/WASD/Space/U/H/Esc
- **Landscape Warning:** Auto-pause on mobile landscape <500px
- **Developer Mode:** `?debug=true` for FPS, grid, skip, crystals

### Anti-Cheat & Security
- Score validation (max arrows × 50)
- Time validation (0-3600s)
- Save checksum (mod 1000)
- DevTools detection
- Analytics rate limiting

### Documentation
- GDD.md, PUZZLE_SPECS.md, PUZZLE_GRAPH.md, LEVEL_GENERATION.md
- BROWSER_TESTING.md, DEVICE_TESTING.md, PERFORMANCE.md

## [1.0.0] - 2026-10-14

### Added
- **Core Gameplay:** Arrow puzzle mechanic with 4-directional grid
- **Element System:** FIRE, WATER, ICE, ELECTRIC with unique abilities
- **Chain Reactions:** STEAM, CONDUCTOR, DEEP FREEZE, EXPLOSION
- **Element Evolution:** 3 tiers per element, upgrade with crystals
- **50 Campaign Levels:** Progressive difficulty, reverse-solve generation
- **Boss Battles:** 5 unique bosses (L10,20,30,40,50)
- **Game Modes:** Campaign, Endless, Daily Challenge, Boss Rush
- **Crystal Economy:** Earn/spend for upgrades, items, continues
- **Achievements:** 10 achievements with toast notifications
- **Star Rating:** 3-star system per level (complete, no-mistake, speed)
- **Combo System:** Escalating rewards at 3, 5, 10+ combos

### Technical
- **Vanilla ES6+:** Zero dependencies, no build step
- **Canvas Rendering:** DPR-aware, 60fps fixed timestep
- **Game Juice:** Hit-stop, trauma shake, squash/stretch, particles
- **Audio:** Web Audio API procedural SFX + seamless music loops
- **Save System:** LocalStorage with versioning, checksum, migration
- **PWA:** Service Worker, manifest, offline support, installable
- **i18n:** English + Indonesian, auto-detect, live switch
- **Accessibility:** Colorblind, reduced motion, high contrast, ARIA, screen reader
- **CrazyGames SDK v3:** Gameplay events, rewarded/interstitial ads, mute sync

### UI/UX
- **Mobile-first:** Portrait 9:16, safe areas, touch optimized
- **Menus:** Main, Level Select, Mode Select, Element Lab, Achievements, Settings, Pause
- **Settings:** Sound, Music, Vibration, Colorblind, Reduced Motion, Language, Data management
- **Keyboard:** Arrows/WASD/Space/U/H/Esc
- **Landscape Warning:** Auto-pause on mobile landscape <500px
- **Developer Mode:** `?debug=true` for FPS, grid, skip, crystals

### Anti-Cheat & Security
- Score validation (max arrows × 50)
- Time validation (0-3600s)
- Save checksum (mod 1000)
- DevTools detection
- Analytics rate limiting

### Documentation
- GDD.md, PUZZLE_SPECS.md, PUZZLE_GRAPH.md, LEVEL_GENERATION.md
- BROWSER_TESTING.md, DEVICE_TESTING.md, PERFORMANCE.md

## [1.0.1] - 2026-10-14 (Post-MVP Polish)

### Completed (previously Planned)
- Procedural fallback for all 17+ missing images (arrows, icons, covers, logos, PWA icons)
- Anonymous mode (in-memory progress, no localStorage persistence)
- Screen reader announcements for all game events
- Focus trap management for modal dialogs
- Auto-resume level if played within 24 hours
- Skip level confirmation with crystal cost
- LocalStorage quota handling (auto-cleanup analytics)
- Build size optimization: 268KB (target <500KB)

### Documentation
- README.md updated with final feature list
- CHANGELOG.md updated

## [Unreleased]

### Planned
- MCP-generated production assets (replacing procedural fallbacks)
- Platform metadata (ID descriptions, all cover formats in platform/)
- Deployment guide for Vercel/Netlify/GitHub Pages
- Final QA checklist completion
- CrazyGames submission

---

## Versioning
- **Major:** Breaking changes, new mechanics
- **Minor:** New features, modes, content
- **Patch:** Bug fixes, balance, polish

## Save Version History
| Game Version | Save Version | Migration |
|--------------|--------------|-----------|
| 1.0.0 | 1 | Initial |