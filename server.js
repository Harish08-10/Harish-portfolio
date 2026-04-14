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

// Serve all static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// FORCED ROUTE: This fixes the "Cannot GET /" error
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mikki AI Core Configuration
let genAI = null;
let generativeModel = null;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    generativeModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: "You are Mikki, Harish's Professional AI Cyber Assistant..." // Your instructions here
    });
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!generativeModel) return res.status(500).json({ error: "AI Offline" });
    try {
        const result = await generativeModel.generateContent(message);
        res.json({ reply: result.response.text() });
    } catch (e) {
        res.status(500).json({ error: "System overload" });
    }
});

app.listen(PORT, () => console.log(`NEON SYSTEM ONLINE ON PORT ${PORT}`));
