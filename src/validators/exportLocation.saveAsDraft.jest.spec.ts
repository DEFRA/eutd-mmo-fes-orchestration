import * as Joi from 'joi';

describe('Export Location - saveAsDraft validation', () => {
  // Validation schema for /v1/export-location/saveAsDraft endpoint
  // Updated to match the actual implementation with trim() and regex validation
  const saveAsDraftSchema = Joi.object({
    pointOfDestination: Joi.string().trim().allow('').allow(null).optional().max(100).regex(/^[a-zA-Z0-9\-' /]+$/)
  }).unknown(true);

  describe('pointOfDestination - optional field validation', () => {
    it('should accept empty string', () => {
      const payload = { pointOfDestination: '', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('');
    });

    it('should accept null value', () => {
      const payload = { pointOfDestination: null, exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBeNull();
    });

    it('should be optional - missing field should pass validation', () => {
      const payload = { exportedTo: 'France' };
      const { error } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
    });
  });

  describe('pointOfDestination - valid pattern acceptance', () => {
    it('should accept pointOfDestination with ONLY alphanumeric characters', () => {
      const payload = { pointOfDestination: 'Rotterdam', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('Rotterdam');
    });

    it('should accept pointOfDestination with ONLY numbers', () => {
      const payload = { pointOfDestination: '12345', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('12345');
    });

    it('should accept pointOfDestination with alphanumeric and hyphens', () => {
      const payload = { pointOfDestination: 'ABC123-XYZ', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('ABC123-XYZ');
    });

    it('should accept pointOfDestination with alphanumeric and apostrophes', () => {
      const payload = { pointOfDestination: "ABC123'DEF", exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe("ABC123'DEF");
    });

    it('should accept pointOfDestination with combination of alphanumeric, hyphens, and apostrophes', () => {
      const payload = { pointOfDestination: "Test-123'ABC", exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe("Test-123'ABC");
    });
  });

  describe('pointOfDestination - with spaces and slashes', () => {
    it('should accept pointOfDestination with spaces', () => {
      const payload = { pointOfDestination: 'Port of Rotterdam', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('Port of Rotterdam');
    });

    it('should accept pointOfDestination with slashes', () => {
      const payload = { pointOfDestination: 'Terminal/Dock', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('Terminal/Dock');
    });

    it('should accept pointOfDestination with complex valid pattern', () => {
      const payload = { 
        pointOfDestination: "Port-of-Le Havre ABC123 O'Connor's Bay/Terminal", 
        exportedTo: 'France' 
      };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe("Port-of-Le Havre ABC123 O'Connor's Bay/Terminal");
    });

    it('should accept pointOfDestination with alphanumeric and space', () => {
      const payload = { pointOfDestination: 'ABC 123', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('ABC 123');
    });

    it('should accept pointOfDestination with mixed characters including slash', () => {
      const payload = { pointOfDestination: 'Port123 ABC/XYZ', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('Port123 ABC/XYZ');
    });
  });

  describe('pointOfDestination - length validation', () => {
    it('should reject pointOfDestination exceeding 100 characters', () => {
      const payload = { pointOfDestination: 'A'.repeat(101), exportedTo: 'France' };
      const { error } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].type).toBe('string.max');
    });

    it('should accept pointOfDestination at 100 character boundary', () => {
      const longValue = 'A'.repeat(100);
      const payload = { pointOfDestination: longValue, exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe(longValue);
    });

    it('should accept 100 characters with spaces', () => {
      const longValue = 'Port of '.repeat(12) + 'Test';
      const payload = { pointOfDestination: longValue.substring(0, 100), exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination.length).toBe(100);
    });
  });

  describe('pointOfDestination - trim behavior', () => {
    it('should trim leading and trailing whitespace', () => {
      const payload = { pointOfDestination: '  Port of Rotterdam  ', exportedTo: 'France' };
      const result = saveAsDraftSchema.validate(payload);
      
      expect(result.error).toBeUndefined();
      expect(result.value.pointOfDestination).toBe('Port of Rotterdam');
    });

    it('should trim tabs and newlines', () => {
      const payload = { pointOfDestination: '\tTest Port\n', exportedTo: 'France' };
      const result = saveAsDraftSchema.validate(payload);
      
      expect(result.error).toBeUndefined();
      expect(result.value.pointOfDestination).toBe('Test Port');
    });
  });

  describe('pointOfDestination - regex validation', () => {
    it('should accept valid characters: alphanumeric, hyphens, apostrophes, spaces, slashes', () => {
      const payload = { pointOfDestination: "Port-123 O'Neil/Terminal", exportedTo: 'France' };
      const result = saveAsDraftSchema.validate(payload);
      
      expect(result.error).toBeUndefined();
      expect(result.value.pointOfDestination).toBe("Port-123 O'Neil/Terminal");
    });

    it('should reject invalid characters like @ # $ %', () => {
      const payload = { pointOfDestination: 'Port@Terminal', exportedTo: 'France' };
      const result = saveAsDraftSchema.validate(payload);
      
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].type).toBe('string.pattern.base');
    });

    it('should reject special characters', () => {
      const payload = { pointOfDestination: 'Port#Terminal$', exportedTo: 'France' };
      const result = saveAsDraftSchema.validate(payload);
      
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].type).toBe('string.pattern.base');
    });
  });

  describe('pointOfDestination - edge cases', () => {
    it('should accept single character', () => {
      const payload = { pointOfDestination: 'A', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('A');
    });

    it('should accept single hyphen', () => {
      const payload = { pointOfDestination: '-', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('-');
    });

    it('should accept single apostrophe', () => {
      const payload = { pointOfDestination: "'", exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe("'");
    });

    it('should trim single space to empty string', () => {
      const payload = { pointOfDestination: ' ', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe(''); // Trimmed to empty
    });

    it('should accept single slash', () => {
      const payload = { pointOfDestination: '/', exportedTo: 'France' };
      const { error, value } = saveAsDraftSchema.validate(payload);
      
      expect(error).toBeUndefined();
      expect(value.pointOfDestination).toBe('/');
    });
  });
});
