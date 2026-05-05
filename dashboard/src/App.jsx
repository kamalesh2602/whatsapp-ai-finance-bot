import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, LineChart, Line, XAxis, YAxis } from "recharts";

function App() {
  const phone = "%2B919940950539"; // 🔥 already encoded

  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {

    // ===== SUMMARY =====
    axios.get(`http://localhost:3000/api/summary?phone=${phone}`)
      .then(res => {
        console.log("SUMMARY:", res.data);

        setTotal(res.data.total);

        setCategory(
          (res.data.category || []).map(i => ({
            name: i._id,
            value: i.total
          }))
        );
      })
      .catch(err => console.error(err));

    // ===== TREND =====
    axios.get(`http://localhost:3000/api/trend?phone=${phone}`)
      .then(res => {
        console.log("TREND:", res.data);

        setTrend(
          res.data.map(i => ({
            month: `${i._id.month}/${i._id.year}`,
            total: i.total
          }))
        );
      })
      .catch(err => console.error(err));

  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Finance Dashboard</h1>

      <h2>💰 Total: ₹{total}</h2>

      <h3>Category Breakdown</h3>
      <PieChart width={400} height={300}>
        <Pie data={category} dataKey="value" nameKey="name" outerRadius={100} />
        <Tooltip />
      </PieChart>

      <h3>Monthly Trend</h3>
      <LineChart width={500} height={300} data={trend}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" />
      </LineChart>
    </div>
  );
}

export default App;