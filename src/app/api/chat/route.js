import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Server is not configured with GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, history = [], context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const { input, analysis } = context || {};

    const systemPrompt = `You are an analytical, friendly assistant giving gambling safety advice.
For each answer:
1) Briefly restate what the user is asking.
2) Analyze their situation step by step (mention game type, bet size, frequency, and risk tolerance).
3) Explain the main risks clearly.
4) Finish with 2–3 concrete, practical suggestions to reduce risk (limits, budgets, breaks, avoiding chasing losses).
Keep answers focused and under about 6–8 sentences.
Do not mention that you are an AI or talk about tokens or APIs.
Avoid giving specific betting tips; focus on risk, probabilities and safe behavior.`;

    const contextSummary = input && analysis
      ? `
Previous input:
- Game type: ${input.gameType}
- Average bet size: ${input.betSize}
- Plays per week: ${input.frequencyPerWeek}
- Risk tolerance: ${input.riskTolerance}

Previous analysis:
- Advice: ${analysis.advice}
- Risk score: ${analysis.riskScore}
- Win chance estimate: ${analysis.winChanceEstimate}
- Loss chance estimate: ${analysis.lossChanceEstimate}
- Expected weekly spend: ${analysis.expectedWeeklySpend}
`
      : '';

    const historyText = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const userPrompt = `${contextSummary}
Conversation so far:
${historyText}

User: ${message}

Reply briefly and clearly.`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini chat API error', geminiRes.status, errText);
      return NextResponse.json(
        { error: 'Gemini chat API error', status: geminiRes.status },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    let reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    reply = reply.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    return NextResponse.json(
      {
        error: 'Failed to chat',
        message: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
