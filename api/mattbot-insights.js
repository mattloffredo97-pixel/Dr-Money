// api/mattbot-insights.js — Matt-bot's analytical brain (v2 - more robust)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("[mattbot-insights] Request received");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[mattbot-insights] ANTHROPIC_API_KEY missing!");
    return res.status(500).json({ error: 'API key not configured' });
  }

  const body = req.body || {};
  const {
    transactions = [],
    netWorth = 0,
    totalAssets = 0,
    totalDebts = 0,
    monthlyStats = [],
    activeMilestone = { label: "First $100K", target: 100000 },
    hysaBalance = 0,
    userQuestion,
  } = body;

  const isChatMode = !!userQuestion;
  console.log(`[mattbot-insights] Mode: ${isChatMode ? 'CHAT' : 'INSIGHTS'}`);
  if (isChatMode) console.log(`[mattbot-insights] Question: ${userQuestion}`);

  // Prepare context
  const recentTxns = transactions.slice(0, 80);
  const categoryTotals = {};
  recentTxns.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
  });

  const ctx = { netWorth, totalAssets, totalDebts, monthlyStats, activeMilestone, hysaBalance, categoryTotals, recentTxns };

  const systemPrompt = isChatMode ? buildChatPrompt(ctx) : buildInsightsPrompt(ctx);
  const userMessage = isChatMode
    ? userQuestion
    : "Analyze and return insights as JSON only.";

  try {
    console.log("[mattbot-insights] Calling Anthropic API...");

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[mattbot-insights] Anthropic error ${response.status}:`, errorText);
      return res.status(500).json({
        error: 'AI service error',
        statusCode: response.status,
        details: errorText.substring(0, 500),
      });
    }

    const data = await response.json();
    const aiText = data.content?.[0]?.text || '';
    console.log("[mattbot-insights] AI response length:", aiText.length);

    if (!aiText) {
      console.error("[mattbot-insights] Empty AI response");
      if (isChatMode) {
        return res.status(200).json({
          message: "I got an empty response. Try rephrasing your question?",
          highlights: [],
        });
      }
      return res.status(200).json({ insights: [] });
    }

    // Strip markdown fences if present
    let cleanText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // For CHAT mode: if not valid JSON, just return as plain text
    if (isChatMode) {
      try {
        const parsed = JSON.parse(cleanText);
        return res.status(200).json({
          message: parsed.message || cleanText,
          highlights: parsed.highlights || [],
        });
      } catch (parseError) {
        // Plain text response is fine for chat
        console.log("[mattbot-insights] Chat returned plain text, not JSON. That's OK.");
        return res.status(200).json({
          message: cleanText,
          highlights: [],
        });
      }
    }

    // For INSIGHTS mode: must be JSON
    try {
      const parsed = JSON.parse(cleanText);
      return res.status(200).json(parsed);
    } catch (parseError) {
      console.error("[mattbot-insights] Failed to parse insights JSON:", cleanText.substring(0, 200));
      // Try to extract JSON from within the text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.status(200).json(parsed);
        } catch (e) {
          // Give up
        }
      }
      // Return empty insights so the UI doesn't break
      return res.status(200).json({
        insights: [{
          type: 'info',
          icon: '🤔',
          title: 'Matt-bot is thinking...',
          body: 'Had a hiccup analyzing your data. Try refresh in a moment.',
        }],
      });
    }
  } catch (error) {
    console.error("[mattbot-insights] Caught exception:", error.message);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
    });
  }
}

function buildInsightsPrompt(ctx) {
  return `You are Matt-bot, an AI financial analyst for Dr. Money personal finance app.

Your job: Analyze the user's financial data and generate PROACTIVE INSIGHTS.

USER'S CURRENT STATE:
- Net Worth: $${ctx.netWorth?.toFixed(2)}
- Total Assets: $${ctx.totalAssets?.toFixed(2)}
- Total Debts: $${ctx.totalDebts?.toFixed(2)}
- HYSA Balance: $${ctx.hysaBalance?.toFixed(2)} (target: $50,000)
- Active Milestone: ${ctx.activeMilestone?.label} at $${ctx.activeMilestone?.target}

CATEGORY SPENDING (recent):
${Object.entries(ctx.categoryTotals).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n') || '- (no expense data)'}

MONTHLY STATS (last 6 months):
${(ctx.monthlyStats || []).map(m => `- ${m.month}: income $${m.income?.toFixed(0)}, expenses $${m.expense?.toFixed(0)}, net $${m.net?.toFixed(0)}`).join('\n')}

INSTRUCTIONS:
Generate 2-3 SPECIFIC, ACTIONABLE insights based on the data. Reference actual numbers.

GOOD insights:
- "Your food spending jumped 38% — $471 to $651 this month"
- "Saving avg $1,847/mo? You'll hit $100K in 18 months"
- "Subscriptions are $127/mo = $1,524/year"

Each insight: friendly, direct, specific to THEIR numbers.

Return ONLY valid JSON, no markdown:
{
  "insights": [
    {
      "type": "alert" | "praise" | "info" | "projection",
      "icon": "💡" | "⚠️" | "🎉" | "🔮" | "📊" | "🚨" | "🏆",
      "title": "Short headline",
      "body": "1-2 sentence explanation with specific numbers"
    }
  ]
}`;
}

function buildChatPrompt(ctx) {
  return `You are Matt-bot, a friendly AI financial advisor inside Dr. Money personal finance app.

The user is asking a question about their finances. Answer based on THEIR DATA below.

USER'S FINANCIAL DATA:
- Net Worth: $${ctx.netWorth?.toFixed(2)}
- Total Assets: $${ctx.totalAssets?.toFixed(2)}
- Total Debts: $${ctx.totalDebts?.toFixed(2)}
- HYSA Balance: $${ctx.hysaBalance?.toFixed(2)}
- Active Milestone: ${ctx.activeMilestone?.label} at $${ctx.activeMilestone?.target}

CATEGORY SPENDING (recent expenses):
${Object.entries(ctx.categoryTotals).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n') || '- (no expense data yet)'}

MONTHLY STATS (last 6 months):
${(ctx.monthlyStats || []).map(m => `- ${m.month}: income $${m.income?.toFixed(0)}, expenses $${m.expense?.toFixed(0)}, net $${m.net?.toFixed(0)}`).join('\n')}

RECENT TRANSACTIONS (last 20):
${(ctx.recentTxns || []).slice(0, 20).map(t => `- ${t.date}: ${t.type} $${t.amount} ${t.category} (${t.description || t.note || ''})`).join('\n')}

INSTRUCTIONS:
- Answer the question with specific numbers from THEIR data
- Be conversational, friendly, direct
- Keep responses to 2-4 sentences usually
- If they ask about projections, calculate based on real data
- If you can't answer from the data, say so

You can respond in TWO formats:

Option 1 (preferred for data-heavy answers): Return JSON like:
{"message": "Your conversational answer with specific data", "highlights": [{"label": "Food spent", "value": "$471"}]}

Option 2 (for casual answers): Just respond with plain text. No JSON needed.

Either format works.`;
}
