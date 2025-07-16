import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export async function sendMenuList(to, catalog) {
  const rows = catalog.map((item) => ({
    id: `add_item_${item.id}`,
    title: item.name,
    description: `₹${item.price}`
  }));

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "🍽️ Menu"
      },
      body: {
        text: "Please choose an item to add to your cart:"
      },
      footer: {
        text: "Tap an item to continue"
      },
      action: {
        button: "View Menu",
        sections: [
          {
            title: "Available Items",
            rows: rows
          }
        ]
      }
    }
  };

  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    body,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}
