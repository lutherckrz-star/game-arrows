/**
 * Arrow Escape — Elemental
 * Menu System - Main Menu, Level Select, Mode Select, Pause Menu
 */

import { CONFIG } from './config.js';
import { i18n, t } from './i18n.js';

export class MenuManager {
    constructor() {
        this.currentMenu = 'main';
        this.selectedLevel = 1;
    }

    init() {
        this.createMainMenu();
        this.createLevelSelect();
        this.createModeSelect();
        this.createPauseMenu();
        this.bindEvents();
    }

    createMainMenu() {
        const container = document.getElementById('modals-container');
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.className = 'modal';
        menu.innerHTML = `
            <div class="modal-content">
                <h1 data-i18n="play">Play</h1>
                <div class="menu-buttons">
                    <button id="btn-continue" class="menu-btn primary" data-i18n="play"></button>
                    <button id="btn-level-select" class="menu-btn" data-i18n="level_select"></button>
                    <button id="btn-modes" class="menu-btn" data-i18n="modes"></button>
                    <button id="btn-element-lab" class="menu-btn" data-i18n="element_lab"></button>
                    <button id="btn-achievements" class="menu-btn" data-i18n="achievements"></button>
                    <button id="btn-settings" class="menu-btn icon-btn" aria-label="Settings">
                        <img src="assets/images/icon_settings.png" alt="" class="icon">
                    </button>
                </div>
                <div class="menu-info">
                    <span id="menu-crystals" class="crystal-display">💎 0</span>
                </div>
            </div>
        `;
        container.appendChild(menu);
    }

    createLevelSelect() {
        const container = document.getElementById('modals-container');
        const menu = document.createElement('div');
        menu.id = 'level-select';
        menu.className = 'modal hidden';
        menu.innerHTML = `
            <div class="modal-content">
                <header class="modal-header">
                    <h2 data-i18n="level_select">Levels</h2>
                    <button id="btn-level-back" class="icon-btn" aria-label="Back">
                        <img src="assets/images/icon_undo.png" alt="" class="icon">
                    </button>
                </header>
                <div id="level-grid" class="level-grid"></div>
            </div>
        `;
        container.appendChild(menu);
    }

    createModeSelect() {
        const container = document.getElementById('modals-container');
        const menu = document.createElement('div');
        menu.id = 'mode-select';
        menu.className = 'modal hidden';
        menu.innerHTML = `
            <div class="modal-content">
                <header class="modal-header">
                    <h2 data-i18n="modes">Modes</h2>
                    <button id="btn-mode-back" class="icon-btn" aria-label="Back">
                        <img src="assets/images/icon_undo.png" alt="" class="icon">
                    </button>
                </header>
                <div class="mode-grid">
                    <div class="mode-card" data-mode="campaign">
                        <h3 data-i18n="play">Campaign</h3>
                        <p>50 levels with elemental progression</p>
                    </div>
                    <div class="mode-card" data-mode="endless" id="mode-endless">
                        <h3 data-i18n="endless">Endless</h3>
                        <p data-i18n="unlock_endless">Unlocks after Level 50</p>
                    </div>
                    <div class="mode-card" data-mode="daily" id="mode-daily">
                        <h3 data-i18n="daily_challenge">Daily Challenge</h3>
                        <p data-i18n="unlock_daily">Unlocks after Level 10</p>
                    </div>
                    <div class="mode-card" data-mode="boss_rush" id="mode-boss-rush">
                        <h3 data-i18n="boss_rush">Boss Rush</h3>
                        <p data-i18n="unlock_boss_rush">Unlocks after Final Boss</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(menu);
    }

    createPauseMenu() {
        const container = document.getElementById('modals-container');
        const menu = document.createElement('div');
        menu.id = 'pause-menu';
        menu.className = 'modal hidden';
        menu.innerHTML = `
            <div class="modal-content">
                <h2 data-i18n="pause">Paused</h2>
                <div class="menu-buttons">
                    <button id="btn-resume" class="menu-btn primary" data-i18n="resume"></button>
                    <button id="btn-restart" class="menu-btn" data-i18n="restart"></button>
                    <button id="btn-pause-settings" class="menu-btn" data-i18n="settings"></button>
                    <button id="btn-quit-menu" class="menu-btn danger" data-i18n="back_to_menu"></button>
                </div>
            </div>
        `;
        container.appendChild(menu);
    }
bindEvents() {
        document.getElementById('btn-continue')?.addEventListener('click', () => this.startGame());
        document.getElementById('btn-level-select')?.addEventListener('click', () => this.showLevelSelect());
        document.getElementById('btn-modes')?.addEventListener('click', () => this.showModeSelect());
        document.getElementById('btn-element-lab')?.addEventListener('click', () => this.showElementLab());
        document.getElementById('btn-achievements')?.addEventListener('click', () => this.showAchievements());
        document.getElementById('btn-settings')?.addEventListener('click', () => this.showSettings());
        document.getElementById('btn-level-back')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-mode-back')?.addEventListener('click', () => this.showMainMenu());
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => this.startMode(card.dataset.mode));
        });
        document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-restart')?.addEventListener('click', () => this.restartLevel());
        document.getElementById('btn-pause-settings')?.addEventListener('click', () => this.showSettings());
        document.getElementById('btn-quit-menu')?.addEventListener('click', () => this.quitToMenu());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.togglePause(); });
    }

    showMainMenu() { this.hideAllModals(); document.getElementById('main-menu').classList.remove('hidden'); this.currentMenu = 'main'; this.updateContinueButton(); i18n.applyLanguage(); }
    showLevelSelect() { this.hideAllModals(); document.getElementById('level-select').classList.remove('hidden'); this.currentMenu = 'level_select'; this.renderLevelGrid(); i18n.applyLanguage(); }
    showModeSelect() { this.hideAllModals(); document.getElementById('mode-select').classList.remove('hidden'); this.currentMenu = 'mode_select'; this.updateModeLocks(); i18n.applyLanguage(); }
    showPauseMenu() { this.hideAllModals(); document.getElementById('pause-menu').classList.remove('hidden'); this.currentMenu = 'pause'; }
    hideAllModals() { document.querySelectorAll('#modals-container > .modal').forEach(m => m.classList.add('hidden')); }

    updateContinueButton() { const btn = document.getElementById('btn-continue'); const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}'); btn.textContent = (save.currentLevel && save.currentLevel > 1) ? `${t('play')} (Level ${save.currentLevel})` : t('play'); }

    updateModeLocks() { const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}'); const currentLevel = save.currentLevel || 1; document.getElementById('mode-endless').classList.toggle('locked', currentLevel < CONFIG.ENDLESS_UNLOCK_LEVEL); document.getElementById('mode-daily').classList.toggle('locked', currentLevel < CONFIG.DAILY_UNLOCK_LEVEL); document.getElementById('mode-boss-rush').classList.toggle('locked', currentLevel < CONFIG.BOSS_RUSH_UNLOCK_LEVEL); }

    renderLevelGrid() { const grid = document.getElementById('level-grid'); const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}'); const currentLevel = save.currentLevel || 1; const starRatings = save.starRatings || {}; grid.innerHTML = ''; for (let i = 1; i <= CONFIG.CAMPAIGN_LEVELS; i++) { const btn = document.createElement('button'); btn.className = 'level-btn'; btn.dataset.level = i; const stars = starRatings[i] || 0; const isLocked = i > currentLevel; btn.innerHTML = `<span class="level-number">${i}</span><div class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>${isLocked ? '<span class="lock-icon">🔒</span>' : ''}`; if (isLocked) btn.classList.add('locked'); if (stars > 0) btn.classList.add('completed'); btn.addEventListener('click', () => { if (!isLocked) this.startLevel(i); }); grid.appendChild(btn); } }

    startGame() { const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}'); this.startLevel(save.currentLevel || 1); }
    startLevel(levelNum) { this.hideAllModals(); if (window.game) window.game.startLevel(levelNum); this.currentMenu = 'game'; }
    startMode(mode) { const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}'); const currentLevel = save.currentLevel || 1; if (mode === 'endless' && currentLevel < CONFIG.ENDLESS_UNLOCK_LEVEL) return; if (mode === 'daily' && currentLevel < CONFIG.DAILY_UNLOCK_LEVEL) return; if (mode === 'boss_rush' && currentLevel < CONFIG.BOSS_RUSH_UNLOCK_LEVEL) return; this.hideAllModals(); if (window.game) window.game.startMode(mode); }

    showElementLab() { this.hideAllModals(); if (window.ui) window.ui.showElementLab(); }
    showAchievements() { this.hideAllModals(); if (window.ui) window.ui.showAchievements(); }
    showSettings() { this.hideAllModals(); if (window.ui) window.ui.showSettings(); }

    togglePause() { if (this.currentMenu === 'game' && window.game && !window.game.isPaused) { window.game.pause(); this.showPauseMenu(); } else if (this.currentMenu === 'pause') { this.resumeGame(); } }
    resumeGame() { this.hideAllModals(); if (window.game) window.game.resume(); this.currentMenu = 'game'; }
    restartLevel() { this.hideAllModals(); if (window.game) window.game.restartLevel(); this.currentMenu = 'game'; }
    quitToMenu() { if (confirm(t('exit_confirm'))) { this.hideAllModals(); if (window.game) window.game.quitToMenu(); this.showMainMenu(); } }
}

export const menuManager = new MenuManager();
if (typeof window !== 'undefined') { window.MenuManager = MenuManager; window.menuManager = menuManager; }