import { useEffect, useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

function App() {

  const phone = import.meta.env.VITE_PHONE_NUMBER;

  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {

    // ================= SUMMARY =================
    axios
      .get(`http://localhost:3000/api/summary?phone=${phone}`)
      .then(res => {

        setTotal(res.data.total || 0);

        setCategory(
          (res.data.category || []).map(i => ({
            name: i._id,
            value: i.total
          }))
        );
      });

    // ================= TREND =================
    axios
      .get(`http://localhost:3000/api/trend?phone=${phone}`)
      .then(res => {

        setTrend(
          res.data.map(i => ({
            month: `${i._id.month}/${i._id.year}`,
            total: i.total
          }))
        );
      });

    // ================= BUDGETS =================
    axios
      .get(`http://localhost:3000/api/budgets?phone=${phone}`)
      .then(res => {
        setBudgets(res.data);
      });

    // ================= RECENT =================
    axios
      .get(`http://localhost:3000/api/recent?phone=${phone}`)
      .then(res => {
        setRecent(res.data);
      });

  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="mb-8">

        <h1 className="text-4xl font-bold text-gray-800">
          💸 Finance Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          AI-powered WhatsApp expense tracker
        </p>

      </div>

      {/* TOTAL CARD */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <p className="text-gray-500 mb-2">
          Total Spending
        </p>

        <h2 className="text-5xl font-bold text-green-600">
          ₹{total}
        </h2>

      </div>

      {/* ================= BUDGET SECTION ================= */}

      <div className="mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Budget Limits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {budgets.map((b, index) => (

            <div
              key={index}
              className="bg-white rounded-2xl shadow p-6"
            >

              <div className="flex justify-between mb-2">

                <h3 className="text-xl font-semibold capitalize">
                  {b.category}
                </h3>

                <span className={`font-bold ${
                  b.percent >= 100
                    ? "text-red-500"
                    : "text-green-600"
                }`}>
                  {b.percent}%
                </span>

              </div>

              <p className="text-gray-500 mb-3">
                ₹{b.spent} / ₹{b.limit}
              </p>

              {/* PROGRESS BAR */}
              <div className="w-full bg-gray-200 rounded-full h-4">

                <div
                  className={`h-4 rounded-full ${
                    b.percent >= 100
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(b.percent, 100)}%`
                  }}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* ================= RECENT TRANSACTIONS ================= */}

      <div className="mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Recent Transactions
        </h2>

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {recent.map((item, index) => (

            <div
              key={index}
              className="flex justify-between items-center p-4 border-b last:border-none"
            >

              <div>

                <p className="font-semibold capitalize">
                  {item.category}
                </p>

                <p className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>

              </div>

              <div className="text-right">

                <p className="font-bold text-lg">
                  ₹{item.amount}
                </p>

                <p className="text-sm text-gray-500 capitalize">
                  {item.type}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* ================= CHARTS ================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PIE CHART */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h3 className="text-xl font-semibold mb-4">
            Category Breakdown
          </h3>

          <ResponsiveContainer width="100%" height={300}>

            <PieChart>

              <Pie
                data={category}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
              />

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

        {/* TREND CHART */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h3 className="text-xl font-semibold mb-4">
            Monthly Trend
          </h3>

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={trend}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="total"
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

export default App;