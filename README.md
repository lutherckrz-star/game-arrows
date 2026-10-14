 HEAD
# Arrow Escape — Elemental

HTML5 puzzle game with elemental reactions, chain combos, and boss battles. Built for CrazyGames and Playgama.

## 🎮 Game Features

- **Core Mechanic**: Tap arrows to clear them - only if path is clear
- **4 Elements**: Fire, Water, Ice, Electric with unique abilities
- **Chain Reactions**: Fire+Ice=Steam, Water+Electric=Conductor, Ice+Water=Deep Freeze, Electric+Fire=Explosion
- **Element Evolution**: 3 tiers per element, upgrade with Crystals
- **50 Campaign Levels** + Endless, Daily Challenge, Boss Rush modes
- **Boss Battles** every 10 levels with unique attack patterns
- **Achievements** (10), Daily Rewards, Crystal economy
- **PWA Ready**: Offline support, installable, fullscreen

## 📁 Project Structure

```
arrow-escape/
├── index.html          # Main entry point
├── style.css           # All styling (CSS variables, responsive)
├── sw.js               # Service Worker for PWA
├── manifest.json       # PWA manifest
├── favicon.ico         # App icon
├── js/
│   ├── config.js       # All constants & configuration
│   ├── i18n.js         # EN/ID localization
│   ├── arrow.js        # Arrow class & directions
│   ├── element.js      # Elements & chain reactions
│   ├── board.js        # Board logic & grid
│   ├── level.js        # Level generator (reverse-solve)
│   ├── boss.js         # Boss battles
│   ├── crystal.js      # Crystal economy & upgrades
│   ├── achievement.js  # 10 achievements
│   ├── menu.js         # Menus & navigation
│   ├── settings.js     # Settings persistence
│   ├── audio.js        # Web Audio API + procedural SFX
│   ├── ads.js          # CrazyGames SDK v3 integration
│   ├── analytics.js    # Event tracking & funnels
│   ├── security.js     # Anti-cheat & save validation
│   ├── particles.js    # Particle system (object pooling)
│   ├── ui.js           # Modals, toasts, HUD
│   └── game.js         # Main game loop & state
├── assets/
│   ├── images/         # Sprites, icons, covers
│   ├── sounds/         # SFX (WAV)
│   └── i18n.json       # Translations
├── platform/           # Store assets (covers, descriptions)
├── docs/               # Documentation
└── README.md
```

## 🚀 Quick Start

```bash
# No build step needed - pure vanilla JS
# Just open index.html in a browser (or use Live Server)

# For development with HTTPS (required for CrazyGames SDK):
npx serve -l 3000 --ssl-cert localhost.pem --ssl-key localhost-key.pem
```

## ⚙️ Configuration

All game constants in `js/config.js`:
- Grid sizes, level progression
- Element stats & upgrade costs
- Scoring, combo thresholds
- Ad timing, cooldowns
- Visual effects (trauma, hit-stop, squash/stretch)

## 🎨 Asset Generation

Uses the **MCP Game Asset Generator** (separate project):

```bash
cd ../mcp-game-asset-generator
npm run build
# Configure in Cline MCP settings
```

Then in Cline:
> "Generate all assets for Arrow Escape Elemental"

This creates 17 images + 12 SFX in `assets/`.

## 📱 PWA Features

- **Offline**: Service Worker caches all assets
- **Installable**: Meets PWA criteria
- **Fullscreen**: `display: fullscreen` in manifest
- **Orientation**: Portrait locked
- **Safe Areas**: Respects notches/home indicators

## 🎯 CrazyGames Integration

SDK v3 events implemented:
- `gameplayStart()` / `gameplayStop()`
- `loadingStart()` / `loadingStop()`
- `muteAudio()`
- Rewarded ads with Crystal fallback
- Interstitial every 3 levels (grace: first 3 levels)
- Ad blocker detection
- Happy Hour support

## 🌐 Localization

EN/ID in `assets/i18n.json`. Auto-detects browser language.

## 🔧 Developer Mode

Add `?debug=true` to URL for:
- FPS counter
- Grid overlay
- Skip Level button
- +100 Crystals

## 📦 Deployment

```bash
# Vercel (recommended)
vercel deploy

# Netlify
netlify deploy --prod

# GitHub Pages
# Enable in repo settings
```

Requirements:
- HTTPS (required for SDK)
- Initial load < 50MB
- Total < 250MB
- File count < 1,500

## 📋 Submission Checklist

- [ ] HTTPS enabled
- [ ] No console errors
- [ ] Load time < 5s
- [ ] Mobile portrait works
- [ ] Rewarded ads work
- [ ] Interstitials work
- [ ] Ad blocker fallback works
- [ ] No 3rd party ads
- [ ] PEGI 12 compliant
- [ ] Privacy policy linked
- [ ] Game covers ready (16:9, 1:1, 9:16)
- [ ] Lands directly in gameplay
- [ ] Fullscreen handled by SDK
- [ ] No cross-promotion
- [ ] `muteAudio` implemented

## 📚 Documentation

See `docs/`:
- `GDD.md` - Game Design Document
- `PUZZLE_SPECS.md` - Level specifications
- `LEVEL_GENERATION.md` - Algorithm details
- `BROWSER_TESTING.md` - Test results
- `PERFORMANCE.md` - Optimization notes

## 📄 License

MIT License - Free for commercial use.

---

**Built with vanilla JS, zero dependencies, pure web standards.** 🎮

# game-arrows
 2f9089176f055118c3e9dfd6d741fe092b6fac29
