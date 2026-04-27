import { authManager } from './auth.js';
import { store } from './store.js';
import { ui } from './ui.js';
import { app } from './app.js';
import { geminiApi } from './api/gemini.js';

export const aiModule = {
    currentStep: null,
    currentSessionId: null,
    sessions: [],
    isTyping: false,

    render() {
        return `
            <div class="h-[calc(100vh-140px)] w-full flex bg-slate-900/50 rounded-2xl md:rounded-[3rem] border border-white/5 overflow-hidden glass animate-fade-in shadow-2xl relative">
                <!-- Sidebar Toggle (Mobile Only) -->
                <button onclick="aiModule.toggleSidebar()" class="md:hidden absolute top-4 left-4 z-20 p-2 glass rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>

                <!-- Sidebar: Session History -->
                <aside id="ai-sidebar" class="fixed md:relative inset-0 md:inset-auto w-full md:w-80 border-r border-white/5 flex flex-col bg-slate-950 z-[100] md:z-30 transform -translate-x-full md:translate-x-0 transition-transform duration-300">
                    <div class="p-8 border-b border-white/5 relative">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">💬</div>
                                <h3 class="text-xl font-bold font-outfit">Chats</h3>
                            </div>
                            <!-- Close Button (Mobile Only) -->
                            <button onclick="aiModule.toggleSidebar()" class="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <p class="text-[10px] text-slate-500 uppercase tracking-widest">Conversation History</p>
                    </div>

                    <div id="ai-sessions-list" class="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <!-- Sessions will be injected here -->
                    </div>

                    <div class="p-6 border-t border-white/5 bg-slate-950/20">
                        <button id="new-chat-btn" onclick="aiModule.newSession(); aiModule.toggleSidebar(false)" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold transition-all glow flex items-center justify-center space-x-2 active:scale-95">
                            <span class="text-xl">+</span>
                            <span>New Conversation</span>
                        </button>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <main id="chat-main-container" class="flex-grow flex flex-col relative bg-slate-900/10">
                    <!-- This will be swapped between Landing and Active Chat -->
                </main>
            </div>

            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                
                @keyframes typing {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .typing-dot { animation: typing 1s infinite; }
            </style>
        `;
    },

    async init() {
        console.log("AI Module Initializing...");
        await this.loadSessions();
        this.newSession(); // Always start with a fresh landing state
    },

    async loadSessions() {
        const uid = authManager.user?.uid;
        if (!uid) {
            this.sessions = JSON.parse(localStorage.getItem('electra_guest_chats') || '[]');
        } else {
            // In a real app, you'd fetch from Firestore 'chats' collection
            // For this demo, we'll use a mix of local and mock to show history
            const stored = localStorage.getItem(`electra_chats_${uid}`);
            this.sessions = stored ? JSON.parse(stored) : [];
        }
        this.renderSessionsList();
    },

    renderSessionsList() {
        const list = document.getElementById('ai-sessions-list');
        if (!list) return;

        if (this.sessions.length === 0) {
            list.innerHTML = `
                <div class="p-8 text-center space-y-4 opacity-40">
                    <div class="text-4xl">📭</div>
                    <p class="text-xs">No past conversations. Start a new one!</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.sessions.map(s => `
            <button onclick="aiModule.loadChat('${s.id}')" class="w-full text-left p-4 rounded-2xl transition-all group border ${this.currentSessionId === s.id ? 'bg-indigo-600/20 border-indigo-500/30 shadow-lg' : 'hover:bg-white/5 border-transparent'}">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">💭</div>
                    <div class="flex-grow min-w-0">
                        <p class="text-sm font-medium text-slate-300 group-hover:text-white truncate">${s.title}</p>
                        <p class="text-[10px] text-slate-500 uppercase tracking-tighter">${new Date(s.timestamp || Date.now()).toLocaleDateString()}</p>
                    </div>
                </div>
            </button>
        `).join('');
    },

    newSession() {
        console.log("Clearing chat state for new session...");
        this.currentSessionId = null;
        const container = document.getElementById('chat-main-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex-grow flex flex-col items-center justify-center p-6 md:p-12 text-center animate-fade-in overflow-y-auto">
                <div class="w-16 h-16 md:w-24 md:h-24 bg-indigo-600/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 glow shadow-2xl animate-float">
                    <img src="assets/bolt-logo.png" class="w-10 h-10 md:w-16 md:h-16 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]" alt="Electra">
                </div>
                <h2 class="text-2xl md:text-5xl font-bold font-outfit mb-3">Hello! I'm Electra.</h2>
                <p class="text-slate-400 max-w-lg mb-6 md:mb-12 text-sm md:text-lg px-4">How can I help you navigate the election process today?</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8 md:mb-12">
                    <button onclick="aiModule.quickPrompt('How do I register as a voter?')" class="p-5 md:p-6 glass rounded-[1.5rem] md:rounded-[2rem] text-left hover:border-indigo-500/50 hover:bg-white/5 transition-all group border-white/5">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="text-lg md:text-xl">✍️</span>
                            <p class="text-sm font-bold group-hover:text-indigo-400">Voter Registration</p>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed">"What are the steps to get registered in my district?"</p>
                    </button>
                    <button onclick="aiModule.quickPrompt('Tell me about the campaign rules.')" class="p-5 md:p-6 glass rounded-[1.5rem] md:rounded-[2rem] text-left hover:border-indigo-500/50 hover:bg-white/5 transition-all group border-white/5">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="text-lg md:text-xl">📢</span>
                            <p class="text-sm font-bold group-hover:text-indigo-400">Campaigning</p>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed">"What are the legal limits on election campaigning?"</p>
                    </button>
                </div>

                <div class="w-full max-w-2xl relative group px-4 md:px-0">
                    <form onsubmit="event.preventDefault(); aiModule.handleInitialMessage();" class="relative">
                        <input id="ai-chat-input" type="text" placeholder="Type your question..." 
                            class="w-full bg-slate-800/80 border border-white/10 rounded-2xl md:rounded-3xl py-5 md:py-7 pl-6 md:pl-10 pr-24 md:pr-28 focus:outline-none focus:border-indigo-500 transition-all text-base md:text-lg shadow-2xl">
                        <button type="submit" class="absolute right-2 top-2 bottom-2 px-4 md:px-8 bg-indigo-600 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-indigo-500 transition-all active:scale-95">
                            Go
                        </button>
                    </form>
                </div>
            </div>
        `;
        this.renderSessionsList();
    },

    quickPrompt(text) {
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.value = text;
            this.handleInitialMessage();
        }
    },

    async handleInitialMessage() {
        const input = document.getElementById('ai-chat-input');
        const text = input.value.trim();
        if (!text) return;

        // 1. Create session data
        const newSession = {
            id: 'session_' + Date.now(),
            title: text.length > 25 ? text.substring(0, 25) + '...' : text,
            timestamp: Date.now()
        };

        // 2. Add to list and persist
        this.sessions.unshift(newSession);
        this.saveSessionsLocally();
        
        // 3. Switch to chat view
        await this.loadChat(newSession.id);
        
        // 4. Send the first message
        await this.sendMessage(text);
    },

    saveSessionsLocally() {
        const uid = authManager.user?.uid;
        const key = uid ? `electra_chats_${uid}` : 'electra_guest_chats';
        localStorage.setItem(key, JSON.stringify(this.sessions));
    },

    async loadChat(sessionId) {
        this.toggleSidebar(false); // Close sidebar on mobile when chat selected
        this.currentSessionId = sessionId;
        const container = document.getElementById('chat-main-container');
        if (!container) return;

        const session = this.sessions.find(s => s.id === sessionId);

        container.innerHTML = `
            <header class="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl">
                <div class="flex items-center space-x-5">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-500/20 shadow-xl">🤖</div>
                    <div>
                        <h4 class="font-bold font-outfit text-xl">${session ? session.title : 'Active Conversation'}</h4>
                        <div class="flex items-center space-x-2 mt-1">
                            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Electra Assistant Online</span>
                        </div>
                    </div>
                </div>
                <button onclick="aiModule.newSession()" class="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg">New Chat</button>
            </header>

            <div id="ai-chat-messages" class="flex-grow overflow-y-auto p-5 md:p-10 space-y-6 md:space-y-8 custom-scrollbar scroll-smooth">
                <!-- Messages will load here -->
            </div>

            <div id="typing-indicator" class="px-10 py-2 hidden">
                <div class="flex items-center space-x-2 text-slate-500">
                    <div class="w-1 h-1 bg-slate-500 rounded-full typing-dot"></div>
                    <div class="w-1 h-1 bg-slate-500 rounded-full typing-dot" style="animation-delay: 0.2s"></div>
                    <div class="w-1 h-1 bg-slate-500 rounded-full typing-dot" style="animation-delay: 0.4s"></div>
                    <span class="text-[10px] uppercase font-bold tracking-widest ml-2">Electra is thinking...</span>
                </div>
            </div>

            <div class="p-4 md:p-8 border-t border-white/5 bg-slate-950/20">
                <form id="ai-chat-form" onsubmit="event.preventDefault(); aiModule.handleChatInput();" class="relative max-w-4xl mx-auto">
                    <input id="ai-chat-input" type="text" placeholder="Continue conversation..." 
                        class="w-full bg-slate-800/60 border border-white/5 rounded-xl md:rounded-2xl py-4 md:py-5 pl-5 md:pl-8 pr-20 md:pr-24 focus:outline-none focus:border-indigo-500 transition-all text-base md:text-lg shadow-inner">
                    <button type="submit" class="absolute right-2 top-2 bottom-2 px-6 md:px-8 bg-indigo-600 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-indigo-500 transition-all shadow-lg active:scale-95">
                        Send
                    </button>
                </form>
            </div>
        `;

        this.renderSessionsList();
        await this.renderMessageHistory(sessionId);
    },

    async renderMessageHistory(sessionId) {
        const messagesEl = document.getElementById('ai-chat-messages');
        if (!messagesEl) return;

        messagesEl.innerHTML = '<div class="flex justify-center py-20"><div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>';

        const uid = authManager.user?.uid;
        let history = [];
        
        if (uid) {
            history = await store.getChatHistory(uid, sessionId);
        } else {
            history = JSON.parse(localStorage.getItem(`guest_history_${sessionId}`) || '[]');
        }

        if (history.length === 0) {
            messagesEl.innerHTML = `
                <div class="flex items-start space-x-6 animate-fade-in mb-12">
                    <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-lg">🤖</div>
                    <div class="glass p-6 rounded-3xl rounded-tl-none max-w-2xl border-indigo-500/10">
                        <p class="text-sm text-slate-200 leading-relaxed">Welcome! I'm ready to help you with <b>${this.sessions.find(s => s.id === sessionId)?.title || 'your request'}</b>. What would you like to know first?</p>
                    </div>
                </div>
            `;
        } else {
            messagesEl.innerHTML = history.map(msg => this.getMessageHtml(msg)).join('');
        }
        this.scrollToBottom();
    },

    async handleChatInput() {
        const input = document.getElementById('ai-chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        await this.sendMessage(text);
    },

    async sendMessage(text) {
        const messagesEl = document.getElementById('ai-chat-messages');
        if (!messagesEl) return;

        // 1. Render User Message (WhatsApp-style Right Aligned)
        messagesEl.innerHTML += this.getMessageHtml({ sender: 'user', text });
        this.scrollToBottom();

        // 2. Persist User Message
        await this.persistMessage(text, 'user');

        // 3. Show Typing Indicator
        this.showTyping(true);

        // 4. Generate & Render AI Response (Real AI or High-Quality Fallback)
        setTimeout(async () => {
            const context = this.currentStep ? `Current Stage: ${this.currentStep.title}` : '';
            let aiText = await geminiApi.generateResponse(text, context);
            
            // Fallback if API key is missing or error occurs
            if (!aiText) {
                aiText = this.getAiResponse(text);
            }

            this.showTyping(false);
            messagesEl.innerHTML += this.getMessageHtml({ sender: 'ai', text: aiText });
            this.scrollToBottom();
            await this.persistMessage(aiText, 'ai');
        }, 800);
    },

    async persistMessage(text, sender) {
        const uid = authManager.user?.uid;
        const sessionId = this.currentSessionId;
        
        if (uid) {
            await store.saveChatMessage(uid, sessionId, text, sender);
        } else {
            // Guest local persistence
            const key = `guest_history_${sessionId}`;
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            history.push({ text, sender, timestamp: Date.now() });
            localStorage.setItem(key, JSON.stringify(history));
        }
    },

    showTyping(show) {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.classList.toggle('hidden', !show);
    },

    getMessageHtml(msg) {
        const isAi = msg.sender === 'ai';
        return `
            <div class="w-full flex ${isAi ? 'justify-start' : 'justify-end'} mb-6 animate-fade-in">
                <div class="flex items-start max-w-[90%] md:max-w-[80%] ${isAi ? 'flex-row' : 'flex-row-reverse'} space-x-2 md:space-x-4">
                    <div class="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 ${isAi ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-700 shadow-slate-500/10'} rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg shadow-lg ${isAi ? 'mr-2 md:mr-4' : 'ml-2 md:ml-4'}">
                        ${isAi ? '🤖' : '👤'}
                    </div>
                    <div class="relative glass p-4 md:p-6 rounded-2xl md:rounded-3xl ${isAi ? 'rounded-tl-none border-indigo-500/10' : 'rounded-tr-none bg-indigo-600/10 border-indigo-500/20 shadow-indigo-500/5'} shadow-xl">
                        <p class="text-sm md:text-[15px] leading-relaxed ${isAi ? 'text-slate-200' : 'text-white'}">${msg.text}</p>
                        <div class="flex items-center justify-between mt-3">
                            <p class="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-500 font-bold">${isAi ? 'Electra AI' : 'You'}</p>
                            ${!isAi ? '<span class="text-[10px] text-indigo-400 ml-4">✓✓</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    toggleSidebar(show) {
        const sidebar = document.getElementById('ai-sidebar');
        if (sidebar) {
            if (show === undefined) {
                sidebar.classList.toggle('-translate-x-full');
            } else {
                if (show) sidebar.classList.remove('-translate-x-full');
                else sidebar.classList.add('-translate-x-full');
            }
        }
    },

    getAiResponse(input) {
        input = input.toLowerCase();
        const knowledge = {
            'voter': "Voter registration is the first step! You'll need to provide your ID and address. Most regions have online portals now. Would you like a link to check your status?",
            'register': "To register, you usually need to be 18+ and a citizen. The process involves filling a Form 6 (or equivalent) and submitting it to your local Electoral Officer.",
            'candidate': "Candidates must be eligible voters themselves, usually 25+ years old, and must file a nomination with a security deposit and an affidavit of assets.",
            'nomination': "The nomination period is when aspiring leaders officially join the race. They submit their papers, which are then scrutinized by the Returning Officer.",
            'campaign': "Campaigning is where parties share their manifestos. There are strict rules on spending and a 'silence period' 48 hours before voting begins.",
            'vote': "Voting is your superpower! On polling day, you'll go to your booth, get your finger marked with indelible ink, and cast your vote on the EVM.",
            'evm': "Electronic Voting Machines (EVMs) are secure devices that record votes. They are often linked with VVPAT machines so you can see a paper slip confirming your choice.",
            'result': "Once the polls close, EVMs are sealed and moved to counting centers. Results are usually announced within 24-48 hours after counting begins.",
            'hello': "Hello! I'm Electra, your intelligent election companion. I'm here to explain the democratic process in simple, engaging steps. What can I clarify for you?",
            'who are you': "I am Electra, an AI trained to help citizens understand their democratic rights and the election lifecycle.",
            'how are you': "I'm functioning at 100% capacity and ready to talk about democracy! How can I help you today?"
        };

        for (const [key, val] of Object.entries(knowledge)) {
            if (input.includes(key)) return val;
        }

        return "That's a complex question. In democratic systems, this is governed by the Election Commission's guidelines. For the most accurate answer, I recommend checking your local election authority's official handbook, or I can try to break down the general principles for you!";
    },

    scrollToBottom() {
        const el = document.getElementById('ai-chat-messages');
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    },

    updateContext(step) {
        this.currentStep = step;
        const tooltip = document.getElementById('ai-suggestion');
        if (tooltip) tooltip.innerText = this.getSuggestion(step);
    },

    getSuggestion(step) {
        if (!step) return "Hi! How can I help you today?";
        return `Ask me anything about ${step.title}...`;
    },

    askContextual() {
        app.navigateTo('ai');
    }
};
