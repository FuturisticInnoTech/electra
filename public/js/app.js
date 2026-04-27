import { ui } from './ui.js';
import { authManager } from './auth.js';
import { journeyEngine } from './journey.js';
import { aiModule } from './ai.js';
import { AI_ENABLED } from './config.js';
import { simulationModule } from './simulation.js';
import { quizModule } from './quiz.js';
import { store } from './store.js';
import { learningModule } from './learning.js';

export const app = {
    init() {
        console.log("Electra Journey Engine Initializing...");
        
        // Expose to window for HTML handlers
        window.app = this;
        window.journeyEngine = journeyEngine;
        window.ui = ui;
        window.authManager = authManager;
        if (AI_ENABLED) {
            window.aiModule = aiModule;
        }
        window.simulationModule = simulationModule;
        window.quizModule = quizModule;
        window.store = store;
        window.learningModule = learningModule;

        ui.init();
        authManager.init();
        journeyEngine.init();
        
        console.log("Electra Journey Engine Ready.");
    },

    navigateTo(pageId) {
        // Ensure simulation mode is closed if navigating via navbar
        if (pageId !== 'simulation') {
            journeyEngine.exit();
        }

        if (pageId === 'home') {
            ui.navigateTo('home');
        } else if (pageId === 'simulation') {
            journeyEngine.start();
        } else {
            ui.navigateTo(pageId);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
