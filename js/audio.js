/**
 * Arrow Escape — Elemental
 * Audio Manager - Web Audio API untuk SFX & Musik
 */

import { CONFIG } from './config.js';

export class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.sfxBuffers = {};
        this.musicSource = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.masterGain = null;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.currentMusic = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 1;
            this.masterGain.connect(this.audioCtx.destination);

            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.audioCtx.createGain();
            this.musicGain.connect(this.masterGain);

            await this.loadSFX();
            
            this.isInitialized = true;
            console.log('AudioManager initialized');
        } catch (e) {
            console.warn('Web Audio API not available:', e);
        }
    }

    async loadSFX() {
        const sfxList = [
            { key: 'arrow_out', file: 'sfx_arrow_out.wav', volume: CONFIG.VOLUME.SFX_ARROW_OUT },
            { key: 'arrow_blocked', file: 'sfx_arrow_blocked.wav', volume: CONFIG.VOLUME.SFX_ARROW_BLOCKED },
            { key: 'combo', file: 'sfx_combo.wav', volume: CONFIG.VOLUME.SFX_COMBO },
            { key: 'level_complete', file: 'sfx_level_complete.wav', volume: CONFIG.VOLUME.SFX_LEVEL_COMPLETE },
            { key: 'button_click', file: 'sfx_button_click.wav', volume: CONFIG.VOLUME.SFX_BUTTON_CLICK },
            { key: 'reaction', file: 'sfx_reaction.wav', volume: CONFIG.VOLUME.SFX_REACTION },
            { key: 'element_upgrade', file: 'sfx_element_upgrade.wav', volume: CONFIG.VOLUME.SFX_ELEMENT_UPGRADE },
            { key: 'boss_warning', file: 'sfx_boss_warning.wav', volume: CONFIG.VOLUME.SFX_BOSS_WARNING },
            { key: 'boss_defeat', file: 'sfx_boss_defeat.wav', volume: CONFIG.VOLUME.SFX_BOSS_DEFEAT },
            { key: 'deadend', file: 'sfx_deadend.wav', volume: CONFIG.VOLUME.SFX_DEADEND },
            { key: 'achievement', file: 'sfx_achievement.wav', volume: CONFIG.VOLUME.SFX_ACHIEVEMENT },
            { key: 'combo_escalation', file: 'sfx_combo_escalation.wav', volume: CONFIG.VOLUME.SFX_COMBO_ESCALATION }
        ];

        for (const sfx of sfxList) {
            try {
                const response = await fetch(`assets/sounds/${sfx.file}`);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    this.sfxBuffers[sfx.key] = await this.audioCtx.decodeAudioData(arrayBuffer);
                }
            } catch (e) {
                console.warn(`Failed to load SFX: ${sfx.file}`, e);
                this.sfxBuffers[sfx.key] = this.createProceduralSFX(sfx.key);
            }
        }
    }

    createProceduralSFX(type) {
        const sampleRate = this.audioCtx.sampleRate;
        let duration = 0.3, frequency = 440;
        
        switch (type) {
            case 'arrow_out': frequency = 800; duration = 0.1; break;
            case 'arrow_blocked': frequency = 200; duration = 0.15; break;
            case 'combo': frequency = 880; duration = 0.2; break;
            case 'level_complete': frequency = 523; duration = 0.5; break;
            case 'button_click': frequency = 1000; duration = 0.05; break;
            case 'reaction': frequency = 600; duration = 0.3; break;
            case 'element_upgrade': frequency = 660; duration = 0.4; break;
            case 'boss_warning': frequency = 150; duration = 0.5; break;
            case 'boss_defeat': frequency = 523; duration = 0.8; break;
            case 'deadend': frequency = 180; duration = 0.3; break;
            case 'achievement': frequency = 880; duration = 0.5; break;
            case 'combo_escalation': frequency = 1000; duration = 0.2; break;
        }

        const buffer = this.audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }
        return buffer;
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playSFX(key, options = {}) {
        if (!this.sfxEnabled || !this.audioCtx || !this.sfxBuffers[key]) return;
        
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.sfxBuffers[key];
        
        const gain = this.audioCtx.createGain();
        gain.gain.value = options.volume || 1;
        gain.connect(this.sfxGain);
        
        source.connect(gain);
        
        if (options.pitch) source.playbackRate.value = options.pitch;
        
        source.start(0);
        return source;
    }

    playSFXWithPitch(key, pitch = 1) {
        this.playSFX(key, { pitch });
    }
async playMusic(key, loop = true) {
        if (!this.musicEnabled || !this.audioCtx) return;
        this.stopMusic();
        try {
            const response = await fetch(`assets/sounds/${key}.wav`);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                this.musicSource = this.audioCtx.createBufferSource();
                this.musicSource.buffer = buffer;
                this.musicSource.loop = loop;
                this.musicSource.connect(this.musicGain);
                this.musicSource.start(0);
                this.currentMusic = key;
            }
        } catch (e) { console.warn('Failed to load music:', key, e); this.playProceduralMusic(key); }
    }

    playProceduralMusic(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = type === 'boss' ? 110 : 220;
        gain.gain.value = 0.1;
        osc.connect(gain); gain.connect(this.musicGain); osc.start();
        this.musicSource = osc; this.currentMusic = type;
    }

    stopMusic() { if (this.musicSource) { try { this.musicSource.stop(); } catch (e) {} this.musicSource = null; this.currentMusic = null; } }

    setSFXEnabled(enabled) { this.sfxEnabled = enabled; this.sfxGain.gain.value = enabled ? 1 : 0; }
    setMusicEnabled(enabled) { this.musicEnabled = enabled; this.musicGain.gain.value = enabled ? 1 : 0; if (!enabled) this.stopMusic(); }
    setMasterVolume(volume) { if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, volume)); }

    playArrowOut(combo = 1) { const pitch = 1 + Math.min(combo * 0.05, 0.3); this.playSFXWithPitch('arrow_out', pitch); }
    playCombo(combo) { this.playSFX('combo', { pitch: 1 + Math.min(combo * 0.02, 0.2) }); if (combo >= 5) this.playSFX('combo_escalation'); }
    playReaction(type) { this.playSFX('reaction'); switch (type) { case 'STEAM': this.playSFXWithPitch('arrow_out', 1.5); break; case 'CONDUCTOR': this.playSFXWithPitch('combo', 1.2); break; case 'DEEP_FREEZE': this.playSFXWithPitch('arrow_blocked', 0.7); break; case 'EXPLOSION': this.playSFXWithPitch('boss_warning', 1.3); break; } }
    playElementUpgrade() { this.playSFX('element_upgrade'); }
    playBossWarning() { this.playSFX('boss_warning'); }
    playBossDefeat() { this.playSFX('boss_defeat'); }
    playDeadend() { this.playSFX('deadend'); }
    playAchievement() { this.playSFX('achievement'); }
    playButtonClick() { this.playSFX('button_click'); }
    playLevelComplete() { this.playSFX('level_complete'); }

    async switchToBossMusic() { await this.playMusic('music_boss', true); }
    async switchToAmbientMusic() { await this.playMusic('music_ambient', true); }

    fadeMusic(duration = 500) { if (!this.musicGain) return; const start = this.musicGain.gain.value; const startTime = this.audioCtx.currentTime; const endTime = startTime + duration / 1000; this.musicGain.gain.cancelScheduledValues(startTime); this.musicGain.gain.setValueAtTime(start, startTime); this.musicGain.gain.linearRampToValueAtTime(0, endTime); setTimeout(() => this.stopMusic(), duration); }
    getState() { return this.audioCtx?.state || 'unavailable'; }
}

export const audioManager = new AudioManager();
if (typeof window !== 'undefined') { window.AudioManager = AudioManager; window.audioManager = audioManager; }