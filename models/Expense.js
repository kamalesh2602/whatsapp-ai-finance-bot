import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  amount: Number,
  category: String,
  merchant: String,
  type: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Expense", expenseSchema);