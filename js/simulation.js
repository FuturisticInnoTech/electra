import { authManager } from './auth.js';
import { store } from './store.js';
import { ui } from './ui.js';
import { app } from './app.js';

export const simulationModule = {
    candidates: [
        { id: 'c1', name: 'Growth Party', symbol: '📈', vision: 'Focus on economic expansion and tech infrastructure.' },
        { id: 'c2', name: 'Eco Alliance', symbol: '🌿', vision: 'Prioritize sustainability and green energy.' },
        { id: 'c3', name: 'Justice Front', symbol: '⚖️', vision: 'Ensuring equality and social welfare for all.' },
        { id: 'nota', name: 'NOTA', symbol: '⚪', vision: 'None Of The Above - Reject all candidates.' }
    ],

    renderInline() {
        return `
            <div id="sim-container" class="glass p-8 rounded-[2rem] border-indigo-500/20 glow relative overflow-hidden w-full max-w-md mx-auto">
                <div id="vote-machine" class="space-y-4">
                    <div class="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Balloting Unit v2.0</span>
                        <div class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                    </div>

                    <div class="space-y-3">
                        ${this.candidates.map(c => `
                            <div class="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-xl hover:bg-slate-800 transition-all group cursor-pointer border border-transparent hover:border-indigo-500/30" onclick="simulationModule.castVote('${c.id}')">
                                <div class="text-3xl">${c.symbol}</div>
                                <div class="flex-grow">
                                    <p class="font-bold text-sm">${c.name}</p>
                                    <p class="text-[10px] text-slate-500 truncate max-w-[120px]">${c.vision}</p>
                                </div>
                                <div class="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center group-hover:border-indigo-500 transition-all">
                                    <div class="w-4 h-4 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div id="vote-success" class="hidden absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in z-20">
                    <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-5xl animate-bounce">✅</div>
                    <h3 class="text-2xl font-bold font-outfit">Vote Recorded!</h3>
                    <p class="text-slate-400 text-sm">Your simulated vote has been cast. Every vote counts in the journey of democracy.</p>
                </div>
            </div>
        `;
    },

    render() {
        // Keep original render as fallback or for separate page if needed
        return `<div class="p-20 text-center">Simulation is now embedded in the journey!</div>`;
    },

    init() {
        console.log("Simulation Initialized");
    },

    async castVote(id) {
        // Visual feedback
        const machine = document.getElementById('vote-machine');
        if (machine) machine.classList.add('pointer-events-none', 'opacity-50');
        
        // Save to Firebase (Optional, but let's record it anyway for analytics)
        if (authManager.user) {
            await store.recordVote(authManager.user.uid, id);
        }
        
        // Show success screen
        const success = document.getElementById('vote-success');
        if (success) success.classList.remove('hidden');
        
        ui.showNotification("Vote cast successfully!", "success");
    }
};
