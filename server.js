const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");

console.log("Starting server...");

const app = express();
app.use(bodyParser.json());

// --------------------
// CONFIG
// --------------------
const VERIFY_TOKEN = "mybotverify"; // your verify token
const PAGE_ACCESS_TOKEN = "EAAOUTb7FiWYBQBTmeSoobKBpC3th2X1RzlLPnZCb3DctZAc16Vya0f7fszh4iIviW6R9496kwFizjzWvV545xhxqGLAuRZAN6Ph6WCs3yQBfj1RvZCFvVO7iuzwIGUG8waRaF0s7irgrrjwfoLfZChZAeRrz9ezrb8WGVzeLF4uq4Rsra1g0JBeGGY3Sb9J69eD2DdrecD6gZDZD";

// --------------------
// VERIFICATION ENDPOINT
// --------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified!");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  } else {
    return res.sendStatus(403);
  }
});

// --------------------
// MESSAGE RECEIVER
// --------------------
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const event = entry.messaging[0];
      const sender = event.sender.id;

      if (event.message && event.message.text) {
        const text = event.message.text;
        console.log("Received:", text);

        // Reply
        await sendText(sender, "Bot received: " + text);
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// --------------------
// SEND TEXT MESSAGE
// --------------------
async function sendText(sender_psid, message) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const payload = {
    recipient: { id: sender_psid },
    message: { text: message }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (data.error) {
      console.error("Facebook API error:", data.error);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
