// Pure code router - no AI.

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'deep';
export type RouteType = 'A' | 'B' | 'C';

export interface RouteDecision {
  score: number;
  level: ComplexityLevel;
  yesNo: boolean;
  route: RouteType;
  tokenCap: number;
  words: number;
  analysisKeywords: number;
  multi: number;
}

const ANALYSIS_KEYWORDS = [
  'why',
  'compare',
  'analyze',
  'analyse',
  'impact',
  'trend',
  'explain',
  'versus',
  'how',
];

const YES_NO_STARTERS = [
  'will',
  'is',
  'are',
  'does',
  'do',
  'can',
  'should',
  'has',
  'have',
  'did',
  'was',
  'would',
];

/**
 * Evaluates a question text and detailedReport toggle to determine route and token cap.
 */
export function routeQuestion(question: string, detailedReport: boolean = false): RouteDecision {
  const trimmed = question.trim();

  // 1. words: whitespace-separated word count
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

  // 2. analysisKeywords: count of whole-word matches (case-insensitive)
  const keywordRegex = new RegExp(`\\b(${ANALYSIS_KEYWORDS.join('|')})\\b`, 'gi');
  const matchedKeywords = trimmed.match(keywordRegex);
  const analysisKeywords = matchedKeywords ? matchedKeywords.length : 0;

  // 3. multi: 1 if > 1 "?", or contains "and" followed later by "?", or a comma followed by "and"; otherwise 0.
  const questionMarks = (trimmed.match(/\?/g) || []).length;
  const hasAndThenQuestion = /\band\b[\s\S]*\?/i.test(trimmed);
  const hasCommaAnd = /,\s*and\b/i.test(trimmed);

  const multi = questionMarks > 1 || hasAndThenQuestion || hasCommaAnd ? 1 : 0;

  // 4. score = words/8 + 2*analysisKeywords + 2*multi + (detailedReport ? 3 : 0)
  const score = Number((words / 8 + 2 * analysisKeywords + 2 * multi + (detailedReport ? 3 : 0)).toFixed(3));

  // 5. level: score < 4 → simple; < 8 → moderate; < 14 → complex; otherwise deep.
  let level: ComplexityLevel;
  if (score < 4) {
    level = 'simple';
  } else if (score < 8) {
    level = 'moderate';
  } else if (score < 14) {
    level = 'complex';
  } else {
    level = 'deep';
  }

  // 6. yesNo: question starts with will, is, are, does, do, can, should, has, have, did, was, or would.
  const yesNoRegex = new RegExp(`^(${YES_NO_STARTERS.join('|')})\\b`, 'i');
  const yesNo = yesNoRegex.test(trimmed);

  // 7. Route determination:
  // - Route C (writer-heavy, token cap 1200) if not yesNo, or level is complex or deep.
  // - Route B (Jev plus writer, token cap 400) if detailedReport, or level is moderate.
  // - Route A (Jev only, no writer, token cap 0) otherwise.
  let route: RouteType;
  let tokenCap: number;

  if (!yesNo || level === 'complex' || level === 'deep') {
    route = 'C';
    tokenCap = 1200;
  } else if (detailedReport || level === 'moderate') {
    route = 'B';
    tokenCap = 400;
  } else {
    route = 'A';
    tokenCap = 0;
  }

  return {
    score,
    level,
    yesNo,
    route,
    tokenCap,
    words,
    analysisKeywords,
    multi,
  };
}
