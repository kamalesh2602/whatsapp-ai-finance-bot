import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";

import { parseExpense } from "./services/aiParser.js";
import Expense from "./models/Expense.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------- DB CONNECTION ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ---------------- TEST ROUTE ----------------
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

// ---------------- CATEGORY EXTRACT ----------------
function extractCategory(text) {
  const msg = text.toLowerCase();

  if (msg.includes("food")) return "food";
  if (msg.includes("travel")) return "travel";
  if (msg.includes("shopping")) return "shopping";

  return null;
}

// ---------------- WEBHOOK ----------------
app.post("/webhook", async (req, res) => {
  const message = req.body.Body;

  const rawPhone = req.body.From;
  const phone = rawPhone.replace("whatsapp:", "");

  console.log("\n-------------------------");
  console.log("Incoming:", message);
  console.log("Phone:", phone);

  try {

    // ================= QUERY FLOW =================
    if (!isExpense(message) && isQuery(message)) {

      const category = extractCategory(message);

      let matchStage = { phone };

      if (category) {
        matchStage.category = category;
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

      let replyText = "";

      if (category) {
        replyText = `💰 You spent ₹${amount} on ${category}`;
      } else {
        replyText = `💰 You spent ₹${amount}`;
      }

      return res.send(`
        <Response>
          <Message>${replyText}</Message>
        </Response>
      `);
    }

    // ================= EXPENSE FLOW =================
    const data = await parseExpense(message);

    console.log("Parsed Data:", data);

    const expense = await Expense.create({
      ...data,
      phone
    });

    console.log("Saved Expense:", expense);

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