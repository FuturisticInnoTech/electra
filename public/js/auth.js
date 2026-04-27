import { auth, analytics } from './config.js';
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import { ui } from './ui.js';
import { app } from './app.js';
import { store } from './store.js';

export const authManager = {
    user: null,

    init() {
        onAuthStateChanged(auth, user => {
            if (user) {
                this.user = user;
                this.onUserLoggedIn(user);
            } else {
                this.user = null;
                this.onUserLoggedOut();
            }
        });
    },

    // --- Authentication Methods ---

    async loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            ui.showNotification('Welcome back!', 'success');
            logEvent(analytics, 'login', { method: 'google' });
            this.closeAuthModal();
        } catch (error) {
            console.error("Google Login Error:", error);
            const msg = error.code === 'auth/popup-closed-by-user' ? 'Login popup closed.' : 
                        error.code === 'auth/operation-not-allowed' ? 'Google login not enabled in Firebase.' :
                        'Google login failed. Check console for details.';
            ui.showNotification(msg, 'error');
        }
    },

    async signupWithEmail(email, password, name) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            // Force a slight delay or manually trigger the update logic
            // to ensure the name is reflected in the UI
            this.user = auth.currentUser; 
            this.onUserLoggedIn(this.user);
            
            ui.showNotification('Account created successfully!', 'success');
            logEvent(analytics, 'sign_up', { method: 'email' });
            this.closeAuthModal();
        } catch (error) {
            console.error("Signup Error:", error);
            ui.showNotification(error.message, 'error');
        }
    },

    async loginWithEmail(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            ui.showNotification('Logged in successfully!', 'success');
            logEvent(analytics, 'login', { method: 'email' });
            this.closeAuthModal();
        } catch (error) {
            console.error("Login Error:", error);
            ui.showNotification('Invalid email or password.', 'error');
        }
    },

    async loginAsGuest() {
        try {
            await signInAnonymously(auth);
            ui.showNotification('Browsing as Guest. Progress will not be saved permanently.', 'info');
            logEvent(analytics, 'login', { method: 'guest' });
            this.closeAuthModal();
        } catch (error) {
            console.error("Guest Login Error:", error);
            ui.showNotification('Guest access failed.', 'error');
        }
    },

    async logout() {
        await signOut(auth);
        ui.showNotification('You have been logged out.');
        app.navigateTo('home');
        logEvent(analytics, 'logout');
    },

    // --- UI State Handlers ---

    onUserLoggedIn(user) {
        const authSection = document.getElementById('auth-section');
        const mobileAuthSection = document.getElementById('mobile-auth-section');
        
        const isGuest = user.isAnonymous;
        const displayName = isGuest ? 'Guest User' : (user.displayName ? user.displayName.split(' ')[0] : 'User');
        const photoURL = isGuest ? 'https://ui-avatars.com/api/?name=Guest&background=6366f1&color=fff' : (user.photoURL || `https://ui-avatars.com/api/?name=${displayName}`);

        const loggedInHtml = `
            <div class="flex items-center space-x-3">
                <div class="text-right hidden md:block">
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest">${isGuest ? 'Limited Access' : 'Informed Citizen'}</p>
                    <p class="text-sm font-bold text-white">${displayName}</p>
                </div>
                <div class="relative group">
                    <img src="${photoURL}" class="w-10 h-10 rounded-full border-2 ${isGuest ? 'border-slate-500' : 'border-indigo-500'} cursor-pointer hover:scale-110 transition-all" id="user-avatar">
                    <div class="absolute right-0 top-full mt-2 w-48 glass rounded-xl hidden group-hover:block z-[60] p-2 border-white/10">
                        <button onclick="authManager.logout()" class="w-full text-left px-4 py-3 text-xs font-bold hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors uppercase tracking-widest">Sign Out</button>
                    </div>
                </div>
            </div>
        `;

        const mobileLoggedInHtml = `
            <div class="flex flex-col items-center space-y-4 py-4">
                <img src="${photoURL}" class="w-20 h-20 rounded-full border-4 border-indigo-500 shadow-2xl">
                <div class="text-center">
                    <p class="text-xl font-bold text-white">${displayName}</p>
                    <p class="text-xs text-slate-500 uppercase tracking-widest">${isGuest ? 'Guest Mode' : 'Verified Member'}</p>
                </div>
                <button onclick="authManager.logout()" class="w-full py-4 glass rounded-2xl text-sm font-bold text-red-400 uppercase tracking-widest">Sign Out</button>
            </div>
        `;

        if (authSection) authSection.innerHTML = loggedInHtml;
        if (mobileAuthSection) mobileAuthSection.innerHTML = mobileLoggedInHtml;
        
        const avatar = document.getElementById('user-avatar');
        if (avatar) avatar.onclick = () => this.logout();
        
        store.initUserProgress(user.uid);
    },

    onUserLoggedOut() {
        const authSection = document.getElementById('auth-section');
        const mobileAuthSection = document.getElementById('mobile-auth-section');

        const loggedOutHtml = `
            <div class="flex items-center gap-4 md:gap-8">
                <button onclick="authManager.openAuthModal('login')" class="text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors">Login</button>
                <button onclick="app.navigateTo('ai')" class="px-5 md:px-7 py-2 md:py-2.5 bg-indigo-600 rounded-full font-bold text-[10px] md:text-xs glow hover:scale-105 transition-all whitespace-nowrap shadow-xl shadow-indigo-500/10 uppercase tracking-[0.15em] border border-white/10">Electra AI</button>
            </div>
        `;

        const mobileLoggedOutHtml = `
            <div class="flex flex-col gap-2 w-full">
                <button onclick="authManager.openAuthModal('login'); ui.toggleMobileMenu(false)" class="w-full py-3.5 glass rounded-2xl font-bold text-slate-400 text-sm">Sign In</button>
                <button onclick="app.navigateTo('ai'); ui.toggleMobileMenu(false)" class="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-base glow uppercase tracking-widest border border-white/10">Electra AI</button>
            </div>
        `;

        if (authSection) authSection.innerHTML = loggedOutHtml;
        if (mobileAuthSection) mobileAuthSection.innerHTML = mobileLoggedOutHtml;
    },

    // --- Auth Modal Logic ---

    openAuthModal(mode = 'login') {
        const modalHtml = `
            <div id="auth-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onclick="authManager.closeAuthModal()"></div>
                <div class="glass max-w-md w-full p-8 rounded-[2rem] border-white/10 relative z-10 animate-fade-in">
                    <button onclick="authManager.closeAuthModal()" class="absolute top-6 right-6 text-slate-400 hover:text-white">✕</button>
                    
                    <div class="text-center space-y-2 mb-8">
                        <h2 class="text-3xl font-bold font-outfit" id="modal-title">${mode === 'login' ? 'Welcome Back' : 'Join Electra'}</h2>
                        <p class="text-slate-400 text-sm" id="modal-desc">${mode === 'login' ? 'Login to continue your learning journey' : 'Create an account to track your progress'}</p>
                    </div>

                    <div id="email-auth-form" class="space-y-4">
                        ${mode === 'signup' ? `
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                                <input type="text" id="auth-name" placeholder="John Doe" class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            </div>
                        ` : ''}
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                            <input type="email" id="auth-email" placeholder="name@example.com" class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
                            <input type="password" id="auth-pass" placeholder="••••••••" class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                        </div>
                        <button onclick="authManager.handleAuthSubmit('${mode}')" class="w-full py-4 bg-indigo-600 rounded-xl font-bold glow hover:bg-indigo-500 transition-all mt-4">${mode === 'login' ? 'Sign In' : 'Create Account'}</button>
                    </div>

                    <div class="relative my-8">
                        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
                        <div class="relative flex justify-center text-xs uppercase"><span class="bg-[#0f172a] px-2 text-slate-500">Or continue with</span></div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="authManager.loginWithGoogle()" class="flex items-center justify-center space-x-2 py-3 glass rounded-xl hover:bg-white/5 transition-all text-sm font-medium">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-4 h-4">
                            <span>Google</span>
                        </button>
                        <button onclick="authManager.loginAsGuest()" class="flex items-center justify-center space-x-2 py-3 glass rounded-xl hover:bg-white/5 transition-all text-sm font-medium">
                            <span>👤 Guest</span>
                        </button>
                    </div>

                    <p class="text-center text-sm text-slate-400 mt-8">
                        ${mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <a href="#" onclick="authManager.openAuthModal('${mode === 'login' ? 'signup' : 'login'}')" class="text-indigo-400 font-bold hover:underline ml-1">${mode === 'login' ? 'Sign up' : 'Log in'}</a>
                    </p>
                </div>
            </div>
        `;

        // Check if modal already exists
        const existing = document.getElementById('auth-modal');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('opacity-0', 'scale-95');
            setTimeout(() => modal.remove(), 200);
        }
    },

    handleAuthSubmit(mode) {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        
        if (mode === 'signup') {
            const name = document.getElementById('auth-name').value;
            this.signupWithEmail(email, pass, name);
        } else {
            this.loginWithEmail(email, pass);
        }
    },

    isGuest() {
        return this.user && this.user.isAnonymous;
    }
};
