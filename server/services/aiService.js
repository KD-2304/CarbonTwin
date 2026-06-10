/**
 * AI Service — Claude API integration for personalized carbon coaching
 */

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
  console.warn('Anthropic SDK not installed. AI features will be disabled.');
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  try {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch (e) {
    console.error('Failed to initialize Anthropic client:', e.message);
    return null;
  }
}

/**
 * Generate a personalized weekly insight based on user data
 */
async function generateWeeklyInsight(userData) {
  const client = getClient();
  if (!client) {
    return getFallbackInsight(userData);
  }

  const { currentScore, scoreBreakdown, recentActions, weakestCategory } = userData;

  const prompt = `You are a friendly, knowledgeable carbon footprint coach. Analyze this user's data and provide personalized advice.

USER DATA:
- Current annual carbon footprint: ${currentScore} kg CO₂/year
- Score breakdown:
  • Transport: ${scoreBreakdown.transport} kg CO₂/year
  • Diet: ${scoreBreakdown.diet} kg CO₂/year
  • Energy: ${scoreBreakdown.energy} kg CO₂/year
  • Shopping: ${scoreBreakdown.shopping} kg CO₂/year
  • Flights: ${scoreBreakdown.flights} kg CO₂/year
- Weakest category (highest emissions): ${weakestCategory}
- Recent actions (last 7 days):
${recentActions.map(a => `  ${a.timestamp}: ${a.action} (${a.co2Delta > 0 ? '+' : ''}${a.co2Delta} kg CO₂)`).join('\n') || '  No actions logged this week'}

GLOBAL CONTEXT:
- World average: 4,000 kg CO₂/year
- Paris Agreement target: 2,000 kg CO₂/year

Respond in this EXACT JSON format:
{
  "insight": "One key insight about their biggest emission source (2-3 sentences, specific to their data)",
  "actions": [
    {"action": "Specific action 1", "saving": "X kg CO₂/week"},
    {"action": "Specific action 2", "saving": "X kg CO₂/week"},
    {"action": "Specific action 3", "saving": "X kg CO₂/week"}
  ],
  "encouragement": "One encouraging line about their progress (personalized)"
}

Use their ACTUAL numbers. Be specific, not generic. Reference their exact scores.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getFallbackInsight(userData);
  } catch (error) {
    console.error('Claude API error (weekly insight):', error.message);
    return getFallbackInsight(userData);
  }
}

/**
 * Handle free-form chat questions with personalized context
 */
async function handleChatMessage(message, userData) {
  const client = getClient();
  if (!client) {
    return {
      response: "AI Coach is currently unavailable. Please set your ANTHROPIC_API_KEY in the server environment to enable personalized coaching."
    };
  }

  const { currentScore, scoreBreakdown, recentActions, streak } = userData;

  const systemPrompt = `You are "Carbon Coach", a friendly and knowledgeable AI assistant helping users reduce their carbon footprint. You have access to this user's actual data:

CURRENT STATUS:
- Annual footprint: ${currentScore} kg CO₂/year
- Breakdown: Transport ${scoreBreakdown.transport}kg, Diet ${scoreBreakdown.diet}kg, Energy ${scoreBreakdown.energy}kg, Shopping ${scoreBreakdown.shopping}kg, Flights ${scoreBreakdown.flights}kg
- Current streak: ${streak} days
- World avg: 4,000 kg | Paris target: 2,000 kg

RECENT ACTIVITY (last 7 days):
${recentActions.map(a => `- ${a.action} (${a.co2Delta > 0 ? '+' : ''}${a.co2Delta} kg)`).join('\n') || 'No recent actions logged'}

RULES:
- Always reference their ACTUAL numbers in your response
- Be specific with suggestions — include estimated kg CO₂ savings
- Be encouraging but honest
- Keep responses concise (2-4 paragraphs max)
- Use emoji sparingly for friendliness`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    });

    return { response: response.content[0].text };
  } catch (error) {
    console.error('Claude API error (chat):', error.message);
    return { response: "I'm having trouble connecting right now. Please try again in a moment." };
  }
}

/**
 * Generate a full weekly report
 */
async function generateWeeklyReport(userData, weekActions) {
  const client = getClient();

  const totalDelta = weekActions.reduce((sum, a) => sum + a.co2Delta, 0);
  const categoryTotals = {};
  weekActions.forEach(a => {
    categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.co2Delta;
  });

  if (!client) {
    return {
      summary: `This week you logged ${weekActions.length} actions with a net impact of ${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(1)} kg CO₂.`,
      insight: `Your biggest impact area was ${Object.entries(categoryTotals).sort((a, b) => a[1] - b[1])[0]?.[0] || 'unknown'}.`,
      goal: 'Try to log at least one green action per day this week.',
      totalDelta,
      actionsCount: weekActions.length,
      categoryBreakdown: categoryTotals
    };
  }

  const prompt = `Generate a weekly carbon footprint report for this user.

USER PROFILE:
- Current annual score: ${userData.currentScore} kg CO₂/year
- Baseline score: ${userData.baselineScore} kg CO₂/year
- Current streak: ${userData.streak} days

THIS WEEK'S ACTIVITY:
- Total actions logged: ${weekActions.length}
- Net CO₂ impact: ${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(1)} kg
- By category: ${JSON.stringify(categoryTotals)}
- Actions: ${weekActions.map(a => `${a.action} (${a.co2Delta}kg)`).join(', ')}

Respond in this EXACT JSON format:
{
  "summary": "2-3 sentence summary of the week's performance",
  "insight": "Key insight about what improved most or needs work",
  "goal": "One specific, measurable goal for next week"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      summary: parsed.summary || `Logged ${weekActions.length} actions this week.`,
      insight: parsed.insight || '',
      goal: parsed.goal || '',
      totalDelta,
      actionsCount: weekActions.length,
      categoryBreakdown: categoryTotals
    };
  } catch (error) {
    console.error('Claude API error (weekly report):', error.message);
    return {
      summary: `This week you logged ${weekActions.length} actions with a net impact of ${totalDelta.toFixed(1)} kg CO₂.`,
      insight: '',
      goal: 'Keep logging your daily actions to track progress.',
      totalDelta,
      actionsCount: weekActions.length,
      categoryBreakdown: categoryTotals
    };
  }
}

/**
 * Fallback insight when API is unavailable
 */
function getFallbackInsight(userData) {
  const { currentScore, scoreBreakdown, weakestCategory } = userData;
  const tips = {
    transport: [
      { action: 'Use public transit 3 days/week instead of driving', saving: '3.6 kg CO₂/week' },
      { action: 'Work from home 2 days/week', saving: '2.4 kg CO₂/week' },
      { action: 'Cycle for trips under 5km', saving: '2.1 kg CO₂/week' }
    ],
    diet: [
      { action: 'Have 3 meatless days per week', saving: '2.4 kg CO₂/week' },
      { action: 'Buy local seasonal produce', saving: '1.4 kg CO₂/week' },
      { action: 'Reduce food waste by meal planning', saving: '1.0 kg CO₂/week' }
    ],
    energy: [
      { action: 'Switch to a renewable energy provider', saving: '5.0 kg CO₂/week' },
      { action: 'Reduce heating by 1°C', saving: '3.5 kg CO₂/week' },
      { action: 'Air-dry laundry instead of using dryer', saving: '2.8 kg CO₂/week' }
    ],
    shopping: [
      { action: 'Buy secondhand clothing this month', saving: '4.8 kg CO₂/week' },
      { action: 'Repair instead of replacing electronics', saving: '3.0 kg CO₂/week' },
      { action: 'Use reusable bags and containers', saving: '0.7 kg CO₂/week' }
    ],
    flights: [
      { action: 'Take train instead of short-haul flight', saving: '4.9 kg CO₂/week' },
      { action: 'Reduce one long-haul flight per year', saving: '31.2 kg CO₂/week' },
      { action: 'Offset remaining flights with verified programs', saving: '2.0 kg CO₂/week' }
    ]
  };

  return {
    insight: `Your biggest emission source is ${weakestCategory}, contributing ${scoreBreakdown[weakestCategory]} kg CO₂/year to your total of ${currentScore} kg. This is ${currentScore > 4000 ? 'above' : 'below'} the world average of 4,000 kg.`,
    actions: tips[weakestCategory] || tips.transport,
    encouragement: currentScore < 4000
      ? `Great job! You're already below the world average. Keep pushing toward the Paris Agreement target of 2,000 kg!`
      : `Every action counts! You're on a journey to reduce your footprint, and tracking is the first step.`
  };
}

module.exports = {
  generateWeeklyInsight,
  handleChatMessage,
  generateWeeklyReport
};
