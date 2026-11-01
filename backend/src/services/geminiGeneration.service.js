import { env } from '../config/env.js';
import { RECOMMENDATION_SYSTEM_INSTRUCTION, recommendationPrompt } from '../prompts/recommendation.prompt.js';
import { geminiRecommendationOutputSchema } from '../validators/recommendation.schema.js';
import { logger } from '../utils/logger.js';

/**
 * Clean and parse JSON from LLM response (handling potential markdown backticks).
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.slice(7);
  } else if (clean.startsWith('```')) {
    clean = clean.slice(3);
  }
  if (clean.endsWith('```')) {
    clean = clean.slice(0, -3);
  }
  clean = clean.trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Attempt regex extraction of first outer JSON object
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Builds deterministic fallback explanations when Gemini is temporarily unavailable.
 */
function buildFallbackRecommendations(candidates, userQuery) {
  return {
    summary: `Here are the top ranked matches for "${userQuery}" based on vector similarity and graph connectivity.`,
    isFallback: true,
    recommendations: candidates.slice(0, 5).map(c => ({
      movieId: c.movieId,
      reason: c.evidence?.length > 0
        ? `Ranked top match via hybrid retrieval. Key connections: ${c.evidence.join('. ')}.`
        : `Ranked top match with a ${(c.semanticScore * 100).toFixed(0)}% semantic relevance score.`,
      matchedThemes: c.genres || [],
      graphEvidence: c.evidence || [],
      confidence: 'medium'
    }))
  };
}

/**
 * Generates grounded recommendations using Gemini with strict validation.
 * 
 * @param {Object} params
 * @param {string} params.userQuery
 * @param {Array<Object>} params.candidates - Ranked candidates
 * @param {Object} [params.constraints={}]
 * @returns {Promise<Object>} Validated recommendation object
 */
export async function generateGroundedRecommendations({
  userQuery,
  candidates,
  constraints = {}
}) {
  if (!candidates || candidates.length === 0) {
    return {
      summary: 'No suitable movies found matching all of your criteria.',
      recommendations: [],
      isFallback: false
    };
  }

  // Format candidates into rich evidence summaries for the prompt
  const candidateSummaries = candidates.slice(0, 10).map((c, idx) => {
    const parts = [
      `[${idx + 1}] Movie ID: ${c.movieId}`,
      `Title: ${c.title}`,
      `Release Year: ${c.releaseYear || 'Unknown'}`,
      `Genres: ${(c.genres || []).join(', ')}`,
      `Vote Rating: ${c.voteAverage || 0}/10`
    ];
    if (c.evidence && c.evidence.length > 0) {
      parts.push(`Graph Evidence: ${c.evidence.join('; ')}`);
    }
    if (c.overview) {
      parts.push(`Overview: ${c.overview.slice(0, 300)}`);
    }
    return parts.join('\n');
  }).join('\n\n---\n\n');

  const excludedGenresText = (constraints.excludedGenres || []).join(', ') || 'None';
  const yearRangeText = constraints.minYear || constraints.maxYear
    ? `${constraints.minYear || 'Any'} to ${constraints.maxYear || 'Any'}`
    : 'All release years';

  const userPromptText = await recommendationPrompt.format({
    userQuery,
    excludedGenres: excludedGenresText,
    yearRange: yearRangeText,
    candidateSummaries
  });

  const candidateModels = [
    env.GEMINI_GENERATION_MODEL || 'gemini-3.5-flash',
    'gemini-3.1-flash-lite'
  ];

  for (const modelName of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: RECOMMENDATION_SYSTEM_INSTRUCTION }]
          },
          contents: [
            { parts: [{ text: userPromptText }] }
          ],
          generationConfig: {
            temperature: 0.2, // Low temperature for factual precision
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(`Gemini generation HTTP error on ${modelName} (${response.status}): ${errText}`);
        continue; // Try next fallback model
      }

      const data = await response.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedJson = extractJson(rawOutput);

      if (!parsedJson) {
        logger.warn(`Failed to parse JSON from Gemini response (${modelName}), trying fallback.`);
        continue;
      }

      // Validate structured output using Zod
      const validationResult = geminiRecommendationOutputSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        logger.warn(`Gemini response (${modelName}) did not conform to schema: ${validationResult.error.message}`);
        continue;
      }

      return {
        ...validationResult.data,
        isFallback: false,
        modelUsed: modelName
      };
    } catch (err) {
      logger.error(`Gemini generation on ${modelName} failed:`, err.message);
    }
  }

  // If all models fail, return safe deterministic fallback
  return buildFallbackRecommendations(candidates, userQuery);
}
