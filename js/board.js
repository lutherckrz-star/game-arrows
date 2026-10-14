/**
 * Arrow Escape — Elemental
 * Board Class - Papan permainan, grid, dan logika papan
 */

import { CONFIG } from './config.js';
import { Arrow, DIRECTIONS, ELEMENTS } from './arrow.js';
import { detectReactions, applyReaction, getElementLevel } from './element.js';

export class Board {
    constructor(size = 4) {
        this.size = size;
        this.grid = this.createEmptyGrid();
        this.arrows = [];
        this.selectedArrow = null;
        this.hoveredCell = null;
        // Panah yang sedang dalam animasi terbang keluar (tidak dihitung aktif)
        this.exitFx = [];
    }

    createEmptyGrid() {
        return Array(this.size).fill(null).map(() => Array(this.size).fill(null));
    }

    placeArrow(row, col, direction, element = ELEMENTS.PLAIN) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return false;
        if (this.grid[row][col]) return false;
        const arrow = new Arrow(row, col, direction, element);
        this.grid[row][col] = arrow;
        this.arrows.push(arrow);
        return arrow;
    }

    removeArrow(row, col) {
        const arrow = this.grid[row][col];
        if (arrow) {
            this.grid[row][col] = null;
            this.arrows = this.arrows.filter(a => a.id !== arrow.id);
            return arrow;
        }
        return null;
    }

    getArrow(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return null;
        return this.grid[row][col];
    }

    isCellEmpty(row, col) {
        return !this.getArrow(row, col);
    }

    getActiveArrows() {
        return this.arrows.filter(a => !a.isExiting);
    }

    isEmpty() {
        return this.getActiveArrows().length === 0;
    }

    tryExitArrow(arrow) {
        if (!arrow || arrow.isExiting || arrow.isFrozen) return { success: false, reason: 'invalid' };
        const canExit = arrow.canExit(this);
        if (!canExit) {
            arrow.wasBlocked = true;
            return { success: false, reason: 'blocked', blockers: arrow.getBlockers(this) };
        }
        const blockers = arrow.getBlockers(this);
        // Hapus INSTAN dari grid & daftar arrow agar jalur panah lain & kondisi
        // menang langsung akurat. Objek tetap dipakai renderer via exitFx.
        arrow.isExiting = true;
        arrow.exitProgress = 0;
        arrow.triggerSquashStretch();
        arrow.originRow = arrow.row;
        arrow.originCol = arrow.col;
        this.grid[arrow.row][arrow.col] = null;
        this.arrows = this.arrows.filter(a => a.id !== arrow.id);
        this.exitFx.push(arrow);
        return { success: true, blockers, arrow };
    }

    pruneExitFx() {
        if (this.exitFx.length === 0) return;
        this.exitFx = this.exitFx.filter(a => a.exitProgress < 1);
    }

    update(dt) {
        const finished = [];
        for (const arrow of this.arrows) {
            arrow.updateFreeze(dt);
            arrow.updateSquashStretch(dt);
        }
        if (this.exitFx.length > 0) {
            const remaining = [];
            for (const arrow of this.exitFx) {
                if (arrow.updateExit(dt)) finished.push(arrow);
                else remaining.push(arrow);
            }
            this.exitFx = remaining;
        }
        return finished;
    }

    checkSolvable() {
        const testBoard = this.clone();
        let attempts = 0;
        const maxAttempts = 1000;
        while (!testBoard.isEmpty() && attempts < maxAttempts) {
            let moved = false;
            for (const arrow of testBoard.getActiveArrows()) {
                if (arrow.canExit(testBoard)) {
                    testBoard.tryExitArrow(arrow);
                    moved = true;
                    break;
                }
            }
            if (!moved) return false;
            attempts++;
        }
        return testBoard.isEmpty();
    }

    clone() {
        const newBoard = new Board(this.size);
        for (const arrow of this.getActiveArrows()) {
            const cloned = arrow.clone();
            cloned.isExiting = false;
            cloned.exitProgress = 0;
            newBoard.grid[cloned.row][cloned.col] = cloned;
            newBoard.arrows.push(cloned);
        }
        return newBoard;
    }

    serialize() {
        return { size: this.size, arrows: this.getActiveArrows().map(a => a.serialize()) };
    }

    static deserialize(data) {
        if (!data || !data.size || !Array.isArray(data.arrows)) throw new Error('Invalid board data');
        const board = new Board(data.size);
        for (const arrowData of data.arrows) {
            if (!arrowData || typeof arrowData.row !== 'number' || typeof arrowData.col !== 'number') continue;
            if (arrowData.row < 0 || arrowData.row >= board.size || arrowData.col < 0 || arrowData.col >= board.size) continue;
            const arrow = Arrow.deserialize(arrowData);
            board.grid[arrow.row][arrow.col] = arrow;
            board.arrows.push(arrow);
        }
        return board;
    }

    getCellCenter(row, col, cellSize, offsetX, offsetY) {
        return { x: offsetX + col * cellSize + cellSize / 2, y: offsetY + row * cellSize + cellSize / 2 };
    }

    screenToGrid(x, y, cellSize, offsetX, offsetY) {
        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) return { row, col };
        return null;
    }
}

if (typeof window !== 'undefined') { window.Board = Board; }
