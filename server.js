import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";

import { parseExpense } from "./services/aiParser.js";
import Expense from "./models/Expense.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------- DB ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ---------------- ROUTE ----------------
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ---------------- DETECTION ----------------
function isExpense(text) {
  return /\d+/.test(text);
}

function isQuery(text) {
  const msg = text.toLowerCase();

  return (
    msg.includes("how much") ||
    msg.includes("total") ||
    msg.includes("spend") ||
    msg.includes("expense")
  );
}

function isInsightQuery(text) {
  const msg = text.toLowerCase();

  return (
    msg.includes("analysis") ||
    msg.includes("insight") ||
    msg.includes("summary") ||
    msg.includes("how is my spending")
  );
}

// ---------------- CATEGORY ----------------
function extractCategory(text) {
  const msg = text.toLowerCase();

  if (msg.includes("food")) return "food";
  if (msg.includes("travel")) return "travel";
  if (msg.includes("shopping")) return "shopping";

  return null;
}

// ---------------- TIME ----------------
function getDateRange(text) {
  const msg = text.toLowerCase();
  const now = new Date();

  let start = null;
  let end = null;

  if (msg.includes("this month")) {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date();
  }

  else if (msg.includes("last month")) {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  else if (msg.includes("this week")) {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end = new Date();
  }

  return { start, end };
}

// ---------------- WEBHOOK ----------------
app.post("/webhook", async (req, res) => {
  const message = req.body.Body;
  const phone = req.body.From.replace("whatsapp:", "");

  console.log("\n-------------------------");
  console.log("Incoming:", message);

  try {

    // ================= INSIGHTS =================
    if (isInsightQuery(message)) {

      const data = await Expense.aggregate([
        { $match: { phone } },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" }
          }
        }
      ]);

      if (!data.length) {
        return res.send(`
          <Response>
            <Message>No data yet. Start adding expenses.</Message>
          </Response>
        `);
      }

      const total = data.reduce((sum, item) => sum + item.total, 0);
      const top = data.sort((a, b) => b.total - a.total)[0];

      const reply = `
💰 Total: ₹${total}
📊 Top: ${top._id} (₹${top.total})
      `;

      return res.send(`
        <Response>
          <Message>${reply}</Message>
        </Response>
      `);
    }

    // ================= QUERY =================
    if (!isExpense(message) && isQuery(message)) {

      const category = extractCategory(message);
      const { start, end } = getDateRange(message);

      let matchStage = { phone };

      if (category) matchStage.category = category;

      if (start && end) {
        matchStage.createdAt = { $gte: start, $lte: end };
      }

      const total = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);

      const amount = total[0]?.total || 0;

      let replyText = `💰 You spent ₹${amount}`;

      if (category) replyText += ` on ${category}`;
      if (message.includes("last month")) replyText += " last month";
      else if (message.includes("this month")) replyText += " this month";
      else if (message.includes("this week")) replyText += " this week";

      return res.send(`
        <Response>
          <Message>${replyText}</Message>
        </Response>
      `);
    }

    // ================= EXPENSE =================
    const data = await parseExpense(message);

    const expense = await Expense.create({
      ...data,
      phone
    });

    const reply = `
      <Response>
        <Message>
          ✅ Added ₹${expense.amount} to ${expense.category}
        </Message>
      </Response>
    `;

    res.set("Content-Type", "text/xml");
    res.send(reply);

  } catch (err) {
    console.error("ERROR:", err.message);

    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>❌ Couldn't understand. Try again.</Message>
      </Response>
    `);
  }
});

// ---------------- SERVER ----------------
app.listen(3000, () => console.log("Server running on port 3000"));