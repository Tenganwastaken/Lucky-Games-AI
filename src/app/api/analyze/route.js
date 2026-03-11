import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'sessions.json');

async function appendSession(entry) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let existing = [];
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
    existing.push(entry);
    await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to persist session data:', e);
  }
}

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
    const { gameType, betSize, frequencyPerWeek, riskTolerance } = body;

    const prompt = `
You are analyzing a user's gambling / lucky game behavior.

User data:
- Game type: ${gameType}
- Average bet size (in currency units): ${betSize}
- Plays per week: ${frequencyPerWeek}
- Self-reported risk tolerance: ${riskTolerance}

In 2-3 sentences, give clear, responsible advice about their gambling behavior.
Encourage safe habits and highlight risks if they seem too high.
Return only plain text sentences, no JSON, no bullet points, no code fences.
`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error', geminiRes.status, errText);
      return NextResponse.json(
        { error: 'Gemini API error', status: geminiRes.status },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    console.log('Gemini API success payload raw:', JSON.stringify(geminiData, null, 2));
    let adviceText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental code fences
    adviceText = adviceText.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();

    // Simple deterministic calculations for chart values
    const baseRiskByGame = {
      lottery: 30,
      slots: 70,
      sports_bet: 60,
      other: 50,
    };

    let riskScore = baseRiskByGame[gameType] ?? 50;

    if (riskTolerance === 'low') {
      riskScore += 10;
    } else if (riskTolerance === 'high') {
      riskScore -= 10;
    }

    // More plays per week increases risk
    if (frequencyPerWeek >= 5) {
      riskScore += 10;
    } else if (frequencyPerWeek >= 2) {
      riskScore += 5;
    }

    // Bigger bet size also increases risk a bit
    if (betSize >= 50) {
      riskScore += 10;
    } else if (betSize >= 20) {
      riskScore += 5;
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    let winChanceEstimate;
    switch (gameType) {
      case 'lottery':
        winChanceEstimate = 5;
        break;
      case 'slots':
        winChanceEstimate = 15;
        break;
      case 'sports_bet':
        winChanceEstimate = 25;
        break;
      default:
        winChanceEstimate = 10;
        break;
    }

    const lossChanceEstimate = 100 - winChanceEstimate;
    const expectedWeeklySpend = betSize * frequencyPerWeek;

    const responsePayload = {
      advice: adviceText || 'No advice generated.',
      riskScore,
      winChanceEstimate,
      lossChanceEstimate,
      expectedWeeklySpend,
    };

    // Persist this analysis for later use (thesis data)
    const timestamp = new Date().toISOString();
    appendSession({
      timestamp,
      input: { gameType, betSize, frequencyPerWeek, riskTolerance },
      output: responsePayload,
    });

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error('Error in /api/analyze:', err);
    return NextResponse.json(
      {
        error: 'Failed to analyze',
        message: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}