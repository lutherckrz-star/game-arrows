/**
 * Arrow Escape — Elemental
 * Particle System - Object pooling for effects
 */

import { CONFIG } from './config.js';
import { ELEMENTS } from './arrow.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        this.maxParticles = CONFIG.MAX_PARTICLES;
        this.canvas = null;
        this.ctx = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    getParticle() {
        if (this.pool.length > 0) return this.pool.pop();
        return { x: 0, y: 0, vx: 0, vy: 0, life: 1, maxLife: 1, color: '#fff', size: 4, shape: 'circle', rotation: 0, rotationSpeed: 0, alpha: 1, scale: 1 };
    }

    releaseParticle(p) { if (this.pool.length < this.maxParticles) this.pool.push(p); }

    emit(x, y, options = {}) {
        const count = options.count || CONFIG.PARTICLE_COUNT;
        const color = options.color || '#fff';
        const shape = options.shape || 'circle';
        const speed = options.speed || 2;
        const life = options.life || 1;
        const size = options.size || 4;
        const gravity = options.gravity || 0;
        const fade = options.fade !== false;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (options.angleOffset || 0);
            const p = this.getParticle();
            p.x = x; p.y = y;
            p.vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.5);
            p.vy = Math.sin(angle) * speed * (0.5 + Math.random() * 0.5);
            p.life = life; p.maxLife = life;
            p.color = color; p.shape = shape; p.size = size * (0.5 + Math.random() * 0.5);
            p.rotation = Math.random() * Math.PI * 2;
            p.rotationSpeed = (Math.random() - 0.5) * 0.2;
            p.alpha = 1; p.scale = 1; p.gravity = gravity; p.fade = fade;
            this.particles.push(p);
        }
    }
emitArrowExit(row, col, element, cellSize, offsetX, offsetY) {
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;
        const colors = { [ELEMENTS.FIRE]: ['#ff4757', '#ff6b6b', '#ff9f43'], [ELEMENTS.WATER]: ['#3498db', '#54a0ff', '#74b9ff'], [ELEMENTS.ICE]: ['#74b9ff', '#a2d2ff', '#ffffff'], [ELEMENTS.ELECTRIC]: ['#feca57', '#ffdd59', '#fff'], [ELEMENTS.PLAIN]: ['#ffffff', '#dddddd', '#aaaaaa'] };
        const color = colors[element]?.[0] || '#fff';
        this.emit(x, y, { color, count: 8, speed: 3, life: 0.8, size: 4 });
    }

    emitBurn(row, col, cellSize, offsetX, offsetY) {
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;
        this.emit(x, y, { color: '#ff4757', count: 12, speed: 4, life: 1, size: 6, shape: 'triangle', gravity: -0.5 });
    }

    emitFreeze(row, col, cellSize, offsetX, offsetY) {
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;
        this.emit(x, y, { color: '#74b9ff', count: 10, speed: 2, life: 1.5, size: 5, shape: 'diamond', gravity: 0 });
    }

    emitWave(row, direction, cellSize, offsetX, offsetY) {
        const y = offsetY + row * cellSize + cellSize / 2;
        const x = direction === 'LEFT' ? offsetX : offsetX + cellSize * 6;
        this.emit(x, y, { color: '#3498db', count: 8, speed: 5, life: 0.8, size: 4, angleOffset: direction === 'LEFT' ? 0 : Math.PI });
    }

    emitRotate(row, col, cellSize, offsetX, offsetY) {
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;
        this.emit(x, y, { color: '#feca57', count: 8, speed: 3, life: 0.6, size: 4, shape: 'lightning' });
    }

    addTrail(x, y, color, element) {
        if (this.particles.length >= this.maxParticles) return;
        const p = this.getParticle();
        p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 0.5; p.vy = (Math.random() - 0.5) * 0.5;
        p.life = CONFIG.TRAIL_DURATION / 1000; p.maxLife = p.life; p.color = color; p.size = 3; p.shape = 'circle'; p.fade = true;
        this.particles.push(p);
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += (p.gravity || 0) * dt * 60;
            p.life -= dt; p.rotation += p.rotationSpeed;
            if (p.fade) { p.alpha = p.life / p.maxLife; p.scale = p.life / p.maxLife; }
            if (p.life <= 0) { this.releaseParticle(p); this.particles.splice(i, 1); }
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.save();
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.alpha; this.ctx.fillStyle = p.color;
            this.ctx.translate(p.x, p.y); this.ctx.rotate(p.rotation); this.ctx.scale(p.scale, p.scale);
            this.drawShape(p); this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        this.ctx.restore();
    }

    drawShape(p) { const s = p.size; switch (p.shape) { case 'circle': this.ctx.beginPath(); this.ctx.arc(0, 0, s, 0, Math.PI * 2); this.ctx.fill(); break; case 'triangle': this.ctx.beginPath(); this.ctx.moveTo(0, -s); this.ctx.lineTo(s, s); this.ctx.lineTo(-s, s); this.ctx.closePath(); this.ctx.fill(); break; case 'diamond': this.ctx.beginPath(); this.ctx.moveTo(0, -s); this.ctx.lineTo(s, 0); this.ctx.lineTo(0, s); this.ctx.lineTo(-s, 0); this.ctx.closePath(); this.ctx.fill(); break; case 'square': this.ctx.fillRect(-s/2, -s/2, s, s); break; case 'lightning': this.ctx.beginPath(); this.ctx.moveTo(0, -s); this.ctx.lineTo(s/2, 0); this.ctx.lineTo(-s/2, 0); this.ctx.lineTo(0, s); this.ctx.strokeStyle = p.color; this.ctx.lineWidth = 2; this.ctx.stroke(); break; } }

    clear() { this.particles.forEach(p => this.releaseParticle(p)); this.particles = []; }
}

export const particleSystem = new ParticleSystem();
if (typeof window !== 'undefined') { window.ParticleSystem = ParticleSystem; window.particleSystem = particleSystem; }