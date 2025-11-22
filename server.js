// server.js
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Tokens
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mybotverify";

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Receive messages
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      console.log("Message received:", webhookEvent);

      if (webhookEvent.message) {
        handleMessage(webhookEvent.sender.id, webhookEvent.message);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Simple reply handler
function handleMessage(senderPsid, receivedMessage) {
  let response = {};

  if (receivedMessage.text) {
    response = {
      text: `You said: ${receivedMessage.text}`
    };
  }

  callSendAPI(senderPsid, response);
}

// Send message API
function callSendAPI(senderPsid, response) {
  const requestBody = {
    recipient: { id: senderPsid },
    message: response
  };

  request({
    uri: "https://graph.facebook.com/v18.0/me/messages",
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: "POST",
    json: requestBody
  }, (err) => {
    if (err) {
      console.error("Unable to send message:", err);
    }
  });
}

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
