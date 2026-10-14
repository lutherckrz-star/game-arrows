/**
 * Arrow Escape — Elemental
 * Konfigurasi Global Game
 * Semua konstanta di sini agar mudah diubah tanpa cari di kode
 */

export const CONFIG = {
    // Game Info
    GAME_TITLE: 'Arrow Escape — Elemental',
    VERSION: '1.0.0',
    SAVE_VERSION: 1,
    SAVE_KEY: 'arrowEscape_save',

    // Grid & Board
    MIN_GRID_SIZE: 4,
    MAX_GRID_SIZE: 7,
    CELL_SIZE_BASE: 60, // px, akan diskalakan via DPR

    // Level Progression
    CAMPAIGN_LEVELS: 50,
    BOSS_LEVELS: [10, 20, 30, 40, 50],
    ELEMENT_UNLOCK_LEVELS: {
        FIRE: 11,
        ICE: 11,
        WATER: 21,
        ELECTRIC: 31
    },

    // Elements
    ELEMENT_LEVEL_MAX: 3,
    CRYSTAL_PER_UPGRADE: 10,
    CRYSTAL_NO_MISTAKE: 1,
    CRYSTAL_SPEED_BONUS: 1,
    CRYSTAL_SPEED_THRESHOLD: 30000, // ms
    CRYSTAL_DAILY_REWARD: 5,

    // Scoring
    SCORE_PLAIN_ARROW: 10,
    SCORE_ELEMENT_ARROW: 20,
    SCORE_REACTION_BONUS: 30,
    SCORE_COMBO_BONUS: 50,
    SCORE_COMBO_THRESHOLD: 3,
    SCORE_SPEED_BONUS_PER_SEC: 1,

    // Stars
    STAR_1: 'complete',
    STAR_2: 'no_mistake',
    STAR_3: 'speed',

    // Combo
    COMBO_THRESHOLD: 3,
    COMBO_ESCALATION_THRESHOLD: 5,

    // Boss
    BOSS_ATTACK_INTERVAL: 5000,
    BOSS_FINAL_INTERVAL: 3000,
    BOSS_WARNING_DURATION: 1000,
    BOSS_GRID_SIZE: 6,

    // Game Feel
    HIT_STOP_DURATION: 50,
    TRAUMA_DECAY: 0.02,
    MAX_SHAKE: 10,
    SQUASH_DURATION: 50,
    STRETCH_DURATION: 100,
    PARTICLE_COUNT: 12,
    MAX_PARTICLES: 100,
    TRAIL_DURATION: 300,

    // Timing
    FIXED_DT: 1 / 60,
    FREEZE_DURATION: 1000,
    COMBO_FREEZE_DURATION: 2000,
    TOTAL_FREEZE_DURATION: 2000,

    // Ads
    INTERSTITIAL_COOLDOWN: 90000,
    INTERSTITIAL_GRACE_LEVELS: 3,
    INTERSTITIAL_FREQUENCY: 3,
    REWARD_HINT_COST: 5,
    REWARD_UNDO_COST: 3,
    REWARD_SKIP_COST: 15,
    REWARD_REVIVE_COST: 15,
    MAX_SKIPS_PER_CAMPAIGN: 3,
    RETRY_FREE_COUNT: 3,
    BOSS_RETRY_FREE: 1,
    AD_LOAD_TIMEOUT: 10000,
    FIRST_SESSION_AD_FREE_TIME: 120000,
    FIRST_SESSION_AD_FREE_LEVELS: 3,

    // Save
    AUTO_SAVE_INTERVAL: 1000,
    SAVE_CORRUPT_RESET: true,
    CHECKSUM_MOD: 1000,

    // Daily Challenge
    DAILY_UNLOCK_LEVEL: 10,

    // Endless
    ENDLESS_UNLOCK_LEVEL: 50,
    ENDLESS_GRID_SIZE: 7,

    // Boss Rush
    BOSS_RUSH_UNLOCK_LEVEL: 50,

    // Visual
    DPR_MAX: 2,
    ANIMATION_DURATION: 300,
    MODAL_ANIMATION_DURATION: 400,
    TOAST_DURATION: 1500,
    COMBO_PULSE_DURATION: 250,

    // Audio Volumes
    VOLUME: {
        SFX_ARROW_OUT: 0.4,
        SFX_ARROW_BLOCKED: 0.5,
        SFX_COMBO: 0.6,
        SFX_LEVEL_COMPLETE: 0.7,
        SFX_BUTTON_CLICK: 0.3,
        SFX_REACTION: 0.6,
        SFX_ELEMENT_UPGRADE: 0.7,
        SFX_BOSS_WARNING: 0.8,
        SFX_BOSS_DEFEAT: 0.8,
        SFX_DEADEND: 0.5,
        SFX_ACHIEVEMENT: 0.7,
        SFX_COMBO_ESCALATION: 0.6,
        MUSIC_AMBIENT: 0.3,
        MUSIC_BOSS: 0.4
    },

    // Colors
    COLORS: {
        BG: '#1a1a2e',
        BOARD: '#16213e',
        CELL_EMPTY: '#0f3460',
        CELL_HOVER: '#1a4a7a',
        FIRE: '#ff4757',
        WATER: '#3498db',
        ICE: '#74b9ff',
        ELECTRIC: '#feca57',
        PLAIN: '#ffffff',
        TEXT: '#ffffff',
        TEXT_DIM: '#a0a0b0',
        ACCENT: '#ff6b6b',
        GOLD: '#ffd700',
        CRYSTAL: '#00ffff',
        COMBO: '#ff6b6b',
        BOSS_WARNING: '#ff4757'
    },

    // Element Symbols (for colorblind)
    ELEMENT_SYMBOLS: {
        FIRE: 'F',
        WATER: 'W',
        ICE: 'I',
        ELECTRIC: 'E',
        PLAIN: ''
    },

    // Element Patterns (for colorblind)
    ELEMENT_PATTERNS: {
        FIRE: 'vertical',
        WATER: 'horizontal',
        ICE: 'dots',
        ELECTRIC: 'zigzag',
        PLAIN: 'none'
    },

    // Developer Mode
    DEBUG: false,
    DEBUG_FPS: false,
    DEBUG_GRID: false,
    DEBUG_SKIP_LEVEL: false,
    DEBUG_ADD_CRYSTALS: 100,

    // Analytics
    ANALYTICS_MAX_EVENTS: 100,
    ANALYTICS_RATE_LIMIT: 10, // per second

    // Anti-cheat
    MAX_SCORE_MULTIPLIER: 50,
    MAX_LEVEL_TIME: 3600000,
    DEVTOOLS_THRESHOLD: 160
};

// Helper: cek debug mode dari URL
if (new URLSearchParams(window.location.search).has('debug')) {
    CONFIG.DEBUG = true;
    CONFIG.DEBUG_FPS = true;
    CONFIG.DEBUG_GRID = true;
    CONFIG.DEBUG_SKIP_LEVEL = true;
}

// Export untuk non-module fallback
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}