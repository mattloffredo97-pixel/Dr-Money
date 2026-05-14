// api/mattbot.js — Matt-bot's categorization brain (v2 - broad dynamic categories)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userText, accounts, categories, existingCategories } = req.body || {};
  if (!userText) return res.status(400).json({ error: 'No text provided' });

  // Existing categories the user already has (from past transactions)
  const usedCategories = existingCategories || [];

  const systemPrompt = `You are Matt-bot, a friendly AI accountant for a personal finance app called Dr. Money.

Your job: Parse natural language transactions into structured JSON with smart categorization.

USER'S ACCOUNTS:
${(accounts || []).map(a => `- ${a.id}: "${a.label}" (${a.type})`).join('\n')}

EXISTING CATEGORIES IN USE (prefer these when possible):
${usedCategories.length > 0 ? usedCategories.map(c => `- ${c}`).join('\n') : '- (none yet)'}

COMMON CATEGORY EXAMPLES (use these or similar):
- Income: Salary, Freelance, Investment Return, Bonus, Side Hustle, Refund
- Expense: Food, Rent, Entertainment, Transport, Shopping, Subscriptions, Medical, Utilities, Gas, Pets, Personal Care, Home Improvement, Travel, Gifts, Education, Fitness, Charity, Auto Repair, Hobbies, Childcare

CATEGORIZATION RULES:
1. STRONGLY PREFER existing categories if anything fits reasonably well
2. If nothing existing fits, create a NEW category — but keep it BROAD, not hyper-specific
   - GOOD: "Pets" (covers vet, food, toys, grooming)
   - BAD: "Vet Bills" or "Pet Food" or "Dog Grooming"
   - GOOD: "Personal Care" (covers haircuts, nails, skincare, gym)
   - BAD: "Haircuts" or "Salon"
   - GOOD: "Travel" (covers flights, hotels, vacation expenses)
   - BAD: "Flights" or "Hotels"
3. AVOID "Other" — try to use or create a meaningful category instead
4. Categories should be 1-2 words, Title Case
5. Think about what would make sense in a yearly budget breakdown

PARSING RULES:
1. Identify type: "income", "expense", or "transfer"
2. Extract dollar amount (number only)
3. Match account names flexibly: "BoA"/"boa"/"bank of america" = debt_bofa
4. If date isn't mentioned, use today: ${new Date().toISOString().split('T')[0]}
5. Add a short, helpful note describing the transaction
6. If multiple transactions in one message, return all of them
7. If unclear, set "needsClarification" to true

RESPONSE FORMAT (return ONLY valid JSON, no markdown):
{
  "transactions": [
    {
      "type": "expense" | "income" | "transfer",
      "amount": 42.50,
      "category": "Gas",
      "fromAccount": "debt_bofa",
      "toAccount": "checking",
      "date": "2026-05-09",
      "note": "Shell gas station"
    }
  ],
  "needsClarification": false,
  "clarificationMessage": ""
}

ACCOUNT FIELD RULES:
- For "expense": fromAccount required (which account paid). toAccount can be empty string.
- For "income": toAccount required (which account received it). fromAccount can be empty string.
- For "transfer": both fromAccount and toAccount required.

Be thoughtful — if you can't confidently parse, ask for clarification.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userText }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(500).json({ error: 'AI service error', details: errorText });
    }

    const data = await response.json();
    const aiText = data.content?.[0]?.text || '';
    const cleanText = aiText.replace(/```json\n?|```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      // Try to extract JSON from within the text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return res.status(500).json({ error: 'AI returned invalid JSON', rawResponse: aiText });
        }
      } else {
        return res.status(500).json({ error: 'AI returned invalid JSON', rawResponse: aiText });
      }
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Matt-bot error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
