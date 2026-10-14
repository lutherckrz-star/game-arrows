/**
 * Arrow Escape — Elemental
 * Level Generator - Generate level dengan reverse-solve algorithm (dijamin solvable)
 */

import { CONFIG } from './config.js';
import { Board } from './board.js';
import { Arrow, ELEMENTS } from './arrow.js';
import { getElementLevel } from './element.js';

/**
 * Generate level menggunakan reverse-solve algorithm
 * 1. Mulai dengan papan kosong
 * 2. Acak urutan posisi
 * 3. Untuk setiap posisi, pilih arah yang jalurnya kosong
 * 4. Tempatkan panah
 * 5. Assign elemen setelah papan terbentuk
 * 6. Validasi dengan checkSolvable()
 */
export function generateLevel(levelNum) {
    const config = getLevelConfig(levelNum);
    let board = null;
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
        board = generateBoardReverseSolve(config);
        if (board && board.checkSolvable()) {
            assignElements(board, levelNum);
            return board;
        }
        attempts++;
    }

    console.warn(`Level ${levelNum}: fallback after ${attempts} attempts`);
    board = generateSimpleLevel(config);
    assignElements(board, levelNum);
    return board;
}

/**
 * Konfigurasi level berdasarkan nomor
 */
function getLevelConfig(levelNum) {
    let size, arrowCount, elementTypes;

    if (levelNum <= 3) {
        size = 4; arrowCount = 6; elementTypes = [];
    } else if (levelNum <= 10) {
        size = 4; arrowCount = 8 + Math.floor((levelNum - 3) * 0.3); elementTypes = [];
    } else if (levelNum <= 20) {
        size = 5; arrowCount = 12 + Math.floor((levelNum - 10) * 0.3); elementTypes = [ELEMENTS.FIRE, ELEMENTS.ICE];
    } else if (levelNum <= 30) {
        size = 5; arrowCount = 15 + Math.floor((levelNum - 20) * 0.3); elementTypes = [ELEMENTS.FIRE, ELEMENTS.ICE, ELEMENTS.WATER];
    } else if (levelNum <= 40) {
        size = 6; arrowCount = 20 + Math.floor((levelNum - 30) * 0.5); elementTypes = [ELEMENTS.FIRE, ELEMENTS.ICE, ELEMENTS.WATER, ELEMENTS.ELECTRIC];
    } else {
        size = 6; arrowCount = 25; elementTypes = [ELEMENTS.FIRE, ELEMENTS.ICE, ELEMENTS.WATER, ELEMENTS.ELECTRIC];
    }

    if (CONFIG.BOSS_LEVELS.includes(levelNum)) {
        size = CONFIG.BOSS_GRID_SIZE;
        arrowCount = Math.min(arrowCount + 5, size * size - 4);
    }

    return { size, arrowCount, elementTypes, isBoss: CONFIG.BOSS_LEVELS.includes(levelNum) };
}

/**
 * Reverse-solve generation
 */
function generateBoardReverseSolve(config) {
    const { size, arrowCount } = config;
    const board = new Board(size);
    
    const positions = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            positions.push({ row: r, col: c });
        }
    }
    
    shuffleArray(positions);
    
    let placed = 0;
    for (const pos of positions) {
        if (placed >= arrowCount) break;
        
        const validDirections = getValidDirections(board, pos.row, pos.col);
        if (validDirections.length === 0) continue;
        
        const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
        board.placeArrow(pos.row, pos.col, direction, ELEMENTS.PLAIN);
        placed++;
    }
    
    if (placed < arrowCount) {
        for (const pos of positions) {
            if (placed >= arrowCount) break;
            if (board.isCellEmpty(pos.row, pos.col)) {
                const validDirections = getValidDirections(board, pos.row, pos.col);
                if (validDirections.length > 0) {
                    const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                    board.placeArrow(pos.row, pos.col, direction, ELEMENTS.PLAIN);
                    placed++;
                }
            }
        }
    }
    
    return board;
}

/**
 * Dapatkan arah yang valid untuk posisi (jalur ke edge kosong)
 */
function getValidDirections(board, row, col) {
    const valid = [];
    const { grid, size } = board;
    
    let clear = true;
    for (let r = row - 1; r >= 0; r--) { if (grid[r][col]) { clear = false; break; } }
    if (clear) valid.push('UP');
    
    clear = true;
    for (let r = row + 1; r < size; r++) { if (grid[r][col]) { clear = false; break; } }
    if (clear) valid.push('DOWN');
    
    clear = true;
    for (let c = col - 1; c >= 0; c--) { if (grid[row][c]) { clear = false; break; } }
    if (clear) valid.push('LEFT');
    
    clear = true;
    for (let c = col + 1; c < size; c++) { if (grid[row][c]) { clear = false; break; } }
    if (clear) valid.push('RIGHT');
    
    return valid;
}

/**
 * Fallback simple generation
 */
function generateSimpleLevel(config) {
    const { size, arrowCount } = config;
    const board = new Board(size);
    const positions = [];
    
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            positions.push({ row: r, col: c });
        }
    }
    shuffleArray(positions);
    
    let placed = 0;
    for (const pos of positions) {
        if (placed >= arrowCount) break;
        const validDirections = getValidDirections(board, pos.row, pos.col);
        if (validDirections.length > 0) {
            const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
            board.placeArrow(pos.row, pos.col, direction, ELEMENTS.PLAIN);
            placed++;
        }
    }
    return board;
}
/**
 * Assign elemen ke panah berdasarkan level
 */
function assignElements(board, levelNum) {
    const config = getLevelConfig(levelNum);
    const { elementTypes } = config;
    
    if (elementTypes.length === 0) return;
    
    const arrows = board.getActiveArrows();
    const elementCount = Math.min(arrows.length, Math.floor(arrows.length * 0.4));
    
    const shuffled = [...arrows].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < elementCount; i++) {
        const element = elementTypes[Math.floor(Math.random() * elementTypes.length)];
        shuffled[i].element = element;
    }
}

/**
 * Generate boss level
 */
export function generateBossLevel(levelNum) {
    const board = new Board(CONFIG.BOSS_GRID_SIZE);
    const bossType = getBossType(levelNum);
    
    const config = { ...getLevelConfig(levelNum), size: CONFIG.BOSS_GRID_SIZE };
    const generatedBoard = generateBoardReverseSolve(config);
    
    // Copy generated arrows to the boss board
    for (const arrow of generatedBoard.getActiveArrows()) {
        board.placeArrow(arrow.row, arrow.col, arrow.direction, arrow.element);
    }
    
    addBossArrows(board, bossType);
    assignElements(board, levelNum);
    return board;
}

function getBossType(levelNum) {
    switch (levelNum) {
        case 10: return 'FIRE';
        case 20: return 'WATER';
        case 30: return 'ICE';
        case 40: return 'ELECTRIC';
        case 50: return 'FINAL';
        default: return 'FIRE';
    }
}

function addBossArrows(board, bossType) {
    const size = board.size;
    const center = Math.floor(size / 2);
    
    const bossArrow = new Arrow(center - 1, center - 1, 'UP', bossType);
    bossArrow.isBoss = true;
    bossArrow.bossSize = 2;
    bossArrow.hp = bossType === 'FINAL' ? 3 : 2;
    
    board.grid[center - 1][center - 1] = bossArrow;
    board.grid[center][center - 1] = bossArrow;
    board.grid[center - 1][center] = bossArrow;
    board.grid[center][center] = bossArrow;
    board.arrows.push(bossArrow);
}

/**
 * Generate endless level
 */
export function generateEndlessLevel() {
    const config = { size: CONFIG.ENDLESS_GRID_SIZE, arrowCount: CONFIG.ENDLESS_GRID_SIZE * CONFIG.ENDLESS_GRID_SIZE - 4 };
    const board = generateBoardReverseSolve(config);
    const allElements = [ELEMENTS.FIRE, ELEMENTS.WATER, ELEMENTS.ICE, ELEMENTS.ELECTRIC];
    assignElements(board, 999);
    return board;
}

/**
 * Generate daily challenge (seeded by date)
 */
export function generateDailyChallenge(date = new Date()) {
    const seed = date.toISOString().split('T')[0];
    const seededRandom = createSeededRandom(seed);
    
    const config = { size: 5, arrowCount: 15 };
    const board = new Board(config.size);
    const positions = [];
    
    for (let r = 0; r < config.size; r++) {
        for (let c = 0; c < config.size; c++) {
            positions.push({ row: r, col: c });
        }
    }
    
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    let placed = 0;
    for (const pos of positions) {
        if (placed >= config.arrowCount) break;
        const validDirections = getValidDirections(board, pos.row, pos.col);
        if (validDirections.length > 0) {
            const direction = validDirections[Math.floor(seededRandom() * validDirections.length)];
            board.placeArrow(pos.row, pos.col, direction, ELEMENTS.PLAIN);
            placed++;
        }
    }
    
    const arrows = board.getActiveArrows();
    const elementTypes = [ELEMENTS.FIRE, ELEMENTS.WATER, ELEMENTS.ICE, ELEMENTS.ELECTRIC];
    for (let i = 0; i < Math.floor(arrows.length * 0.5); i++) {
        const element = elementTypes[Math.floor(seededRandom() * elementTypes.length)];
        arrows[i].element = element;
    }
    
    return board;
}

function createSeededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    return () => {
        hash = (hash * 16807) % 2147483647;
        return (hash - 1) / 2147483646;
    };
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Export untuk non-module
if (typeof window !== 'undefined') {
    window.generateLevel = generateLevel;
    window.generateBossLevel = generateBossLevel;
    window.generateEndlessLevel = generateEndlessLevel;
    window.generateDailyChallenge = generateDailyChallenge;
}