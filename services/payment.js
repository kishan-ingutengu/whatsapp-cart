import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createPaymentLink(totalAmount, orderId) {
  try {
    const res = await razorpay.paymentLink.create({
      amount: totalAmount * 100,
      currency: 'INR',
      description: `Order ${orderId}`,
      customer: { name: "Customer" },
      notify: { sms: false, email: false },
      callback_url: "https://razorpay.com",
      callback_method: "get",
    });

    return res.short_url;
  } catch (error) {
    console.error("❌ Razorpay error:", error);
    throw error; // rethrow so it triggers your webhook catch block
  }
}
