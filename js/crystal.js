/**
 * Arrow Escape — Elemental
 * Crystal System - Kristal Elemen untuk upgrade & beli item
 */

import { CONFIG } from './config.js';

export class CrystalManager {
    constructor() {
        this.crystals = 0;
        this.totalEarned = 0;
        this.totalSpent = 0;
    }

    add(amount, source = 'unknown') {
        this.crystals += amount;
        this.totalEarned += amount;
        this.save();
        this.updateUI();
        
        if (window.analytics) {
            window.analytics.track('crystal_earned', { amount, source, total: this.crystals });
        }
        return this.crystals;
    }

    spend(amount, purpose = 'unknown') {
        if (this.crystals < amount) return false;
        this.crystals -= amount;
        this.totalSpent += amount;
        this.save();
        this.updateUI();
        
        if (window.analytics) {
            window.analytics.track('crystal_spent', { amount, purpose, remaining: this.crystals });
        }
        return true;
    }

    canAfford(amount) {
        return this.crystals >= amount;
    }

    upgradeElement(element) {
        const cost = CONFIG.CRYSTAL_PER_UPGRADE;
        if (!this.canAfford(cost)) return { success: false, reason: 'not_enough' };
        
        const { upgradeElement, getElementLevel } = window.elementModule || {};
        if (!upgradeElement || !getElementLevel) return { success: false, reason: 'module_missing' };
        
        const currentLevel = getElementLevel(element);
        if (currentLevel >= CONFIG.ELEMENT_LEVEL_MAX) {
            return { success: false, reason: 'max_level' };
        }
        
        this.spend(cost, `upgrade_${element}`);
        const success = upgradeElement(element);
        
        if (success) {
            if (window.audioManager) window.audioManager.playSFX('element_upgrade');
            if (window.ui) window.ui.showToast(`${element} naik ke level ${getElementLevel(element)}!`);
            if (window.analytics) window.analytics.track('element_upgraded', { element, newLevel: getElementLevel(element) });
        }
        
        return { success, newLevel: getElementLevel(element) };
    }

    buyUndo() {
        const cost = CONFIG.REWARD_UNDO_COST;
        if (!this.canAfford(cost)) return false;
        this.spend(cost, 'buy_undo');
        if (window.game) window.game.addUndo(1);
        return true;
    }

    buyHint() {
        const cost = CONFIG.REWARD_HINT_COST;
        if (!this.canAfford(cost)) return false;
        this.spend(cost, 'buy_hint');
        if (window.game) window.game.showHint();
        return true;
    }
skipLevel() {
        const cost = CONFIG.REWARD_SKIP_COST;
        if (!this.canAfford(cost)) return false;
        const skipsUsed = this.getSkipsUsed();
        if (skipsUsed >= CONFIG.MAX_SKIPS_PER_CAMPAIGN) return false;
        
        this.spend(cost, 'skip_level');
        this.incrementSkipsUsed();
        if (window.game) window.game.skipLevel();
        return true;
    }

    reviveBoss() {
        const cost = CONFIG.REWARD_REVIVE_COST;
        if (!this.canAfford(cost)) return false;
        this.spend(cost, 'revive_boss');
        if (window.game) window.game.reviveBoss();
        return true;
    }

    getSkipsUsed() {
        return parseInt(localStorage.getItem('arrowEscape_skipsUsed') || '0', 10);
    }

    incrementSkipsUsed() {
        const used = this.getSkipsUsed() + 1;
        localStorage.setItem('arrowEscape_skipsUsed', used.toString());
    }

    resetSkipsUsed() {
        localStorage.setItem('arrowEscape_skipsUsed', '0');
    }

    rewardNoMistake() {
        return this.add(CONFIG.CRYSTAL_NO_MISTAKE, 'no_mistake');
    }

    rewardSpeedBonus(timeMs) {
        if (timeMs < CONFIG.CRYSTAL_SPEED_THRESHOLD) {
            return this.add(CONFIG.CRYSTAL_SPEED_BONUS, 'speed_bonus');
        }
        return this.crystals;
    }

    claimDailyReward() {
        const lastClaim = localStorage.getItem('arrowEscape_dailyClaim');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastClaim === today) {
            return { success: false, reason: 'already_claimed' };
        }
        
        localStorage.setItem('arrowEscape_dailyClaim', today);
        const amount = CONFIG.CRYSTAL_DAILY_REWARD;
        this.add(amount, 'daily_reward');
        
        if (window.ui) window.ui.showToast(`Hadiah harian: +${amount} Kristal!`);
        
        return { success: true, amount };
    }

    save() {}

    load(data) {
        if (data) {
            this.crystals = data.crystals || 0;
            this.totalEarned = data.totalCrystalsEarned || 0;
            this.totalSpent = data.totalCrystalsSpent || 0;
        }
        this.updateUI();
    }

    updateUI() {
        const el = document.getElementById('crystal-count');
        if (el) el.textContent = this.crystals;
    }

    getSaveData() {
        return {
            crystals: this.crystals,
            totalCrystalsEarned: this.totalEarned,
            totalCrystalsSpent: this.totalSpent
        };
    }
}

export const crystalManager = new CrystalManager();

if (typeof window !== 'undefined') {
    window.CrystalManager = CrystalManager;
    window.crystalManager = crystalManager;
}