const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pool } = require('pg');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

app.use(express.json());
app.use(express.static('public'));

app.post('/chat', async (req, res) => {
    try {
        const { message, userIp } = req.body;
        // Query check: IP se user dhundo
        let resDB = await pool.query("SELECT * FROM users WHERE ip_address = ", [userIp]);
        let user = resDB.rows[0];
        
        if (!user) {
            await pool.query("INSERT INTO users (ip_address) VALUES ()", [userIp]);
            user = { is_paid: false };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const aiRes = await model.generateContent("You are Naina, 25, Delhi. Short lovely replies. User: " + message);
        res.json({ reply: aiRes.response.text() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Yaar, busy hoon abhi." });
    }
});

app.post('/submit-utr', async (req, res) => {
    await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, "🔔 Payment aaya hai!");
    res.json({ status: "Sent" });
});

// Bot launch sirf tabhi karein agar development na ho
if (process.env.NODE_ENV !== 'test') {
    bot.launch().catch(err => console.log("Bot already running"));
}

app.listen(process.env.PORT || 3000, () => console.log("Naina Live"));
