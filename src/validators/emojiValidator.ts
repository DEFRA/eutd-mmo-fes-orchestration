import * as Joi from 'joi';

/**
 * Regex that matches Extended Pictographic characters (emoji/pictographic symbols).
 *
 * Uses the Unicode property `\p{Extended_Pictographic}` which covers all emoji
 * pictographic code points without false-positives on digits or regular ASCII.
 *
 * Also matches variation selectors (U+FE0E, U+FE0F), zero-width joiners (U+200D),
 * and regional indicator symbols used for flag sequences (U+1F1E0–U+1F1FF).
 *
 * FI0-10908: Prevent emoji entry in form fields to protect PDF integrity.
 */
const EMOJI_REGEX = /\p{Extended_Pictographic}|[\u{FE0E}\u{FE0F}\u{200D}]|[\u{1F1E0}-\u{1F1FF}]/u;

/**
 * Returns true if the given string contains one or more emoji or unsupported
 * pictographic Unicode characters.
 */
export const containsEmoji = (value: string): boolean => EMOJI_REGEX.test(value);

/**
 * Joi custom validator that rejects values containing emoji characters.
 * Intended to be used with `.custom(validateNoEmoji)` on Joi string schemas.
 *
 * Produces error type `string.emoji` consumed by the standard errorExtractor
 * pipeline to generate `error.<field>.string.emoji` keys.
 */
export const validateNoEmoji = (value: string, helpers: Joi.CustomHelpers) => {
  if (containsEmoji(value)) {
    return helpers.error('string.emoji');
  }
  return value;
};

/**
 * Creates a combined Joi custom validator that performs emoji detection first,
 * then falls back to an allowlist pattern check. Using a single custom validator
 * ensures that only one error is produced per field regardless of Joi's
 * `abortEarly` option — emoji input surfaces as `string.emoji` rather than
 * being masked by the subsequent `string.pattern.base` error.
 *
 * @param pattern - The allowlist regex applied after the emoji check.
 * @returns A Joi custom validator function.
 *
 * FI0-10908: Prevent emoji entry in form fields to protect PDF integrity.
 */
export const createEmojiAwarePatternValidator = (pattern: RegExp) => {
  return (value: string, helpers: Joi.CustomHelpers) => {
    if (containsEmoji(value)) {
      return helpers.error('string.emoji');
    }
    if (!pattern.test(value)) {
      return helpers.error('string.pattern.base');
    }
    return value;
  };
};

