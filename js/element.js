/**
 * Arrow Escape — Elemental
 * Element System - Sistem Elemen & Reaksi Berantai
 */

import { CONFIG } from './config.js';
import { ELEMENTS } from './arrow.js';

// Element definitions dengan properti visual & gameplay
export const ELEMENT_DEFS = {
    [ELEMENTS.FIRE]: {
        name: 'FIRE',
        color: CONFIG.COLORS.FIRE,
        symbol: CONFIG.ELEMENT_SYMBOLS.FIRE,
        pattern: CONFIG.ELEMENT_PATTERNS.FIRE,
        level: 1,
        maxLevel: CONFIG.ELEMENT_LEVEL_MAX,
        destroyCount: (level) => level === 3 ? 'all' : level,
        description: 'Menghancurkan ICE di jalurnya'
    },
    [ELEMENTS.WATER]: {
        name: 'WATER',
        color: CONFIG.COLORS.WATER,
        symbol: CONFIG.ELEMENT_SYMBOLS.WATER,
        pattern: CONFIG.ELEMENT_PATTERNS.WATER,
        level: 1,
        maxLevel: CONFIG.ELEMENT_LEVEL_MAX,
        passCount: (level) => level,
        description: 'Melewati panah penghalang'
    },
    [ELEMENTS.ICE]: {
        name: 'ICE',
        color: CONFIG.COLORS.ICE,
        symbol: CONFIG.ELEMENT_SYMBOLS.ICE,
        pattern: CONFIG.ELEMENT_PATTERNS.ICE,
        level: 1,
        maxLevel: CONFIG.ELEMENT_LEVEL_MAX,
        freezeRadius: (level) => level === 3 ? 'board' : (level === 2 ? 8 : 4),
        description: 'Membekukan panah sekitarnya'
    },
    [ELEMENTS.ELECTRIC]: {
        name: 'ELECTRIC',
        color: CONFIG.COLORS.ELECTRIC,
        symbol: CONFIG.ELEMENT_SYMBOLS.ELECTRIC,
        pattern: CONFIG.ELEMENT_PATTERNS.ELECTRIC,
        level: 1,
        maxLevel: CONFIG.ELEMENT_LEVEL_MAX,
        chainCount: (level) => level === 3 ? 'all' : level * 2,
        description: 'Menyambar ELECTRIC lain di baris/kolom'
    },
    [ELEMENTS.PLAIN]: {
        name: 'PLAIN',
        color: CONFIG.COLORS.PLAIN,
        symbol: CONFIG.ELEMENT_SYMBOLS.PLAIN,
        pattern: CONFIG.ELEMENT_PATTERNS.PLAIN,
        level: 1,
        maxLevel: 1,
        description: 'Panah biasa'
    }
};

// Reaction types
export const REACTIONS = {
    STEAM: 'STEAM',
    CONDUCTOR: 'CONDUCTOR',
    DEEP_FREEZE: 'DEEP_FREEZE',
    EXPLOSION: 'EXPLOSION'
};

// Reaction definitions
export const REACTION_DEFS = {
    [REACTIONS.STEAM]: {
        name: 'UAP',
        elements: [ELEMENTS.FIRE, ELEMENTS.ICE],
        description: 'Membuka 2 sel di sekitar ICE yang hancur',
        particleColor: '#ffffff',
        particleShape: 'circle',
        effect: 'open_cells',
        radius: 2
    },
    [REACTIONS.CONDUCTOR]: {
        name: 'KONDUKTOR',
        elements: [ELEMENTS.WATER, ELEMENTS.ELECTRIC],
        description: 'Listrik mengalir ke 3 panah lain di sekitar',
        particleColor: '#3498db',
        particleShape: 'lightning',
        effect: 'chain_lightning',
        chainCount: 3
    },
    [REACTIONS.DEEP_FREEZE]: {
        name: 'BEKU TOTAL',
        elements: [ELEMENTS.ICE, ELEMENTS.WATER],
        description: 'Membekukan seluruh baris dan kolom selama 2 detik',
        particleColor: '#74b9ff',
        particleShape: 'ice_wave',
        effect: 'freeze_row_col',
        duration: 2000
    },
    [REACTIONS.EXPLOSION]: {
        name: 'LEDAKAN',
        elements: [ELEMENTS.ELECTRIC, ELEMENTS.FIRE],
        description: 'Menghancurkan 1 panah penghalang di sekitar FIRE',
        particleColor: '#ffa500',
        particleShape: 'explosion',
        effect: 'destroy_blocker',
        screenShake: 0.6
    }
};
/**
 * Deteksi reaksi berantai saat panah keluar
 * Hanya trigger jika panah YANG KELUAR adalah elemen aktif (pertama di pair)
 * @param {Arrow} exitingArrow - Panah yang keluar (elemen aktif)
 * @param {Arrow[]} involvedArrows - Panah yang terlibat (blockers/targets)
 * @returns {Object[]} Array reaksi yang terpicu
 */
export function detectReactions(exitingArrow, involvedArrows) {
    const reactions = [];
    const exitingElement = exitingArrow.element;
    
    for (const involved of involvedArrows) {
        const involvedElement = involved.element;
        if (involvedElement === ELEMENTS.PLAIN) continue;
        
        for (const [reactionKey, reactionDef] of Object.entries(REACTION_DEFS)) {
            const [activeElem, passiveElem] = reactionDef.elements;
            // HANYA trigger jika exitingArrow adalah elemen AKTIF (pertama)
            if (exitingElement === activeElem && involvedElement === passiveElem) {
                reactions.push({
                    type: reactionKey,
                    def: reactionDef,
                    source: exitingArrow,
                    target: involved,
                    position: { row: involved.row, col: involved.col }
                });
            }
        }
    }
    return reactions;
}

/**
 * Terapkan efek reaksi ke papan
 * @param {Board} board - Instance Board
 * @param {Object} reaction - Objek reaksi
 * @returns {Arrow[]} Array panah yang terpengaruh
 */
export function applyReaction(board, reaction) {
    const affected = [];
    const { type, def, source, target, position } = reaction;
    const { grid, size } = board;
    
    switch (type) {
        case REACTIONS.STEAM:
            // STEAM: "Membuka 2 sel di sekitar ICE yang hancur"
            // ICE sudah hancur (target), buka 2 sel kosong di sekitar posisi ICE
            const steamDirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
            let opened = 0;
            for (const [dr, dc] of steamDirs) {
                if (opened >= def.radius) break;
                const r = position.row + dr;
                const c = position.col + dc;
                if (r >= 0 && r < size && c >= 0 && c < size && grid[r][c]) {
                    // Hapus panah di sel tersebut (buka sel)
                    affected.push(grid[r][c]);
                    grid[r][c] = null;
                    opened++;
                }
            }
            break;
        case REACTIONS.CONDUCTOR:
            // CONDUCTOR: "Listrik mengalir ke 3 panah ELECTRIC lain di baris dan kolom yang sama"
            const electricArrows = [];
            // Cari di baris yang sama
            for (let c = 0; c < size; c++) {
                if (grid[position.row][c] && grid[position.row][c].element === ELEMENTS.ELECTRIC && grid[position.row][c] !== target) {
                    electricArrows.push(grid[position.row][c]);
                }
            }
            // Cari di kolom yang sama
            for (let r = 0; r < size; r++) {
                if (grid[r][position.col] && grid[r][position.col].element === ELEMENTS.ELECTRIC && grid[r][position.col] !== target) {
                    // Hindari duplikat jika di intersection
                    if (!electricArrows.includes(grid[r][position.col])) {
                        electricArrows.push(grid[r][position.col]);
                    }
                }
            }
            electricArrows.sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(def.chainCount, electricArrows.length); i++) {
                electricArrows[i].isExiting = true;
                electricArrows[i].exitProgress = 0;
                affected.push(electricArrows[i]);
            }
            break;
        case REACTIONS.DEEP_FREEZE:
            // DEEP_FREEZE: "Membekukan seluruh baris dan kolom selama 2 detik" - sudah benar
            const freezeDuration = def.duration / 1000;
            for (let i = 0; i < size; i++) {
                if (grid[position.row][i]) {
                    grid[position.row][i].freeze(freezeDuration);
                    affected.push(grid[position.row][i]);
                }
                if (grid[i][position.col]) {
                    grid[i][position.col].freeze(freezeDuration);
                    affected.push(grid[i][position.col]);
                }
            }
            break;
        case REACTIONS.EXPLOSION:
            // EXPLOSION: "Menghancurkan 1 panah penghalang di sekitar FIRE (target)"
            const targetPos = { row: target.row, col: target.col };
            const explosionDirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
            for (const [dr, dc] of explosionDirs) {
                const r = targetPos.row + dr;
                const c = targetPos.col + dc;
                if (r >= 0 && r < size && c >= 0 && c < size && grid[r][c] && grid[r][c] !== target) {
                    affected.push(grid[r][c]);
                    grid[r][c] = null;
                    break;
                }
            }
            break;
    }
    return affected;
}

/**
 * Dapatkan definisi elemen
 */
export function getElementDef(element) {
    return ELEMENT_DEFS[element] || ELEMENT_DEFS[ELEMENTS.PLAIN];
}

/**
 * Upgrade level elemen
 */
export function upgradeElement(element) {
    const def = ELEMENT_DEFS[element];
    if (def && def.level < def.maxLevel) {
        def.level++;
        return true;
    }
    return false;
}

/**
 * Reset level elemen (untuk new game)
 */
export function resetElementLevels() {
    for (const def of Object.values(ELEMENT_DEFS)) {
        def.level = 1;
    }
}

/**
 * Dapatkan level elemen saat ini
 */
export function getElementLevel(element) {
    return ELEMENT_DEFS[element]?.level || 1;
}

// Export untuk non-module
if (typeof window !== 'undefined') {
    window.ELEMENT_DEFS = ELEMENT_DEFS;
    window.REACTIONS = REACTIONS;
    window.REACTION_DEFS = REACTION_DEFS;
    window.detectReactions = detectReactions;
    window.applyReaction = applyReaction;
    window.getElementDef = getElementDef;
    window.upgradeElement = upgradeElement;
    window.resetElementLevels = resetElementLevels;
    window.getElementLevel = getElementLevel;
}