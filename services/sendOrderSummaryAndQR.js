// sendOrderSummaryAndQR.js
const axios = require('axios');
const { db } = require('./services/firebase');
const { getCart } = require('./services/cart'); // assumes getCart(userId) returns [{ name, quantity, price }]
const PHONE_NUMBER_ID = propcess.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = propcess.env.ACCESS_TOKEN;
const UPI_QR_MEDIA_ID = process.env.UPI_QR_MEDIA_ID;

/**
 * Sends order summary and static QR image to user.
 * @param {string} userId - WhatsApp ID like '9198xxxxxxx'
 */
async function sendOrderSummaryAndQR(userId) {
  try {
    const cartItems = await getCart(userId);
    if (!cartItems || cartItems.length === 0) {
      console.log('🛒 Cart is empty, skipping order summary.');
      return;
    }

    // Create order summary text
    let total = 0;
    const lines = cartItems.map(item => {
      const line = `${item.quantity} x ${item.name} — ₹${item.price * item.quantity}`;
      total += item.price * item.quantity;
      return line;
    });
    const orderText = lines.join('\n');

    const summaryText = `🧾 *Order Summary*\n\n${orderText}\n\n💰 *Total: ₹${total}*\n\nPlease scan the QR in the next message to complete payment.`;

    // Step 1: Send summary text
    await axios.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: userId,
      type: 'text',
      text: { body: summaryText },
    }, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    // Step 2: Send static QR code image
    await axios.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: userId,
      type: 'image',
      image: {
        id: UPI_QR_MEDIA_ID,
        caption: '📸 *Scan this UPI QR to pay*\nUPI ID: yourupiid@upi',
      },
    }, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Sent order summary + QR to ${userId}`);

  } catch (err) {
    console.error('❌ Error in sendOrderSummaryAndQR:', err.response?.data || err.message);
  }
}

module.exports = { sendOrderSummaryAndQR };
