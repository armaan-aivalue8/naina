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
        // Query fix: SELECT statement sahi kiya
        let result = await pool.query("SELECT * FROM users WHERE ip_address = ", [userIp]);
        let user = result.rows[0];
        
        if (!user) {
            await pool.query("INSERT INTO users (ip_address, first_interaction) VALUES (, NOW())", [userIp]);
            user = { is_paid: false };
        }

        const timeDiff = (new Date() - new Date(user.first_interaction)) / 60000;
        const triggerPayment = (!user.is_paid && timeDiff > 15) ? " [SHOW_QR]" : "";

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const aiRes = await model.generateContent("You are Naina, 25, from Delhi. Short replies. User: " + message);
        res.json({ reply: aiRes.response.text() + triggerPayment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Yaar, server thoda busy hai, ruk ja na." });
    }
});

// Bot setup bina conflict ke
bot.launch().catch(e => console.log("Bot already running"));
app.listen(process.env.PORT || 3000, () => console.log("Naina Live"));
