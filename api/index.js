const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // Vercel sets its own PORT

// Use CORS middleware to allow requests from your frontend
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // For parsing application/json (if you switch to POST with JSON)

// --- In-memory "Database" ---
// In a real application, replace this with a proper database (e.g., MongoDB, PostgreSQL, SQLite)
let messages = []; // Stores objects like { id, name, message, seed, channel, timestamp }
let messageIdCounter = 0;

// --- Helper function to decode Base64 (from your frontend) ---
function decodeBase64Unicode(str) {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        console.error("Error decoding Base64 string:", e);
        return ""; // Return empty or handle error appropriately
    }
}

// --- API Endpoints ---

// Endpoint to get BBS messages
// GET /api?t=<timestamp>&channel=<channel_name>&verify=<true/false>
app.get('/api', (req, res) => {
    const { channel, verify } = req.query; // 't' is for cache busting on frontend, not used here

    let filteredMessages = messages;

    if (channel && channel !== 'all') { // Filter by channel if provided
        filteredMessages = filteredMessages.filter(msg => msg.channel === channel);
    }

    // Apply "verify" filter (スピ限) if needed.
    // As per your frontend, this is a checkbox. We'll simulate a simple filter.
    // You might want to implement a more complex logic here, e.g., only show messages
    // from verified users, or messages that pass certain criteria.
    if (verify === 'true') {
        // Example: Only show messages where the seed is a specific value or pattern
        // For now, let's just show messages that are 'verified' in some arbitrary way
        // In a real app, this would be a database field or a more complex check.
        filteredMessages = filteredMessages.filter(msg => msg.isVerified === true);
    }


    // Format messages for display (similar to your frontend expectation)
    const formattedMessages = filteredMessages.map(msg => {
        const date = new Date(msg.timestamp);
        const dateStr = date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        return `<p><b>${msg.name}</b> (${msg.seed.substring(0, 4)}...${msg.seed.substring(msg.seed.length - 4)}) ${dateStr}<br>${msg.message}</p>`;
    }).join('');

    res.status(200).send(formattedMessages || "<p>メッセージがありません。</p>");
});

// Endpoint to send a message (your frontend uses GET /bbs/result)
// GET /api/result?name=<name>&message=<base64_message>&seed=<seed>&channel=<channel>&verify=<true/false>
app.get('/api/result', (req, res) => {
    const { name, message, seed, channel, verify } = req.query;

    if (!name || !message || !seed) {
        return res.status(400).send("名前、Seed、メッセージは必須です！");
    }

    const decodedMessage = decodeBase64Unicode(message);

    // Simulate "verification" for "スピ限". This is just an example.
    // You might have a list of verified seeds, or specific rules.
    const isVerified = (verify === 'true'); // For now, just passes the frontend 'verify' state

    messageIdCounter++;
    const newMessage = {
        id: messageIdCounter,
        name: name,
        message: decodedMessage,
        seed: seed,
        channel: channel || 'main', // Default to 'main' if not specified
        timestamp: Date.now(),
        isVerified: isVerified // Store the verification status
    };

    messages.push(newMessage);

    // For simplicity, just send a success response. Frontend will refetch BBS.
    res.status(200).send("メッセージが送信されました！");
});

// --- Vercel Serverless Function Export ---
// This is how Vercel recognizes and uses your API.
// Instead of app.listen, we export the app instance.
module.exports = app;
