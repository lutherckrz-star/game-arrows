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
        this.bindEvents();
    }
bindEvents() {
        // Main menu buttons
        document.getElementById('btn-continue')?.addEventListener('click', () => this.startGame());
        document.getElementById('btn-level-select')?.addEventListener('click', () => this.showLevelSelect());
        document.getElementById('btn-modes')?.addEventListener('click', () => this.showModeSelect());
        document.getElementById('btn-element-lab')?.addEventListener('click', () => this.showElementLab());
        document.getElementById('btn-achievements')?.addEventListener('click', () => this.showAchievements());
        document.getElementById('btn-settings')?.addEventListener('click', () => this.showSettings());
        
        // Back buttons
        document.getElementById('btn-level-back')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-mode-back')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-lab-back')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-achievements-back')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-settings-back')?.addEventListener('click', () => this.showMainMenu());
        
        // Mode cards - use buttons for accessibility
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => this.startMode(card.dataset.mode));
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this.startMode(card.dataset.mode); });
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
        });
        
        // Pause menu buttons
        document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-restart')?.addEventListener('click', () => this.restartLevel());
        document.getElementById('btn-pause-settings')?.addEventListener('click', () => this.showSettings());
        document.getElementById('btn-quit-menu')?.addEventListener('click', () => this.quitToMenu());
        
        // Other modal buttons
        document.getElementById('btn-next-level')?.addEventListener('click', () => this.nextLevel());
        document.getElementById('btn-level-complete-menu')?.addEventListener('click', () => this.backToMenu());
        document.getElementById('btn-retry-free')?.addEventListener('click', () => this.retryLevel());
        document.getElementById('btn-retry-ad')?.addEventListener('click', () => this.showRewardedRetry());
        document.getElementById('btn-failed-menu')?.addEventListener('click', () => this.backToMenu());
        document.getElementById('btn-deadend-undo')?.addEventListener('click', () => this.undoMove());
        document.getElementById('btn-deadend-restart')?.addEventListener('click', () => this.restartLevel());
        document.getElementById('btn-deadend-menu')?.addEventListener('click', () => this.backToMenu());
        
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
    startMode(mode) {
        const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}');
        const currentLevel = save.currentLevel || 1;
        const unlockMap = { endless: CONFIG.ENDLESS_UNLOCK_LEVEL, daily: CONFIG.DAILY_UNLOCK_LEVEL, boss_rush: CONFIG.BOSS_RUSH_UNLOCK_LEVEL };
        const need = unlockMap[mode];
        if (need !== undefined && currentLevel < need) {
            if (window.ui) window.ui.showToast(`${t('locked')} — ${t('level')} ${need}`);
            return;
        }
        this.hideAllModals();
        if (window.game) window.game.startMode(mode);
    }

    showElementLab() { this.hideAllModals(); if (window.ui) window.ui.showElementLab(); }
    showAchievements() { this.hideAllModals(); if (window.ui) window.ui.showAchievements(); }
    showSettings() { this.hideAllModals(); if (window.ui) window.ui.showSettings(); }

    togglePause() {
        const state = window.game?.state;
        if (state === 'playing') { window.game.pause(); this.showPauseMenu(); }
        else if (state === 'paused') { this.resumeGame(); }
    }
    resumeGame() { this.hideAllModals(); if (window.game) window.game.resume(); this.currentMenu = 'game'; }
    restartLevel() { this.hideAllModals(); if (window.game) window.game.restartLevel(); this.currentMenu = 'game'; }
    
    nextLevel() {
        this.hideAllModals();
        if (window.game && window.game.currentLevel < CONFIG.CAMPAIGN_LEVELS) {
            window.game.startLevel(window.game.currentLevel + 1);
            this.currentMenu = 'game';
        } else {
            this.backToMenu();
        }
    }
    backToMenu() { this.hideAllModals(); if (window.game) window.game.quitToMenu(); this.showMainMenu(); }
    undoMove() { if (window.game) window.game.undo(); }
    
    showRewardedRetry() { if (window.adsManager) window.adsManager.showRewardedWithLoading('retry', (success) => { if (success && window.game) window.game.addRetry(); }); }
    
    quitToMenu() { if (confirm(t('exit_confirm'))) { this.hideAllModals(); if (window.game) window.game.quitToMenu(); this.showMainMenu(); } }
}

export const menuManager = new MenuManager();
if (typeof window !== 'undefined') { window.MenuManager = MenuManager; window.menuManager = menuManager; }