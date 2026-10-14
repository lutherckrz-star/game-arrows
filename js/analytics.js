/**
 * Arrow Escape — Elemental
 * Analytics Manager - Event tracking & funnel analysis
 */

import { CONFIG } from './config.js';

export class AnalyticsManager {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.lastEventTime = 0;
        this.eventCountThisSecond = 0;
    }

    init() {
        this.track('session_start', { sessionId: this.sessionId });
        
        // Track session end on page hide
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('session_end', { 
                    sessionId: this.sessionId, 
                    duration: Date.now() - this.sessionStart 
                });
            } else {
                this.sessionStart = Date.now();
                this.track('session_resume', { sessionId: this.sessionId });
            }
        });

        // Track before unload
        window.addEventListener('beforeunload', () => {
            this.track('session_end', { 
                sessionId: this.sessionId, 
                duration: Date.now() - this.sessionStart 
            });
        });
    }

    generateSessionId() {
        return 'ses_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    track(eventName, data = {}) {
        // Rate limiting
        const now = Date.now();
        if (now - this.lastEventTime < 1000) {
            this.eventCountThisSecond++;
            if (this.eventCountThisSecond > CONFIG.ANALYTICS_RATE_LIMIT) {
                return; // Drop event
            }
        } else {
            this.eventCountThisSecond = 1;
            this.lastEventTime = now;
        }

        const event = {
            name: eventName,
            timestamp: now,
            sessionId: this.sessionId,
            data: data
        };

        this.events.push(event);
        
        // Keep only last N events
        if (this.events.length > CONFIG.ANALYTICS_MAX_EVENTS) {
            this.events.shift();
        }

        // Send to CrazyGames if available
        if (window.CrazyGames?.SDK?.analytics) {
            try {
                window.CrazyGames.SDK.analytics.track(eventName, data);
            } catch (e) {}
        }

        // Console log in debug mode
        if (CONFIG.DEBUG) {
            console.log('[Analytics]', eventName, data);
        }
    }

    // Funnel tracking
    trackFunnel(step, data = {}) {
        this.track(`funnel_${step}`, data);
    }

    // Ad funnel
    trackAdFunnel(step, data = {}) {
        this.track(`ad_${step}`, data);
    }

    // Performance metrics
    trackPerformance(metrics) {
        this.track('performance', metrics);
    }

    // Get events for debugging
    getEvents() {
        return [...this.events];
    }

    // Get session data
    getSessionData() {
        return {
            sessionId: this.sessionId,
            startTime: this.sessionStart,
            duration: Date.now() - this.sessionStart,
            eventCount: this.events.length
        };
    }

    // Save to localStorage (for persistence)
    save() {
        try {
            localStorage.setItem('arrowEscape_analytics', JSON.stringify({
                events: this.events.slice(-50), // Keep last 50
                sessionId: this.sessionId,
                sessionStart: this.sessionStart
            }));
        } catch (e) {}
    }

    load() {
        try {
            const saved = localStorage.getItem('arrowEscape_analytics');
            if (saved) {
                const data = JSON.parse(saved);
                this.events = data.events || [];
                this.sessionId = data.sessionId || this.sessionId;
                this.sessionStart = data.sessionStart || this.sessionStart;
            }
        } catch (e) {}
    }
}

export const analytics = new AnalyticsManager();

if (typeof window !== 'undefined') {
    window.AnalyticsManager = AnalyticsManager;
    window.analytics = analytics;
}