import { APP_CONSTANTS } from './config.js';
import { authManager } from './auth.js';
import { store } from './store.js';
import { ui } from './ui.js';
import { aiModule } from './ai.js';
import { quizModule } from './quiz.js';

export const learningModule = {
    currentStepIndex: 0,
    selectedRole: 'voter',
    xp: 0,

    render() {
        return `
            <div class="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in">
                <!-- 1. TOP DASHBOARD (PROGRESS + RESUME) -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 glass p-8 rounded-[2.5rem] border-white/5 glow flex flex-col md:flex-row items-center gap-8">
                        <div class="relative w-32 h-32 flex-shrink-0">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-800" />
                                <circle id="dashboard-progress-circle" cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" 
                                    stroke-dasharray="364.4" stroke-dashoffset="364.4"
                                    class="text-indigo-500 transition-all duration-1000 ease-out" />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span id="dashboard-progress-percent" class="text-2xl font-bold font-outfit">0%</span>
                                <span class="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Progress</span>
                            </div>
                        </div>
                        <div class="flex-grow text-center md:text-left space-y-4">
                            <div>
                                <h2 class="text-2xl font-bold font-outfit flex items-center justify-center md:justify-start gap-3">
                                    Your Learning Journey 
                                    <span id="user-level-badge" class="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-[10px] text-indigo-400">Beginner</span>
                                </h2>
                                <p class="text-slate-400 text-sm mt-1">Master the democratic process step-by-step.</p>
                            </div>
                            <button onclick="learningModule.resumeLearning()" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm transition-all glow active:scale-95">
                                Continue Learning 🚀
                            </button>
                        </div>
                    </div>

                    <div class="glass p-8 rounded-[2.5rem] border-white/5 space-y-6">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Stats</span>
                            <div class="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-xs">📊</div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p id="stat-xp" class="text-xl font-bold font-outfit text-indigo-400">0</p>
                                <p class="text-[9px] uppercase tracking-widest text-slate-500 font-bold">XP Points</p>
                            </div>
                            <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p id="stat-accuracy" class="text-xl font-bold font-outfit text-cyan-400">0%</p>
                                <p class="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Quiz Accuracy</p>
                            </div>
                            <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p id="stat-steps" class="text-xl font-bold font-outfit text-emerald-400">0/5</p>
                                <p class="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Steps Done</p>
                            </div>
                            <div id="stat-badges-container" class="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-1 overflow-x-auto">
                                <span class="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Badges</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. INTERACTIVE JOURNEY SYSTEM (CORE) -->
                <div class="relative">
                    <!-- Navigation Indicators -->
                    <div class="flex justify-center mb-10 overflow-x-auto py-4 gap-4 no-scrollbar">
                        ${APP_CONSTANTS.LEARNING_STEPS.map((step, i) => `
                            <button onclick="learningModule.jumpToStep(${i})" id="step-indicator-${i}" 
                                class="flex-shrink-0 w-12 h-12 rounded-2xl border transition-all flex items-center justify-center font-bold text-sm step-indicator ${i === 0 ? 'active border-indigo-500 bg-indigo-600/20 text-white' : 'border-white/10 text-slate-500'}">
                                ${i + 1}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Step Content Card -->
                    <div id="step-content-card" class="glass p-8 md:p-12 rounded-[3rem] border-white/5 glow relative min-h-[500px]">
                        <!-- Dynamic content injected here -->
                    </div>
                </div>
            </div>

            <style>
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .step-indicator.active { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
                .step-indicator.completed { border-color: #10b981; background: rgba(16, 185, 129, 0.1); color: #10b981; }
                
                .interaction-glow { animation: interaction-glow 2s infinite; }
                @keyframes interaction-glow {
                    0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.1); }
                    50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.3); }
                }
            </style>
        `;
    },

    async init() {
        console.log("Learning Module Initialized");
        if (authManager.user) {
            await store.initUserProgress(authManager.user.uid);
        }
        this.selectedRole = 'voter';
        this.updateDashboard();
        this.showStep(this.currentStepIndex);
    },

    updateDashboard() {
        if (!store.userProgress) return;

        const completed = store.userProgress.completedSteps.length;
        const total = APP_CONSTANTS.LEARNING_STEPS.length;
        const percent = Math.round((completed / total) * 100);

        // Update Progress Circle
        const circle = document.getElementById('dashboard-progress-circle');
        const text = document.getElementById('dashboard-progress-percent');
        if (circle) {
            const offset = 364.4 - (364.4 * percent) / 100;
            circle.style.strokeDashoffset = offset;
        }
        if (text) text.innerText = `${percent}%`;

        // Update Stats
        const xpEl = document.getElementById('stat-xp');
        const accEl = document.getElementById('stat-accuracy');
        const stepEl = document.getElementById('stat-steps');
        const badgeEl = document.getElementById('stat-badges-container');
        const levelEl = document.getElementById('user-level-badge');

        if (xpEl) xpEl.innerText = store.userProgress.xp || 0;
        if (accEl) accEl.innerText = `${store.userProgress.quizAccuracy || 0}%`;
        if (stepEl) stepEl.innerText = `${completed}/${total}`;

        if (badgeEl) {
            badgeEl.innerHTML = (store.userProgress.badges || []).map(b => `
                <div title="${b}" class="w-10 h-10 flex-shrink-0 bg-indigo-600/10 rounded-xl flex items-center justify-center border border-indigo-500/20 group relative">
                    <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span class="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">${b}</span>
                </div>
            `).join('');
            if (store.userProgress.badges?.length === 0) badgeEl.innerHTML = '<span class="text-[8px] text-slate-600 italic">No badges yet</span>';
        }

        if (levelEl) {
            let level = 'Beginner';
            if (completed >= 2) level = 'Aware Citizen';
            if (completed >= 5) level = 'Election Pro';
            levelEl.innerText = level;
        }

        // Update step indicators
        APP_CONSTANTS.LEARNING_STEPS.forEach((s, i) => {
            const ind = document.getElementById(`step-indicator-${i}`);
            if (ind) {
                if (store.userProgress.completedSteps.includes(s.id)) {
                    ind.classList.add('completed');
                }
            }
        });
    },


    jumpToStep(index) {
        this.currentStepIndex = index;
        this.showStep(index);
    },

    resumeLearning() {
        const completed = store.userProgress?.completedSteps || [];
        const next = APP_CONSTANTS.LEARNING_STEPS.findIndex(s => !completed.includes(s.id));
        this.currentStepIndex = next === -1 ? 0 : next;
        this.showStep(this.currentStepIndex);
        ui.showNotification("Resuming your journey...");
    },

    showStep(index) {
        this.currentStepIndex = index;
        const step = APP_CONSTANTS.LEARNING_STEPS[index];
        const container = document.getElementById('step-content-card');
        if (!container) return;

        // Update indicators
        document.querySelectorAll('.step-indicator').forEach((ind, i) => {
            ind.classList.toggle('active', i === index);
            ind.classList.toggle('border-indigo-500', i === index);
            ind.classList.toggle('bg-indigo-600/20', i === index);
            ind.classList.toggle('text-white', i === index);
            if (i !== index && !ind.classList.contains('completed')) {
                ind.classList.remove('border-indigo-500', 'bg-indigo-600/20', 'text-white');
                ind.classList.add('border-white/10', 'text-slate-500');
            }
        });

        const isCompleted = store.userProgress?.completedSteps.includes(step.id);

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                <!-- Left: Info -->
                <div class="space-y-8">
                    <div class="space-y-4">
                        <div class="flex items-center gap-4">
                            <span class="text-6xl font-bold text-indigo-500/20 font-outfit">0${step.id}</span>
                            <h3 class="text-3xl md:text-4xl font-bold font-outfit">${step.title}</h3>
                        </div>
                        <p class="text-slate-300 text-lg leading-relaxed">${step.desc}</p>
                        
                        <div class="bg-indigo-600/10 border-l-4 border-indigo-500 p-5 rounded-r-2xl">
                            <p class="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-2">Voter Insight</p>
                            <p class="text-sm text-slate-200 italic">"${step.roleContent.voter}"</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <button onclick="learningModule.toggleLearnMore()" class="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                            <span id="learn-more-icon">⊕</span> Learn More Detail
                        </button>
                        <div id="learn-more-content" class="hidden glass p-6 rounded-2xl border-white/5 text-xs text-slate-400 leading-relaxed animate-fade-in">
                            ${step.learnMore}
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-4 pt-4">
                        <button onclick="learningModule.askElectra('${step.title}')" class="px-6 py-3 glass rounded-xl text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                            <span>🤖</span> Ask Electra
                        </button>
                    </div>
                </div>

                <!-- Right: Interaction -->
                <div class="flex flex-col">
                    <div class="flex-grow glass p-8 rounded-[2rem] border-white/10 bg-indigo-500/[0.02] flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden interaction-glow">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        
                        <div id="interaction-area" class="w-full">
                            ${this.renderInteraction(step, isCompleted)}
                        </div>
                    </div>

                    <div class="flex items-center justify-between mt-8">
                        <button onclick="learningModule.prevStep()" ${index === 0 ? 'disabled' : ''} class="p-4 glass rounded-2xl hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed">←</button>
                        
                        ${(index + 1) % 2 === 0 && !isCompleted ? `
                            <button onclick="learningModule.startInlineQuiz()" class="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-sm glow transition-all active:scale-95">Take Quiz ✨</button>
                        ` : `
                            <button onclick="learningModule.nextStep()" class="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm glow transition-all active:scale-95">
                                ${index === APP_CONSTANTS.LEARNING_STEPS.length - 1 ? 'Finish Journey' : 'Next Step →'}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    renderInteraction(step, isCompleted) {
        if (isCompleted) {
            return `
                <div class="space-y-4 py-10 animate-bounce">
                    <div class="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-4xl">✅</div>
                    <h4 class="text-xl font-bold text-emerald-400">Step Completed</h4>
                    <p class="text-xs text-slate-500">You've mastered this stage. Continue to the next step or revisit the interaction below.</p>
                    <button onclick="learningModule.resetInteraction(${step.id})" class="text-[10px] uppercase font-bold text-indigo-400 hover:underline">Redo Interaction</button>
                </div>
            `;
        }

        const data = step.interaction;
        switch (data.type) {
            case 'check_list':
                return `
                    <div class="space-y-6">
                        <h4 class="text-xl font-bold font-outfit">${data.title}</h4>
                        <div class="space-y-3 text-left">
                            ${data.items.map((item, i) => `
                                <label class="flex items-center gap-4 p-4 glass rounded-xl border-white/5 hover:bg-white/5 cursor-pointer transition-all">
                                    <input type="checkbox" class="w-5 h-5 rounded border-indigo-500 bg-transparent text-indigo-600 focus:ring-indigo-500" onchange="learningModule.checkChecklist(${step.id})">
                                    <span class="text-sm text-slate-300">${item}</span>
                                </label>
                            `).join('')}
                        </div>
                        <button id="interaction-submit" disabled onclick="learningModule.completeInteraction(${step.id})" class="w-full py-4 bg-slate-800 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed">Complete Interaction</button>
                    </div>
                `;
            case 'form':
                return `
                    <div class="space-y-6">
                        <h4 class="text-xl font-bold font-outfit">${data.title}</h4>
                        <div class="space-y-4 text-left">
                            ${data.fields.map(f => `
                                <div>
                                    <label class="block text-[10px] uppercase font-bold text-slate-500 mb-2 ml-1">${f.label}</label>
                                    <input type="${f.type}" name="${f.name}" class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="learningModule.completeInteraction(${step.id})" class="w-full py-4 bg-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">Submit Nomination</button>
                    </div>
                `;
            case 'choice':
                return `
                    <div class="space-y-6">
                        <h4 class="text-xl font-bold font-outfit">${data.title}</h4>
                        <div class="grid grid-cols-1 gap-3">
                            ${data.options.map(opt => `
                                <button onclick="learningModule.selectChoice(${step.id}, '${opt.id}')" class="p-4 glass rounded-xl border-white/5 hover:border-indigo-500/50 hover:bg-white/5 text-left transition-all group">
                                    <p class="text-sm font-bold group-hover:text-indigo-400">${opt.label}</p>
                                    <p class="text-[10px] text-slate-500 mt-1">${opt.impact}</p>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'simulated_voting':
                return `
                    <div class="space-y-6">
                        <h4 class="text-xl font-bold font-outfit">${data.title}</h4>
                        <div class="p-6 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-inner">
                            <div class="grid grid-cols-1 gap-4">
                                <div class="flex items-center justify-between p-3 glass rounded-lg">
                                    <span class="text-sm font-bold">Candidate A</span>
                                    <button onclick="learningModule.completeInteraction(${step.id})" class="w-10 h-10 bg-indigo-600 rounded-full shadow-lg border-4 border-slate-800"></button>
                                </div>
                                <div class="flex items-center justify-between p-3 glass rounded-lg">
                                    <span class="text-sm font-bold">Candidate B</span>
                                    <button onclick="learningModule.completeInteraction(${step.id})" class="w-10 h-10 bg-indigo-600 rounded-full shadow-lg border-4 border-slate-800"></button>
                                </div>
                            </div>
                        </div>
                        <p class="text-[10px] text-slate-500">Click a blue button to cast your mock vote.</p>
                    </div>
                `;
            case 'result_tabulation':
                return `
                    <div class="space-y-6">
                        <h4 class="text-xl font-bold font-outfit">${data.title}</h4>
                        <div class="space-y-4">
                            <div class="flex items-center gap-4">
                                <div class="flex-grow h-4 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-indigo-500" style="width: 65%"></div>
                                </div>
                                <span class="text-xs font-bold">Candidate A (65%)</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="flex-grow h-4 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-cyan-500" style="width: 35%"></div>
                                </div>
                                <span class="text-xs font-bold">Candidate B (35%)</span>
                            </div>
                        </div>
                        <button onclick="learningModule.completeInteraction(${step.id})" class="w-full py-4 bg-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">Verify & Complete</button>
                    </div>
                `;
            default: return `<p>Interaction Coming Soon</p>`;
        }
    },

    toggleLearnMore() {
        const content = document.getElementById('learn-more-content');
        const icon = document.getElementById('learn-more-icon');
        if (content) {
            const isHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden');
            icon.innerText = isHidden ? '⊖' : '⊕';
        }
    },

    askElectra(title) {
        aiModule.updateContext({ title });
        app.navigateTo('ai');
        // Trigger initial message in AI module
        setTimeout(() => {
            const input = document.getElementById('ai-chat-input');
            if (input) {
                input.value = `Tell me more about ${title} and why it matters.`;
                aiModule.handleInitialMessage();
            }
        }, 500);
    },

    checkChecklist(stepId) {
        const checkboxes = document.querySelectorAll('#interaction-area input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(c => c.checked);
        const btn = document.getElementById('interaction-submit');
        if (btn) {
            btn.disabled = !allChecked;
            btn.classList.toggle('opacity-50', !allChecked);
            btn.classList.toggle('cursor-not-allowed', !allChecked);
            btn.classList.toggle('bg-indigo-600', allChecked);
            btn.classList.toggle('bg-slate-800', !allChecked);
        }
    },

    selectChoice(stepId, choiceId) {
        ui.showNotification("Choice recorded!", "success");
        this.completeInteraction(stepId);
    },

    async completeInteraction(stepId) {
        const step = APP_CONSTANTS.LEARNING_STEPS.find(s => s.id === stepId);
        const xp = step.interaction.xp || 50;

        if (authManager.user) {
            await store.updateProgress(authManager.user.uid, stepId, xp);
            ui.showNotification(`+${xp} XP Earned! Step Completed.`, "success");
            this.updateDashboard();
            this.showStep(this.currentStepIndex);
        } else {
            ui.showNotification("Sign in to save progress and earn XP!", "info");
            // Still show as completed for the session
            if (!store.userProgress) store.userProgress = { completedSteps: [], xp: 0 };
            if (!store.userProgress.completedSteps.includes(stepId)) {
                store.userProgress.completedSteps.push(stepId);
                store.userProgress.xp += xp;
                this.updateDashboard();
                this.showStep(this.currentStepIndex);
            }
        }
    },

    resetInteraction(stepId) {
        // Just for demo, usually would remove from store
        ui.showNotification("Interaction reset.");
        this.showStep(this.currentStepIndex);
    },

    prevStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.showStep(this.currentStepIndex);
        }
    },

    nextStep() {
        if (this.currentStepIndex < APP_CONSTANTS.LEARNING_STEPS.length - 1) {
            this.currentStepIndex++;
            this.showStep(this.currentStepIndex);
        } else {
            ui.showNotification("Journey Completed! Well done.", "success");
            app.navigateTo('home');
        }
    },

    startInlineQuiz() {
        quizModule.startQuiz();
        ui.showNotification("Starting Module Quiz...");
    }
};
