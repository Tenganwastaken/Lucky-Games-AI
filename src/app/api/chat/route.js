import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {
  ADVISOR_SYSTEM_PROMPT,
  CRISIS_RESPONSE,
  WIN_STRATEGY_REFUSAL,
  buildAdvisorContextBlock,
  buildUserTurn,
  detectCrisisMessage,
  detectWinStrategyRequest,
} from '@/lib/advisor-chat';

export const runtime = 'nodejs';

const GROQ_MODEL = process.env.ADVISOR_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = process.env.ADVISOR_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TEMPERATURE = 0.4;
const MAX_OUTPUT_TOKENS = 768;

function stripFences(text) {
  return String(text || '')
    .replace(/```[a-zA-Z]*/g, '')
    .replace(/```/g, '')
    .trim();
}

async function callGroq(apiKey, history, contextBlock, message) {
  const groq = new Groq({ apiKey });
  const messages = [
    {
      role: 'system',
      content: `${ADVISOR_SYSTEM_PROMPT}\n\n${contextBlock}`,
    },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: TEMPERATURE,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  return stripFences(completion.choices?.[0]?.message?.content);
}

async function callGemini(apiKey, userTurn) {
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: ADVISOR_SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [{ text: userTurn }],
        },
      ],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`);
  }

  const geminiData = await geminiRes.json();
  return stripFences(geminiData.candidates?.[0]?.content?.parts?.[0]?.text);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, history = [], context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (detectCrisisMessage(trimmed)) {
      return NextResponse.json({ reply: CRISIS_RESPONSE, safety: 'crisis' });
    }

    if (detectWinStrategyRequest(trimmed)) {
      return NextResponse.json({ reply: WIN_STRATEGY_REFUSAL, safety: 'win_strategy_refusal' });
    }

    const { input, analysis, formData } = context || {};
    const formPayload = formData ?? input ?? analysis?.input ?? null;
    const contextBlock = buildAdvisorContextBlock(formPayload, analysis);

    if (!contextBlock.trim()) {
      return NextResponse.json(
        {
          error:
            'Δεν υπάρχουν δεδομένα αξιολόγησης. Ολοκλήρωσε πρώτα την ανάλυση στη φόρμα.',
        },
        { status: 400 },
      );
    }

    const userTurn = buildUserTurn(history, trimmed, contextBlock);

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let reply = '';
    let provider = null;

    if (groqKey) {
      try {
        reply = await callGroq(groqKey, history, contextBlock, trimmed);
        provider = 'groq';
      } catch (groqErr) {
        console.error('Groq chat failed, falling back to Gemini:', groqErr);
        if (!geminiKey) throw groqErr;
      }
    }

    if (!reply && geminiKey) {
      reply = await callGemini(geminiKey, userTurn);
      provider = 'gemini';
    }

    if (!groqKey && !geminiKey) {
      return NextResponse.json(
        { error: 'Server is not configured with GROQ_API_KEY or GEMINI_API_KEY' },
        { status: 500 },
      );
    }

    if (!reply) {
      return NextResponse.json(
        { error: 'Empty response from language model' },
        { status: 500 },
      );
    }

    return NextResponse.json({ reply, provider });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    return NextResponse.json(
      {
        error: 'Failed to chat',
        message: err?.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
