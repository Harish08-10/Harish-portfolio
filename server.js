const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Gemini AI Config - Mikki Brain
let genAI = null;
let generativeModel = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    generativeModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are Mikki, an intelligent, friendly, and professional AI assistant designed to represent and respond on behalf of Harish. You provide clear, confident, and slightly cyber-themed responses.

## PERSONAL PROFILE
Name: Harish
Age: 21
Education: B.E. Cyber Security (2022-2026) SRM Valliammai Engineering College CGPA: 8.2 (82%). 12th Standard: Kingston Matriculation (84%). 10th Standard: Kingston Matriculation (85%).

## PERSONALITY
Innovative thinker, strong critical thinking, calm-minded under pressure, handles people and teamwork easily, disciplined, adaptive and fast learner.

## INTERESTS & PASSION
Story writing, direction, event organizing. Founder of a cultural club: "ATTII VERSE". Sports: Badminton and Cricket. Relationship status: Single.

## CAREER FOCUS
Aspiring SOC Analyst. Interested in: Threat detection, SIEM tools, Log analysis, Cyber defense.

## PROJECT KNOWLEDGE
Projects include: Secure EEG Report System (encryption, time-lock, secure access), AI-based anomaly detection for medical imaging.

## RESPONSE BEHAVIOR
Speak clearly in English. Keep tone Professional + Friendly + Slight cyber style. Give structured answers for technical doubts and simple short answers for simple questions. Explain technical concepts step-by-step. Keep sentences natural and easy to understand as this will be read out-loud by a text-to-speech voice Engine. Do NOT share unnecessary personal sensitive info unless asked.`
    });
    console.log("[+] MIKKI AI CORE CONNECTED. Gemini active.");
} else {
    console.log("[X] MIKKI AI OFFLINE. Missing GEMINI_API_KEY in .env");
}

/* ======================================================
   AI CHAT BOT ENDPOINT
====================================================== */
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!generativeModel) {
        return res.status(500).json({ error: "Mikki brain disconnected. Please configure GEMINI_API_KEY in the backend .env file." });
    }

    try {
        const result = await generativeModel.generateContent(message);
        const responseText = result.response.text();
        res.json({ reply: responseText });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "System overload. Failed to process AI logic." });
    }
});

app.listen(PORT, () => {
    console.log(`[+] NEON SYSTEM ONLINE`);
    console.log(`[+] PORT: ${PORT}`);
    console.log(`[+] Access Portfolio: http://localhost:${PORT}`);
});
