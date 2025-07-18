import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const MAX_TITLE_LENGTH = 24;

function trimTitle(name) {
  return name.length > MAX_TITLE_LENGTH ? name.slice(0, MAX_TITLE_LENGTH - 3) + '...' : name;
}

function groupByCategory(catalog) {
  const grouped = {};
  for (const item of catalog) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }
  return grouped;
}

export async function sendMenuList(to, catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error("Catalog is empty or invalid.");
  }

  const groupedCatalog = groupByCategory(catalog);

  const sections = Object.entries(groupedCatalog).slice(0, 10).map(([category, items]) => ({
    title: category,
    rows: items.slice(0, 10).map(item => ({
      id: `add_item_${item.id}`,
      title: trimTitle(item.name),
      description: `Price ₹${item.price} | ${item.name}`
    }))
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
        sections: sections
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
  ).catch(err => {
    console.error("❌ WhatsApp API error:", err.response?.data || err.message);
    throw err;
  });
}
