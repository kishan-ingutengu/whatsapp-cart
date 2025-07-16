import express from "express";
import { sendTextMessage, sendButtons } from "../services/whatsapp.js";
import { createPaymentLink } from "../services/razorpay.js";

const router = express.Router();

router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

router.post("/", async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message) {
    const from = message.from;
    const text = message.text?.body;

    if (text?.toLowerCase().includes("pay")) {
      const link = await createPaymentLink(from);
      await sendTextMessage(from, `🧾 Your payment link:\n${link}`);
    } else {
      await sendButtons(from);
    }
  }

  res.sendStatus(200);
});

export default router;
