/**
 * Arrow Escape — Elemental
 * UI Manager - Modals, toasts, overlays, HUD
 */

import { CONFIG } from './config.js';
import { i18n, t } from './i18n.js';

export class UIManager {
    constructor() {
        this.toasts = [];
        this.loadingVisible = false;
        this.landscapeWarningVisible = false;
    }

    init() {
        this.bindEvents();
        i18n.subscribe(() => this.onLanguageChange());
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.hideModal(e.target.id);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeTopModal();
        });
    }

    onLanguageChange() {
        if (this.currentModal) this.renderModalContent(this.currentModal);
    }

    showToast(message, duration = CONFIG.TOAST_DURATION) {
        const container = document.getElementById('toasts-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
    }

    showLoading(text = 'Loading...') {
        document.getElementById('loading-overlay').classList.remove('hidden');
        document.getElementById('loading-text').textContent = text;
        this.loadingVisible = true;
    }

    hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); this.loadingVisible = false; }

    checkLandscape() {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        const isShort = window.innerHeight < 500;
        const warning = document.getElementById('landscape-warning');
        if (isLandscape && isShort) { warning.classList.remove('hidden'); this.landscapeWarningVisible = true; if (window.game) window.game.pause(); }
        else { warning.classList.add('hidden'); this.landscapeWarningVisible = false; }
    }

    currentModal = null;

    showModal(modalId) {
        this.hideAllModals();
        const modal = document.getElementById(modalId);
        if (modal) { modal.classList.remove('hidden'); this.currentModal = modalId; this.renderModalContent(modalId); const btn = modal.querySelector('button'); if (btn) btn.focus(); }
    }

    hideModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.add('hidden'); if (this.currentModal === modalId) this.currentModal = null; }
    hideAllModals() { document.querySelectorAll('#modals-container > .modal').forEach(m => m.classList.add('hidden')); this.currentModal = null; }
    closeTopModal() { if (this.currentModal) this.hideModal(this.currentModal); }
    renderModalContent(modalId) { i18n.applyLanguage(); }
showLevelComplete(data) {
        const modal = document.getElementById('level-complete-modal');
        if (!modal) return;
        modal.querySelector('[data-i18n="level_complete"]').textContent = t('level_complete');
        modal.querySelector('.stars').textContent = '★'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
        modal.querySelector('.score').textContent = `${t('score')}: ${data.score}`;
        modal.querySelector('.crystals').textContent = `+${data.crystals} ${t('crystals')}`;
        modal.querySelector('.time').textContent = `${t('time')}: ${this.formatTime(data.time)}`;
        if (data.noMistake) modal.querySelector('.no-mistake').textContent = `+${CONFIG.CRYSTAL_NO_MISTAKE} ${t('no_mistake_bonus')}`;
        if (data.speedBonus) modal.querySelector('.speed-bonus').textContent = `+${CONFIG.CRYSTAL_SPEED_BONUS} ${t('speed_bonus')}`;
        this.showModal('level-complete-modal');
    }

    showLevelFailed(data) { this.showModal('level-failed-modal'); }

    showElementLab() { this.showModal('element-lab-modal'); this.renderElementLab(); }

    renderElementLab() {
        const container = document.getElementById('element-lab-content');
        if (!container) return;
        const elements = ['FIRE', 'WATER', 'ICE', 'ELECTRIC'];
        container.innerHTML = elements.map(el => {
            const level = window.getElementLevel ? window.getElementLevel(el) : 1;
            const maxLevel = CONFIG.ELEMENT_LEVEL_MAX;
            const cost = CONFIG.CRYSTAL_PER_UPGRADE;
            const canUpgrade = level < maxLevel && window.crystalManager?.canAfford(cost);
            return `<div class="element-upgrade-card"><div class="element-icon" style="color: var(--color-${el.toLowerCase()})">${el[0]}</div><h4>${el}</h4><div class="level-display">${t('current_level')} ${level} / ${maxLevel}</div><button class="upgrade-btn" data-element="${el}" ${!canUpgrade ? 'disabled' : ''}>${level >= maxLevel ? t('max_level') : `${t('upgrade')} (${cost} 💎)`}</button></div>`;
        }).join('');
        container.querySelectorAll('.upgrade-btn').forEach(btn => { btn.addEventListener('click', () => { const result = window.crystalManager?.upgradeElement(btn.dataset.element); if (result?.success) this.renderElementLab(); }); });
    }

    showAchievements() { this.showModal('achievements-modal'); this.renderAchievements(); }

    renderAchievements() {
        const container = document.getElementById('achievements-list');
        if (!container || !window.achievementManager) return;
        const lang = i18n.getLang();
        const achievements = window.achievementManager.getAllForUI(lang);
        container.innerHTML = achievements.map(a => `<div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}"><span class="achievement-icon">${a.icon}</span><div class="achievement-info"><h4>${a.name}</h4><p>${a.desc}</p></div><span class="achievement-status">${a.unlocked ? '✓' : '🔒'}</span></div>`).join('');
    }

    showSettings() { this.showModal('settings-modal'); }

    updateHUD(data) {
        const levelEl = document.getElementById('level-display');
        const scoreEl = document.getElementById('score-display');
        const crystalEl = document.getElementById('crystal-count');
        const timerEl = document.getElementById('timer-display');
        if (levelEl) levelEl.textContent = `${t('level')} ${data.level}`;
        if (scoreEl) scoreEl.textContent = `${t('score')}: ${data.score}`;
        if (crystalEl) crystalEl.textContent = data.crystals;
        if (timerEl) timerEl.textContent = this.formatTime(data.time);
    }

    showBossTimer(remaining) { const bossTimer = document.getElementById('boss-timer'); if (bossTimer) { bossTimer.textContent = `Boss: ${this.formatTime(remaining)}`; bossTimer.classList.remove('hidden'); } }
    hideBossTimer() { document.getElementById('boss-timer')?.classList.add('hidden'); }

    formatTime(ms) { const totalSec = Math.floor(ms / 1000); const min = Math.floor(totalSec / 60); const sec = totalSec % 60; return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`; }

    showReaction(reactionName) { const lang = i18n.getLang(); const names = { STEAM: { en: 'STEAM!', id: 'UAP!' }, CONDUCTOR: { en: 'CONDUCTOR!', id: 'KONDUKTOR!' }, DEEP_FREEZE: { en: 'DEEP FREEZE!', id: 'BEKU TOTAL!' }, EXPLOSION: { en: 'EXPLOSION!', id: 'LEDAKAN!' } }; this.showToast(names[reactionName]?.[lang] || reactionName, 2000); }

    showCombo(combo) { this.showToast(`${t('combo')}${combo}!`, 1000); }

    showDeadend() { this.showModal('deadend-modal'); }
}

export const ui = new UIManager();
if (typeof window !== 'undefined') { window.UIManager = UIManager; window.ui = ui; }