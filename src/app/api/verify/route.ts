import { NextResponse } from 'next/server';
import { extractClaims, callLLM } from '@/lib/services/llm';
import { searchWeb, SearchResult } from '@/lib/services/search';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, type = 'text' } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 1. Extract Claims
    const claims = await extractClaims(content);
    if (!claims || claims.length === 0) {
      return NextResponse.json({ error: 'Failed to extract factual claims from the content.' }, { status: 422 });
    }

    // 2. Source Discovery (Search Web for the primary claim)
    const primaryClaim = claims[0];
    const searchResults = await searchWeb(primaryClaim);

    // 3. Contradiction Check & Verdict Generation
    // We construct a prompt passing the claim and the discovered evidence
    const evidenceContext = searchResults.map(r => `Source: ${r.sourceName}\nSnippet: ${r.snippet}`).join('\n\n');
    
    const evaluationPrompt = `You are a misinformation verification engine. Evaluate this claim based ONLY on the provided evidence.
Claim: "${primaryClaim}"

Evidence:
${evidenceContext || "No evidence available."}

Respond ONLY with a raw JSON object (no markdown, no quotes) using this exact schema:
{
  "verdict": "VERIFIED" | "PARTIALLY VERIFIED" | "UNVERIFIED" | "LIKELY MISLEADING",
  "score": number (0-100, where 100 means highly verified, 0 means entirely false/misleading),
  "reasoning": "A concise, 1-2 sentence explanation of why this verdict was reached.",
  "explainSimply": "A very simple, non-technical sentence explaining the result to a normal user.",
  "signals": [
    {"name": "string", "detected": boolean, "description": "string"}
  ]
}
Ensure the response is strictly valid JSON.`;

    const rawEvaluation = await callLLM(evaluationPrompt, 800);
    
    let evaluation;
    try {
      // Clean up markdown wrapping if the LLM leaked some
      const cleanJson = rawEvaluation.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse LLM evaluation:", rawEvaluation);
      // Fallback
      evaluation = {
        verdict: "UNVERIFIED",
        score: 50,
        reasoning: "The system could not definitively parse the verification outcome.",
        explainSimply: "We don't have enough clear evidence to verify this claim right now.",
        signals: [{ name: "Insufficient Evidence", detected: true, description: "Not enough reliable sources found." }]
      };
    }

    // 4. Construct Final Response payload matching the new architecture
    return NextResponse.json({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      originalContent: content,
      claimsAnalyzed: claims,
      sources: searchResults,
      verdict: evaluation.verdict,
      evidenceScore: evaluation.score,
      keyReasoning: evaluation.reasoning,
      explainSimply: evaluation.explainSimply,
      manipulationSignals: evaluation.signals || []
    });

  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during verification' }, { status: 500 });
  }
}
