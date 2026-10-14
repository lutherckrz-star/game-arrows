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
        this._userGestureHandled = false;
        this._pendingSfxEnabled = true;
        this._pendingMusicEnabled = true;
    }

    async init() {
        if (this.isInitialized) return;
        
        // Don't create AudioContext yet - wait for user gesture
        this._bindUserGesture();
        
        await this.loadSFX();
        
        this.isInitialized = true;
        console.log('AudioManager initialized (pending user gesture)');
    }

    _bindUserGesture() {
        if (this._userGestureHandled) return;
        const resumeAudio = () => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            this._userGestureHandled = true;
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
        };
        document.addEventListener('click', resumeAudio, { once: true, passive: true });
        document.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
        document.addEventListener('keydown', resumeAudio, { once: true, passive: true });
    }

    _ensureAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 1;
            this.masterGain.connect(this.audioCtx.destination);

            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.audioCtx.createGain();
            this.musicGain.connect(this.masterGain);
            
            // Apply pending settings
            this.sfxGain.gain.value = this._pendingSfxEnabled ? 1 : 0;
            this.musicGain.gain.value = this._pendingMusicEnabled ? 1 : 0;
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    async loadSFX() {
        const sfxList = [
            { key: 'arrow_out', volume: CONFIG.VOLUME.SFX_ARROW_OUT },
            { key: 'arrow_blocked', volume: CONFIG.VOLUME.SFX_ARROW_BLOCKED },
            { key: 'combo', volume: CONFIG.VOLUME.SFX_COMBO },
            { key: 'level_complete', volume: CONFIG.VOLUME.SFX_LEVEL_COMPLETE },
            { key: 'button_click', volume: CONFIG.VOLUME.SFX_BUTTON_CLICK },
            { key: 'reaction', volume: CONFIG.VOLUME.SFX_REACTION },
            { key: 'element_upgrade', volume: CONFIG.VOLUME.SFX_ELEMENT_UPGRADE },
            { key: 'boss_warning', volume: CONFIG.VOLUME.SFX_BOSS_WARNING },
            { key: 'boss_defeat', volume: CONFIG.VOLUME.SFX_BOSS_DEFEAT },
            { key: 'deadend', volume: CONFIG.VOLUME.SFX_DEADEND },
            { key: 'achievement', volume: CONFIG.VOLUME.SFX_ACHIEVEMENT },
            { key: 'combo_escalation', volume: CONFIG.VOLUME.SFX_COMBO_ESCALATION }
        ];

        // Store config for lazy creation
        this._sfxConfigs = {};
        for (const sfx of sfxList) {
            this._sfxConfigs[sfx.key] = sfx;
        }
    }

    createProceduralSFX(type) {
        // Create buffer lazily when audioCtx is available
        this._ensureAudioContext();
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

    _getSFXBuffer(key) {
        if (!this.sfxBuffers[key] && this._sfxConfigs[key]) {
            this.sfxBuffers[key] = this.createProceduralSFX(key);
        }
        return this.sfxBuffers[key];
    }

    resume() {
        this._ensureAudioContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playSFX(key, options = {}) {
        this._ensureAudioContext();
        const buffer = this._getSFXBuffer(key);
        if (!this.sfxEnabled || !this.audioCtx || !buffer) return;
        
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        
        const gain = this.audioCtx.createGain();
        gain.gain.value = (this._sfxConfigs[key]?.volume ?? 1) * (this.sfxEnabled ? 1 : 0);
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
        // Use procedural music directly (no WAV files in build)
        this.playProceduralMusic(key);
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

    setSFXEnabled(enabled) { 
        this.sfxEnabled = enabled; 
        this._pendingSfxEnabled = enabled;
        if (this.sfxGain) this.sfxGain.gain.value = enabled ? 1 : 0; 
    }
    setMusicEnabled(enabled) { 
        this.musicEnabled = enabled; 
        this._pendingMusicEnabled = enabled;
        if (this.musicGain) this.musicGain.gain.value = enabled ? 1 : 0; 
        if (!enabled) this.stopMusic(); 
    }
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