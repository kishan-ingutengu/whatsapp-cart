const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const {
  getCart, updateCart, clearCart,
  getMenuMessage, saveOrder, getCatalog,
  saveAddressToOrder, getPendingOrder
} = require('./firebase');
const { createPaymentLink } = require('./payment');

function normalizeId(id) {
  return id.split('@')[0];
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log('✅ WhatsApp connected!');
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const senderRaw = msg.key.remoteJid;
    const sender = normalizeId(senderRaw);

    const text =
      msg.message?.conversation?.trim() ||
      msg.message?.extendedTextMessage?.text?.trim();
    if (!text) return;

    const lowerText = text.toLowerCase();
    const catalog = await getCatalog();
    if (!catalog || catalog.length === 0) {
      await sock.sendMessage(senderRaw, { text: '❌ Catalog is empty. Please try again later.' });
      return;
    }

    // MENU
    const menuTriggers = ['hi', 'menu', 'start', 'hello', 'help', 'commands', 'order', 'items', 'list', 'show menu', 'show items'];
    if (menuTriggers.includes(lowerText)) {
      await sock.sendMessage(senderRaw, { text: await getMenuMessage() });
      return;
    }

    // VIEW CART
    if (lowerText === 'view cart') {
      const cart = await getCart(sender);
      if (!cart || Object.keys(cart).length === 0) {
        await sock.sendMessage(senderRaw, { text: '🛒 Your cart is empty.' });
      } else {
        let summary = '*🛒 Your Cart:*\n\n';
        let total = 0;
        for (const id in cart) {
          const item = catalog.find(i => i.id == id);
          if (!item) continue;
          const qty = cart[id];
          const cost = item.price * qty;
          total += cost;
          summary += `• ${item.name} × ${qty} = ₹${cost}\n`;
        }
        summary += `\n💰 *Total: ₹${total}*`;
        await sock.sendMessage(senderRaw, { text: summary });
      }
      return;
    }

    // CHECKOUT - Save order and ask for address
    if (lowerText === 'checkout') {
      const cart = await getCart(sender);
      if (!cart || Object.keys(cart).length === 0) {
        await sock.sendMessage(senderRaw, { text: '🛒 Your cart is empty. Add items before checking out.' });
        return;
      }

      let items = [];
      let total = 0;
      for (const id in cart) {
        const item = catalog.find(i => i.id == id);
        if (!item) continue;
        const qty = cart[id];
        const cost = item.price * qty;
        total += cost;
        items.push({ name: item.name, quantity: qty, total: cost });
      }

      const order = {
        from: senderRaw,
        items,
        total,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      await saveOrder(order);
      await sock.sendMessage(senderRaw, {
        text: '📍 Please provide your delivery address in this format:\n\n_address: villa 256, street 59_'
      });
      await clearCart(sender);
      return;
    }

    // ADDRESS handling
    if (lowerText.startsWith('address:')) {
      const address = text.split('address:')[1].trim();
      if (!address) {
        await sock.sendMessage(senderRaw, { text: '❌ Please provide a valid address like:\n_address: villa 256, street 59_' });
        return;
      }

      const order = await getPendingOrder(senderRaw);
      if (!order) {
        await sock.sendMessage(senderRaw, { text: '⚠️ No pending order found. Type *checkout* to start again.' });
        return;
      }

      await saveAddressToOrder(senderRaw, address);

      const paymentLink = await createPaymentLink(order.total, order.id);
      await sock.sendMessage(senderRaw, {
        text: `📍 Address saved!\n\n🧾 *Order Summary:*\n${order.items.map(i => `• ${i.name} × ${i.quantity} = ₹${i.total}`).join('\n')}\n\n💰 *Total: ₹${order.total}*\n\n🔗 *Pay here:* ${paymentLink}\n\nReply with *PAID* once payment is done.`
      });
      return;
    }

    // PAYMENT CONFIRMATION
    if (lowerText === 'paid') {
      await sock.sendMessage(senderRaw, { text: '✅ Payment received! Your order is confirmed. 🍽️' });
      return;
    }

    // CLEAR CART
    if (lowerText === 'clear cart') {
      await clearCart(sender);
      await sock.sendMessage(senderRaw, { text: '🗑️ Your cart has been cleared' });
      return;
    }

    // PARSE TEXT INPUT (ex: Regular Idli 2, Uddin Vada 1)
    try {
      const cart = await getCart(sender);
      const items = text.split(',').map(item => item.trim());
      let foundAny = false;

      for (const item of items) {
        const match = item.match(/(.+?)\s+(\d+)/);
        if (!match) continue;

        const name = match[1].trim().toLowerCase();
        const quantity = parseInt(match[2]);

        const catalogItem = catalog.find(i => i.name.toLowerCase() === name);
        if (!catalogItem) continue;

        cart[catalogItem.id] = (cart[catalogItem.id] || 0) + quantity;
        foundAny = true;
      }

      if (foundAny) {
        await updateCart(sender, cart);
        await sock.sendMessage(senderRaw, { text: '✅ Items added to cart.' });
      } else {
        await sock.sendMessage(senderRaw, { text: '❌ Could not understand your items. Please try again or type *menu* to see available items.' });
      }
    } catch (err) {
      console.error('❌ Error:', err);
      await sock.sendMessage(senderRaw, { text: '⚠️ Something went wrong. Please try again later.' });
    }
  });
}

startBot();
