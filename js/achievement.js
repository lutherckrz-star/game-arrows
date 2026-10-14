/**
 * Arrow Escape — Elemental
 * Achievement System - 10 Achievement
 */

import { CONFIG } from './config.js';

export const ACHIEVEMENTS = [
    {
        id: 'first_blood',
        name: { en: 'First Blood', id: 'Pertama Kali' },
        desc: { en: 'Complete your first level', id: 'Selesaikan level pertama' },
        icon: '🩸',
        check: (stats) => stats.levelsCompleted >= 1
    },
    {
        id: 'combo_apprentice',
        name: { en: 'Combo Apprentice', id: 'Pemula Combo' },
        desc: { en: 'Reach combo x3', id: 'Capai combo x3' },
        icon: '🔥',
        check: (stats) => stats.maxCombo >= 3
    },
    {
        id: 'combo_master',
        name: { en: 'Combo Master', id: 'Master Combo' },
        desc: { en: 'Reach combo x10', id: 'Capai combo x10' },
        icon: '🔥🔥',
        check: (stats) => stats.maxCombo >= 10
    },
    {
        id: 'reaction_rookie',
        name: { en: 'Reaction Rookie', id: 'Pemula Reaksi' },
        desc: { en: 'Trigger your first chain reaction', id: 'Picu reaksi berantai pertama' },
        icon: '⚡',
        check: (stats) => stats.reactionsTriggered >= 1
    },
    {
        id: 'reaction_king',
        name: { en: 'Reaction King', id: 'Raja Reaksi' },
        desc: { en: 'Trigger 50 chain reactions', id: 'Picu 50 reaksi berantai' },
        icon: '⚡⚡',
        check: (stats) => stats.reactionsTriggered >= 50
    },
    {
        id: 'elementalist',
        name: { en: 'Elementalist', id: 'Elementalist' },
        desc: { en: 'Upgrade any element to level 2', id: 'Upgrade elemen apapun ke level 2' },
        icon: '🧪',
        check: (stats, elementLevels) => Object.values(elementLevels).some(l => l >= 2)
    },
    {
        id: 'master_of_elements',
        name: { en: 'Master of Elements', id: 'Master Elemen' },
        desc: { en: 'Upgrade all elements to level 3', id: 'Upgrade semua elemen ke level 3' },
        icon: '🧪🧪',
        check: (stats, elementLevels) => Object.values(elementLevels).every(l => l >= 3)
    },
    {
        id: 'boss_slayer',
        name: { en: 'Boss Slayer', id: 'Pembunuh Bos' },
        desc: { en: 'Defeat all 5 bosses', id: 'Kalahkan 5 bos' },
        icon: '👑',
        check: (stats) => stats.bossesDefeated >= 5
    },
    {
        id: 'perfectionist',
        name: { en: 'Perfectionist', id: 'Perfeksionis' },
        desc: { en: 'Get 3 stars on 10 levels', id: 'Dapat 3 bintang di 10 level' },
        icon: '⭐',
        check: (stats) => stats.threeStarLevels >= 10
    },
    {
        id: 'speed_demon',
        name: { en: 'Speed Demon', id: 'Iblis Kecepatan' },
        desc: { en: 'Complete a level in under 10 seconds', id: 'Selesaikan level di bawah 10 detik' },
        icon: '💨',
        check: (stats) => stats.fastestLevelTime > 0 && stats.fastestLevelTime < 10000
    }
];

export class AchievementManager {
    constructor() {
        this.unlocked = new Set();
        this.newlyUnlocked = [];
    }

    // Cek dan unlock achievement
    checkAll(stats, elementLevels) {
        const newlyUnlocked = [];
        
        for (const achievement of ACHIEVEMENTS) {
            if (this.unlocked.has(achievement.id)) continue;
            
            if (achievement.check(stats, elementLevels)) {
                this.unlocked.add(achievement.id);
                newlyUnlocked.push(achievement);
            }
        }
        
        if (newlyUnlocked.length > 0) {
            this.newlyUnlocked = newlyUnlocked;
            this.save();
            this.showToasts(newlyUnlocked);
            
            if (window.analytics) {
                for (const a of newlyUnlocked) {
                    window.analytics.track('achievement_unlocked', { id: a.id });
                }
            }
        }
        
        return newlyUnlocked;
    }

    showToasts(achievements) {
        if (!window.ui) return;
        
        achievements.forEach((a, i) => {
            setTimeout(() => {
                const lang = window.i18n?.getLang() || 'en';
                window.ui.showToast(
                    `🏆 Achievement: ${a.name[lang]}!`,
                    3000
                );
                if (window.audioManager) {
                    window.audioManager.playSFX('achievement');
                }
            }, i * 500);
        });
    }

    // Cek apakah achievement sudah unlock
    isUnlocked(id) {
        return this.unlocked.has(id);
    }

    // Dapatkan daftar achievement untuk UI
    getAllForUI(lang = 'en') {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            name: a.name[lang],
            desc: a.desc[lang],
            unlocked: this.unlocked.has(a.id)
        }));
    }

    // Load dari save
    load(data) {
        if (data && data.achievements) {
            this.unlocked = new Set(data.achievements);
        }
    }

    // Save
    save() {
        // Disimpan via game.save()
    }

    // Get data untuk save
    getSaveData() {
        return {
            achievements: Array.from(this.unlocked)
        };
    }

    // Reset (untuk testing)
    reset() {
        this.unlocked.clear();
        this.newlyUnlocked = [];
    }
}

export const achievementManager = new AchievementManager();

if (typeof window !== 'undefined') {
    window.ACHIEVEMENTS = ACHIEVEMENTS;
    window.AchievementManager = AchievementManager;
    window.achievementManager = achievementManager;
}