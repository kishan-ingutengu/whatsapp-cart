import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

import {
  getCart, updateCart, clearCart
} from './services/cart.js';
import {
  getCatalog, getCatalogByType
} from './services/catalog.js';
import {
  saveOrder, getPendingOrder,
  saveAddressToOrder, saveDeliveryTimeToOrder
} from './services/order.js';
// import { createPaymentLink } from './services/payment.js';
import { sendMenuList } from './services/menu.js';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(bodyParser.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const userState = {};

function sendMessage(to, text) {
  return fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      text: { body: text }
    })
  });
}

function sendButtons(to, message) {
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: message },
      action: {
        buttons: [
          { type: "reply", reply: { id: "menu", title: "➕ Add More" } },
          { type: "reply", reply: { id: "view_cart", title: "🛒 View Cart" } },
          { type: "reply", reply: { id: "checkout", title: "✅ Checkout" } }
        ]
      }
    }
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const messageObj = entry?.changes?.[0]?.value?.messages?.[0];
    if (!messageObj) return res.sendStatus(200);

    const from = messageObj.from;
    const catalog = await getCatalog();
    const interactive = messageObj?.interactive;
    const msgType = messageObj?.type;

    // ✅ Handle both button replies & typed messages
    let text = null;

    if (msgType === 'text') {
      const userTyped = messageObj.text.body.trim().toLowerCase();
      if (['menu', '🛒 view cart', '➕ add more', '✅ checkout', '🗑️ clear cart'].includes(userTyped)) {
        if (userTyped.includes('menu') || userTyped.includes('add')) text = 'menu';
        else if (userTyped.includes('view') || userTyped.includes('cart')) text = 'view_cart';
        else if (userTyped.includes('checkout')) text = 'checkout';
        else if (userTyped.includes('clear')) text = 'clear_cart';
      }
    } else {
      text = interactive?.button_reply?.id?.toLowerCase();
    }

    // 🛒 Add item from list
    if (interactive?.type === "list_reply") {
      await sendMessage(from, '⏳ Please wait...');
      const selectedId = interactive.list_reply.id;
      const itemId = selectedId.replace("add_item_", "");
      const item = catalog.find(i => i.id == itemId);

      if (item) {
        const cart = await getCart(from);
        cart[item.id] = (cart[item.id] || 0) + 1;
        await updateCart(from, cart);
        await sendButtons(from, `✅ Added *${item.name}* to your cart.\n\nWhat would you like to do next?`);
        return res.sendStatus(200);
      }
    }

    // 📍 Address
    if (userState[from] === 'awaiting_address') {
      await sendMessage(from, '⏳ Please wait...');
      await saveAddressToOrder(from, messageObj.text.body.trim());
      userState[from] = 'awaiting_time';
      await sendMessage(from, '⏰ Please enter your preferred delivery time (e.g., 8:00 AM)');
      return res.sendStatus(200);
    }

    // ⏰ Delivery time & payment
    if (userState[from] === 'awaiting_time') {
      if (userState[from] === 'processing_payment') {
        await sendMessage(from, '⚠️ Please wait while we finish generating your payment link...');
        return res.sendStatus(200);
      }

      userState[from] = 'processing_payment';

      try {
        await sendMessage(from, '⏳ Please wait...');
        await saveDeliveryTimeToOrder(from, messageObj.text.body.trim());

const order = await getPendingOrder(from);
const summaryLines = order.items.map(item => `• ${item.name} × ${item.quantity} = ₹${item.total}`);
const summaryMessage = `✅ Order Summary:\n${summaryLines.join('\n')}\n\n💰 Total: ₹${order.total}\n\n📸 Please scan the QR in the next message to pay.`;
await sendMessage(from, summaryMessage);

// ✅ Send the QR image (replace UPI_QR_MEDIA_ID with your actual ID)
await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    to: from,
    type: "image",
    image: {
      id: process.env.UPI_QR_MEDIA_ID,
      caption: '📸 *Scan this QR to pay*\nUPI ID: q459562038@ybl'
    }
  })
});


        // await sendMessage(from, '⏳ Generating payment link...');
        // const paymentLink = await createPaymentLink(order.total, order.id);
        
        // await sendMessage(from, `✅ Payment link generated!`);
        // await sendMessage(from, `💳 *Pay here:* ${paymentLink}`);

        await clearCart(from);
        delete userState[from];
        return res.sendStatus(200);
      } catch (err) {
        console.error('⚠️ Payment flow failed:', err);
        await sendMessage(from, '⚠️ Something went wrong while processing your order. Please try again.');
        delete userState[from];
        return res.sendStatus(500);
      }
    }

    // ✅ Checkout
    if (text === 'checkout') {
      if (userState[from]) {
        await sendMessage(from, '⚠️ You’ve already initiated checkout. Please complete it before trying again.');
        return res.sendStatus(200);
      }

      await sendMessage(from, '⏳ Checking your cart...');
      const cart = await getCart(from);
      if (!cart || Object.keys(cart).length === 0) {
        await sendButtons(from, '🛒 Your cart is empty. Please add items before checking out.');
        return res.sendStatus(200);
      }

      let items = [], total = 0;
      for (const id in cart) {
        const item = catalog.find(i => i.id == id);
        if (!item) {
          console.warn(`⚠️ Catalog item not found for ID: ${id}`);
          continue;
        }

        const qty = cart[id];
        const price = item.price * qty;
        items.push({ name: item.name, quantity: qty, total: price });
        total += price;
      }

      const order = {
        from,
        items,
        total,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      await saveOrder(order);
      userState[from] = 'awaiting_address';
      await sendMessage(from, '📍 Please enter your delivery address:');
      return res.sendStatus(200);
    }

    // 🛒 View Cart
    if (text === 'view_cart') {
      await sendMessage(from, '⏳ Fetching your cart...');
      const cart = await getCart(from);
      if (!cart || Object.keys(cart).length === 0) {
        await sendButtons(from, '🛒 Your cart is currently empty. Please add items first.');
        return res.sendStatus(200);
      }

      let total = 0;
      let message = '*🛒 Your Cart:*\n';
      for (const id in cart) {
        const item = catalog.find(i => i.id == id);
        if (!item) continue;
        const qty = cart[id];
        const cost = qty * item.price;
        total += cost;
        message += `• ${item.name} × ${qty} = ₹${cost}\n`;
      }
      message += `\n💰 Total: ₹${total}`;

      await sendButtons(from, message);
      return res.sendStatus(200);
    }

    // 🗑️ Clear cart
    if (text === 'clear_cart') {
      await sendMessage(from, '⏳ Clearing your cart...');
      const cart = await getCart(from);
      if (!cart || Object.keys(cart).length === 0) {
        await sendButtons(from, '🛒 Your cart is already empty.');
        return res.sendStatus(200);
      }

      await clearCart(from);
      await sendButtons(from, '🗑️ Your cart has been cleared.\n\nWhat would you like to do next?');
      return res.sendStatus(200);
    }

    // 🍽️ Menu (based on current IST time)
    if (text === 'menu') {
  await sendMessage(from, '⏳ Checking menu availability...');

  try {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    const hour = istNow.getUTCHours();
    const minutes = istNow.getUTCMinutes();
    const totalMinutes = hour * 60 + minutes;

    let type = null;
    const startBreakfast = 450; // 7:30 AM
    const endBreakfast = 690;   // 11:30 AM
    const startChats = 1050;    // 5:30 PM
    const endChats = 1170;      // 8:30 PM

    if (totalMinutes >= startBreakfast && totalMinutes <= endBreakfast) {
      type = 'breakfast';
    } else if (totalMinutes >= startChats && totalMinutes <= endChats) {
      type = 'chats';
    }

    if (!type) {
      await sendMessage(
        from,
        '❌ Sorry, the menu is currently unavailable.\n\n🕒 Timings:\n• *Breakfast:* 5:30–11:30 AM\n• *Chats:* 5:30–8:30 PM'
      );
      return res.sendStatus(200);
    }

    console.log(`📦 Fetching catalog for type: ${type}`);

    const menu = await getCatalogByType(type);

    console.log(`📦 Catalog received (${menu.length} items):`, menu);

    if (!menu.length) {
      await sendMessage(from, '⚠️ Menu is currently empty. Please try again later.');
    } else {
      await sendMenuList(from, menu);
    }
  } catch (error) {
    console.error('❌ Failed to fetch/send menu:', error);
    await sendMessage(from, '⚠️ Something went wrong. Please try again.');
  }

  return res.sendStatus(200);
}


    // Fallback
    await sendButtons(from, '⚠️ Please use the buttons to interact.');
    return res.sendStatus(200);

  } catch (error) {
    console.error('❌ Webhook error:', error);
    const from = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
    if (from) await sendMessage(from, '⚠️ Something went wrong. Please try again.');
    return res.sendStatus(500);
  }
});

app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
