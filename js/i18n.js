/**
 * Arrow Escape — Elemental
 * Internationalization System - Core only (full translations loaded from JSON)
 */

export class I18n {
    constructor() {
        this.lang = 'en';
        this.translations = {};
        this.listeners = [];
    }

    async init() {
        // Load translations from JSON
        try {
            const response = await fetch('assets/i18n.json');
            this.translations = await response.json();
        } catch (e) {
            console.warn('Failed to load i18n.json, using fallback');
            this.translations = this.getFallbackTranslations();
        }

        // Detect language (SDK may not be initialized yet)
        const savedLang = localStorage.getItem('arrowEscape_lang');
        if (savedLang && this.translations[savedLang]) {
            this.lang = savedLang;
        } else {
            // Safe SDK access - may not be initialized yet
            let cgLang = null;
            try {
                cgLang = window.CrazyGames?.SDK?.user?.systemInfo?.locale;
            } catch (e) {
                // SDK not ready, ignore
            }
            if (cgLang && cgLang.startsWith('id')) this.lang = 'id';
            else {
                const browserLang = navigator.language || navigator.userLanguage;
                if (browserLang.startsWith('id')) this.lang = 'id';
            }
        }
        this.applyLanguage();
    }

    getFallbackTranslations() {
        return {
            en: { play: 'Play', level_select: 'Levels', settings: 'Settings', level: 'Level', score: 'Score', crystals: 'Crystals', pause: 'Pause', resume: 'Resume', retry: 'Retry', back_to_menu: 'Back to Menu', level_complete: 'Level Complete!', level_failed: 'Level Failed', boss_warning: 'Boss Incoming!', upgrade: 'Upgrade', sound: 'Sound', music: 'Music', language: 'Language', english: 'English', indonesian: 'Indonesian', confirm: 'Confirm', cancel: 'Cancel', ok: 'OK', tutorial_text: 'Tap arrows to clear them', deadend: 'Dead End!', undo: 'Undo', restart: 'Restart', error_occurred: 'Oops! Something went wrong.', reload: 'Reload', rotate_device: 'Rotate to portrait', exit_confirm: 'Exit to menu? Progress will be saved.' },
            id: { play: 'Main', level_select: 'Level', settings: 'Pengaturan', level: 'Level', score: 'Skor', crystals: 'Kristal', pause: 'Jeda', resume: 'Lanjut', retry: 'Ulangi', back_to_menu: 'Kembali ke Menu', level_complete: 'Level Selesai!', level_failed: 'Level Gagal', boss_warning: 'Bos Datang!', upgrade: 'Tingkatkan', sound: 'Suara', music: 'Musik', language: 'Bahasa', english: 'Inggris', indonesian: 'Indonesia', confirm: 'Konfirmasi', cancel: 'Batal', ok: 'OK', tutorial_text: 'Sentuh panah untuk menghapusnya', deadend: 'Jalan Buntu!', undo: 'Undo', restart: 'Mulai Ulang', error_occurred: 'Ups! Ada yang salah.', reload: 'Muat Ulang', rotate_device: 'Putar ke portrait', exit_confirm: 'Keluar ke menu? Progress tersimpan.' }
        };
    }

    setLang(lang) {
        if (this.translations[lang]) {
            this.lang = lang;
            localStorage.setItem('arrowEscape_lang', lang);
            this.applyLanguage();
            this.notifyListeners();
            if (window.analytics) window.analytics.track('language_changed', { language: lang });
        }
    }

    getLang() { return this.lang; }

    t(key, params = {}) {
        const translation = this.translations[this.lang]?.[key] || this.translations.en[key] || key;
        return translation.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
    }

    applyLanguage() {
        document.documentElement.lang = this.lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = translation;
            else el.textContent = translation;
        });
    }

    subscribe(listener) { this.listeners.push(listener); }
    unsubscribe(listener) { this.listeners = this.listeners.filter(l => l !== listener); }
    notifyListeners() { this.listeners.forEach(l => l(this.lang)); }
}

export const i18n = new I18n();
export function t(key, params) { return i18n.t(key, params); }
if (typeof window !== 'undefined') { window.I18n = I18n; window.i18n = i18n; window.t = t; }