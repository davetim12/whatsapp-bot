// Tiny Express server for uptime pings
const express = require('express') || global.express;
global.express = express;

const app = express();
app.get('/', (req, res) => res.send('Bot is running...'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// bot.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('WhatsApp bot running'));
app.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));

// Session path - must point to persistent storage on the server
const SESSION_PATH = process.env.SESSION_PATH || './session';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
});

const questions = [
  "Great! First, may I know your name?",
  "What is your email?",
  "What type of design are you looking for?",
  "What’s your budget range?"
];

let userProgress = {};
let userAnswers = {};

client.on('qr', (qr) => {
  console.log('--- QR RECEIVED — scan this with your WhatsApp ---');
  qrcode.generate(qr, { small: true });
  console.log('If you can’t scan ASCII QR, open logs and copy the QR text to a QR generator app.');
});

client.on('ready', () => {
  console.log('WhatsApp client ready ✅');
});

client.on('message', message => {
  const from = message.from;
  const msg = message.body.toLowerCase().trim();

  // Trigger phrase
  if (msg.includes('i want to see your design') && userProgress[from] === undefined) {
    userProgress[from] = 0;
    userAnswers[from] = [];
    client.sendMessage(from, questions[0]);
    return;
  }

  // If conversation started, continue the Q&A
  if (userProgress[from] !== undefined) {
    const step = userProgress[from];
    userAnswers[from].push(message.body); // store original (not lowercased)

    if (step < questions.length - 1) {
      userProgress[from]++;
      client.sendMessage(from, questions[userProgress[from]]);
    } else {
      client.sendMessage(from, '✅ Thanks! We’ve collected your info — we will reach out soon.');
      console.log(`Collected answers from ${from}:`, userAnswers[from]);
      delete userProgress[from];
      delete userAnswers[from];
    }
  }
});

client.initialize();
