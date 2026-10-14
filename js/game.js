/**
 * Arrow Escape — Elemental
 * Main Game Controller - Chunk 1: Constructor & Init
 */

import { CONFIG } from './config.js';
import { Board } from './board.js';
import { Arrow, DIRECTIONS, ELEMENTS } from './arrow.js';
import { generateLevel, generateBossLevel, generateEndlessLevel, generateDailyChallenge } from './level.js';
import { detectReactions, applyReaction, getElementLevel, upgradeElement, resetElementLevels } from './element.js';
import { BossManager } from './boss.js';
import { crystalManager } from './crystal.js';
import { achievementManager } from './achievement.js';
import { audioManager } from './audio.js';
import { adsManager } from './ads.js';
import { analytics } from './analytics.js';
import { securityManager } from './security.js';
import { particleSystem } from './particles.js';
import { ui } from './ui.js';
import { settingsManager } from './settings.js';
import { i18n } from './i18n.js';

// Global refs
window.game = null;
window.getElementLevel = getElementLevel;
window.upgradeElement = upgradeElement;

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'loading';
        this.mode = 'campaign';
        this.currentLevel = 1;
        this.board = null;
        this.bossManager = new BossManager();
        
        // Gameplay
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.mistakes = 0;
        this.levelStartTime = 0;
        this.totalPlayTime = 0;
        this.undoStack = [];
        this.undoCount = 3;
        this.hintsUsed = 0;
        this.reactionsTriggered = 0;
        this.isFirstSession = true;
        
        // Visual
        this.cellSize = 60;
        this.boardOffsetX = 0;
        this.boardOffsetY = 0;
        this.dpr = Math.min(window.devicePixelRatio || 1, CONFIG.DPR_MAX);
        this.trauma = 0;
        this.hitStopTimer = 0;
        this.selectedCell = null;
        this.hoveredCell = null;
        
        // Level data
        this.levelData = null;
        this.isBossLevel = false;
        
        // Input
        this.keysPressed = new Set();
        this.touchStart = null;
        
        // Auto-save
        this.autoSaveTimer = 0;
        this.lastLevelState = null;
        
        // High contrast mode detection
        this.highContrast = window.matchMedia('(prefers-contrast: more)').matches;
        window.matchMedia('(prefers-contrast: more)').addEventListener('change', (e) => {
            this.highContrast = e.matches;
        });
    }

async init() {
        console.log('Initializing Arrow Escape...');
        
        await audioManager.init();
        await i18n.init();
        settingsManager.init();
        analytics.init();
        securityManager.init();
        adsManager.init();
        ui.init();
        particleSystem.init(this.canvas);
        
        this.loadGame();
        this.setupCanvas();
        this.setupInput();
        await this.loadAssets(); // Load assets with fallbacks
        
        this.lastTime = performance.now();
        this.state = 'menu';
        ui.showMainMenu();
        ui.updateHUD(this.getHUDData());
        ui.hideLoading();
        
        // Safe check for first session
        const save = this.saveData;
        if (!save || !save.firstSessionComplete) {
            this.isFirstSession = true;
            this.startLevel(1);
        } else if (this.checkAutoResume()) {
            // Show main menu first, then prompt auto-resume
            setTimeout(() => this.promptAutoResume(), 500);
        }
        
        requestAnimationFrame(this.gameLoop.bind(this));
        console.log('Game initialized!');
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 100);
            ui.checkLandscape();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const maxWidth = Math.min(rect.width, 500);
        const maxHeight = rect.height * 0.7;
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
        
        this.canvas.width = maxWidth * this.dpr;
        this.canvas.height = maxHeight * this.dpr;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);
        
        const boardSize = Math.min(maxWidth, maxHeight * 0.9);
        this.cellSize = boardSize / (this.board?.size || 4);
        this.boardOffsetX = (maxWidth - boardSize) / 2;
        this.boardOffsetY = (maxHeight - boardSize) / 2 + 20;
    }

    setupInput() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.keysPressed.delete(e.key));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Footer buttons
        const undoBtn = document.getElementById('undo-btn');
        const hintBtn = document.getElementById('hint-btn');
        const shareBtn = document.getElementById('share-btn');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (hintBtn) hintBtn.addEventListener('click', () => this.useHint());
        if (shareBtn) shareBtn.addEventListener('click', () => this.shareScore());
    }

    // ========== ASSET LOADING WITH FALLBACKS ==========
    async loadAssets() {
        this.assetImages = {};
        this.assetLoaded = false;
        
        const assetManifest = {
            arrow_fire: 'assets/images/arrow_fire.png',
            arrow_water: 'assets/images/arrow_water.png',
            arrow_ice: 'assets/images/arrow_ice.png',
            arrow_electric: 'assets/images/arrow_electric.png',
            arrow_plain: 'assets/images/arrow_plain.png',
            icon_undo: 'assets/images/icon_undo.png',
            icon_hint: 'assets/images/icon_hint.png',
            icon_share: 'assets/images/icon_share.png',
            icon_settings: 'assets/images/icon_settings.png',
            icon_crystal: 'assets/images/icon_crystal.png',
            icon_pause: 'assets/images/icon_pause.png',
            icon_flask: 'assets/images/icon_flask.png',
            icon_trophy: 'assets/images/icon_trophy.png',
            icon_play: 'assets/images/icon_play.png',
            icon_endless: 'assets/images/icon_endless.png',
            icon_192: 'assets/images/icon-192.png',
            icon_512: 'assets/images/icon-512.png',
            logo_arrow_escape: 'assets/images/logo_arrow_escape.png',
            cover_16x9: 'assets/images/cover_16x9.png',
            cover_9x16: 'assets/images/cover_9x16.png',
        };

        const loadPromises = Object.entries(assetManifest).map(async ([key, path]) => {
            try {
                const img = await this.loadImage(path);
                this.assetImages[key] = img;
            } catch (e) {
                console.warn(`Failed to load ${path}, will use fallback`);
                this.assetImages[key] = null;
            }
        });

        await Promise.all(loadPromises);
        this.generateFallbackImages();
        this.assetLoaded = true;
        console.log('Assets loaded (with fallbacks where needed)');
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load ${src}`));
            img.src = src;
        });
    }

    generateFallbackImages() {
        const fallbacks = {
            arrow_fire: () => this.createArrowFallback('#ff4757', '#ff9f43'),
            arrow_water: () => this.createArrowFallback('#3498db', '#54a0ff'),
            arrow_ice: () => this.createArrowFallback('#74b9ff', '#a2d2ff'),
            arrow_electric: () => this.createArrowFallback('#feca57', '#ffdd59'),
            arrow_plain: () => this.createArrowFallback('#ffffff', '#dddddd'),
            icon_undo: () => this.createIconFallback('undo'),
            icon_hint: () => this.createIconFallback('hint'),
            icon_share: () => this.createIconFallback('share'),
            icon_settings: () => this.createIconFallback('settings'),
            icon_crystal: () => this.createIconFallback('crystal'),
            icon_pause: () => this.createIconFallback('pause'),
            icon_flask: () => this.createIconFallback('flask'),
            icon_trophy: () => this.createIconFallback('trophy'),
            icon_play: () => this.createIconFallback('play'),
            icon_endless: () => this.createIconFallback('endless'),
            icon_192: () => this.createPWAIconFallback(192),
            icon_512: () => this.createPWAIconFallback(512),
            logo_arrow_escape: () => this.createLogoFallback('Arrow Escape'),
            cover_16x9: () => this.createCoverFallback(1920, 1080),
            cover_9x16: () => this.createCoverFallback(540, 960),
        };

        for (const [key, generator] of Object.entries(fallbacks)) {
            if (!this.assetImages[key]) {
                try {
                    this.assetImages[key] = generator();
                } catch (e) {
                    console.warn(`Failed to generate fallback for ${key}`);
                }
            }
        }
    }
        const maxWidth = Math.min(rect.width, 500);
        const maxHeight = rect.height * 0.7;
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
        
        this.canvas.width = maxWidth * this.dpr;
        this.canvas.height = maxHeight * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        
        const boardSize = Math.min(maxWidth, maxHeight * 0.9);
        this.cellSize = boardSize / (this.board?.size || 4);
        this.boardOffsetX = (maxWidth - boardSize) / 2;
        this.boardOffsetY = (maxHeight - boardSize) / 2 + 20;
    }
setupInput() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.keysPressed.delete(e.key));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Footer buttons
        const undoBtn = document.getElementById('undo-btn');
        const hintBtn = document.getElementById('hint-btn');
        const shareBtn = document.getElementById('share-btn');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (hintBtn) hintBtn.addEventListener('click', () => this.useHint());
        if (shareBtn) shareBtn.addEventListener('click', () => this.shareScore());
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastFrameTime = dt; // For FPS counter
        this.lastTime = timestamp;
        if (this.hitStopTimer > 0) { this.hitStopTimer -= dt; if (this.hitStopTimer <= 0) this.hitStopTimer = 0; }
        else { this.update(dt); }
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(dt) {
        if (this.state !== 'playing') return;
        this.board.update(dt); particleSystem.update(dt);
        if (this.isBossLevel && this.bossManager.isActive()) {
            const bossDefeated = this.bossManager.update(dt, this.board);
            if (bossDefeated) this.onBossDefeated();
            const boss = this.bossManager.getBoss();
            if (boss) { const remaining = Math.max(0, boss.attackInterval - boss.attackTimer); ui.showBossTimer(remaining); }
        }
        if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - CONFIG.TRAUMA_DECAY);
createArrowFallback(primaryColor, secondaryColor) {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(16, 4);
        ctx.lineTo(24, 16);
        ctx.lineTo(20, 16);
        ctx.lineTo(20, 28);
        ctx.lineTo(12, 28);
        ctx.lineTo(12, 16);
        ctx.lineTo(8, 16);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(16, 6);
        ctx.lineTo(20, 14);
        ctx.lineTo(16, 14);
        ctx.closePath();
        ctx.fill();
        
        return canvas;
    }

    createIconFallback(type) {
        const canvas = document.createElement('canvas');
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        
        switch (type) {
            case 'undo':
                ctx.beginPath();
                ctx.arc(12, 12, 8, Math.PI * 0.25, Math.PI * 1.75);
                ctx.lineTo(12, 12);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(8, 8);
                ctx.lineTo(4, 12);
                ctx.lineTo(8, 16);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case 'hint':
                ctx.beginPath();
                ctx.arc(12, 8, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(11, 14, 2, 6);
                break;
            case 'share':
                ctx.beginPath();
                ctx.moveTo(18, 6);
                ctx.lineTo(6, 12);
                ctx.lineTo(18, 18);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case 'settings':
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = 12 + Math.cos(angle) * 10;
                    const y = 12 + Math.sin(angle) * 10;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'crystal':
                ctx.beginPath();
                ctx.moveTo(12, 4);
                ctx.lineTo(20, 12);
                ctx.lineTo(12, 20);
                ctx.lineTo(4, 12);
                ctx.closePath();
                ctx.fill();
                break;
            case 'pause':
                ctx.fillRect(6, 4, 4, 16);
                ctx.fillRect(14, 4, 4, 16);
                break;
            case 'flask':
                ctx.beginPath();
                ctx.moveTo(8, 6);
createLogoFallback(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        const glow = ctx.createRadialGradient(256, 256, 0, 256, 256, 200);
        glow.addColorStop(0, 'rgba(255, 71, 87, 0.3)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 512, 512);
        
        ctx.font = \old \px system-ui\;
        ctx.fillStyle = '#ff4757';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Arrow Escape', 256, 240);
        
        ctx.font = \old \px system-ui\;
        ctx.fillStyle = '#feca57';
        ctx.fillText('Elemental', 256, 290);
        
        return canvas;
    }

    createCoverFallback(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        const glow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
        glow.addColorStop(0, 'rgba(255, 71, 87, 0.2)');
        glow.addColorStop(0.5, 'rgba(52, 152, 219, 0.1)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = \old \px system-ui\;
        ctx.fillStyle = '#ff4757';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Arrow Escape', width/2, height/2 - 30);
        
        ctx.font = \old \px system-ui\;
        ctx.fillStyle = '#feca57';
        ctx.fillText('Elemental', width/2, height/2 + 30);
        
        return canvas;
    }
                ctx.lineTo(8, 18);
                ctx.lineTo(16, 18);
                ctx.lineTo(16, 6);
                ctx.closePath();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(10, 4);
                ctx.lineTo(14, 4);
                ctx.stroke();
                break;
            case 'trophy':
                ctx.beginPath();
                ctx.moveTo(6, 10);
                ctx.lineTo(6, 18);
                ctx.lineTo(18, 18);
                ctx.lineTo(18, 10);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(12, 6, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'play':
                ctx.beginPath();
                ctx.moveTo(8, 6);
                ctx.lineTo(18, 12);
                ctx.lineTo(8, 18);
                ctx.closePath();
                ctx.fill();
                break;
            case 'endless':
                ctx.beginPath();
                ctx.arc(12, 12, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(12, 4);
                ctx.lineTo(12, 20);
                ctx.moveTo(4, 12);
                ctx.lineTo(20, 12);
                ctx.stroke();
                break;
        }
        
        return canvas;
    }

    createPWAIconFallback(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = Math.max(2, size/64);
        ctx.stroke();
        
        ctx.font = `bold ${size/4}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('→', size/2, size/2 + size/16);
        
        return canvas;
    }

    update(dt) {
        if (this.state !== 'playing') return;
        this.board.update(dt); particleSystem.update(dt);
        if (this.isBossLevel && this.bossManager.isActive()) {
            const bossDefeated = this.bossManager.update(dt, this.board);
            if (bossDefeated) this.onBossDefeated();
            const boss = this.bossManager.getBoss();
            if (boss) { const remaining = Math.max(0, boss.attackInterval - boss.attackTimer); ui.showBossTimer(remaining); }
        }
        if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - CONFIG.TRAUMA_DECAY);
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer >= CONFIG.AUTO_SAVE_INTERVAL / 1000) { this.saveLevelState(); this.autoSaveTimer = 0; }
        this.totalPlayTime += dt; ui.updateHUD(this.getHUDData());
    }

    render() {
        this.ctx.save();
        if (this.trauma > 0) { const shake = this.trauma * this.trauma * CONFIG.MAX_SHAKE; this.ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); }
        this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
        this.drawBoardBackground(); this.drawGrid(); this.drawArrows(); this.drawSelection(); particleSystem.render();
        
        // Near-miss feedback: sisa 1-2 panah, border berdenyut hijau
        const activeCount = this.board.getActiveArrows().length;
        if (activeCount > 0 && activeCount <= 2 && !settingsManager.get('reducedMotion')) {
            const pulse = (Math.sin(performance.now() / 200) + 1) / 2; // 0 to 1
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + pulse * 0.5})`;
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(this.boardOffsetX - 2, this.boardOffsetY - 2, this.board.size * this.cellSize + 4, this.board.size * this.cellSize + 4);
        }
        
        if (this.isBossLevel && this.bossManager.getBoss()?.isWarning) this.drawBossWarning();
        
        // Developer Mode: FPS counter & Grid overlay
        if (CONFIG.DEBUG) {
            this.drawDebugInfo();
        }
        
        this.ctx.restore();
    }

    drawDebugInfo() {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // FPS Counter
        if (CONFIG.DEBUG_FPS) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 120, 60);
            ctx.fillStyle = '#0f0';
            ctx.font = '14px monospace';
            ctx.fillText(`FPS: ${Math.round(1 / (this.lastFrameTime || 0.016))}`, 20, 30);
            ctx.fillText(`Arrows: ${this.board.getActiveArrows().length}`, 20, 50);
            ctx.fillText(`Trauma: ${this.trauma.toFixed(2)}`, 20, 70);
        }
        
        // Grid Overlay
        if (CONFIG.DEBUG_GRID && this.board) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let r = 0; r <= this.board.size; r++) {
                const y = this.boardOffsetY + r * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(this.boardOffsetX, y);
                ctx.lineTo(this.boardOffsetX + this.board.size * this.cellSize, y);
                ctx.stroke();
            }
            for (let c = 0; c <= this.board.size; c++) {
                const x = this.boardOffsetX + c * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(x, this.boardOffsetY);
                ctx.lineTo(x, this.boardOffsetY + this.board.size * this.cellSize);
                ctx.stroke();
            }
        }
        
        // Skip Level & Add Crystals buttons
        if (CONFIG.DEBUG_SKIP_LEVEL || CONFIG.DEBUG_ADD_CRYSTALS) {
            ctx.fillStyle = 'rgba(255, 71, 87, 0.9)';
            let y = this.canvas.height / this.dpr - 100;
            if (CONFIG.DEBUG_SKIP_LEVEL) {
                ctx.fillRect(10, y, 150, 40);
                ctx.fillStyle = '#fff';
                ctx.font = \old \px system-ui\;
                ctx.fillText('Skip Level (K)', 20, y + 25);
                y += 50;
            }
            if (CONFIG.DEBUG_ADD_CRYSTALS) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
                ctx.fillRect(10, y, 150, 40);
                ctx.fillStyle = '#000';
                ctx.font = \old \px system-ui\;
                ctx.fillText(`+${CONFIG.DEBUG_ADD_CRYSTALS} Crystals (C)`, 20, y + 25);
            }
        }
        
        ctx.restore();
    }
// ========== INPUT HANDLERS ==========
    handleClick(e) {
        if (this.state !== 'playing') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.dpr;
        const y = (e.clientY - rect.top) * this.dpr;
        this.processInput(x, y);
    }

    handleMouseMove(e) {
        if (this.state !== 'playing') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.dpr;
        const y = (e.clientY - rect.top) * this.dpr;
        this.hoveredCell = this.board.screenToGrid(x, y, this.cellSize, this.boardOffsetX, this.boardOffsetY);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.state !== 'playing') return;
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchStart = { x: (touch.clientX - rect.left) * this.dpr, y: (touch.clientY - rect.top) * this.dpr };
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.state !== 'playing' || !this.touchStart) return;
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * this.dpr;
        const y = (touch.clientY - rect.top) * this.dpr;
        const dx = x - this.touchStart.x;
        const dy = y - this.touchStart.y;
        if (Math.abs(dx) < 20 * this.dpr && Math.abs(dy) < 20 * this.dpr) this.processInput(x, y);
        this.touchStart = null;
    }

    handleKeyDown(e) {
        this.keysPressed.add(e.key);
        if (this.state === 'playing') {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': this.moveSelection(0, -1); break;
                case 'ArrowDown': case 's': case 'S': this.moveSelection(0, 1); break;
                case 'ArrowLeft': case 'a': case 'A': this.moveSelection(-1, 0); break;
                case 'ArrowRight': case 'd': case 'D': this.moveSelection(1, 0); break;
                case ' ': case 'Enter': this.confirmSelection(); break;
                case 'u': case 'U': this.undo(); break;
                case 'h': case 'H': this.useHint(); break;
                case 'Escape': this.pause(); break;
                // Developer Mode keys
                case 'k': case 'K': if (CONFIG.DEBUG_SKIP_LEVEL) this.debugSkipLevel(); break;
                case 'c': case 'C': if (CONFIG.DEBUG_ADD_CRYSTALS) { crystalManager.add(CONFIG.DEBUG_ADD_CRYSTALS, 'debug'); ui.showToast(`+${CONFIG.DEBUG_ADD_CRYSTALS} Crystals (Debug)`); } break;
            }
        } else if (this.state === 'paused' && e.key === 'Escape') this.resume();
    }

    moveSelection(dx, dy) {
        if (!this.selectedCell) this.selectedCell = { row: Math.floor(this.board.size / 2), col: Math.floor(this.board.size / 2) };
        else { this.selectedCell.row = Math.max(0, Math.min(this.board.size - 1, this.selectedCell.row + dy)); this.selectedCell.col = Math.max(0, Math.min(this.board.size - 1, this.selectedCell.col + dx)); }
    }

    confirmSelection() {
        if (this.selectedCell) this.processInput(this.boardOffsetX + this.selectedCell.col * this.cellSize + this.cellSize / 2, this.boardOffsetY + this.selectedCell.row * this.cellSize + this.cellSize / 2);
    }

    processInput(x, y) {
        const cell = this.board.screenToGrid(x, y, this.cellSize, this.boardOffsetX, this.boardOffsetY);
        if (!cell) return;
        const arrow = this.board.getArrow(cell.row, cell.col);
        if (!arrow) return;
        audioManager.resume();
        this.pushUndoState();
        const result = this.board.tryExitArrow(arrow);
        if (result.success) this.onArrowExit(arrow, result.blockers);
        else this.onArrowBlocked(arrow, result.blockers);
    }

    pushUndoState() { this.undoStack.push(this.serializeLevelState()); if (this.undoStack.length > 20) this.undoStack.shift(); }

    undo() {
        if (this.undoStack.length === 0 || this.undoCount <= 0) { audioManager.playSFX('button_click'); return; }
        this.undoCount--; const state = this.undoStack.pop(); this.deserializeLevelState(state); this.combo = 0; this.mistakes = 0; audioManager.playSFX('button_click'); ui.showToast(`${t('undo')} (${this.undoCount} left)`);
    }

    useHint() {
        if (this.hintsUsed >= 3) return;
        for (const arrow of this.board.getActiveArrows()) {
            if (arrow.canExit(this.board)) { this.selectedCell = { row: arrow.row, col: arrow.col }; ui.showToast(`${t('hint')}: Row ${arrow.row + 1}, Col ${arrow.col + 1}`); this.hintsUsed++; audioManager.playSFX('button_click'); return; }
        }
    }
// ========== ARROW EXIT / BLOCKED LOGIC ==========
    onArrowExit(arrow, blockers) {
        this.hitStopTimer = CONFIG.HIT_STOP_DURATION / 1000;
        this.trauma += 0.1;
        const colors = { [ELEMENTS.FIRE]: '#ff4757', [ELEMENTS.WATER]: '#3498db', [ELEMENTS.ICE]: '#74b9ff', [ELEMENTS.ELECTRIC]: '#feca57', [ELEMENTS.PLAIN]: '#ffffff' };
        particleSystem.emitArrowExit(arrow.row, arrow.col, arrow.element, this.cellSize, this.boardOffsetX, this.boardOffsetY);
        const baseScore = arrow.element === ELEMENTS.PLAIN ? CONFIG.SCORE_PLAIN_ARROW : CONFIG.SCORE_ELEMENT_ARROW;
        this.score += baseScore;
        this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
        audioManager.playArrowOut(this.combo);
        if (this.combo % CONFIG.COMBO_THRESHOLD === 0) { this.score += CONFIG.SCORE_COMBO_BONUS; this.trauma += 0.2; audioManager.playCombo(this.combo); ui.showCombo(this.combo); this.announceCombo(this.combo); }
        if (this.combo >= CONFIG.COMBO_ESCALATION_THRESHOLD && this.combo % 5 === 0) audioManager.playSFX('combo_escalation');
        this.announceArrowExit(arrow);
        const involvedArrows = [...blockers];
        const reactions = detectReactions(arrow, involvedArrows);
        for (const reaction of reactions) { const affected = applyReaction(this.board, reaction); this.reactionsTriggered++; this.score += CONFIG.SCORE_REACTION_BONUS; this.trauma += 0.4; audioManager.playReaction(reaction.type); ui.showReaction(reaction.type); analytics.track('reaction_triggered', { type: reaction.type, level: this.currentLevel }); this.announceReaction(reaction.type); }
        
        // Auto-save after successful move
        this.saveGame();
        
        if (this.board.isEmpty()) this.onLevelComplete();
        else if (!this.board.checkSolvable()) this.onDeadend();
    }

    onArrowBlocked(arrow, blockers) {
        this.combo = 0; this.mistakes++; this.trauma += 0.05;
        arrow.wasBlocked = true; arrow.triggerSquashStretch();
        audioManager.playSFX('arrow_blocked');
        if (settingsManager.get('vibration') && navigator.vibrate) navigator.vibrate(50);
        
        // Auto-save after blocked attempt too
        this.saveGame();
    }

    onDeadend() { this.state = 'deadend'; audioManager.playSFX('deadend'); analytics.track('deadend_detected', { level: this.currentLevel }); ui.showDeadend(); this.announceDeadend(); }
onLevelComplete() {
        this.state = 'level_complete';
        adsManager.gameplayStop();
        const timeTaken = performance.now() - this.levelStartTime;
        const noMistake = this.mistakes === 0;
        const speedBonus = timeTaken < CONFIG.CRYSTAL_SPEED_THRESHOLD;
        let stars = 1;
        if (noMistake) stars = 2;
        if (noMistake && speedBonus) stars = 3;
        let crystalsEarned = 0;
        if (noMistake) crystalsEarned += crystalManager.rewardNoMistake();
        if (speedBonus) crystalsEarned += crystalManager.rewardSpeedBonus(timeTaken);
        const save = this.saveData;
        save.starRatings = save.starRatings || {};
        save.bestTimes = save.bestTimes || {};
        if (!save.starRatings[this.currentLevel] || save.starRatings[this.currentLevel] < stars) save.starRatings[this.currentLevel] = stars;
        if (!save.bestTimes[this.currentLevel] || save.bestTimes[this.currentLevel] > timeTaken) save.bestTimes[this.currentLevel] = timeTaken;
        if (this.currentLevel >= (save.currentLevel || 1)) save.currentLevel = this.currentLevel + 1;
        save.totalScore = this.score;
        save.totalPlaytime = this.totalPlayTime;
        save.firstSessionComplete = true;
        this.saveGame();
        analytics.track('level_complete', { level: this.currentLevel, stars, time: timeTaken, score: this.score, noMistake, speedBonus, reactions: this.reactionsTriggered });
        achievementManager.checkAll({ levelsCompleted: Object.keys(save.starRatings).length, maxCombo: this.maxCombo, reactionsTriggered: this.reactionsTriggered, threeStarLevels: Object.values(save.starRatings).filter(s => s === 3).length, fastestLevelTime: Math.min(...Object.values(save.bestTimes).filter(t => t > 0)), bossesDefeated: save.bossesDefeated || 0 }, { FIRE: getElementLevel(ELEMENTS.FIRE), WATER: getElementLevel(ELEMENTS.WATER), ICE: getElementLevel(ELEMENTS.ICE), ELECTRIC: getElementLevel(ELEMENTS.ELECTRIC) });
        if (this.currentLevel >= CONFIG.ENDLESS_UNLOCK_LEVEL && !save.unlockedModes.includes('endless')) save.unlockedModes.push('endless');
        if (this.currentLevel >= CONFIG.DAILY_UNLOCK_LEVEL && !save.unlockedModes.includes('daily')) save.unlockedModes.push('daily');
        if (this.currentLevel >= CONFIG.BOSS_RUSH_UNLOCK_LEVEL && !save.unlockedModes.includes('boss_rush')) save.unlockedModes.push('boss_rush');
        adsManager.onLevelPlayed();
        if (adsManager.canShowInterstitial()) adsManager.showInterstitial();
        audioManager.playLevelComplete();
        ui.showLevelComplete({ stars, score: this.score, crystals: crystalsEarned, time: timeTaken, noMistake, speedBonus });
        this.announceLevelComplete(stars);
    }

    onBossDefeated() {
        this.isBossLevel = false;
        ui.hideBossTimer();
        const save = this.saveData;
        save.bossesDefeated = (save.bossesDefeated || 0) + 1;
        audioManager.playBossDefeat();
        ui.showToast(t('boss_defeated'));
        setTimeout(() => { if (this.currentLevel < CONFIG.CAMPAIGN_LEVELS) this.startLevel(this.currentLevel + 1); else this.quitToMenu(); }, 2000);
    }
// ========== RENDERING ==========
    drawBoardBackground() {
        const size = this.board.size;
        const boardWidth = size * this.cellSize;
        const boardHeight = size * this.cellSize;
        this.ctx.fillStyle = CONFIG.COLORS.BOARD;
        this.ctx.fillRect(this.boardOffsetX - 4, this.boardOffsetY - 4, boardWidth + 8, boardHeight + 8);
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)'; this.ctx.lineWidth = 1;
        for (let i = 0; i <= size; i++) { this.ctx.beginPath(); this.ctx.moveTo(this.boardOffsetX + i * this.cellSize, this.boardOffsetY); this.ctx.lineTo(this.boardOffsetX + i * this.cellSize, this.boardOffsetY + boardHeight); this.ctx.stroke(); this.ctx.beginPath(); this.ctx.moveTo(this.boardOffsetX, this.boardOffsetY + i * this.cellSize); this.ctx.lineTo(this.boardOffsetX + boardWidth, this.boardOffsetY + i * this.cellSize); this.ctx.stroke(); }
    }

    drawGrid() {}

    drawArrows() {
        for (const arrow of this.board.getActiveArrows()) {
            const centerX = this.boardOffsetX + arrow.col * this.cellSize + this.cellSize / 2;
            const centerY = this.boardOffsetY + arrow.row * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35 * (arrow.squashStretch || 1);
            this.ctx.save(); this.ctx.translate(centerX, centerY); this.ctx.rotate(DIRECTIONS[arrow.direction].angle);
            const color = this.getElementColor(arrow.element); this.ctx.fillStyle = color;
            this.ctx.beginPath(); this.ctx.moveTo(0, -size); this.ctx.lineTo(size * 0.6, size * 0.4); this.ctx.lineTo(size * 0.2, size * 0.4); this.ctx.lineTo(size * 0.2, size); this.ctx.lineTo(-size * 0.2, size); this.ctx.lineTo(-size * 0.2, size * 0.4); this.ctx.lineTo(-size * 0.6, size * 0.4); this.ctx.closePath(); this.ctx.fill();
            if (arrow.element !== ELEMENTS.PLAIN) this.drawElementIndicator(arrow.element, size);
            if (arrow.isFrozen) { this.ctx.fillStyle = 'rgba(116, 185, 255, 0.5)'; this.ctx.beginPath(); this.ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = '#74b9ff'; this.ctx.lineWidth = 2; this.ctx.stroke(); }
            if (arrow.wasBlocked) { this.ctx.strokeStyle = '#ff4757'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2); this.ctx.stroke(); }
            this.ctx.restore();
        }
    }

    getElementColor(element) { 
        if (this.highContrast) {
            // High contrast: use pure white/black with patterns
            switch (element) {
                case ELEMENTS.FIRE: return '#ffffff';
                case ELEMENTS.WATER: return '#ffffff';
                case ELEMENTS.ICE: return '#ffffff';
                case ELEMENTS.ELECTRIC: return '#ffffff';
                default: return '#ffffff';
            }
        }
        switch (element) { case ELEMENTS.FIRE: return CONFIG.COLORS.FIRE; case ELEMENTS.WATER: return CONFIG.COLORS.WATER; case ELEMENTS.ICE: return CONFIG.COLORS.ICE; case ELEMENTS.ELECTRIC: return CONFIG.COLORS.ELECTRIC; default: return CONFIG.COLORS.PLAIN; } 
    }
drawElementIndicator(element, size) {
        const color = this.getElementColor(element); this.ctx.fillStyle = color;
        switch (element) {
            case ELEMENTS.FIRE: this.ctx.beginPath(); this.ctx.moveTo(0, -size * 0.2); this.ctx.bezierCurveTo(-size * 0.3, -size * 0.5, size * 0.3, -size * 0.5, 0, -size * 0.2); this.ctx.fill(); break;
            case ELEMENTS.WATER: this.ctx.beginPath(); this.ctx.moveTo(0, size * 0.3); this.ctx.bezierCurveTo(-size * 0.25, size * 0.1, -size * 0.25, -size * 0.2, 0, -size * 0.3); this.ctx.bezierCurveTo(size * 0.25, -size * 0.2, size * 0.25, size * 0.1, 0, size * 0.3); this.ctx.fill(); break;
            case ELEMENTS.ICE: this.ctx.beginPath(); for (let i = 0; i < 6; i++) { const angle = (Math.PI / 3) * i - Math.PI / 6; this.ctx.lineTo(Math.cos(angle) * size * 0.25, Math.sin(angle) * size * 0.25); } this.ctx.closePath(); this.ctx.fill(); break;
            case ELEMENTS.ELECTRIC: this.ctx.beginPath(); this.ctx.moveTo(0, -size * 0.3); this.ctx.lineTo(-size * 0.15, 0); this.ctx.lineTo(size * 0.1, 0); this.ctx.lineTo(0, size * 0.3); this.ctx.lineTo(size * 0.15, 0); this.ctx.lineTo(-size * 0.1, 0); this.ctx.closePath(); this.ctx.fill(); break;
        }
    }

    drawSelection() {
        if (this.selectedCell) { const x = this.boardOffsetX + this.selectedCell.col * this.cellSize; const y = this.boardOffsetY + this.selectedCell.row * this.cellSize; this.ctx.strokeStyle = '#00ffff'; this.ctx.lineWidth = 3; this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4); }
        if (this.hoveredCell && (!this.selectedCell || this.hoveredCell.row !== this.selectedCell.row || this.hoveredCell.col !== this.selectedCell.col)) { const x = this.boardOffsetX + this.hoveredCell.col * this.cellSize; const y = this.boardOffsetY + this.hoveredCell.row * this.cellSize; this.ctx.strokeStyle = 'rgba(255,255,255,0.5)'; this.ctx.lineWidth = 2; this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4); }
    }

    drawBossWarning() {
        const boss = this.bossManager.getBoss(); if (!boss) return;
        const centerX = this.canvas.width / this.dpr / 2; const centerY = this.boardOffsetY - 40;
        const pulse = Math.sin(performance.now() / 200) * 0.5 + 0.5;
        this.ctx.fillStyle = `rgba(255, 71, 87, ${0.8 + pulse * 0.2})`; this.ctx.font = \old \px system-ui\; this.ctx.textAlign = 'center'; this.ctx.fillText('⚠ ' + boss.getWarningText() + ' ⚠', centerX, centerY);
        this.ctx.strokeStyle = `rgba(255, 71, 87, ${0.5 + pulse * 0.5})`; this.ctx.lineWidth = 4; this.ctx.strokeRect(this.boardOffsetX - 4, this.boardOffsetY - 4, this.board.size * this.cellSize + 8, this.board.size * this.cellSize + 8);
    }
// ========== SAVE/LOAD ==========
    get saveData() { return JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}'); }

    loadGame() {
        if (settingsManager.get('anonymousMode')) return;
        const data = this.saveData;
        if (data) { this.currentLevel = data.currentLevel || 1; this.score = data.totalScore || 0; this.totalPlayTime = data.totalPlaytime || 0; this.undoCount = data.undoCount || CONFIG.RETRY_FREE_COUNT; if (data.elementLevels) { Object.entries(data.elementLevels).forEach(([el, lvl]) => { while (getElementLevel(el) < lvl) upgradeElement(el); }); } crystalManager.load(data); achievementManager.load(data); analytics.load(); }
    }

    saveGame() {
        if (settingsManager.get('anonymousMode')) return;
        const data = { version: CONFIG.SAVE_VERSION, checksum: '', currentLevel: this.currentLevel, totalScore: this.score, bestTimes: this.saveData.bestTimes || {}, starRatings: this.saveData.starRatings || {}, elementLevels: { FIRE: getElementLevel(ELEMENTS.FIRE), WATER: getElementLevel(ELEMENTS.WATER), ICE: getElementLevel(ELEMENTS.ICE), ELECTRIC: getElementLevel(ELEMENTS.ELECTRIC) }, crystals: crystalManager.crystals, unlockedModes: this.saveData.unlockedModes || ['campaign'], achievements: Array.from(achievementManager.unlocked), settings: settingsManager.getSaveData().settings, dailyStreak: this.saveData.dailyStreak || { lastPlayed: '', count: 0 }, totalReactionsTriggered: this.reactionsTriggered, totalPlaytime: this.totalPlayTime, firstSessionComplete: this.saveData.firstSessionComplete || false, lastLevelState: this.lastLevelState, lastPlayTime: Date.now() };
        data.checksum = securityManager.calculateChecksum(data);
        try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data)); } catch (e) { if (e.name === 'QuotaExceededError') this.handleStorageFull(); else console.warn('Save failed:', e); }
    }

    handleStorageFull() {
        try {
            const analyticsData = localStorage.getItem('arrowEscape_analytics');
            if (analyticsData) { localStorage.removeItem('arrowEscape_analytics'); }
            this.saveGame();
        } catch (e) {
            if (window.ui) window.ui.showToast(t('storage_full') || 'Penyimpanan penuh!');
        }
    }

    checkAutoResume() {
        const data = this.saveData;
        if (!data.lastPlayTime) return false;
        const hoursSince = (Date.now() - data.lastPlayTime) / 3600000;
        if (hoursSince < 24 && data.lastLevelState && data.currentLevel > 1) {
            return true;
        }
        return false;
    }

    promptAutoResume() {
        if (!this.checkAutoResume()) return false;
        const data = this.saveData;
        const msg = `${t('resume_level')} ${data.currentLevel}?`;
        if (confirm(msg)) {
            this.deserializeLevelState(data.lastLevelState);
            this.startLevel(data.currentLevel);
            return true;
        }
        return false;
    }

    confirmSkipLevel() {
        const cost = CONFIG.REWARD_SKIP_COST;
        if (!crystalManager.canAfford(cost)) {
            ui.showToast(t('not_enough_crystals'));
            return false;
        }
        const msg = t('confirm_skip', { level: this.currentLevel, cost });
        if (confirm(msg)) {
            crystalManager.skipLevel();
            return true;
        }
        return false;
    }

    saveLevelState() { if (settingsManager.get('anonymousMode')) return; this.lastLevelState = this.serializeLevelState(); }

    serializeLevelState() { return { board: this.board.serialize(), score: this.score, combo: this.combo, mistakes: this.mistakes, levelStartTime: this.levelStartTime, undoCount: this.undoCount, hintsUsed: this.hintsUsed, reactionsTriggered: this.reactionsTriggered }; }

    deserializeLevelState(state) { this.board = Board.deserialize(state.board); this.score = state.score; this.combo = state.combo; this.mistakes = state.mistakes; this.levelStartTime = state.levelStartTime; this.undoCount = state.undoCount; this.hintsUsed = state.hintsUsed; this.reactionsTriggered = state.reactionsTriggered; this.resizeCanvas(); }

    getHUDData() { return { level: this.currentLevel === 999 ? '∞' : this.currentLevel === 0 ? 'Daily' : this.currentLevel, score: this.score, crystals: crystalManager.crystals, time: performance.now() - this.levelStartTime }; }

    addUndo(count = 1) { this.undoCount += count; }
    addRetry() { this.undoCount = Math.min(this.undoCount + 1, CONFIG.RETRY_FREE_COUNT); }
    resetGame() { localStorage.removeItem(CONFIG.SAVE_KEY); location.reload(); }

    // Gameplay Skip Level (via crystals)
    skipLevel() {
        if (this.currentLevel < CONFIG.CAMPAIGN_LEVELS) {
            this.startLevel(this.currentLevel + 1);
            ui.showToast(`${t('level')} ${this.currentLevel}`);
            analytics.track('level_skipped', { level: this.currentLevel - 1 });
        }
    }

    // Developer Mode: Skip Level (no cost)
    debugSkipLevel() {
        if (this.currentLevel < CONFIG.CAMPAIGN_LEVELS) {
            this.startLevel(this.currentLevel + 1);
            ui.showToast('Level skipped (Debug)');
        }
    }

    // Web Share API with fallback
    async shareScore() {
        const text = i18n.t('share_text', { score: this.score });
        const url = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Arrow Escape Elemental', text, url });
                analytics.track('share_clicked', { method: 'web_share_api' });
                return;
            } catch (e) {
                if (e.name !== 'AbortError') console.warn('Web Share failed:', e);
            }
        }
        
        // Fallback: copy to clipboard + download canvas as image
        try {
            await navigator.clipboard.writeText(`${text} ${url}`);
            ui.showToast('Copied to clipboard!');
        } catch (e) {
            // Final fallback: download canvas
            const link = document.createElement('a');
            link.download = `arrow-escape-score-${this.score}.png`;
            link.href = this.canvas.toDataURL('image/png');
            link.click();
            ui.showToast('Image downloaded!');
        }
        analytics.track('share_clicked', { method: 'fallback' });
    }

    // ========== ACCESSIBILITY ==========
    announce(message) {
        const liveRegion = document.getElementById('toasts-container');
        if (liveRegion) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            liveRegion.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        }
    }

    announceArrowExit(arrow) {
        const elementNames = { FIRE: 'Fire', WATER: 'Water', ICE: 'Ice', ELECTRIC: 'Electric', PLAIN: 'Plain' };
        this.announce(`${elementNames[arrow.element] || 'Arrow'} exited`);
    }

    announceCombo(combo) {
        if (combo % CONFIG.COMBO_THRESHOLD === 0) {
            this.announce(`Combo ${combo}`);
        }
    }

    announceReaction(type) {
        const names = { STEAM: 'Steam reaction', CONDUCTOR: 'Conductor reaction', DEEP_FREEZE: 'Deep freeze reaction', EXPLOSION: 'Explosion reaction' };
        this.announce(names[type] || `Reaction: ${type}`);
    }

    announceLevelComplete(stars) {
        this.announce(`Level complete. ${stars} stars earned`);
    }

    announceDeadend() {
        this.announce('Dead end. No moves possible');
    }

    announceBossAttack(attack) {
        this.announce(`Boss attack: ${attack}`);
    }

    // Focus management for modals
    trapFocus(modal) {
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        modal._focusTrap = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        modal.addEventListener('keydown', modal._focusTrap);
        firstElement?.focus();
    }

    releaseFocus(modal) {
        if (modal._focusTrap) {
            modal.removeEventListener('keydown', modal._focusTrap);
            delete modal._focusTrap;
        }
    }

    startLevel(levelNum) {
        this.mode = 'campaign';
        this.currentLevel = levelNum;
        this.isBossLevel = CONFIG.BOSS_LEVELS.includes(levelNum);
        
        const levelData = this.isBossLevel ? generateBossLevel(levelNum) : generateLevel(levelNum);
        this.board = levelData;
        this.levelData = levelData;
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.mistakes = 0;
        this.levelStartTime = performance.now();
        this.undoCount = CONFIG.RETRY_FREE_COUNT;
        this.hintsUsed = 0;
        this.reactionsTriggered = 0;
        this.undoStack = [];
        this.trauma = 0;
        this.hitStopTimer = 0;
        
        if (this.isBossLevel) {
            this.bossManager.spawnBoss(levelNum);
        }
        
        this.state = 'playing';
        this.saveLevelState();
        
        ui.hideAllModals();
        document.getElementById('game-header').classList.remove('hidden');
        document.getElementById('game-footer').classList.remove('hidden');
        ui.updateHUD(this.getHUDData());
        
        if (this.isBossLevel) {
            audioManager.switchToBossMusic();
        } else {
            audioManager.switchToAmbientMusic();
        }
        
        adsManager.gameplayStart();
        analytics.track('level_start', { level: levelNum, mode: this.mode });
    }

    startMode(mode) {
        this.mode = mode;
        
        switch (mode) {
            case 'endless':
                this.currentLevel = 999;
                this.board = generateEndlessLevel();
                break;
            case 'daily':
                this.currentLevel = 0;
                this.board = generateDailyChallenge();
                break;
            case 'boss_rush':
                this.currentLevel = -1;
                this.board = generateBossLevel(10); // Start with first boss
                break;
            default:
                this.currentLevel = 1;
                this.board = generateLevel(1);
        }
        
        this.isBossLevel = mode === 'boss_rush' || mode === 'daily'; // Daily can have elements
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.mistakes = 0;
        this.levelStartTime = performance.now();
        this.undoCount = mode === 'endless' ? 0 : CONFIG.RETRY_FREE_COUNT;
        this.hintsUsed = 0;
        this.reactionsTriggered = 0;
        this.undoStack = [];
        this.trauma = 0;
        this.hitStopTimer = 0;
        
        if (mode === 'boss_rush') {
            this.bossManager.spawnBoss(10);
        }
        
        this.state = 'playing';
        this.saveLevelState();
        
        ui.hideAllModals();
        document.getElementById('game-header').classList.remove('hidden');
        document.getElementById('game-footer').classList.remove('hidden');
        ui.updateHUD(this.getHUDData());
        
        if (this.isBossLevel) {
            audioManager.switchToBossMusic();
        } else {
            audioManager.switchToAmbientMusic();
        }
        
        adsManager.gameplayStart();
        analytics.track('level_start', { level: this.currentLevel, mode });
    }

    restartLevel() {
        if (this.mode === 'campaign') {
            this.startLevel(this.currentLevel);
        } else {
            this.startMode(this.mode);
        }
    }

    quitToMenu() {
        this.state = 'menu';
        adsManager.gameplayStop();
        audioManager.stopMusic();
        ui.showMainMenu();
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            adsManager.gameplayStop();
            audioManager.stopMusic();
            ui.showModal('pause-menu');
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            audioManager.switchToAmbientMusic();
            adsManager.gameplayStart();
            ui.hideAllModals();
        }
    }

    reviveBoss() {
        if (this.isBossLevel && this.bossManager.getBoss()) {
            const boss = this.bossManager.getBoss();
            boss.hp = boss.maxHp;
            boss.defeated = false;
            this.bossManager.active = true;
            this.state = 'playing';
            ui.hideAllModals();
            audioManager.switchToBossMusic();
            adsManager.gameplayStart();
        }
    }
}

// Auto-start
document.addEventListener('DOMContentLoaded', async () => { const game = new Game(); window.game = game; await game.init(); });
if (typeof window !== 'undefined') { window.Game = Game; }