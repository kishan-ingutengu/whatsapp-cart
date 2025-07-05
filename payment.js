const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPaymentLink(totalAmount, orderId, customerName) {
  const res = await razorpay.paymentLink.create({
    amount: totalAmount * 100,
    currency: 'INR',
    description: `Order ${orderId}`,
    customer: {
      name: customerName || "Customer",
    },
    notify: {
      sms: false,
      email: false,
    },
    callback_url: 'https://razorpay.com',
    callback_method: 'get'
  });

  return res.short_url;
}

module.exports = { createPaymentLink };