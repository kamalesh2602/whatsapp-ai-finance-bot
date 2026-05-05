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

function isComparisonQuery(text) {
  const msg = text.toLowerCase();
  return (
    msg.includes("compare") ||
    msg.includes("trend") ||
    msg.includes("increase") ||
    msg.includes("decrease") ||
    msg.includes("last month")
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

// ---------------- MONTH RANGE ----------------
function getMonthRanges() {
  const now = new Date();

  return {
    thisMonthStart: new Date(now.getFullYear(), now.getMonth(), 1),
    now,
    lastMonthStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    lastMonthEnd: new Date(now.getFullYear(), now.getMonth(), 0)
  };
}

// ---------------- WEBHOOK ----------------
app.post("/webhook", async (req, res) => {
  const message = req.body.Body;
  const phone = req.body.From.replace("whatsapp:", "");

  console.log("\n-------------------------");
  console.log("Incoming:", message);

  try {

    // ================= COMPARISON =================
    if (isComparisonQuery(message)) {

      const { thisMonthStart, now, lastMonthStart, lastMonthEnd } = getMonthRanges();

      const thisMonth = await Expense.aggregate([
        {
          $match: {
            phone,
            createdAt: { $gte: thisMonthStart, $lte: now }
          }
        },
        {
          $group: { _id: null, total: { $sum: "$amount" } }
        }
      ]);

      const lastMonth = await Expense.aggregate([
        {
          $match: {
            phone,
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
          }
        },
        {
          $group: { _id: null, total: { $sum: "$amount" } }
        }
      ]);

      const thisTotal = thisMonth[0]?.total || 0;
      const lastTotal = lastMonth[0]?.total || 0;

      let trend = "";

      if (thisTotal > lastTotal) trend = "📈 Spending increased";
      else if (thisTotal < lastTotal) trend = "📉 Spending decreased";
      else trend = "➡️ Spending is same";

      const reply = `
💰 This Month: ₹${thisTotal}
💰 Last Month: ₹${lastTotal}

${trend}
      `;

      return res.send(`<Response><Message>${reply}</Message></Response>`);
    }

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
        return res.send(`<Response><Message>No data yet</Message></Response>`);
      }

      const total = data.reduce((sum, i) => sum + i.total, 0);
      const top = data.sort((a, b) => b.total - a.total)[0];

      return res.send(`
        <Response>
          <Message>
💰 Total: ₹${total}
📊 Top: ${top._id} (₹${top.total})
          </Message>
        </Response>
      `);
    }

    // ================= QUERY =================
    if (!isExpense(message) && isQuery(message)) {

      const category = extractCategory(message);
      const { start, end } = getDateRange(message);

      let match = { phone };

      if (category) match.category = category;
      if (start && end) match.createdAt = { $gte: start, $lte: end };

      const total = await Expense.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const amount = total[0]?.total || 0;

      let reply = `💰 You spent ₹${amount}`;
      if (category) reply += ` on ${category}`;

      return res.send(`<Response><Message>${reply}</Message></Response>`);
    }

    // ================= EXPENSE =================
    const data = await parseExpense(message);

    const expense = await Expense.create({
      ...data,
      phone
    });

    return res.send(`
      <Response>
        <Message>✅ Added ₹${expense.amount} to ${expense.category}</Message>
      </Response>
    `);

  } catch (err) {
    console.error(err);
    return res.send(`<Response><Message>❌ Error</Message></Response>`);
  }
});

app.listen(3000, () => console.log("Server running"));