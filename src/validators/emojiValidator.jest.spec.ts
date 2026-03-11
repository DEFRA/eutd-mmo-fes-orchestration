import * as Joi from 'joi';
import { containsEmoji, validateNoEmoji } from './emojiValidator';

describe('containsEmoji', () => {
  describe('returns true for emoji characters', () => {
    it.each([
      ['face emoji', '😀'],
      ['grinning face', '😁'],
      ['thumbs up', '👍'],
      ['rocket', '🚀'],
      ['pizza', '🍕'],
      ['fire', '🔥'],
      ['check mark button', '✅'],
      ['wrench emoji (FI0-10908 example)', '🔧'],
      ['flag sequence (GB)', '🇬🇧'],
      ['text with leading emoji', '👋 Hello'],
      ['text with trailing emoji', 'Hello 🌍'],
      ['text with embedded emoji', 'Fish 🐟 export'],
      ['multiple emojis', '🎉🎊'],
    ])('%s: %s', (_label, input) => {
      expect(containsEmoji(input)).toBe(true);
    });
  });

  describe('returns false for permitted characters', () => {
    it.each([
      ['plain letters', 'John Smith'],
      ['letters with apostrophe', "Mary O'Connor"],
      ['letters with period', 'Mr. Smith'],
      ['letters with hyphen', 'Smith-Jones'],
      ['letters and numbers', 'Company123'],
      ['alphanumeric with spaces', 'Fish Co 2024'],
      ['address with common punctuation', '12, Lancaster House'],
      ['empty string', ''],
      ['single letter', 'A'],
      ['digits only', '12345'],
    ])('%s: %s', (_label, input) => {
      expect(containsEmoji(input)).toBe(false);
    });
  });
});

describe('validateNoEmoji', () => {
  const schema = Joi.string().custom(validateNoEmoji);

  it('passes validation for permitted text', () => {
    const { error } = schema.validate('John Smith');
    expect(error).toBeUndefined();
  });

  it('passes validation for text with apostrophe', () => {
    const { error } = schema.validate("O'Connor");
    expect(error).toBeUndefined();
  });

  it('returns a string.emoji error type for emoji input', () => {
    const { error } = schema.validate('Hello 😀');
    expect(error).toBeDefined();
    expect(error.details[0].type).toBe('string.emoji');
  });

  it('returns a string.emoji error for a wrench emoji', () => {
    const { error } = schema.validate('🔧');
    expect(error).toBeDefined();
    expect(error.details[0].type).toBe('string.emoji');
  });

  it('returns a string.emoji error when emoji is embedded in text', () => {
    const { error } = schema.validate('Fish 🐟 Ltd');
    expect(error).toBeDefined();
    expect(error.details[0].type).toBe('string.emoji');
  });

  it('returns a string.emoji error for flag emoji', () => {
    const { error } = schema.validate('🇬🇧 Exports');
    expect(error).toBeDefined();
    expect(error.details[0].type).toBe('string.emoji');
  });
});
