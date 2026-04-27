# Electra ⚡

![Electra Logo](assets/bolt-logo.png)

**Electra** is a professional, immersive educational platform designed to simplify and gamify the democratic election process. It enables users to explore election workflows through interactive simulations, role-based learning, and real-time knowledge evaluation.

---

## 🎯 Problem Statement

Understanding election processes is often complex, static, and inaccessible.
Electra transforms this into an **interactive, intuitive, and engaging learning experience**, enabling users to explore each stage of the democratic lifecycle step-by-step.

---

## 🧠 Solution Overview

Electra provides a **simulation-driven learning platform** where users can:

* Experience the election lifecycle (Announcement → Results)
* Learn from role-based perspectives (Voter, Candidate, Officer)
* Test knowledge through gamified quizzes
* Track progress across sessions

---

## 🏗️ Architecture

Electra follows a **Modular Single Page Application (SPA)** architecture:

* **State Management:** Centralized via `store.js`
* **UI Engine:** Custom lightweight rendering system (`ui.js`)
* **Logic Separation:** Auth, Simulation, Quiz, and UI modules are decoupled
* **Backend:** Firebase-powered serverless infrastructure

---

## 🚀 Key Features

### 🎮 Interactive Election Simulation

Step-by-step journey through:

* Election Announcement
* Nomination
* Campaigning
* Voting
* Results

---

### 🧩 Role-Based Learning

Users can explore the system as:

* Voter
* Candidate
* Election Officer

---

### 🧠 Gamified Quiz Engine

* Real-time scoring
* XP rewards
* Feedback-based learning

---

### 📊 Progress Tracking

* Persistent user data via Firestore
* Session-based simulation tracking

---

### ⚡ Lightweight & Fast

* No heavy frameworks
* Optimized assets
* Fast load time (<2MB)

---

## ⚙️ Tech Stack

* **Frontend:** HTML5, Vanilla JavaScript (ES6 Modules), Tailwind CSS
* **Backend:** Firebase (Auth, Firestore, Hosting)
* **Architecture:** Serverless

---

## ☁️ Google Services Integration

* Firebase Authentication (Google, Email, Guest)
* Cloud Firestore (user data, quiz progress)
* Firebase Hosting (deployment)
* Firebase Analytics (optional tracking)

> ⚠️ AI-based assistance is implemented via Cloud Functions but is currently experimental and may be disabled in production builds to ensure stability.

---

## 📁 Project Structure

```text
/
├── index.html
├── firebase.json
├── firestore.rules
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── store.js
│   ├── ui.js
│   ├── journey.js
│   ├── quiz.js
│   ├── config.js
│   └── api/
```

---

## 🛡️ Code Quality & Security

* Modular structure with clear separation of concerns
* Reusable utilities to reduce duplication
* Consistent naming conventions
* Error handling across async operations
* Minimal dependency design for maintainability

---

## 🧪 Testing Strategy

### Functional Testing

* Authentication flow
* Quiz system validation
* Simulation flow correctness

### Edge Case Handling

* Duplicate prevention (votes, submissions)
* Input validation
* Network failure handling

### Integration Testing

* Firebase Auth ↔ Firestore sync
* Real-time data updates

### UI/UX Testing

* Responsive layouts
* Smooth navigation

### Testing Evidence

* All critical flows manually verified
* Console error-free execution ensured
* Stable Firebase interactions validated

---

## ⚡ Performance

* Optimized assets and rendering
* GPU-accelerated CSS animations
* Minimal JavaScript overhead

---

## 🔮 Future Improvements

* AI assistant stabilization
* Multi-language support
* Real-time election data integration

---

## ▶️ How to Run

1. Clone the repository
2. Configure Firebase credentials in `config.js`
3. Run using a local server
4. Deploy using Firebase Hosting

---

## 📌 Final Notes

* Firestore rules should be restricted in production
* The application prioritizes **stability, performance, and usability**
* Designed for a **smooth, error-free user experience**

---

## 🌐 Live Demo

👉 [Your Deployed Link Here]

---

## 💻 Repository

👉 [Your GitHub Link Here]

---

# ✨ Conclusion

Electra reimagines civic education through an **interactive, reliable, and user-first platform**, making complex democratic systems accessible to everyone.
