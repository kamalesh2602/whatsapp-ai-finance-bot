import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { parseExpense } from "./services/aiParser.js";
import Expense from "./models/Expense.js";
import Budget from "./models/Budget.js";

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------- DB ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ---------------- TEST ----------------
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ---------------- HELPERS ----------------
function isExpense(text) {
  return /\d+/.test(text);
}

function isQuery(text) {
  const msg = text.toLowerCase();
  return (
    msg.includes("how much") ||
    msg.includes("total") ||
    msg.includes("spend")
  );
}

function isInsightQuery(text) {
  const msg = text.toLowerCase();
  return (
    msg.includes("summary") ||
    msg.includes("insight") ||
    msg.includes("how is my spending")
  );
}

function isBudgetSet(text) {
  return text.toLowerCase().includes("budget");
}

function extractCategory(text) {
  const msg = text.toLowerCase();

  if (msg.includes("food")) return "food";
  if (msg.includes("travel")) return "travel";
  if (msg.includes("shopping")) return "shopping";

  return "general";
}

// ---------------- WEBHOOK ----------------
app.post("/webhook", async (req, res) => {
  const message = req.body.Body;
  const phone = req.body.From.replace("whatsapp:", "");

  console.log("\nIncoming:", message);

  try {

    // ================= SET BUDGET =================
    if (isBudgetSet(message)) {

      const amount = parseInt(message.match(/\d+/)?.[0] || 0);
      const category = extractCategory(message);

      await Budget.findOneAndUpdate(
        { phone, category },
        { limit: amount },
        { upsert: true }
      );

      return res.send(`
        <Response>
          <Message>✅ Budget set: ₹${amount} for ${category}</Message>
        </Response>
      `);
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
        return res.send(`
          <Response>
            <Message>No data yet. Start adding expenses.</Message>
          </Response>
        `);
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

      const total = await Expense.aggregate([
        { $match: { phone } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const amount = total[0]?.total || 0;

      return res.send(`
        <Response>
          <Message>💰 You spent ₹${amount}</Message>
        </Response>
      `);
    }

    // ================= EXPENSE =================
    const data = await parseExpense(message);

    const expense = await Expense.create({
      ...data,
      phone
    });

    // 🔥 BUDGET CHECK
    const budget = await Budget.findOne({
      phone,
      category: data.category
    });

    let alert = "";

    if (budget) {
      const total = await Expense.aggregate([
        { $match: { phone, category: data.category } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const spent = total[0]?.total || 0;
      const percent = ((spent / budget.limit) * 100).toFixed(1);

      alert = `\n⚠️ ${data.category}: ₹${spent}/${budget.limit} (${percent}%)`;

      if (spent > budget.limit) {
        alert += "\n🚨 Budget exceeded!";
      }
    }

    return res.send(`
      <Response>
        <Message>
✅ Added ₹${expense.amount} to ${expense.category}
${alert}
        </Message>
      </Response>
    `);

  } catch (err) {
    console.error(err);

    return res.send(`
      <Response>
        <Message>❌ Couldn't understand. Try again.</Message>
      </Response>
    `);
  }
});

app.get("/api/summary", async (req, res) => {
  let phone = req.query.phone;

  phone = decodeURIComponent(phone); // 🔥 FIX

  console.log("Correct phone:", phone);

  const total = await Expense.aggregate([
    { $match: { phone } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const category = await Expense.aggregate([
    { $match: { phone } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } }
  ]);

  res.json({
    total: total[0]?.total || 0,
    category
  });
});

app.get("/api/trend", async (req, res) => {
  let phone = req.query.phone;

  phone = decodeURIComponent(phone); // 🔥 FIX

  const trend = await Expense.aggregate([
    { $match: { phone } },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        total: { $sum: "$amount" }
      }
    }
  ]);

  res.json(trend);
});

// ---------------- START ----------------
app.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});