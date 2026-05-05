import fetch from "node-fetch";

function basicParser(text) {
  const amountMatch = text.match(/\d+/);
  const amount = amountMatch ? parseInt(amountMatch[0]) : 0;

  let category = "other";

  if (text.toLowerCase().includes("food")) category = "food";
  else if (text.toLowerCase().includes("travel")) category = "travel";
  else if (text.toLowerCase().includes("shopping")) category = "shopping";

  return {
    amount,
    category,
    merchant: "unknown",
    type: "expense",
  };
}

export async function parseExpense(text) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `Extract expense JSON from: "${text}"` }]
            }
          ]
        })
      }
    );

    const data = await res.json();

    const textOutput =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!textOutput) return basicParser(text);

    try {
      return JSON.parse(textOutput.replace(/```json|```/g, "").trim());
    } catch {
      return basicParser(text);
    }

  } catch {
    return basicParser(text);
  }
}