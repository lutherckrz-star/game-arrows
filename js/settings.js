/**
 * Arrow Escape — Elemental
 * Settings Manager - Game settings persistence & UI
 */

import { CONFIG } from './config.js';
import { i18n, t } from './i18n.js';

export class SettingsManager {
    constructor() {
        this.settings = {
            sound: true,
            music: true,
            vibration: true,
            colorblind: false,
            reducedMotion: false,
            language: 'en',
            anonymousMode: false
        };
    }

    init() {
        this.load();
        this.applySettings();
        this.bindEvents();
    }

    load() {
        try {
            const saved = localStorage.getItem('arrowEscape_settings');
            if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) };
        } catch (e) { console.warn('Failed to load settings:', e); }
    }

    save() {
        try { localStorage.setItem('arrowEscape_settings', JSON.stringify(this.settings)); }
        catch (e) { console.warn('Failed to save settings:', e); }
    }

    get(key) { return this.settings[key]; }

    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.applySetting(key, value);
        if (window.analytics) window.analytics.track('settings_changed', { key, value });
    }

    applySettings() {
        Object.entries(this.settings).forEach(([key, value]) => this.applySetting(key, value));
    }

    applySetting(key, value) {
        switch (key) {
            case 'sound': if (window.audioManager) window.audioManager.setSFXEnabled(value); break;
            case 'music': if (window.audioManager) window.audioManager.setMusicEnabled(value); break;
            case 'colorblind': document.body.classList.toggle('colorblind', value); break;
            case 'reducedMotion': document.body.classList.toggle('reduced-motion', value); break;
            case 'language': if (i18n.getLang() !== value) i18n.setLang(value); { const sel = document.getElementById('setting-language'); if (sel) sel.value = value; } break;
            case 'anonymousMode': this.applyAnonymousMode(value); break;
        }
        const toggle = document.getElementById(`setting-${key}`);
        if (toggle) toggle.checked = value;
    }

    applyAnonymousMode(enabled) {
        if (enabled) {
            // Clear all localStorage except settings
            const settings = localStorage.getItem('arrowEscape_settings');
            localStorage.clear();
            if (settings) localStorage.setItem('arrowEscape_settings', settings);
            if (window.ui) window.ui.showToast('Anonymous mode: progress stored in memory only');
        } else {
            if (window.ui) window.ui.showToast('Anonymous mode disabled: progress will be saved');
        }
    }
bindEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-setting]')) this.set(e.target.dataset.setting, e.target.checked);
        });
        const langSelect = document.getElementById('setting-language');
        if (langSelect) { langSelect.value = this.settings.language; langSelect.addEventListener('change', (e) => this.set('language', e.target.value)); }
        const resetBtn = document.getElementById('btn-reset-progress');
        if (resetBtn) resetBtn.addEventListener('click', () => this.showResetConfirm());
        const exportBtn = document.getElementById('btn-export-save');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportSave());
        const importBtn = document.getElementById('btn-import-save');
        if (importBtn) importBtn.addEventListener('click', () => this.importSave());
        const deleteBtn = document.getElementById('btn-delete-data');
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.showDeleteConfirm());
        const installBtn = document.getElementById('btn-install-game');
        if (installBtn) installBtn.addEventListener('click', () => this.installGame());
    }

    showResetConfirm() { const input = prompt(t('confirm_reset')); if (input === 'RESET') this.resetProgress(); }

    resetProgress() {
        localStorage.removeItem(CONFIG.SAVE_KEY);
        localStorage.removeItem('arrowEscape_skipsUsed');
        localStorage.removeItem('arrowEscape_dailyClaim');
        if (window.game) window.game.resetGame();
        if (window.ui) window.ui.showToast(t('reload'));
        setTimeout(() => location.reload(), 1000);
    }

    exportSave() {
        const save = localStorage.getItem(CONFIG.SAVE_KEY);
        if (!save) return;
        const blob = new Blob([save], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `arrow-escape-save-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
    }

    importSave() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try { const data = JSON.parse(evt.target.result); localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data)); if (window.ui) window.ui.showToast('Save imported! Reloading...'); setTimeout(() => location.reload(), 1000); }
                catch (err) { if (window.ui) window.ui.showToast('Invalid save file!'); }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    showDeleteConfirm() {
        if (confirm('Delete ALL data? This cannot be undone!')) {
            if (confirm('Are you absolutely sure?')) this.deleteAllData();
        }
    }

    deleteAllData() {
        localStorage.clear();
        if (window.ui) window.ui.showToast('All data deleted. Reloading...');
        setTimeout(() => location.reload(), 1000);
    }

    installGame() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted' && window.ui) window.ui.showToast('Game installed!');
                window.deferredPrompt = null;
            });
        }
    }

    getSaveData() { return { settings: this.settings }; }
}

export const settingsManager = new SettingsManager();
if (typeof window !== 'undefined') { window.SettingsManager = SettingsManager; window.settingsManager = settingsManager; }