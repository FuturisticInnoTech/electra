import { db, analytics } from './config.js';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, getDocs, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import { ui } from './ui.js';
import { authManager } from './auth.js';

export const store = {
    userProgress: null,

    async initUserProgress(uid) {
        const isGuest = authManager.isGuest();
        
        if (isGuest) {
            const local = localStorage.getItem('electra_guest_progress');
            this.userProgress = local ? JSON.parse(local) : {
                role: 'voter',
                completedSteps: [],
                xp: 0,
                badges: [],
                quizAccuracy: 0,
                quizAttempts: 0,
                lastQuizScore: 0,
                hasVoted: false,
                isGuest: true
            };
            return;
        }

        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
            const initialData = {
                displayName: authManager.user.displayName || 'User',
                email: authManager.user.email || 'Guest',
                role: 'voter',
                completedSteps: [],
                xp: 0,
                badges: [],
                quizAccuracy: 0,
                quizAttempts: 0,
                lastQuizScore: 0,
                hasVoted: false,
                lastActive: serverTimestamp()
            };
            await setDoc(userRef, initialData);
            this.userProgress = initialData;
        } else {
            // Update the existing document with name/email if missing
            const existingData = docSnap.data();
            if (!existingData.displayName || !existingData.email) {
                await updateDoc(userRef, {
                    displayName: authManager.user.displayName || existingData.displayName,
                    email: authManager.user.email || existingData.email
                });
            }
            this.userProgress = docSnap.data();
        }
    },

    async updateProgress(uid, stepId, xpEarned = 0) {
        if (authManager.isGuest()) {
            if (!this.userProgress.completedSteps.includes(stepId)) {
                this.userProgress.completedSteps.push(stepId);
                this.userProgress.xp = (this.userProgress.xp || 0) + xpEarned;
                this.checkBadges();
            }
            localStorage.setItem('electra_guest_progress', JSON.stringify(this.userProgress));
            return;
        }

        const userRef = doc(db, 'users', uid);
        const updates = {
            completedSteps: arrayUnion(stepId),
            lastActive: serverTimestamp()
        };
        
        if (xpEarned > 0) {
            updates.xp = (this.userProgress.xp || 0) + xpEarned;
        }

        await updateDoc(userRef, updates);
        this.userProgress.completedSteps.push(stepId);
        this.userProgress.xp = (this.userProgress.xp || 0) + xpEarned;
        this.checkBadges();
    },

    checkBadges() {
        const completed = this.userProgress.completedSteps.length;
        const badges = this.userProgress.badges || [];
        
        if (completed >= 1 && !badges.includes('First Step')) {
            badges.push('First Step');
            ui.showNotification("Badge Unlocked: First Step! 🎖️", "success");
        }
        if (completed >= 5 && !badges.includes('Election Pro')) {
            badges.push('Election Pro');
            ui.showNotification("Badge Unlocked: Election Pro! 🏆", "success");
        }
        
        this.userProgress.badges = badges;
    },

    async saveQuizResult(uid, score, total) {
        const accuracy = Math.round((score / total) * 100);
        
        if (authManager.isGuest()) {
            this.userProgress.lastQuizScore = score;
            this.userProgress.quizAttempts = (this.userProgress.quizAttempts || 0) + 1;
            const currentTotalAccuracy = (this.userProgress.quizAccuracy || 0) * (this.userProgress.quizAttempts - 1);
            this.userProgress.quizAccuracy = Math.round((currentTotalAccuracy + accuracy) / this.userProgress.quizAttempts);
            
            localStorage.setItem('electra_guest_progress', JSON.stringify(this.userProgress));
            return;
        }

        const userRef = doc(db, 'users', uid);
        const newAttempts = (this.userProgress.quizAttempts || 0) + 1;
        const currentTotalAccuracy = (this.userProgress.quizAccuracy || 0) * (this.userProgress.quizAttempts || 0);
        const newAccuracy = Math.round((currentTotalAccuracy + accuracy) / newAttempts);

        await updateDoc(userRef, {
            lastQuizScore: score,
            quizAttempts: newAttempts,
            quizAccuracy: newAccuracy,
            lastActive: serverTimestamp()
        });

        this.userProgress.lastQuizScore = score;
        this.userProgress.quizAttempts = newAttempts;
        this.userProgress.quizAccuracy = newAccuracy;
    },

    async saveChatMessage(uid, chatId, message, sender) {
        if (authManager.isGuest()) return; // Guests don't save chats to cloud

        const chatRef = doc(db, 'users', uid, 'chats', chatId);
        await setDoc(chatRef, {
            lastMessage: message,
            updatedAt: serverTimestamp()
        }, { merge: true });

        const messagesRef = collection(db, 'users', uid, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text: message,
            sender: sender,
            timestamp: serverTimestamp()
        });
    },

    async getChatHistory(uid, chatId) {
        if (authManager.isGuest()) return []; // Guests don't have cloud history

        const messagesRef = collection(db, 'users', uid, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    },

    async recordVote(uid, candidateId) {
        if (authManager.isGuest()) {
            this.userProgress.hasVoted = true;
            this.userProgress.votedFor = candidateId;
            localStorage.setItem('electra_guest_progress', JSON.stringify(this.userProgress));
            return;
        }

        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            hasVoted: true,
            votedFor: candidateId,
            votedAt: serverTimestamp()
        });
        
        logEvent(analytics, 'vote_cast', { candidate: candidateId });
    },

    async bulkLoadQuestions(questions) {
        try {
            const { writeBatch } = await import("https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js");
            const batch = writeBatch(db);
            questions.forEach(q => {
                const qRef = doc(collection(db, "questions"), q.id);
                batch.set(qRef, {
                    ...q,
                    updatedAt: new Date().toISOString()
                });
            });
            await batch.commit();
            console.log(`Successfully seeded ${questions.length} questions.`);
            return true;
        } catch (error) {
            console.error("Bulk load failed:", error);
            throw error;
        }
    },

    async getQuestions(category = null, difficulty = null, count = 10) {
        try {
            const { where, limit, orderBy, startAt } = await import("https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js");
            let q = collection(db, "questions");
            
            const constraints = [];
            if (category) constraints.push(where("category", "==", category));
            if (difficulty) constraints.push(where("difficulty", "==", difficulty));

            let questions = [];

            if (constraints.length > 0) {
                // If filtering by category/difficulty, fetch a very large batch for entropy
                // This overcomes the issue of having many similar variations in a row
                const firestoreQuery = query(q, ...constraints, limit(500));
                const snapshot = await getDocs(firestoreQuery);
                questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // FINAL FALLBACK: Local filtering from a broad sample
                if (questions.length === 0) {
                    const broadQuery = query(q, limit(500));
                    const broadSnapshot = await getDocs(broadQuery);
                    const allSamples = broadSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    questions = allSamples.filter(qObj => {
                        const qCat = (qObj.category || "").toLowerCase();
                        const qDiff = (qObj.difficulty || "").toLowerCase();
                        const targetCat = (category || "").toLowerCase();
                        const targetDiff = (difficulty || "").toLowerCase();
                        
                        const catMatch = !category || qCat === targetCat;
                        const diffMatch = !difficulty || qDiff === targetDiff;
                        return catMatch && diffMatch;
                    });
                }
            } else {
                // Global shuffle: use random cursor on document IDs with a huge sample pool
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let randomId = '';
                for (let i = 0; i < 20; i++) randomId += chars.charAt(Math.floor(Math.random() * chars.length));

                const firestoreQuery = query(q, orderBy("__name__"), startAt(randomId), limit(300));
                const snapshot = await getDocs(firestoreQuery);
                questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (questions.length < 100) {
                    const wrapQuery = query(q, orderBy("__name__"), limit(100));
                    const wrapSnapshot = await getDocs(wrapQuery);
                    questions = [...questions, ...wrapSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
                }
            }

            // 3. Deduplicate by NORMALIZED question text
            // (e.g., "Question text [Ref: 1]" becomes "Question text")
            const uniqueQuestions = [];
            const seenNormalizedTexts = new Set();

            for (const qObj of questions) {
                // Remove [Ref: ...] or (Ref: ...) or any trailing bracketed text for comparison
                const normalized = qObj.question.replace(/\s*[\[\(]Ref:.*?[\]\)]\s*$/i, "").trim().toLowerCase();
                
                if (!seenNormalizedTexts.has(normalized)) {
                    uniqueQuestions.push(qObj);
                    seenNormalizedTexts.add(normalized);
                }
            }

            // 4. Final shuffle and slice to the requested count
            // Using a more robust shuffle algorithm for true variety
            return uniqueQuestions
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value)
                .slice(0, count);
        } catch (error) {
            console.error("Failed to fetch unique random questions:", error);
            return [];
        }
    },

    async getLeaderboard(limitCount = 10) {
        try {
            const { where, limit } = await import("https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js");
            const q = query(
                collection(db, 'users'), 
                where("xp", ">", 0),
                orderBy("xp", "desc"),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Leaderboard fetch failed:", error);
            return [];
        }
    }
};
