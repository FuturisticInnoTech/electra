import { APP_CONSTANTS } from './config.js';
import { ui } from './ui.js';
import { store } from './store.js';
import { authManager } from './auth.js';
import { aiModule } from './ai.js';
import { simulationModule } from './simulation.js';
import { quizModule } from './quiz.js';

export const journeyEngine = {
    isActive: false,
    currentStepIndex: 0,
    steps: APP_CONSTANTS.LEARNING_STEPS,

    init() {
        console.log("Journey Engine Initialized");
        this.renderTimelineDots();
    },

    start() {
        this.isActive = true;
        const engine = document.getElementById('journey-engine');
        engine.classList.remove('hidden');
        engine.classList.add('opacity-100');
        document.body.style.overflow = 'hidden';
        this.goToStep(0);
    },

    exit() {
        if (!this.isActive) return;
        
        this.isActive = false;
        const engine = document.getElementById('journey-engine');
        engine.classList.add('hidden');
        engine.classList.remove('opacity-100');
        document.body.style.overflow = 'auto';
        ui.showNotification("Exited Simulation Mode.");
    },

    goToStep(index) {
        if (index < 0 || index >= this.steps.length) return;
        
        this.currentStepIndex = index;
        const step = this.steps[index];
        const container = document.getElementById('step-container');
        
        // Render the step
        container.innerHTML = this.renderStepTemplate(step);
        
        // Update UI elements
        this.updateUI();
        
        // Contextual AI update
        aiModule.updateContext(step);

        // Initialize embedded simulation if step is 'Voting'
        if (step.title.includes('Voting')) {
            setTimeout(() => {
                const simTarget = document.getElementById('embedded-simulation');
                if (simTarget) simTarget.innerHTML = simulationModule.renderInline();
                simulationModule.init();
            }, 500);
        }
    },

    next() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.goToStep(this.currentStepIndex + 1);
        } else {
            this.exit();
            ui.showNotification("Journey Completed! Redirecting to home...", "success");
        }
    },

    prev() {
        if (this.currentStepIndex > 0) {
            this.goToStep(this.currentStepIndex - 1);
        }
    },

    renderStepTemplate(step) {
        return `
            <div class="h-full w-full flex flex-col md:flex-row items-center animate-fade-in overflow-y-auto">
                <!-- LEFT SIDE: Content -->
                <div class="w-full md:w-1/2 p-8 md:p-24 space-y-6 md:space-y-8 mt-20 md:mt-0">
                    <div class="space-y-2">
                        <span class="text-indigo-400 font-bold tracking-widest text-xs md:text-sm uppercase">Stage 0${step.id}</span>
                        <h2 class="text-4xl md:text-7xl font-bold font-outfit leading-tight">${step.title}</h2>
                    </div>
                    <p class="text-base md:text-lg text-slate-400 leading-relaxed max-w-lg">${step.desc}</p>
                    
                    <div class="grid grid-cols-2 gap-4 md:gap-8 pt-4 md:pt-8">
                        <div>
                            <p class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Duration</p>
                            <p class="text-indigo-300 font-medium text-sm md:text-base">${step.duration}</p>
                        </div>
                        <div>
                            <p class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Participants</p>
                            <p class="text-cyan-300 font-medium text-sm md:text-base">${step.participants}</p>
                        </div>
                    </div>
                </div>

                <!-- RIGHT SIDE: Visual/Interactive -->
                <div class="w-full md:w-1/2 h-full flex items-center justify-center p-8 md:p-12 bg-white/5 pb-32 md:pb-12">
                    <div id="step-interactive-element" class="w-full max-w-lg">
                        ${this.getStepVisual(step)}
                    </div>
                </div>
            </div>
        `;
    },

    getStepVisual(step) {
        if (step.title.includes('Voting')) {
            return `<div id="embedded-simulation" class="w-full animate-float"></div>`;
        }

        let animationHtml = '';
        const title = step.title.toLowerCase();

        if (title.includes('announcement')) {
            animationHtml = `
                <div class="relative flex items-center justify-center py-10">
                    <div class="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
                    <div class="relative z-10 text-8xl animate-bounce">📢</div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-24 h-24 border-4 border-indigo-500 rounded-full animate-ping opacity-20"></div>
                        <div class="w-40 h-40 border-4 border-indigo-400 rounded-full animate-ping opacity-10" style="animation-delay: 0.5s"></div>
                    </div>
                    <div class="absolute -bottom-4 bg-indigo-600 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">Official Declaration</div>
                </div>
            `;
        } else if (title.includes('nomination')) {
            animationHtml = `
                <div class="relative py-10 flex flex-col items-center space-y-4">
                    <div class="glass w-48 h-64 rounded-xl border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                        <div class="w-full h-2 bg-slate-700 rounded mb-4"></div>
                        <div class="w-2/3 h-2 bg-slate-700 rounded mb-4"></div>
                        <div class="w-full h-2 bg-slate-700 rounded mb-8"></div>
                        <div class="absolute bottom-10 right-6 text-4xl animate-float">✍️</div>
                        <div class="w-1/2 h-4 bg-indigo-500/20 rounded self-end"></div>
                    </div>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verification in Progress</p>
                </div>
            `;
        } else if (title.includes('campaign')) {
            animationHtml = `
                <div class="relative py-10 flex items-center justify-center overflow-hidden h-64">
                    <div class="absolute w-full h-full flex items-center justify-center">
                        <div class="w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                    </div>
                    <div class="flex space-x-4 items-end">
                        <div class="w-16 h-24 glass rounded-t-full border-b-0 border-white/10 flex items-center justify-center text-3xl animate-float" style="animation-delay: 0s">📣</div>
                        <div class="w-16 h-32 glass rounded-t-full border-b-0 border-white/10 flex items-center justify-center text-3xl animate-float" style="animation-delay: 0.3s">🚩</div>
                        <div class="w-16 h-20 glass rounded-t-full border-b-0 border-white/10 flex items-center justify-center text-3xl animate-float" style="animation-delay: 0.6s">📢</div>
                    </div>
                    <!-- Buzzing waves -->
                    <div class="absolute top-10 left-1/2 -translate-x-1/2 w-full flex justify-center space-x-1">
                        <div class="w-1 h-8 bg-indigo-500/40 rounded-full animate-pulse" style="animation-delay: 0.1s"></div>
                        <div class="w-1 h-12 bg-indigo-500/40 rounded-full animate-pulse" style="animation-delay: 0.3s"></div>
                        <div class="w-1 h-16 bg-indigo-500/40 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                        <div class="w-1 h-10 bg-indigo-500/40 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            `;
        } else if (title.includes('counting')) {
            animationHtml = `
                <div class="relative py-10 flex flex-col items-center justify-center space-y-6">
                    <div class="flex items-end space-x-4 h-32">
                        <div class="w-8 bg-indigo-500 rounded-t-lg transition-all duration-1000 animate-[grow_2s_ease-out_infinite]" style="height: 60%"></div>
                        <div class="w-8 bg-cyan-400 rounded-t-lg transition-all duration-1000 animate-[grow_2s_ease-out_infinite_0.5s]" style="height: 90%"></div>
                        <div class="w-8 bg-slate-600 rounded-t-lg transition-all duration-1000 animate-[grow_2s_ease-out_infinite_1s]" style="height: 40%"></div>
                    </div>
                    <style>
                        @keyframes grow { 0% { height: 10%; } 50% { height: var(--h); } 100% { height: 10%; } }
                    </style>
                    <div class="glass px-6 py-2 rounded-full text-[10px] font-bold text-indigo-400 animate-pulse uppercase tracking-widest">Live Result Processing</div>
                </div>
            `;
        }

        return `
            <div class="glass p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] glow border-white/10 relative overflow-hidden group min-h-[250px] md:min-h-[300px] flex flex-col items-center justify-center">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                <div class="w-full relative z-10 text-center">
                    ${animationHtml}
                </div>
            </div>
        `;
    },

    getStepIcon(title) {
        if (title.includes('Announcement')) return '📢';
        if (title.includes('Nomination')) return '📝';
        if (title.includes('Campaign')) return '📣';
        if (title.includes('Voting')) return '🗳️';
        if (title.includes('Counting')) return '📊';
        return '✨';
    },

    updateUI() {
        const progressText = document.getElementById('journey-progress-text');
        const progressBar = document.getElementById('step-progress-bar');
        const railProgress = document.getElementById('timeline-rail-progress');
        const prevBtn = document.getElementById('prev-step');
        
        const nextBtn = document.getElementById('next-step');
        
        const total = this.steps.length;
        const current = this.currentStepIndex + 1;
        const percent = (current / total) * 100;
        
        if (progressText) progressText.innerText = `Step ${current}/${total}`;
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (railProgress) railProgress.style.height = `${percent}%`;
        if (prevBtn) prevBtn.disabled = this.currentStepIndex === 0;
        
        if (nextBtn) {
            nextBtn.innerText = this.currentStepIndex === total - 1 ? 'End simulation 🏁' : 'Next Step →';
        }

        this.updateTimelineDots();
    },

    renderTimelineDots() {
        const rail = document.getElementById('side-timeline');
        if (!rail) return;
        rail.classList.add('hidden', 'lg:flex'); // Hide on mobile/tablet
        this.steps.forEach((step, i) => {
            const dot = document.createElement('button');
            dot.className = `w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-900 transition-all hover:scale-125 z-10 timeline-dot`;
            dot.title = step.title;
            dot.onclick = () => this.goToStep(i);
            rail.appendChild(dot);
        });
    },

    updateTimelineDots() {
        const dots = document.querySelectorAll('.timeline-dot');
        dots.forEach((dot, i) => {
            if (i <= this.currentStepIndex) {
                dot.classList.add('border-indigo-500', 'bg-indigo-500/20');
            } else {
                dot.classList.remove('border-indigo-500', 'bg-indigo-500/20');
            }
        });
    }
};
