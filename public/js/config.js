import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

// Initialize global Firebase for Compat SDK (if scripts are included in index.html)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// App Constants
export const APP_CONSTANTS = {
    ROLES: {
        VOTER: 'voter',
        CANDIDATE: 'candidate',
        OFFICER: 'officer'
    },
    LEARNING_STEPS: [
        { 
            id: 1, 
            title: "Election Announcement", 
            desc: "The official start of the democratic process where dates and rules are declared.", 
            duration: "2-3 Months before", 
            participants: "Election Commission, Public",
            roleContent: {
                voter: "Check if your name is in the electoral roll. This is the first step to ensure you can vote.",
                candidate: "Ensure your party registration is active and start preparing your legal team for nomination.",
                officer: "Set up the control room and begin training the field staff for polling station management."
            },
            interaction: {
                type: 'check_list',
                title: 'Announcement Readiness',
                items: ['Read Official Gazette', 'Review Model Code of Conduct', 'Note Election Dates'],
                xp: 50
            },
            learnMore: "The announcement is made by the Election Commission (EC). Once announced, the Model Code of Conduct (MCC) comes into effect immediately, preventing the government from announcing new projects or influencing voters."
        },
        { 
            id: 2, 
            title: "Nomination Filing", 
            desc: "Candidates formally submit their intention to contest the election.", 
            duration: "10-15 Days", 
            participants: "Candidates, Returning Officers",
            roleContent: {
                voter: "Research the candidates in your constituency. Look at their education, criminal records, and assets.",
                candidate: "File your affidavit (Form 26). Ensure all assets, liabilities, and criminal antecedents are declared.",
                officer: "Scrutinize the nomination papers. Ensure every candidate meets the eligibility criteria."
            },
            interaction: {
                type: 'form',
                title: 'File Nomination Mockup',
                fields: [
                    { name: 'candidateName', label: 'Candidate Name', type: 'text' },
                    { name: 'party', label: 'Political Party', type: 'text' },
                    { name: 'assets', label: 'Total Assets (Value)', type: 'number' }
                ],
                xp: 100
            },
            learnMore: "Filing nomination is a legal process. If any material information is hidden in the affidavit, the nomination can be cancelled during scrutiny by the Returning Officer."
        },
        { 
            id: 3, 
            title: "Campaigning", 
            desc: "Candidates present their vision and manifestos to the public.", 
            duration: "2-3 Weeks", 
            participants: "Political Parties, Citizens",
            roleContent: {
                voter: "Attend rallies or read manifestos. Evaluate which candidate's vision aligns with your needs.",
                candidate: "Organize door-to-door visits and social media campaigns. Stick to the MCC rules.",
                officer: "Monitor campaign spending and ensure no inflammatory speeches violate the code of conduct."
            },
            interaction: {
                type: 'choice',
                title: 'Choose Campaign Strategy',
                options: [
                    { id: 'social', label: 'Social Media Blitz', impact: 'High reach, low cost' },
                    { id: 'rally', label: 'Public Rallies', impact: 'Strong emotional connection' },
                    { id: 'door', label: 'Door-to-door', impact: 'Personalized trust building' }
                ],
                xp: 75
            },
            learnMore: "Campaigning must stop 48 hours before the end of polling. This period is known as the 'Silence Period' to allow voters to think calmly without external influence."
        },
        { 
            id: 4, 
            title: "Voting Day", 
            desc: "The crucial day where citizens cast their secret ballots.", 
            duration: "1 Day", 
            participants: "Voters, Polling Staff",
            roleContent: {
                voter: "Carry your ID, stand in queue, verify your name, and press the button on the EVM.",
                candidate: "Visit polling stations through your authorized agents to ensure fair polling.",
                officer: "Manage the EVMs, VVPATs, and ensure the secrecy of the ballot is maintained."
            },
            interaction: {
                type: 'simulated_voting',
                title: 'Mock Voting Process',
                xp: 150
            },
            learnMore: "The VVPAT (Voter Verifiable Paper Audit Trail) allows you to see a paper slip for 7 seconds to confirm your vote was recorded correctly for the chosen candidate."
        },
        { 
            id: 5, 
            title: "Counting & Results", 
            desc: "Votes are tabulated and the winner is declared.", 
            duration: "1-2 Days", 
            participants: "Election Officials, Agents",
            roleContent: {
                voter: "Track results via official EC apps or news outlets. Accept the democratic verdict.",
                candidate: "Be present at the counting center. Sign the result sheets if satisfied with the count.",
                officer: "Supervise the counting process. Handle any disputes regarding invalid votes or EVM errors."
            },
            interaction: {
                type: 'result_tabulation',
                title: 'Tabulate Mock Results',
                xp: 100
            },
            learnMore: "Counting is done under high security and CCTV surveillance. Each candidate has 'Counting Agents' present at every table to verify each vote counted."
        }
    ],
    QUIZ_DATA: [
        {
            id: 1,
            question: "What is the minimum age to vote in most democratic elections?",
            options: ["16", "18", "21", "25"],
            correct: 1,
            feedback: "In most democracies, the voting age is 18."
        },
        {
            id: 2,
            question: "What does EVM stand for?",
            options: ["Electronic Voter Monitor", "Election Verification Machine", "Electronic Voting Machine", "Every Vote Matters"],
            correct: 2,
            feedback: "EVM stands for Electronic Voting Machine, used for casting and counting votes."
        },
        {
            id: 3,
            question: "What is 'NOTA' in an election?",
            options: ["Notice Of Temporary Absence", "None Of The Above", "National Order of Trusted Agents", "New Online Training Application"],
            correct: 1,
            feedback: "NOTA allows voters to indicate that they do not support any of the candidates."
        },
        {
            id: 4,
            question: "What is the duration of the 'Silence Period' before voting ends?",
            options: ["12 Hours", "24 Hours", "48 Hours", "72 Hours"],
            correct: 2,
            feedback: "The silence period lasts for 48 hours before the conclusion of the poll."
        },
        {
            id: 5,
            question: "Who is responsible for the overall conduct of elections in India?",
            options: ["President", "Prime Minister", "Election Commission", "Supreme Court"],
            correct: 2,
            feedback: "The Election Commission of India is an autonomous constitutional authority."
        }
    ]
};
