/**
 * Arrow Escape — Elemental
 * Arrow Class - Representasi panah di papan
 */

export class Arrow {
    constructor(row, col, direction, element = 'PLAIN') {
        this.row = row;
        this.col = col;
        this.direction = direction; // 'UP', 'DOWN', 'LEFT', 'RIGHT'
        this.element = element; // 'FIRE', 'WATER', 'ICE', 'ELECTRIC', 'PLAIN'
        this.id = Arrow.generateId();
        this.isExiting = false;
        this.exitProgress = 0;
        this.isFrozen = false;
        this.freezeTimer = 0;
        this.squashStretch = 1.0;
        this.squashTimer = 0;
        this.trail = [];
        this.wasBlocked = false;
    }

    static generateId() {
        return 'arrow_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Cek apakah panah bisa keluar (jalur bersih)
    canExit(board) {
        if (this.isFrozen) return false;
        const { grid, size } = board;
        let r = this.row;
        let c = this.col;

        switch (this.direction) {
            case 'UP':
                for (let i = r - 1; i >= 0; i--) {
                    if (grid[i][c]) return false;
                }
                return true;
            case 'DOWN':
                for (let i = r + 1; i < size; i++) {
                    if (grid[i][c]) return false;
                }
                return true;
            case 'LEFT':
                for (let j = c - 1; j >= 0; j--) {
                    if (grid[r][j]) return false;
                }
                return true;
            case 'RIGHT':
                for (let j = c + 1; j < size; j++) {
                    if (grid[r][j]) return false;
                }
                return true;
        }
        return false;
    }

    // Dapatkan daftar panah yang menghalangi
    getBlockers(board) {
        const blockers = [];
        const { grid, size } = board;
        let r = this.row;
        let c = this.col;

        switch (this.direction) {
            case 'UP':
                for (let i = r - 1; i >= 0; i--) {
                    if (grid[i][c]) blockers.push(grid[i][c]);
                }
                break;
            case 'DOWN':
                for (let i = r + 1; i < size; i++) {
                    if (grid[i][c]) blockers.push(grid[i][c]);
                }
                break;
            case 'LEFT':
                for (let j = c - 1; j >= 0; j--) {
                    if (grid[r][j]) blockers.push(grid[r][j]);
                }
                break;
            case 'RIGHT':
                for (let j = c + 1; j < size; j++) {
                    if (grid[r][j]) blockers.push(grid[r][j]);
                }
                break;
        }
        return blockers;
    }

    // Update animasi keluar
    updateExit(dt) {
        this.exitProgress += dt * 3; // kecepatan keluar
        if (this.exitProgress >= 1) {
            this.exitProgress = 1;
            this.isExiting = false;
        }
    }

    // Update freeze timer
    updateFreeze(dt) {
        if (this.isFrozen) {
            this.freezeTimer -= dt;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                this.freezeTimer = 0;
            }
        }
    }

    // Update squash & stretch
    updateSquashStretch(dt) {
        if (this.squashTimer > 0) {
            this.squashTimer -= dt;
            const progress = 1 - this.squashTimer / (CONFIG.SQUASH_DURATION + CONFIG.STRETCH_DURATION);
            if (progress < 0.5) {
                // Squash phase
                const t = progress * 2;
                this.squashStretch = 1 + (0.2 - 0.2 * t); // 1.2 -> 1.0
            } else {
                // Stretch phase
                const t = (progress - 0.5) * 2;
                this.squashStretch = 1 + (0.2 * t); // 1.0 -> 1.2
            }
        } else {
            this.squashStretch = 1.0;
        }
    }

    // Trigger squash & stretch animasi
    triggerSquashStretch() {
        this.squashTimer = (CONFIG.SQUASH_DURATION + CONFIG.STRETCH_DURATION) / 1000;
    }

    // Freeze panah
    freeze(duration = CONFIG.FREEZE_DURATION / 1000) {
        this.isFrozen = true;
        this.freezeTimer = duration;
    }

    // Clone untuk undo
    clone() {
        const cloned = new Arrow(this.row, this.col, this.direction, this.element);
        cloned.id = this.id;
        cloned.isExiting = this.isExiting;
        cloned.exitProgress = this.exitProgress;
        cloned.isFrozen = this.isFrozen;
        cloned.freezeTimer = this.freezeTimer;
        return cloned;
    }

    // Serialize untuk save
    serialize() {
        return {
            id: this.id,
            row: this.row,
            col: this.col,
            direction: this.direction,
            element: this.element,
            isFrozen: this.isFrozen,
            freezeTimer: this.freezeTimer
        };
    }

    // Deserialize dari save
    static deserialize(data) {
        const arrow = new Arrow(data.row, data.col, data.direction, data.element);
        arrow.id = data.id;
        arrow.isFrozen = data.isFrozen || false;
        arrow.freezeTimer = data.freezeTimer || 0;
        return arrow;
    }
}

// Direction vectors
export const DIRECTIONS = {
    UP: { dr: -1, dc: 0, angle: -Math.PI / 2 },
    DOWN: { dr: 1, dc: 0, angle: Math.PI / 2 },
    LEFT: { dr: 0, dc: -1, angle: Math.PI },
    RIGHT: { dr: 0, dc: 1, angle: 0 }
};

export const DIRECTION_ORDER = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

// Element types
export const ELEMENTS = {
    FIRE: 'FIRE',
    WATER: 'WATER',
    ICE: 'ICE',
    ELECTRIC: 'ELECTRIC',
    PLAIN: 'PLAIN'
};

// Export untuk non-module
if (typeof window !== 'undefined') {
    window.Arrow = Arrow;
    window.DIRECTIONS = DIRECTIONS;
    window.DIRECTION_ORDER = DIRECTION_ORDER;
    window.ELEMENTS = ELEMENTS;
}