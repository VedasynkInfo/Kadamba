import zxcvbn from 'zxcvbn';
import { ApiError } from './ApiError';

/**
 * Passwords that are common in this deployment's context. zxcvbn already knows
 * the global top-10k; these are the local terms an attacker would try first.
 */
const CONTEXT_WORDS = [
  'kadamba',
  'kadambas',
  'designer',
  'studio',
  'kurnool',
  'boutique',
  'tailor',
  'stitch',
  'maggam',
  'embroidery',
  'saree',
  'blouse',
  'lehenga',
];

/** Absolute minimum regardless of entropy score. */
const MIN_LENGTH = 10;
/** Admin accounts protect the financial ledger — demand more. */
const MIN_LENGTH_ADMIN = 12;
const MIN_SCORE = 3; // 0-4, 3 = "safely unguessable"

export interface PasswordPolicyOptions {
  /** Stricter thresholds for admin accounts. */
  admin?: boolean;
  /** Values that must not appear in the password (email, name, studio name). */
  userInputs?: string[];
}

/**
 * Validate a new password and throw a 400 with a helpful message.
 * Returns the zxcvbn score for callers that want to display strength.
 */
export function assertPasswordPolicy(
  password: string,
  options: PasswordPolicyOptions = {},
): number {
  const minLength = options.admin ? MIN_LENGTH_ADMIN : MIN_LENGTH;

  if (typeof password !== 'string' || password.length < minLength) {
    throw new ApiError(
      400,
      `Password must be at least ${minLength} characters`,
    );
  }
  if (password.length > 200) {
    throw new ApiError(400, 'Password must be at most 200 characters');
  }

  const result = zxcvbn(password, [
    ...CONTEXT_WORDS,
    ...(options.userInputs ?? []).filter(Boolean),
  ]);

  if (result.score < MIN_SCORE) {
    const hint =
      result.feedback.warning ||
      result.feedback.suggestions?.[0] ||
      'Use a longer password with a mix of words, numbers and symbols.';
    throw new ApiError(400, `Password is too weak. ${hint}`);
  }

  return result.score;
}

/** Non-throwing strength report for the UI. */
export function passwordStrength(password: string, userInputs: string[] = []) {
  const result = zxcvbn(password, [...CONTEXT_WORDS, ...userInputs]);
  return {
    score: result.score,
    warning: result.feedback.warning || '',
    suggestions: result.feedback.suggestions ?? [],
    guessesLog10: result.guesses_log10,
  };
}
