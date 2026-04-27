import { app } from './app.js';
import { analytics } from './config.js';
import { logEvent } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import { authManager } from './auth.js';
import { store } from './store.js';
import { learningModule } from './learning.js';
import { quizModule } from './quiz.js';
import { aiModule } from './ai.js';

export const ui = {
    chatHistoryOpen: false,

    init() {
        this.setupEventListeners();
        console.log("UI Initialized");
    },

    setupEventListeners() {
        // AI Trigger logic
        const aiTrigger = document.getElementById('ai-trigger');
        if (aiTrigger) {
            aiTrigger.addEventListener('mouseenter', () => this.toggleAiTooltip(true));
            aiTrigger.addEventListener('mouseleave', () => this.toggleAiTooltip(false));
        }

        // Close mobile menu on resize if desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                this.toggleMobileMenu(false);
            }
        });
    },

    toggleMobileMenu(show) {
        const menu = document.getElementById('mobile-menu');
        if (!menu) return;

        if (show === undefined) {
            menu.classList.toggle('hidden');
        } else {
            if (show) menu.classList.remove('hidden');
            else menu.classList.add('hidden');
        }
    },

    toggleAiTooltip(show) {
        const tooltip = document.getElementById('ai-context-tooltip');
        if (tooltip) {
            if (show) {
                tooltip.classList.remove('hidden');
                tooltip.classList.add('block');
            } else {
                tooltip.classList.add('hidden');
                tooltip.classList.remove('block');
            }
        }
    },

    toggleChatHistory() {
        this.chatHistoryOpen = !this.chatHistoryOpen;
        const drawer = document.getElementById('chat-history-drawer');
        if (drawer) {
            drawer.style.transform = this.chatHistoryOpen ? 'translateX(0)' : 'translateX(100%)';
        }
        
        if (this.chatHistoryOpen && authManager.user) {
            this.renderChatHistory();
        }
    },

    async renderChatHistory() {
        const list = document.getElementById('chat-history-list');
        list.innerHTML = '<p class="text-xs text-slate-500 p-4">Loading history...</p>';
        
        const history = await store.getChatHistory(authManager.user.uid, 'default_chat');
        if (history.length === 0) {
            list.innerHTML = '<p class="text-xs text-slate-500 p-4">No past conversations found.</p>';
            return;
        }

        list.innerHTML = history.map(msg => `
            <div class="p-3 glass rounded-xl border-white/5 space-y-1">
                <p class="text-[10px] font-bold ${msg.sender === 'ai' ? 'text-indigo-400' : 'text-slate-500'} uppercase tracking-widest">${msg.sender}</p>
                <p class="text-xs text-slate-300 line-clamp-2">${msg.text}</p>
            </div>
        `).join('');
    },

    navigateTo(pageId) {
        console.log(`Navigating to: ${pageId}`);
        logEvent(analytics, 'page_view', { page_id: pageId });
        this.toggleAiTooltip(false);
        this.toggleMobileMenu(false);

        // Hide all sections in app-container
        const pages = document.querySelectorAll('#app-container section');
        pages.forEach(p => {
            p.classList.add('hidden-page');
            p.classList.remove('block');
        });

        // Show target page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.remove('hidden-page');
            targetPage.classList.add('block');
        } else {
            this.renderPage(pageId);
        }

        this.updateActiveNavLink(pageId);
        this.updateAiTriggerState(pageId);
    },

    updateAiTriggerState(pageId) {
        const trigger = document.getElementById('ai-trigger');
        if (!trigger) return;
        
        if (pageId === 'ai') {
            trigger.innerHTML = '<span class="text-2xl">🏠</span>';
            trigger.onclick = (e) => {
                e.preventDefault();
                app.navigateTo('home');
            };
            trigger.classList.add('bg-slate-700');
            trigger.classList.remove('bg-indigo-600');
        } else {
            trigger.innerHTML = '<span class="text-2xl animate-float">🤖</span>';
            trigger.onclick = (e) => {
                e.preventDefault();
                app.navigateTo('ai');
            };
            trigger.classList.add('bg-indigo-600');
            trigger.classList.remove('bg-slate-700');
        }
    },

    updateActiveNavLink(pageId) {
        const navLinks = document.querySelectorAll('#main-nav a');
        navLinks.forEach(link => {
            if (link.getAttribute('onclick')?.includes(pageId)) {
                link.classList.add('text-indigo-400');
            } else {
                link.classList.remove('text-indigo-400');
            }
        });
    },

    renderPage(pageId) {
        const container = document.getElementById('app-container');
        let html = '';

        switch(pageId) {
            case 'learning': html = learningModule.render(); break;
            case 'quiz': html = quizModule.render(); break;
            case 'ai': html = aiModule.render(); break;
            default: html = `<div class="text-center py-20"><h2 class="text-3xl font-bold">Coming Soon</h2></div>`;
        }

        const section = document.createElement('section');
        section.id = `page-${pageId}`;
        section.className = 'page-transition';
        section.innerHTML = html;
        container.appendChild(section);

        if (pageId === 'learning') learningModule.init();
        if (pageId === 'quiz') quizModule.init();
        if (pageId === 'ai') aiModule.init();
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 px-6 py-3 rounded-xl glass glow z-[100] transition-all transform translate-x-full border-l-4 ${
            type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-indigo-500'
        }`;
        notification.innerHTML = `<p class="font-medium text-sm">${message}</p>`;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};
