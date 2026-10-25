// Jev is the real evaluation API; simulated mode is a stand-in using log-odds math.

export interface JevEngineStatus {
  mode: 'simulated' | 'live';
  configured: boolean;
  label: string;
}

/**
 * Standard logit function: ln(p / (1 - p))
 * Clamps input probability slightly away from 0 and 1 to prevent infinities.
 */
export function logit(p: number): number {
  const safeP = Math.max(1e-9, Math.min(1 - 1e-9, p));
  return Math.log(safeP / (1 - safeP));
}

/**
 * Standard sigmoid function: 1 / (1 + e^-x)
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Deterministically computes prior probability from the question text.
 * Uses hash algorithm: h = (h * 31 + charCode) % 1000
 * Returns value in range [0.35, 0.65]. The same question always yields the same prior.
 */
export function getPrior(question: string): number {
  let h = 0;
  for (let i = 0; i < question.length; i++) {
    h = (h * 31 + question.charCodeAt(i)) % 1000;
  }
  return 0.35 + (h / 1000) * 0.30;
}

/**
 * Updates posterior probability given current probability and log-odds delta.
 * updatePosterior = sigmoid(logit(current) + delta)
 */
export function updatePosterior(current: number, delta: number): number {
  return sigmoid(logit(current) + delta);
}

/**
 * Returns current Jev engine status.
 * If JEV_MODE=live is set, but no API contract exists, UI displays "Jev: live (not configured)".
 */
export function getJevStatus(): JevEngineStatus {
  const isLive = process.env.JEV_MODE === 'live' || process.env.NEXT_PUBLIC_JEV_MODE === 'live';
  if (isLive) {
    return {
      mode: 'live',
      configured: false,
      label: 'Jev: live (not configured)',
    };
  }
  return {
    mode: 'simulated',
    configured: true,
    label: 'Jev: simulated',
  };
}

/**
 * Jev Live Mode Client Placeholder.
 * As per specification: do not invent the Jev API request format.
 * Throws a clear error until the documented format is supplied.
 */
export async function callJevLiveApi(_endpoint?: string, _apiKey?: string): Promise<never> {
  const endpoint = _endpoint || process.env.JEV_API_URL;
  const apiKey = _apiKey || process.env.JEV_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('Jev live mode: Missing JEV_API_URL or JEV_API_KEY environment variables.');
  }

  throw new Error('Jev live mode: API contract not yet configured. Add the documented request and response format here.');
}
