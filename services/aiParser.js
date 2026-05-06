import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

export async function parseExpense(text) {

  try {

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
Extract expense details from this message.

Message:
"${text}"

Return ONLY valid JSON.

Format:
{
  "amount": number,
  "category": string,
  "merchant": string,
  "type": "expense"
}

Examples:
"spent 300 on swiggy"
{
  "amount": 300,
  "category": "food",
  "merchant": "swiggy",
  "type": "expense"
}

"amazon prime subscription 500"
{
  "amount": 500,
  "category": "subscriptions",
  "merchant": "amazon prime",
  "type": "expense"
}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const raw = response.text();

    console.log("RAW AI:", raw);

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {

      return JSON.parse(cleaned);

    } catch {

      console.log("Invalid AI JSON, fallback used");

      return basicParser(text);
    }

  } catch (err) {

    console.log("AI ERROR:", err.message);

    return basicParser(text);
  }
}

// ---------------- FALLBACK PARSER ----------------

function basicParser(text) {

  const lower = text.toLowerCase();

  const amount = parseInt(
    lower.match(/\d+/)?.[0] || 0
  );

  const categoryMap = {

    // FOOD
    swiggy: "food",
    zomato: "food",
    pizza: "food",
    burger: "food",
    food: "food",

    // TRAVEL
    uber: "travel",
    ola: "travel",
    bus: "travel",
    train: "travel",

    // ENTERTAINMENT
    netflix: "entertainment",
    movie: "entertainment",
    game: "entertainment",
    steam: "entertainment",

    // SHOPPING
    amazon: "shopping",
    flipkart: "shopping",

    // SUBSCRIPTIONS
    "amazon prime": "subscriptions",
    spotify: "subscriptions",

    // HEALTH
    pharmacy: "health",
    apollo: "health"

  };

  let category = "other";

  for (const key in categoryMap) {

    if (lower.includes(key)) {
      category = categoryMap[key];
      break;
    }
  }

  return {
    amount,
    category,
    merchant: "unknown",
    type: "expense"
  };
}