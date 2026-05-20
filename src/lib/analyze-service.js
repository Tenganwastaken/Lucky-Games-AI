import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { computeRiskScore, computeChartEstimates } from '@/lib/riskEngine';
import { normalizeRiskPayload, validateRiskAssessment } from '@/lib/risk-assessment-validate';

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

function formatInputForPrompt(input) {
  return Object.entries(input)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
}

async function fetchGeminiAdvice(apiKey, input, assessment, charts) {
  const prompt = `
You are analyzing gambling behaviour for an educational risk-awareness tool (not clinical diagnosis).

User behavioural indicators:
${formatInputForPrompt(input)}

Rule-based risk score (0-100): ${assessment.score}
Risk tier: ${assessment.tier}
Top drivers: ${assessment.topDrivers.join('; ') || 'none'}
Estimated weekly spend (€): ${charts.expectedWeeklySpend}

In 2-3 sentences in Greek, give clear, responsible advice.
Encourage safe habits, limits, and professional help if risk seems elevated.
Do not make binding decisions for the user — informational only (GDPR Art. 22).
Return only plain text, no JSON, no bullet points, no code fences.
`;

  const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`);
  }

  const geminiData = await geminiRes.json();
  let adviceText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return adviceText.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
}

/**
 * @param {Record<string, unknown>} rawBody
 * @param {{ userId?: string | null, countryCode?: string | null }} persistCtx
 */
export async function runRiskAnalysis(rawBody, persistCtx = {}) {
  const { valid, errors } = validateRiskAssessment(rawBody, 6);
  if (!valid) {
    return { ok: false, status: 400, errors };
  }

  const input = normalizeRiskPayload(rawBody);
  const riskAssessment = computeRiskScore(input);
  const charts = computeChartEstimates(input);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, error: 'Server is not configured with GEMINI_API_KEY' };
  }

  let advice;
  try {
    advice =
      (await fetchGeminiAdvice(apiKey, input, riskAssessment, charts)) ||
      'Δεν δημιουργήθηκε συμβουλή. Επανάλαβε την ανάλυση αργότερα.';
  } catch (e) {
    console.error('Gemini advice failed:', e);
    advice =
      'Η αυτόματη συμβουλή δεν ήταν διαθέσιμη. Βασίσου στους δείκτες κινδύνου και στα γραφήματα. Σκέψου όρια κατάθεσης και επαγγελματική υποστήριξη αν ανησυχείς.';
  }

  const responsePayload = {
    advice,
    riskScore: riskAssessment.score,
    riskTier: riskAssessment.tier,
    riskTierColor: riskAssessment.tierColor,
    winChanceEstimate: charts.winChanceEstimate,
    lossChanceEstimate: charts.lossChanceEstimate,
    expectedWeeklySpend: charts.expectedWeeklySpend,
    riskAssessment,
    riskFactors: riskAssessment.breakdown.map((b) => ({
      key: b.indicator,
      label: b.label,
      points: b.contribution,
    })),
    input,
  };

  appendSession({
    timestamp: new Date().toISOString(),
    input,
    output: responsePayload,
  });

  let assessmentId = null;
  try {
    const created = await prisma.riskAssessment.create({
      data: {
        userId: persistCtx.userId ?? null,
        countryCode: persistCtx.countryCode ?? null,
        ageRange: input.ageRange,
        gender: input.gender,
        primaryGameType: input.primaryGameType,
        gameTypesCount: input.gameTypesCount,
        daysPerMonth: input.daysPerMonth ?? 0,
        avgSessionMinutes: input.avgSessionMinutes ?? 30,
        nightPlayPercent: input.nightPlayPercent ?? 0,
        avgWagerEuro: input.avgWagerEuro ?? 0,
        weeklyTotalEuro: input.weeklyTotalEuro,
        wagerVariability: input.wagerVariability,
        depositsPerSession: input.depositsPerSession,
        chasingFrequency: input.chasingFrequency,
        cancelWithdrawalCount: input.cancelWithdrawalCount,
        limitsSet: input.limitsSet,
        failedStopAttempts: input.failedStopAttempts,
        relationshipConflict: input.relationshipConflict,
        riskAwareness: input.riskAwareness,
        advice: responsePayload.advice,
        riskScore: responsePayload.riskScore,
        winChanceEstimate: responsePayload.winChanceEstimate,
        lossChanceEstimate: responsePayload.lossChanceEstimate,
        expectedWeeklySpend: responsePayload.expectedWeeklySpend,
        riskFactorsJson: JSON.stringify(riskAssessment),
      },
    });
    assessmentId = created.id;
  } catch (persistErr) {
    console.error('RiskAssessment persist failed:', persistErr);
  }

  return {
    ok: true,
    data: { ...responsePayload, assessmentId, usageId: assessmentId },
  };
}
