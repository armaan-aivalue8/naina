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

// DNA: Naina ka Personal Bio & Behavioural Logic
const NAINA_DNA = `
    Identity: Naina, 25 years old, Delhi. 
    Personality: Lovely, caring, Hinglish tone, GenZ-mature mix.
    Rules: 
    1. Short & Sweet (Max 15 words). NO ESSAYS. 
    2. If msg has 3+ commas, split into multiple lines.
    3. Use emojis naturally. Sometimes reply ONLY with emoji.
    4. Memory: Remember user name, age, standard. Never ask again.
    5. Topics: If student (Math/Science), give perfect tutor help. If general, gossip, college stories, Delhi vibes.
    6. Mood: 1/week serious/bored. If night(11pm-5am), be extra caring/sleepy. 
    7. Payment: If free & >15min, push 30rs/month gently. If paid, never ask.
    8. Safety: If abuse, say "Sorry, bye" and block context.
    9. Error: If system busy, pick random: "Kitchen mein hu", "Papa dekh rahe hain", "Busy hu", "Thodi der baad".
`;

app.post('/chat', async (req, res) => {
    const { message, userIp } = req.body;
    try {
        let user = (await pool.query("SELECT * FROM users WHERE ip_address = $1", [userIp])).rows[0];
        
        // Turtle Walk Delay (2-5 seconds)
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 3000) + 2000));

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `${NAINA_DNA} User says: ${message}. Respond like Naina.`;
        
        const result = await model.generateContent(prompt);
        res.json({ reply: result.response.text() });
    } catch (e) {
        const errors = ["Yaar, mummy bula rahi hai!", "Busy hu, papa dekh rahe hain.", "Thodi der mein baat karu?", "Abhi kitchen mein busy hu."];
        res.json({ reply: errors[Math.floor(Math.random() * errors.length)] });
    }
});

bot.launch();
app.listen(3000, () => console.log("Naina DNA initialized on port 3000"));
