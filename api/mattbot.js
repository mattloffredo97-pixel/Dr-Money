// api/mattbot.js — Matt-bot's brain
// Receives natural language, returns structured transactions

export default async function handler(req, res) {
  // CORS headers (allow your app to call this)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userText, accounts, categories } = req.body || {};
  if (!userText) return res.status(400).json({ error: 'No text provided' });

  // Build the prompt that teaches Claude how Matt-bot should think
  const systemPrompt = `You are Matt-bot, a friendly AI accountant for a personal finance app called Dr. Money.

Your job: Parse natural language transactions into structured JSON.

USER'S ACCOUNTS:
${accounts.map(a => `- ${a.id}: "${a.label}" (${a.type})`).join('\n')}

VALID CATEGORIES:
- Income: ${categories.income.join(', ')}
- Expense: ${categories.expense.join(', ')}

RULES:
1. Identify if it's an "income", "expense", or "transfer" (money moving between user's own accounts)
2. Extract the dollar amount (no commas, just a number)
3. Pick the BEST matching category from the lists above
4. Match account names to account IDs (be flexible: "BoA"/"boa"/"bank of america" = debt_bofa)
5. If date isn't mentioned, use today: ${new Date().toISOString().split('T')[0]}
6. Add a short helpful note describing what the transaction was for
7. If user mentions multiple transactions in one message, return them all
8. If something is unclear or ambiguous, set "needsClarification" to true and explain what's needed

RESPONSE FORMAT (return ONLY valid JSON, no markdown, no explanation):
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

NOTES:
- For "expense": fromAccount is required (which account paid). toAccount can be empty.
- For "income": toAccount is required (which account received it). fromAccount can be empty.
- For "transfer": both fromAccount and toAccount are required.
- Be thoughtful and conservative — if you can't confidently parse, ask for clarification.`;

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
    
    // Strip any markdown code fences just in case
    const cleanText = aiText.replace(/```json\n?|```\n?/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      return res.status(500).json({ 
        error: 'AI returned invalid JSON', 
        rawResponse: aiText 
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Matt-bot error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
