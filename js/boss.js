/**
 * Arrow Escape — Elemental
 * Boss System - Boss Battle mechanics
 */

import { CONFIG } from './config.js';
import { ELEMENTS } from './arrow.js';

export class Boss {
    constructor(type, levelNum) {
        this.type = type;
        this.levelNum = levelNum;
        this.hp = type === 'FINAL' ? 3 : 2;
        this.maxHp = this.hp;
        this.attackTimer = 0;
        this.attackInterval = type === 'FINAL' ? CONFIG.BOSS_FINAL_INTERVAL : CONFIG.BOSS_ATTACK_INTERVAL;
        this.warningTimer = 0;
        this.isWarning = false;
        this.currentAttack = null;
        this.defeated = false;
    }

    update(dt, board) {
        if (this.defeated) return;

        this.attackTimer += dt * 1000;
        
        if (this.attackTimer >= this.attackInterval - CONFIG.BOSS_WARNING_DURATION && !this.isWarning) {
            this.isWarning = true;
            this.warningTimer = CONFIG.BOSS_WARNING_DURATION / 1000;
            this.currentAttack = this.chooseAttack();
        }

        if (this.isWarning) {
            this.warningTimer -= dt;
            if (this.warningTimer <= 0) {
                this.isWarning = false;
                this.executeAttack(board);
                this.attackTimer = 0;
            }
        }
    }

    chooseAttack() {
        const attacks = this.getAvailableAttacks();
        return attacks[Math.floor(Math.random() * attacks.length)];
    }

    getAvailableAttacks() {
        switch (this.type) {
            case 'FIRE': return ['burn'];
            case 'WATER': return ['shift_row'];
            case 'ICE': return ['freeze'];
            case 'ELECTRIC': return ['rotate'];
            case 'FINAL': return ['burn', 'shift_row', 'freeze', 'rotate'];
            default: return ['burn'];
        }
    }

    executeAttack(board) {
        const activeArrows = board.getActiveArrows();
        if (activeArrows.length === 0) return;

        switch (this.currentAttack) {
            case 'burn': this.attackBurn(board, activeArrows); break;
            case 'shift_row': this.attackShiftRow(board); break;
            case 'freeze': this.attackFreeze(board, activeArrows); break;
            case 'rotate': this.attackRotate(board, activeArrows); break;
        }
    }

    attackBurn(board, arrows) {
        const target = arrows[Math.floor(Math.random() * arrows.length)];
        const { row, col } = target;
        board.grid[row][col] = null;
        board.arrows = board.arrows.filter(a => a.id !== target.id);
        if (window.particleSystem) window.particleSystem.emitBurn(row, col);
    }

    attackShiftRow(board) {
        const row = Math.floor(Math.random() * board.size);
        const direction = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
        
        const rowArrows = [];
        for (let c = 0; c < board.size; c++) {
            if (board.grid[row][c]) rowArrows.push({ arrow: board.grid[row][c], col: c });
        }
        if (rowArrows.length === 0) return;
        
        for (let c = 0; c < board.size; c++) board.grid[row][c] = null;
        
        for (const { arrow, col } of rowArrows) {
            let newCol = direction === 'LEFT' ? col - 1 : col + 1;
            if (newCol < 0) newCol = board.size - 1;
            if (newCol >= board.size) newCol = 0;
            
            let attempts = 0;
            while (board.grid[row][newCol] && attempts < board.size) {
                newCol = direction === 'LEFT' ? newCol - 1 : newCol + 1;
                if (newCol < 0) newCol = board.size - 1;
                if (newCol >= board.size) newCol = 0;
                attempts++;
            }
            if (!board.grid[row][newCol]) {
                arrow.col = newCol;
                board.grid[row][newCol] = arrow;
            }
        }
        if (window.particleSystem) window.particleSystem.emitWave(row, direction);
    }

    attackFreeze(board, arrows) {
        const targets = [...arrows].sort(() => Math.random() - 0.5).slice(0, 2);
        for (const target of targets) target.freeze(3);
        if (window.particleSystem) {
            for (const target of targets) window.particleSystem.emitFreeze(target.row, target.col);
        }
    }

    attackRotate(board, arrows) {
        const target = arrows[Math.floor(Math.random() * arrows.length)];
        const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
        const currentIndex = directions.indexOf(target.direction);
        target.direction = directions[(currentIndex + 1) % 4];
        if (window.particleSystem) window.particleSystem.emitRotate(target.row, target.col);
    }

    takeDamage() {
        this.hp--;
        if (this.hp <= 0) this.defeated = true;
        return this.defeated;
    }

    getWarningText() {
        switch (this.currentAttack) {
            case 'burn': return 'PERINGATAN: Api akan membakar!';
            case 'shift_row': return 'PERINGATAN: Air akan menggeser baris!';
            case 'freeze': return 'PERINGATAN: Es akan membekukan!';
            case 'rotate': return 'PERINGATAN: Listrik akan memutar!';
            default: return 'PERINGATAN: Serangan bos!';
        }
    }
}
/**
 * Boss Manager - handle multiple bosses
 */
export class BossManager {
    constructor() {
        this.boss = null;
        this.active = false;
    }

    spawnBoss(levelNum) {
        const bossType = this.getBossType(levelNum);
        this.boss = new Boss(bossType, levelNum);
        this.active = true;
        return this.boss;
    }

    getBossType(levelNum) {
        switch (levelNum) {
            case 10: return 'FIRE';
            case 20: return 'WATER';
            case 30: return 'ICE';
            case 40: return 'ELECTRIC';
            case 50: return 'FINAL';
            default: return 'FIRE';
        }
    }

    update(dt, board) {
        if (this.active && this.boss) {
            this.boss.update(dt, board);
            if (this.boss.defeated) {
                this.active = false;
                return true;
            }
        }
        return false;
    }

    getBoss() {
        return this.boss;
    }

    isActive() {
        return this.active;
    }
}

// Export untuk non-module
if (typeof window !== 'undefined') {
    window.Boss = Boss;
    window.BossManager = BossManager;
}