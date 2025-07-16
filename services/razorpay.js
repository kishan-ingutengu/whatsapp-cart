import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config(); // Load .env in this file too (in case it runs standalone)

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createPaymentLink(customerPhone) {
  const response = await instance.paymentLink.create({
    amount: 5000, // ₹50
    currency: "INR",
    accept_partial: false,
    description: "Breakfast Order - Ingu Tengu",
    customer: {
      name: "Ingu Tengu Customer",
      contact: customerPhone,
    },
    notify: {
      sms: true,
      whatsapp: true,
    },
    callback_url: "https://yourdomain.com/payment-success",
    callback_method: "get",
  });

  return response.short_url;
}
