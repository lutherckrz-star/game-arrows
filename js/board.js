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
    }

    createEmptyGrid() {
        return Array(this.size).fill(null).map(() => Array(this.size).fill(null));
    }

    // Place arrow di posisi tertentu
    placeArrow(row, col, direction, element = ELEMENTS.PLAIN) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return false;
        if (this.grid[row][col]) return false;

        const arrow = new Arrow(row, col, direction, element);
        this.grid[row][col] = arrow;
        this.arrows.push(arrow);
        return arrow;
    }

    // Hapus arrow dari posisi
    removeArrow(row, col) {
        const arrow = this.grid[row][col];
        if (arrow) {
            this.grid[row][col] = null;
            this.arrows = this.arrows.filter(a => a.id !== arrow.id);
            return arrow;
        }
        return null;
    }

    // Dapatkan arrow di posisi
    getArrow(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return null;
        return this.grid[row][col];
    }

    // Cek apakah sel kosong
    isEmpty(row, col) {
        return !this.getArrow(row, col);
    }

    // Dapatkan semua arrow yang masih di papan (belum keluar)
    getActiveArrows() {
        return this.arrows.filter(a => !a.isExiting && a.exitProgress < 1);
    }

    // Cek apakah papan kosong (selesai level)
    isEmpty() {
        return this.getActiveArrows().length === 0;
    }

    // Coba gerakkan/keluarkan arrow
    tryExitArrow(arrow) {
        if (!arrow || arrow.isExiting || arrow.isFrozen) return { success: false, reason: 'invalid' };

        const canExit = arrow.canExit(this);
        if (!canExit) {
            arrow.wasBlocked = true;
            return { success: false, reason: 'blocked', blockers: arrow.getBlockers(this) };
        }

        // Arrow bisa keluar
        arrow.isExiting = true;
        arrow.exitProgress = 0;
        arrow.triggerSquashStretch();
        this.grid[arrow.row][arrow.col] = null;
        
        // Dapatkan blockers untuk reaction detection
        const blockers = arrow.getBlockers(this);
        
        return { success: true, blockers };
    }

    // Update semua arrow (animasi keluar, freeze, squash/stretch)
    update(dt) {
        for (const arrow of this.arrows) {
            if (arrow.isExiting) {
                arrow.updateExit(dt);
            }
            arrow.updateFreeze(dt);
            arrow.updateSquashStretch(dt);
        }
        // Hapus arrow yang sudah keluar sepenuhnya
        this.arrows = this.arrows.filter(a => !(a.isExiting && a.exitProgress >= 1));
    }

    // Cek solvable (greedy algorithm)
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

    // Clone board untuk testing
    clone() {
        const newBoard = new Board(this.size);
        for (const arrow of this.arrows) {
            const cloned = arrow.clone();
            newBoard.grid[cloned.row][cloned.col] = cloned;
            newBoard.arrows.push(cloned);
        }
        return newBoard;
    }

    // Serialize untuk save
    serialize() {
        return {
            size: this.size,
            arrows: this.arrows.map(a => a.serialize())
        };
    }

    // Deserialize dari save
    static deserialize(data) {
        const board = new Board(data.size);
        for (const arrowData of data.arrows) {
            const arrow = Arrow.deserialize(arrowData);
            board.grid[arrow.row][arrow.col] = arrow;
            board.arrows.push(arrow);
        }
        return board;
    }

    // Render helper - dapatkan posisi screen dari grid
    getCellCenter(row, col, cellSize, offsetX, offsetY) {
        return {
            x: offsetX + col * cellSize + cellSize / 2,
            y: offsetY + row * cellSize + cellSize / 2
        };
    }

    // Convert screen ke grid coordinate
    screenToGrid(x, y, cellSize, offsetX, offsetY) {
        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            return { row, col };
        }
        return null;
    }
}

// Export untuk non-module
if (typeof window !== 'undefined') {
    window.Board = Board;
}