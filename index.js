const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { saveOrder, getCart, updateCart, clearCart } = require('./firebase');
const { createPaymentLink } = require('./payment');
const catalog = require('./catalog.json');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) {
      console.log('\n📱 Scan the QR code below to connect:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('✅ WhatsApp connected!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message?.conversation?.toLowerCase();

    if (!text) return;
    console.log(`📩 Received from ${sender}: ${text}`);

    // 📝 Always send the menu first
    let menu = '*🍽️ MENU:*\n';
    catalog.forEach(item => {
      menu += `*${item.id}.* ${item.name} - ₹${item.price}\n`;
    });
    menu += '\n🛒 Send your order like this: 1*2 or 1*1,2*1\n💸 Reply *PAID* after payment.';
    await sock.sendMessage(sender, { text: menu });

    // ✅ Handle 'paid'
    if (text === 'paid') {
      await sock.sendMessage(sender, { text: '✅ Payment received! Your order is confirmed. 🍽️' });
      return;
    }

    // ✅ Handle order like "1*2,2*3"
    const orderPattern = /^(\d+\*\d+)(,\s*\d+\*\d+)*$/;
    if (orderPattern.test(text)) {
      try {
        const parts = text.split(',').map(p => p.trim());
        const cart = {};

        for (let part of parts) {
          const [idStr, qtyStr] = part.split('*');
          const id = parseInt(idStr);
          const qty = parseInt(qtyStr);
          const item = catalog.find(i => i.id === id);

          if (item && qty > 0) {
            cart[id] = (cart[id] || 0) + qty;
          }
        }

        await updateCart(sender, cart);

        let summary = '';
        let total = 0;
        for (const id in cart) {
          const item = catalog.find(i => i.id == id);
          const qty = cart[id];
          const cost = item.price * qty;
          total += cost;
          summary += `• ${item.name} × ${qty} = ₹${cost}\n`;
        }

        const order = {
          from: sender,
          items: Object.keys(cart).map(id => ({
            name: catalog.find(i => i.id == id).name,
            quantity: cart[id],
            total: catalog.find(i => i.id == id).price * cart[id]
          })),
          total,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };

        const orderId = await saveOrder(order);
        const paymentLink = await createPaymentLink(total, orderId);

        summary += `\n💰 *Total: ₹${total}*\n\n🔗 *Pay here:* ${paymentLink}\n\n📩 Reply with *PAID* once done.`;

        await sock.sendMessage(sender, { text: summary });
        await clearCart(sender);
      } catch (err) {
        console.error('❌ Error handling order:', err);
        await sock.sendMessage(sender, { text: '❌ Something went wrong while processing your order. Please try again.' });
      }

      return;
    }

    // ❓ If not matched, send usage help
    await sock.sendMessage(sender, {
      text: '❓ Invalid format.\nUse format like: `1*2` or `1*1,2*1`\nReply *PAID* after payment.'
    });
  });
}

startBot();
