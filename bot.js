const { Telegraf } = require('telegraf');
const { Pool } = require('pg');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Approval Logic
bot.action(/approve_(.+)/, async (ctx) => {
    const ip = ctx.match[1];
    await pool.query("UPDATE users SET is_paid = true, expiry_date = NOW() + INTERVAL '30 days' WHERE ip_address = ", [ip]);
    ctx.editMessageText("✅ Payment Accepted! Naina is now unlocked for 30 days.");
});

// Rejection Logic
bot.action(/reject_(.+)/, async (ctx) => {
    const ip = ctx.match[1];
    ctx.editMessageText("❌ Payment Rejected. Please check UTR and notify the user.");
});

bot.launch();
console.log("Telegram Bot with UTR Verification is running...");
