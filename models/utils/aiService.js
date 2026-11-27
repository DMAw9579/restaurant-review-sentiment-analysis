// ============================================================
// aiService.js
// ------------------------------------------------------------
// Thin wrapper around the Anthropic Claude API for the three
// AI features (summarization, recommendations, chatbot).
//
// Design notes:
// - Uses the built-in `fetch` (Node 18+, which Express 5 already
//   requires) - no extra HTTP client dependency needed.
// - Reads the key from process.env.ANTHROPIC_API_KEY. If it's
//   missing (or a call fails), every function falls back to a
//   simple rule-based version instead of crashing the route -
//   so the rest of the app keeps working even with no key set.
// ============================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';
const API_KEY = process.env.ANTHROPIC_API_KEY;

// ------------------------------------------------------------
// Low-level call to the Messages API. Returns plain text.
// Throws on any failure so callers can fall back cleanly.
// ------------------------------------------------------------
async function callClaude(system, userMessage, maxTokens = 500) {
  if (!API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error('Claude API returned no text content');
  }
  return textBlock.text.trim();
}

// Trim the review list sent to the model so prompts stay small & cheap.
function sampleReviews(reviews, limit = 30) {
  return reviews.slice(-limit).map((r) => ({
    rating: r.review_rating,
    sentiment: r.review_sentiment,
    text: r.review_text
  }));
}

// ============================================================
// 1) AI REVIEW SUMMARIZATION
// ============================================================
async function summarizeRestaurantReviews(restaurantName, reviews) {
  if (!reviews || reviews.length === 0) {
    return `No reviews yet for ${restaurantName}.`;
  }

  try {
    const sample = sampleReviews(reviews);
    const system =
      'You are a helpful assistant that writes short, honest summaries of restaurant reviews for a review website. ' +
      'Write 3-4 sentences covering: overall impression, standout positives, and common complaints (if any). ' +
      'Do not invent details that are not supported by the reviews. Plain text only, no headings or bullet points.';
    const userMessage =
      `Restaurant: ${restaurantName}\n` +
      `Reviews (JSON array of {rating, sentiment, text}):\n${JSON.stringify(sample)}`;

    return await callClaude(system, userMessage, 300);
  } catch (err) {
    console.error('AI summary fallback (heuristic) used:', err.message);
    return heuristicSummary(restaurantName, reviews);
  }
}

// Fallback used when there's no API key or the API call fails.
function heuristicSummary(restaurantName, reviews) {
  const count = reviews.length;
  const avg = (reviews.reduce((s, r) => s + r.review_rating, 0) / count).toFixed(1);
  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  reviews.forEach((r) => {
    if (counts[r.review_sentiment] !== undefined) counts[r.review_sentiment]++;
  });

  const topPositive = reviews.find((r) => r.review_sentiment === 'Positive');
  const topNegative = reviews.find((r) => r.review_sentiment === 'Negative');

  let summary = `${restaurantName} has ${count} review${count === 1 ? '' : 's'} with an average rating of ${avg}/5 ` +
    `(${counts.Positive} positive, ${counts.Neutral} neutral, ${counts.Negative} negative).`;

  if (topPositive) summary += ` Customers often mention things like "${topPositive.review_text}"`;
  if (topNegative) summary += ` A recurring complaint: "${topNegative.review_text}"`;

  return summary;
}

// ============================================================
// 2) AI RESTAURANT RECOMMENDATION
// ============================================================
async function recommendRestaurants(preferences, restaurants) {
  const candidates = restaurants.filter((r) => r.reviewCount > 0);
  if (candidates.length === 0) {
    return [];
  }

  try {
    const system =
      'You recommend restaurants to a user based on structured restaurant stats and the user\'s stated preferences. ' +
      'Pick up to 5 of the best-matching restaurants from the provided list only (never invent a restaurant that is not in the list). ' +
      'Respond ONLY with a JSON array (no markdown fences, no prose) of objects: ' +
      '{"restaurant_name": string, "reason": string (1-2 sentences, specific to this user\'s preferences)}. ' +
      'Order the array from best match to worst match.';

    const userMessage =
      `User preferences: ${JSON.stringify(preferences)}\n\n` +
      `Available restaurants (JSON array): ${JSON.stringify(candidates.map((r) => ({
        restaurant_name: r.restaurant_name,
        city: r.city,
        cuisine: r.cuisine,
        avgRating: r.avgRating,
        reviewCount: r.reviewCount,
        sentiments: r.sentiments
      })))}`;

    const raw = await callClaude(system, userMessage, 700);
    const cleaned = raw.replace(/^```json\s*|```$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Re-attach full restaurant data by name so the view has everything it needs.
    return parsed
      .map((rec) => {
        const match = candidates.find(
          (c) => c.restaurant_name.toLowerCase() === (rec.restaurant_name || '').toLowerCase()
        );
        if (!match) return null;
        return { ...match, reason: rec.reason || '' };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('AI recommendation fallback (heuristic) used:', err.message);
    return heuristicRecommendations(preferences, candidates);
  }
}

// Fallback: score restaurants by simple rule-based matching against preferences.
function heuristicRecommendations(preferences, candidates) {
  const { cuisine, city, priority } = preferences;

  const scored = candidates.map((r) => {
    let score = r.avgRating || 0;
    const reasons = [];

    if (cuisine && r.cuisine && r.cuisine.toLowerCase().includes(cuisine.toLowerCase())) {
      score += 2;
      reasons.push(`serves ${r.cuisine} cuisine`);
    }
    if (city && r.city && r.city.toLowerCase() === city.toLowerCase()) {
      score += 1.5;
      reasons.push(`located in ${r.city}`);
    }
    if (priority === 'value' || priority === 'family') {
      // no price data available - lean on positive-sentiment ratio instead
    }
    const total = r.sentiments.Positive + r.sentiments.Neutral + r.sentiments.Negative;
    const positiveRatio = total > 0 ? r.sentiments.Positive / total : 0;
    score += positiveRatio * 2;
    if (positiveRatio >= 0.6) reasons.push('mostly positive reviews');

    return {
      ...r,
      score,
      reason: reasons.length > 0
        ? `Recommended because it ${reasons.join(' and ')}, with an average rating of ${r.avgRating}/5.`
        : `Highly rated overall at ${r.avgRating}/5 with ${r.reviewCount} reviews.`
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ============================================================
// 3) AI CHATBOT
// ============================================================
async function chatAnswer(question, restaurants, reviews) {
  try {
    const system =
      'You are a helpful chatbot embedded in a restaurant review website called TasteTales. ' +
      'Answer the user\'s question using ONLY the restaurant stats and reviews data provided below - ' +
      'never invent restaurants, ratings, or reviews that are not in the data. ' +
      'Keep answers conversational and under 100 words. If the data does not contain an answer, say so honestly.';

    const compactRestaurants = restaurants.map((r) => ({
      name: r.restaurant_name,
      city: r.city,
      cuisine: r.cuisine,
      avgRating: r.avgRating,
      reviewCount: r.reviewCount,
      sentiments: r.sentiments
    }));

    // Keep the review sample small & relevant: prioritize reviews that
    // mention a restaurant named in the question, else send a general sample.
    const lowerQ = question.toLowerCase();
    const mentioned = restaurants.filter((r) => lowerQ.includes(r.restaurant_name.toLowerCase()));
    const relevantReviews = mentioned.length > 0
      ? reviews.filter((r) => mentioned.some((m) => m.restaurant_name.toLowerCase() === r.restaurant_name.toLowerCase()))
      : reviews;

    const userMessage =
      `Restaurant stats: ${JSON.stringify(compactRestaurants)}\n\n` +
      `Sample reviews: ${JSON.stringify(sampleReviews(relevantReviews, 40))}\n\n` +
      `User question: ${question}`;

    return await callClaude(system, userMessage, 300);
  } catch (err) {
    console.error('AI chatbot fallback (rule-based) used:', err.message);
    return heuristicChatAnswer(question, restaurants, reviews);
  }
}

// Fallback: simple keyword-driven Q&A over the aggregated data.
function heuristicChatAnswer(question, restaurants, reviews) {
  const q = question.toLowerCase();
  const withReviews = restaurants.filter((r) => r.reviewCount > 0);

  if (withReviews.length === 0) {
    return "There isn't enough review data yet to answer that.";
  }

  // "best food" / "best restaurant" / "top rated"
  if (/best|top rated|highest rated/.test(q)) {
    const best = [...withReviews].sort((a, b) => b.avgRating - a.avgRating)[0];
    return `${best.restaurant_name} has the highest average rating right now, at ${best.avgRating}/5 from ${best.reviewCount} reviews.`;
  }

  // "positive reviews"
  if (/positive/.test(q)) {
    const positiveHeavy = [...withReviews]
      .sort((a, b) => b.sentiments.Positive - a.sentiments.Positive)
      .slice(0, 3);
    return `Restaurants with the most positive reviews: ${positiveHeavy
      .map((r) => `${r.restaurant_name} (${r.sentiments.Positive} positive)`).join(', ')}.`;
  }

  // "family"
  if (/family/.test(q)) {
    const familyMentions = reviews.filter((r) => /family/i.test(r.review_text));
    if (familyMentions.length === 0) {
      return "No reviews specifically mention family dining yet, but restaurants with high overall ratings tend to be a safe bet.";
    }
    const names = [...new Set(familyMentions.map((r) => r.restaurant_name))];
    return `Reviews mentioning family dining point to: ${names.join(', ')}.`;
  }

  // "why unhappy" / "why bad" about a specific restaurant
  if (/unhappy|complain|bad|worst|negative/.test(q)) {
    const mentioned = restaurants.find((r) => q.includes(r.restaurant_name.toLowerCase()));
    const target = mentioned || [...withReviews].sort((a, b) => a.avgRating - b.avgRating)[0];
    const negatives = reviews.filter(
      (r) => r.restaurant_name.toLowerCase() === target.restaurant_name.toLowerCase() && r.review_sentiment === 'Negative'
    );
    if (negatives.length === 0) {
      return `${target.restaurant_name} doesn't have significant negative feedback in the data.`;
    }
    return `For ${target.restaurant_name}, common complaints include: ${negatives.slice(0, 3).map((r) => `"${r.review_text}"`).join('; ')}.`;
  }

  // Generic fallback: overall snapshot
  const best = [...withReviews].sort((a, b) => b.avgRating - a.avgRating)[0];
  return `I'm not able to fully process that question right now, but here's a quick fact: ${best.restaurant_name} currently has the best average rating (${best.avgRating}/5). Try asking about "best food", "positive reviews", "family dining", or "why is [restaurant] unhappy customers".`;
}

module.exports = {
  summarizeRestaurantReviews,
  recommendRestaurants,
  chatAnswer
};
