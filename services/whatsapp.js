import axios from "axios";

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export async function sendTextMessage(to, message) {
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(url, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message }
  }, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}

export async function sendButtons(to) {
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "Welcome to Ingu Tengu! What would you like to do?"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "order_now", title: "🍽 Order Food" }
          },
          {
            type: "reply",
            reply: { id: "make_payment", title: "💳 Make Payment" }
          }
        ]
      }
    }
  };

  await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}
