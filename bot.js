const { Telegraf, Markup } = require('telegraf');
const { query } = require('./db');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// User jab UTR aur Screenshot bheje (Yeh logic baad mein front-end se connect hoga)
// Filhal main structure dikha raha hoon
bot.action(/approve_(.+)/, async (ctx) => {
    const ip = ctx.match[1];
    await query("UPDATE users SET is_paid = true, expiry_date = NOW() + INTERVAL '30 days' WHERE ip_address = $1", [ip]);
    ctx.editMessageText(`✅ Payment Accepted for IP: ${ip}`);
});

bot.launch();
console.log("Telegram Bot is running...");
