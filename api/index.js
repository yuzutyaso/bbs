const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // Vercel sets its own PORT

// CORSミドルウェアを使用し、異なるオリジンからのリクエストを許可
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- インメモリ "データベース" ---
// 注意：このデータはVercelのサーバーレス関数がアイドル状態になったり再起動したりすると消えます。
// 本番環境では、MongoDB, PostgreSQLなどの永続的なデータベースを使用してください。
let messages = []; // { id, name, message, seed, channel, timestamp, isVerified } を格納
let messageIdCounter = 0;

// --- Base64デコードヘルパー関数 (フロントエンドから送られるメッセージ用) ---
function decodeBase64Unicode(str) {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        console.error("Error decoding Base64 string:", e);
        return "";
    }
}

// --- APIエンドポイント ---

// 掲示板メッセージ取得エンドポイント
// GET /api?t=<timestamp>&channel=<channel_name>&verify=<true/false>
app.get('/api', (req, res) => {
    const { channel, verify } = req.query;

    let filteredMessages = messages;

    // チャンネルでフィルタリング
    if (channel && channel !== 'all') {
        filteredMessages = filteredMessages.filter(msg => msg.channel === channel);
    }

    // 「スピ限」フィルタリング（例：isVerifiedがtrueのメッセージのみ表示）
    if (verify === 'true') {
        filteredMessages = filteredMessages.filter(msg => msg.isVerified === true);
    }

    // メッセージをHTML形式に整形
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

// メッセージ送信エンドポイント
// GET /api/result?name=<name>&message=<base64_message>&seed=<seed>&channel=<channel>&verify=<true/false>
app.get('/api/result', (req, res) => {
    const { name, message, seed, channel, verify } = req.query;

    if (!name || !message || !seed) {
        return res.status(400).send("名前、Seed、メッセージは必須です！");
    }

    const decodedMessage = decodeBase64Unicode(message);

    // 「スピ限」の状態を保存
    const isVerified = (verify === 'true');

    messageIdCounter++;
    const newMessage = {
        id: messageIdCounter,
        name: name,
        message: decodedMessage,
        seed: seed,
        channel: channel || 'main', // チャンネルが指定されない場合は'main'をデフォルトとする
        timestamp: Date.now(),
        isVerified: isVerified
    };

    messages.push(newMessage);

    // フロントエンドがメッセージ送信後に掲示板を再読み込みするため、成功レスポンスを返す
    res.status(200).send("メッセージが送信されました！");
});

// Vercelサーバーレス関数としてExpressアプリをエクスポート
module.exports = app;
