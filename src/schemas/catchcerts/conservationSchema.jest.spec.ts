import conservationSchema from '../../../src/schemas/catchcerts/conservationSchema';
import conservationSaveAsDraftSchema from '../../../src/schemas/catchcerts/conservationSaveAsDraftSchema';

describe('conservationSchema - otherWaters validation', () => {
  describe('otherWaters - required when caughtInOtherWaters is Y', () => {
    it('returns any.required error when otherWaters is missing and caughtInOtherWaters is Y', () => {
      const payload = {
        caughtInOtherWaters: 'Y'
      };
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const otherWatersErr = error.details.find((d: any) => d.path.join('.') === 'otherWaters');
      expect(otherWatersErr).toBeDefined();
      expect(otherWatersErr.type).toBe('any.required');
    });

    it('allows otherWaters to be undefined when caughtInOtherWaters is not Y', () => {
      const payload = {
        caughtInUKWaters: 'Y'
      };
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });

  describe('otherWaters - pattern validation (alphanumeric, spaces, hyphens, apostrophes only)', () => {
    const validTestCases = [
      ['plain letters', 'Iranian Waters'],
      ['letters with spaces', 'North Atlantic Waters'],
      ['letters with hyphens', 'UK-controlled waters'],
      ['letters with apostrophes', "O'Neill waters"],
      ['letters, numbers, and spaces', 'FAO Area 123'],
      ['letters, numbers, hyphens and spaces', 'Area 27-1A waters'],
      ['mixed case', 'South African Waters'],
      ['numbers only', '123'],
      ['single letter', 'A'],
      ['multiple apostrophes', "O'Neill's waters"],
      ['multiple hyphens', 'North-East-Atlantic'],
    ];

    validTestCases.forEach(([label, input]) => {
      it(`allows: ${label} ("${input}")`, () => {
        const payload = {
          caughtInOtherWaters: 'Y',
          otherWaters: input
        };
        const { error } = conservationSchema.validate(payload, { abortEarly: false });
        expect(error).toBeUndefined();
      });
    });

    const invalidTestCases = [
      ['special character @', 'Iranian@Waters', 'string.pattern.base'],
      ['special character !', 'Waters!Zone', 'string.pattern.base'],
      ['special character ~', '@!~~~~~@#@~#', 'string.pattern.base'],
      ['special character #', 'Waters#Zone', 'string.pattern.base'],
      ['special character $', 'Waters$Zone', 'string.pattern.base'],
      ['special character %', 'Waters%Zone', 'string.pattern.base'],
      ['special character ^', 'Waters^Zone', 'string.pattern.base'],
      ['special character &', 'Waters&Zone', 'string.pattern.base'],
      ['special character *', 'Waters*Zone', 'string.pattern.base'],
      ['special character (', 'Waters(Zone)', 'string.pattern.base'],
      ['special character )', 'Waters(Zone', 'string.pattern.base'],
      ['special character =', 'Waters=Zone', 'string.pattern.base'],
      ['special character +', 'Waters+Zone', 'string.pattern.base'],
      ['special character [', 'Waters[Zone]', 'string.pattern.base'],
      ['special character ]', 'Waters[Zone]', 'string.pattern.base'],
      ['special character {', 'Waters{Zone}', 'string.pattern.base'],
      ['special character }', 'Waters{Zone}', 'string.pattern.base'],
      ['special character :', 'Waters:Zone', 'string.pattern.base'],
      ['special character ;', 'Waters;Zone', 'string.pattern.base'],
      ['special character ,', 'Waters,Zone', 'string.pattern.base'],
      ['special character .', 'Waters.Zone', 'string.pattern.base'],
      ['special character ?', 'Waters?Zone', 'string.pattern.base'],
      ['special character /', 'Waters/Zone', 'string.pattern.base'],
      ['special character \\', 'Waters\\Zone', 'string.pattern.base'],
      ['special character |', 'Waters|Zone', 'string.pattern.base'],
      ['special character <', 'Waters<Zone', 'string.pattern.base'],
      ['special character >', 'Waters>Zone', 'string.pattern.base'],
      ['special character `', 'Waters`Zone', 'string.pattern.base'],
      ['emoji', 'Waters 🐟', 'string.emoji'],
      ['emoji at start', '🇬🇧 Waters', 'string.emoji'],
      ['multiple emojis', '🎉 Waters 🎊', 'string.emoji'],
    ];

    invalidTestCases.forEach(([label, input, expectedType]) => {
      it(`rejects: ${label} ("${input}")`, () => {
        const payload = {
          caughtInOtherWaters: 'Y',
          otherWaters: input
        };
        const { error } = conservationSchema.validate(payload, { abortEarly: false });
        expect(error).toBeDefined();
        const otherWatersErr = error.details.find((d: any) => d.path.join('.') === 'otherWaters');
        expect(otherWatersErr).toBeDefined();
        expect(otherWatersErr.type).toBe(expectedType);
      });
    });
  });

  describe('watersCaughtIn - at least one water type required', () => {
    it('returns error when no water type is selected', () => {
      const payload = {};
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const waterErr = error.details.find((d: any) => d.context?.label === 'watersCaughtIn');
      expect(waterErr).toBeDefined();
    });

    it('passes when caughtInUKWaters is Y', () => {
      const payload = {
        caughtInUKWaters: 'Y'
      };
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes when caughtInEUWaters is Y', () => {
      const payload = {
        caughtInEUWaters: 'Y'
      };
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes when caughtInOtherWaters is Y with valid otherWaters', () => {
      const payload = {
        caughtInOtherWaters: 'Y',
        otherWaters: 'Iranian Waters'
      };
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes when multiple water types are selected', () => {
      const payload = {
        caughtInUKWaters: 'Y',
        caughtInEUWaters: 'Y',
        caughtInOtherWaters: 'Y',
        otherWaters: 'Other Waters'
      };
      const { error } = conservationSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });
});

describe('conservationSaveAsDraftSchema - otherWaters validation', () => {
  describe('otherWaters - pattern validation with additional required fields', () => {
    const basePayload = {
      currentUri: '/some-uri',
      journey: 'create-catch-certificate',
      dashboardUri: '/dashboard',
      caughtInUKWaters: 'Y'
    };

    it('returns any.required error when otherWaters is missing and caughtInOtherWaters is Y', () => {
      const payload = {
        ...basePayload,
        caughtInOtherWaters: 'Y'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const otherWatersErr = error.details.find((d: any) => d.path.join('.') === 'otherWaters');
      expect(otherWatersErr).toBeDefined();
      expect(otherWatersErr.type).toBe('any.required');
    });

    it('allows valid otherWaters with alphanumeric and allowed special chars', () => {
      const payload = {
        ...basePayload,
        caughtInOtherWaters: 'Y',
        otherWaters: 'North Atlantic Waters'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('rejects otherWaters with special characters like @!#$%^&*()', () => {
      const payload = {
        ...basePayload,
        caughtInOtherWaters: 'Y',
        otherWaters: '@!~~~~~@#@~#'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const otherWatersErr = error.details.find((d: any) => d.path.join('.') === 'otherWaters');
      expect(otherWatersErr).toBeDefined();
      expect(otherWatersErr.type).toBe('string.pattern.base');
    });

    it('rejects otherWaters with emoji', () => {
      const payload = {
        ...basePayload,
        caughtInOtherWaters: 'Y',
        otherWaters: 'Waters 🐟'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const otherWatersErr = error.details.find((d: any) => d.path.join('.') === 'otherWaters');
      expect(otherWatersErr).toBeDefined();
      expect(otherWatersErr.type).toBe('string.emoji');
    });

    it('ignores otherWaters when caughtInOtherWaters is not Y', () => {
      const payload = {
        ...basePayload,
        otherWaters: '@invalid@'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });

  describe('conservationSaveAsDraftSchema - required fields validation', () => {
    it('returns error when currentUri is missing', () => {
      const payload = {
        journey: 'create-catch-certificate',
        dashboardUri: '/dashboard',
        caughtInUKWaters: 'Y'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const currentUriErr = error.details.find((d: any) => d.path.join('.') === 'currentUri');
      expect(currentUriErr).toBeDefined();
      expect(currentUriErr.type).toBe('any.required');
    });

    it('returns error when journey is missing', () => {
      const payload = {
        currentUri: '/some-uri',
        dashboardUri: '/dashboard',
        caughtInUKWaters: 'Y'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const journeyErr = error.details.find((d: any) => d.path.join('.') === 'journey');
      expect(journeyErr).toBeDefined();
      expect(journeyErr.type).toBe('any.required');
    });

    it('returns error when dashboardUri is missing', () => {
      const payload = {
        currentUri: '/some-uri',
        journey: 'create-catch-certificate',
        caughtInUKWaters: 'Y'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const dashboardUriErr = error.details.find((d: any) => d.path.join('.') === 'dashboardUri');
      expect(dashboardUriErr).toBeDefined();
      expect(dashboardUriErr.type).toBe('any.required');
    });

    it('passes with all required fields and valid water selection', () => {
      const payload = {
        currentUri: '/some-uri',
        journey: 'create-catch-certificate',
        dashboardUri: '/dashboard',
        caughtInUKWaters: 'Y'
      };
      const { error } = conservationSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });
});
