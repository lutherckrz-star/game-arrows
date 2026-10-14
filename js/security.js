/**
 * Arrow Escape — Elemental
 * Security Manager - Anti-cheat & validation
 */

import { CONFIG } from './config.js';

export class SecurityManager {
    constructor() {
        this.devToolsDetected = false;
        this.lastDevToolsCheck = 0;
    }

    init() {
        this.startDevToolsDetection();
        this.validateSaveIntegrity();
    }

    // Validate score
    validateScore(levelNum, score, arrowCount, timeMs) {
        const maxPossibleScore = arrowCount * CONFIG.MAX_SCORE_MULTIPLIER;
        if (score > maxPossibleScore) {
            this.reportCheat('score_overflow', { score, maxPossibleScore, levelNum });
            return false;
        }
        if (timeMs <= 0 || timeMs > CONFIG.MAX_LEVEL_TIME) {
            this.reportCheat('invalid_time', { timeMs, levelNum });
            return false;
        }
        return true;
    }

    // Validate save checksum
    validateSaveIntegrity(saveData) {
        if (!saveData) return false;
        
        const checksum = this.calculateChecksum(saveData);
        if (saveData.checksum !== checksum) {
            this.reportCheat('checksum_mismatch', { expected: checksum, actual: saveData.checksum });
            return false;
        }
        return true;
    }

    calculateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return (Math.abs(hash) % CONFIG.CHECKSUM_MOD).toString();
    }

    addChecksum(data) {
        return { ...data, checksum: this.calculateChecksum(data) };
    }

    // DevTools detection
    startDevToolsDetection() {
        setInterval(() => {
            const threshold = CONFIG.DEVTOOLS_THRESHOLD;
            const isOpen = window.outerHeight - window.innerHeight > threshold || 
                          window.outerWidth - window.innerWidth > threshold;
            
            if (isOpen && !this.devToolsDetected) {
                this.devToolsDetected = true;
                this.track('devtools_opened');
            } else if (!isOpen) {
                this.devToolsDetected = false;
            }
        }, 1000);
    }

    // Report cheat attempt
    reportCheat(type, data) {
        console.warn('[Security] Cheat detected:', type, data);
        this.track('cheat_attempt', { type, ...data });
    }

    // Track security events
    track(event, data) {
        if (window.analytics) {
            window.analytics.track(event, data);
        }
    }

    // Validate action (for sensitive operations)
    validateAction(action, data) {
        const sensitiveActions = ['reset_progress', 'delete_data', 'import_save', 'skip_level'];
        if (sensitiveActions.includes(action)) {
            // Could add additional validation here
            this.track('sensitive_action', { action, ...data });
        }
        return true;
    }
}

export const securityManager = new SecurityManager();

if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;
    window.securityManager = securityManager;
}