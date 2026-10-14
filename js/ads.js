/**
 * Arrow Escape — Elemental
 * Ads Manager - CrazyGames SDK v3 Integration
 */

import { CONFIG } from './config.js';

export class AdsManager {
    constructor() {
        this.sdk = null;
        this.initialized = false;
        this.interstitialCooldown = 0;
        this.lastInterstitialTime = 0;
        this.firstSession = true;
        this.sessionStartTime = Date.now();
        this.levelsPlayedThisSession = 0;
        this.rewardedCallbacks = {};
    }

    async init() {
        if (window.CrazyGames && window.CrazyGames.SDK) {
            this.sdk = window.CrazyGames.SDK;
            try {
                await this.sdk.init();
                this.initialized = true;
                console.log('CrazyGames SDK initialized');
                this.preloadAds();
            } catch (e) { console.warn('SDK init failed:', e); }
        } else {
            window.addEventListener('CrazyGamesSDKReady', () => this.init());
        }
    }

    preloadAds() {
        if (!this.initialized) return;
        try {
            this.sdk.ad.requestAd('rewarded', { preload: true });
            this.sdk.ad.requestAd('midgame', { preload: true });
        } catch (e) { console.warn('Preload failed:', e); }
    }

    canShowInterstitial() {
        if (!this.initialized) return false;
        if (this.firstSession && this.levelsPlayedThisSession < CONFIG.INTERSTITIAL_GRACE_LEVELS) return false;
        if (this.firstSession && Date.now() - this.sessionStartTime < CONFIG.FIRST_SESSION_AD_FREE_TIME) return false;
        if (Date.now() - this.lastInterstitialTime < CONFIG.INTERSTITIAL_COOLDOWN) return false;
        return true;
    }

    showRewarded(rewardType, callback) {
        if (!this.initialized) { this.fallbackReward(rewardType, callback); return; }
        this.rewardedCallbacks[rewardType] = callback;
        try {
            this.sdk.ad.requestAd('rewarded', (result) => {
                if (result === 'completed') { this.grantReward(rewardType); if (callback) callback(true); }
                else if (result === 'skipped') { if (callback) callback(false); }
                else { this.fallbackReward(rewardType, callback); }
            });
        } catch (e) { console.warn('Rewarded ad failed:', e); this.fallbackReward(rewardType, callback); }
    }

    fallbackReward(rewardType, callback) {
        const costs = { hint: CONFIG.REWARD_HINT_COST, undo: CONFIG.REWARD_UNDO_COST, skip: CONFIG.REWARD_SKIP_COST, revive: CONFIG.REWARD_REVIVE_COST, retry: CONFIG.REWARD_UNDO_COST };
        const cost = costs[rewardType] || 0;
        if (window.crystalManager && window.crystalManager.canAfford(cost)) {
            if (confirm(`Ad unavailable. Use ${cost} Crystals for ${rewardType}?`)) {
                window.crystalManager.spend(cost, `fallback_${rewardType}`);
                this.grantReward(rewardType);
                if (callback) callback(true);
            } else { if (callback) callback(false); }
        } else { if (window.ui) window.ui.showToast('Ad unavailable. Not enough crystals.'); if (callback) callback(false); }
    }

    grantReward(rewardType) {
        switch (rewardType) {
            case 'hint': if (window.game) window.game.useHint(); break;
            case 'undo': if (window.game) window.game.addUndo(3); break;
            case 'skip': if (window.game) window.game.skipLevel(); break;
            case 'revive': if (window.game) window.game.reviveBoss(); break;
            case 'retry': if (window.game) window.game.addRetry(); break;
        }
        if (window.analytics) window.analytics.track('reward_granted', { type: rewardType });
    }

    showInterstitial() {
        if (!this.canShowInterstitial()) return false;
        if (!this.initialized) return false;
        try {
            this.sdk.ad.requestAd('midgame', (result) => {
                this.lastInterstitialTime = Date.now();
                this.levelsPlayedThisSession++;
            });
            return true;
        } catch (e) { console.warn('Interstitial failed:', e); return false; }
    }

    gameplayStart() { if (this.initialized) try { this.sdk.game.gameplayStart(); } catch (e) {} }
    gameplayStop() { if (this.initialized) try { this.sdk.game.gameplayStop(); } catch (e) {} }
    loadingStart() { if (this.initialized) try { this.sdk.game.loadingStart(); } catch (e) {} }
    loadingStop() { if (this.initialized) try { this.sdk.game.loadingStop(); } catch (e) {} }
    setMute(muted) { if (this.initialized) try { this.sdk.game.muteAudio(muted); } catch (e) {} }

    async hasAdBlocker() { if (!this.initialized) return false; try { return await this.sdk.ad.hasAdBlock(); } catch (e) { return false; } }

    happyHour(callback) { if (this.initialized) try { this.sdk.ad.happyHour(callback); } catch (e) {} }

    onLevelPlayed() {
        this.levelsPlayedThisSession++;
        if (this.firstSession && this.levelsPlayedThisSession >= CONFIG.FIRST_SESSION_AD_FREE_LEVELS) this.firstSession = false;
    }

    async showRewardedWithLoading(rewardType, callback) {
        if (window.ui) window.ui.showLoading('Loading ad...');
        const timeout = setTimeout(() => { if (window.ui) window.ui.hideLoading(); this.fallbackReward(rewardType, callback); }, CONFIG.AD_LOAD_TIMEOUT);
        this.showRewarded(rewardType, (success) => { clearTimeout(timeout); if (window.ui) window.ui.hideLoading(); if (callback) callback(success); });
    }
}

export const adsManager = new AdsManager();
if (typeof window !== 'undefined') { window.AdsManager = AdsManager; window.adsManager = adsManager; }