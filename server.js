/* ======================================================
   MIKKI AI CORE - UNIVERSAL DEPLOYMENT ENGINE
   ====================================================== */
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

// 1. UNIVERSAL FILE ACCESS: Look in Root and Public folders
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// 2. SMART ROOT ACCESS: Forces index.html to load from anywhere
app.get('/', (req, res) => {
    const rootIndex = path.join(__dirname, 'index.html');
    const publicIndex = path.join(__dirname, 'public', 'index.html');

    // Try finding in public folder first, then root
    res.sendFile(publicIndex, (err) => {
        if (err) {
            res.sendFile(rootIndex, (err2) => {
                if (err2) {
                    res.status(404).send("Internal Error: Mikki could not find index.html in Root or Public folders. Check your GitHub file list!");
                }
            });
        }
    });
});

// 3. MIKKI AI CONFIGURATION
let genAI = null;
let generativeModel = null;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    generativeModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are Mikki, an intelligent, professional AI assistant for Harish. 
        Harish is a 21-year-old Cyber Security graduate from SRM Valliammai (8.2 CGPA). 
        He is an aspiring SOC Analyst and founder of the club "ATTII VERSE".`
    });
}

// 4. CHAT ENDPOINT
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!generativeModel) return res.status(500).json({ error: "Missing API Key" });
    try {
        const result = await generativeModel.generateContent(message);
        res.json({ reply: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: "System overload" });
    }
});

app.listen(PORT, () => console.log(`[+] SYSTEM ONLINE`));
