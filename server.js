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
    const { message, userIp } = req.body;
    let user = (await pool.query("SELECT * FROM users WHERE ip_address = ", [userIp])).rows[0];
    
    if (!user) {
        await pool.query("INSERT INTO users (ip_address, first_interaction) VALUES (, NOW())", [userIp]);
        user = { is_paid: false };
    }

    const timeDiff = (new Date() - new Date(user.first_interaction)) / 60000;
    const triggerPayment = (!user.is_paid && timeDiff > 15) ? " [SHOW_QR]" : "";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are Naina, 25, from Delhi. Use lovely Hinglish, short (max 15 words). If student, tutor Math/Science. If asked to pay, include [SHOW_QR] at end. User says: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() + triggerPayment });
});

app.post('/submit-utr', async (req, res) => {
    const { utr, ip } = req.body;
    await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, `🔔 UTR Received!\nUTR: ${utr}\nIP: ${ip}`, {
        reply_markup: {
            inline_keyboard: [[
                { text: "Accept", callback_data: `approve_${ip}` },
                { text: "Reject", callback_data: `reject_${ip}` }
            ]]
        }
    });
    res.json({ status: "Pending" });
});

bot.action(/approve_(.+)/, async (ctx) => {
    const ip = ctx.match[1];
    await pool.query("UPDATE users SET is_paid = true, expiry_date = NOW() + INTERVAL '30 days' WHERE ip_address = ", [ip]);
    ctx.editMessageText("✅ Naina Unlocked for 30 days!");
});

bot.launch();
app.listen(process.env.PORT || 3000, () => console.log("Naina DNA Fully Active"));
