import { APP_CONSTANTS } from './config.js';
import { authManager } from './auth.js';
import { store } from './store.js';
import { ui } from './ui.js';
import { app } from './app.js';
import { learningModule } from './learning.js';

export const quizModule = {
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
    questions: [], // Loaded from DB

    render() {
        return `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    <!-- Main Quiz Area -->
                    <div class="lg:col-span-8 space-y-6 md:space-y-8">
                        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div class="text-center lg:text-left space-y-2 md:space-y-3">
                                <h2 class="text-3xl md:text-5xl font-black font-outfit tracking-tight">Civic Challenge</h2>
                                <p class="text-slate-400 text-sm md:text-lg">Pick your path and prove your civic knowledge.</p>
                            </div>
                            <!-- Question Count Selector (Custom Segmented Control) -->
                            <div class="flex items-center gap-2 glass p-1.5 rounded-2xl border-white/5" id="quiz-length-selector">
                                ${[5, 10, 15, 20].map(val => `
                                    <button onclick="quizModule.setLength(${val})" class="quiz-len-btn px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${val === 10 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}" data-value="${val}">
                                        ${val}
                                    </button>
                                `).join('')}
                                <input type="hidden" id="quiz-count-select" value="10">
                            </div>
                        </div>

                        <div id="quiz-container" class="glass p-4 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border-white/5 relative overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col justify-center">
                            <!-- Progress Bar -->
                            <div class="absolute top-0 left-0 w-full h-1 bg-slate-800">
                                <div id="quiz-progress" class="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700" style="width: 0%"></div>
                            </div>

                            <div id="quiz-content" class="space-y-8 md:space-y-12">
                                <div class="space-y-8 md:space-y-10 py-4">
                                    <!-- Global Shuffle -->
                                    <div class="flex flex-col items-center justify-center p-6 md:p-8 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 group hover:border-indigo-500/50 transition-all cursor-pointer" onclick="quizModule.startQuiz('random')">
                                        <div class="text-4xl md:text-5xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">🔀</div>
                                        <h3 class="text-xl md:text-2xl font-bold">Shuffle All</h3>
                                        <p class="text-indigo-400 text-[10px] md:text-sm font-medium">Random mix from 1000+ questions</p>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <!-- Topic Wise -->
                                        <div class="space-y-4">
                                            <div class="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                                                <div class="w-2 h-2 rounded-full bg-cyan-500"></div>
                                                Choose by Topic
                                            </div>
                                            <div class="flex flex-wrap gap-2">
                                                ${["Constitution", "Process", "History", "Roles", "General"].map(cat => `
                                                    <button onclick="quizModule.startQuiz('category', '${cat}')" class="px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold hover:bg-indigo-600 hover:border-indigo-500 transition-all">${cat}</button>
                                                `).join('')}
                                            </div>
                                        </div>

                                        <div class="space-y-4">
                                            <div class="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                                                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                                                Select Difficulty
                                            </div>
                                            <div class="flex flex-wrap gap-2">
                                                ${["easy", "medium", "hard"].map(lv => `
                                                    <button onclick="quizModule.startQuiz('difficulty', '${lv}')" class="px-4 md:px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold hover:bg-orange-600 hover:border-orange-500 transition-all capitalize">${lv}</button>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar Leaderboard (Wider) -->
                    <div class="lg:col-span-4 space-y-6">
                        <div class="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/5 space-y-6 md:space-y-8 sticky top-24">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-xl md:text-2xl font-black font-outfit italic tracking-tighter">LEADERBOARD</h3>
                                    <div class="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-full border border-red-500/20">
                                        <div class="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>
                                        <span class="text-[7px] md:text-[8px] uppercase tracking-widest text-red-400 font-bold">LIVE</span>
                                    </div>
                                </div>
                                <p class="text-slate-500 text-[10px] md:text-xs font-medium">The most informed citizens of Electra.</p>
                            </div>

                            <div id="leaderboard-list" class="space-y-4">
                                <!-- Rankings -->
                            </div>

                            <div class="pt-6 border-t border-white/5 flex items-center justify-between text-slate-500">
                                <div class="flex flex-col">
                                    <span class="text-[9px] uppercase font-bold tracking-widest">Your Rank</span>
                                    <span class="text-white font-bold">--</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Join the fight</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    async init() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.loadLeaderboard();
    },

    async loadLeaderboard() {
        const listEl = document.getElementById('leaderboard-list');
        if (!listEl) return;

        try {
            const topUsers = await store.getLeaderboard(5);
            if (topUsers.length === 0) {
                listEl.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs">No entries yet. Be the first!</div>';
                return;
            }

            listEl.innerHTML = topUsers.map((user, i) => `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-8 flex items-center justify-center rounded-lg ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-500'} font-bold text-sm">
                            ${i + 1}
                        </span>
                        <div>
                            <p class="font-bold text-sm">${user.displayName || 'Anonymous Citizen'}</p>
                            <p class="text-[10px] text-slate-500">${user.badges?.length || 0} Badges Unlocked</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-indigo-400">${user.xp || 0} XP</p>
                        <p class="text-[9px] uppercase font-bold text-slate-600">Total Score</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            listEl.innerHTML = '<div class="text-center py-4 text-red-500 text-xs">Failed to load leaderboard.</div>';
        }
    },


    resetToModes() {
        const content = document.getElementById('quiz-content');
        const progress = document.getElementById('quiz-progress');
        if (progress) progress.style.width = '0%';

        content.innerHTML = `
            <div class="space-y-12 animate-fade-in">
                <div class="space-y-10 py-4">
                    <!-- Global Shuffle -->
                    <div class="flex flex-col items-center justify-center p-8 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 group hover:border-indigo-500/50 transition-all cursor-pointer" onclick="quizModule.startQuiz('random')">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🔀</div>
                        <h3 class="text-2xl font-bold text-white">Shuffle All</h3>
                        <p class="text-indigo-400 text-sm font-medium">Random mix from 1000+ questions</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Topic Wise -->
                        <div class="space-y-4">
                            <div class="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                <div class="w-2 h-2 rounded-full bg-cyan-500"></div>
                                Choose by Topic
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${["Constitution", "Process", "History", "Roles", "General"].map(cat => `
                                    <button onclick="quizModule.startQuiz('category', '${cat}')" class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:border-indigo-500 transition-all">${cat}</button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Difficulty Wise -->
                        <div class="space-y-4">
                            <div class="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                                Select Difficulty
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${["Easy", "Medium", "Hard"].map(lv => `
                                    <button onclick="quizModule.startQuiz('difficulty', '${lv}')" class="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-orange-600 hover:border-orange-500 transition-all">${lv}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setLength(val) {
        document.getElementById('quiz-count-select').value = val;
        document.querySelectorAll('.quiz-len-btn').forEach(btn => {
            if (parseInt(btn.dataset.value) === val) {
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg');
                btn.classList.remove('text-slate-500', 'hover:text-slate-300');
            } else {
                btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg');
                btn.classList.add('text-slate-500', 'hover:text-slate-300');
            }
        });
    },

    async startQuiz(mode = 'random', value = null) {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        
        const countSelect = document.getElementById('quiz-count-select');
        const targetCount = countSelect ? parseInt(countSelect.value) : 10;

        const container = document.getElementById('quiz-content');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 space-y-4">
                <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-slate-400 animate-pulse text-sm">Syncing with Election Cloud...</p>
            </div>
        `;
        
        try {
            let cat = mode === 'category' ? value : null;
            let diff = mode === 'difficulty' ? value : null;
            
            this.questions = await store.getQuestions(cat, diff, targetCount);
            
            if (this.questions.length === 0) {
                container.innerHTML = `
                    <div class="text-center space-y-4">
                        <p class="text-red-400">No questions found for this selection.</p>
                        <button onclick="quizModule.resetToModes()" class="px-6 py-2 bg-white/5 rounded-xl">Try Another</button>
                    </div>
                `;
                return;
            }

            // Shuffle options for each question to ensure variety
            this.questions = this.questions.map(q => {
                if (q.options) {
                    const originalOptions = [...q.options];
                    const correctValue = originalOptions[q.correctAnswer];
                    const shuffled = originalOptions.sort(() => Math.random() - 0.5);
                    return {
                        ...q,
                        options: shuffled,
                        correctAnswer: shuffled.indexOf(correctValue)
                    };
                }
                return q;
            });

            this.showQuestion();
        } catch (error) {
            console.error("Quiz start failed:", error);
            this.resetToModes();
        }
    },

    showQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('quiz-content');
        const progress = document.getElementById('quiz-progress');
        
        progress.style.width = `${(this.currentQuestionIndex / this.questions.length) * 100}%`;

        container.innerHTML = `
            <div class="space-y-8 animate-fade-in">
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400">Question ${this.currentQuestionIndex + 1} of ${this.questions.length}</p>
                        <h3 class="text-xl md:text-2xl font-bold leading-tight">${question.question}</h3>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <div class="px-4 py-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <span class="text-[10px] block uppercase font-bold text-indigo-200">Score</span>
                            <span class="text-lg font-black text-white">${this.score}</span>
                        </div>
                        <button onclick="quizModule.resetToModes()" class="text-[9px] uppercase font-bold text-slate-500 hover:text-red-400 transition-colors tracking-widest">End Quiz ✕</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-3">
                    ${question.options.map((opt, i) => `
                        <button onclick="quizModule.handleAnswer(${i})" class="group flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[1.25rem] text-left hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                            <span class="text-sm md:text-base font-medium group-hover:text-white transition-colors">${opt}</span>
                            <div class="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-white/30 flex items-center justify-center transition-all">
                                <div class="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all"></div>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <div class="flex items-center justify-center gap-4 pt-4 border-t border-white/5">
                    <span class="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-slate-500">${question.category}</span>
                    <span class="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-slate-500">${question.difficulty}</span>
                </div>
            </div>
        `;
    },

    handleAnswer(index) {
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = index === question.correctAnswer;
        const points = isCorrect ? (question.points || 10) : 0;
        
        this.score += points;
        this.answers.push({ questionId: question.id, correct: isCorrect });

        const container = document.getElementById('quiz-content');
        container.innerHTML = `
            <div class="text-center space-y-6 py-10 animate-fade-in flex flex-col items-center">
                <div class="text-6xl mb-2">${isCorrect ? '✨' : '🧐'}</div>
                <div class="space-y-2">
                    <h3 class="text-3xl font-bold ${isCorrect ? 'text-green-400' : 'text-orange-400'}">${isCorrect ? 'Correct!' : 'Not Quite!'}</h3>
                    <p class="text-slate-400 max-w-sm mx-auto text-sm">${isCorrect ? `Great job! You've earned <b>${points} points</b>.` : `The correct answer was <b>${question.options[question.correctAnswer]}</b>.`}</p>
                </div>
                
                <div class="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20 w-full max-w-[200px]">
                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Score</p>
                    <p class="text-3xl font-black text-white">${this.score}</p>
                </div>

                <button onclick="quizModule.nextQuestion()" class="group flex items-center gap-3 px-10 py-4 bg-indigo-600 rounded-2xl font-bold glow hover:scale-105 transition-all">
                    <span>Next Question</span>
                    <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
            </div>
        `;
    },

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    },

    async showResults() {
        const container = document.getElementById('quiz-content');
        const progress = document.getElementById('quiz-progress');
        progress.style.width = '100%';

        const totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 10), 0);
        const finalScorePercent = Math.round((this.score / totalPoints) * 100);

        container.innerHTML = `
            <div class="text-center space-y-10 py-10 animate-fade-in flex flex-col items-center">
                <div class="relative w-40 h-40">
                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="10" fill="transparent" class="text-slate-800" />
                        <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="10" fill="transparent" stroke-dasharray="439.6" stroke-dashoffset="${439.6 - (439.6 * finalScorePercent / 100)}" class="text-indigo-500" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-3xl font-black">${finalScorePercent}%</span>
                        <span class="text-[9px] uppercase font-bold text-slate-500">Success</span>
                    </div>
                </div>
                
                <div class="space-y-2">
                    <h3 class="text-3xl font-black font-outfit">Challenge Completed!</h3>
                    <p class="text-slate-400">You secured <b>${this.score}</b> out of <b>${totalPoints}</b> points.</p>
                </div>

                <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <button onclick="quizModule.startQuiz()" class="px-6 py-4 border border-white/10 rounded-2xl font-bold hover:bg-white/5 transition-all text-sm">Retry</button>
                    <button onclick="quizModule.resetToModes()" class="px-6 py-4 bg-indigo-600 rounded-2xl font-bold glow text-sm">Main Menu</button>
                </div>
            </div>
        `;

        if (authManager.user) {
            const totalXP = this.questions.reduce((sum, q) => sum + (q.xp || 20), 0);
            const xpEarned = Math.round((this.score / totalPoints) * totalXP);
            
            await store.saveQuizResult(authManager.user.uid, this.score, totalPoints);
            if (xpEarned > 0) {
                await store.updateProgress(authManager.user.uid, 'quiz_completed', xpEarned);
            }
            
            ui.showNotification(`Results saved! +${xpEarned} XP earned.`, "success");
            this.loadLeaderboard();
            if (document.getElementById('stat-accuracy')) {
                learningModule.updateDashboard();
            }
        }
    }
};
