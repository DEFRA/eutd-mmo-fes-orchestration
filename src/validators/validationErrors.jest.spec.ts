import {
  invalidErrorMessage,
  cannotReachErrorMessage,
  buildErrorDetails,
  buildErrorForClient,
  combineValidationErrors,
  mergeSchemaAndValidationErrors,
  CannotReachError
} from './validationErrors';

describe('invalidErrorMessage', () => {
  it('should return correct error message format for invalid field', () => {
    const result = invalidErrorMessage('testField');
    expect(result).toBe('child "testField" fails because ["testField" is invalid]');
  });

  it('should handle field names with special characters', () => {
    const result = invalidErrorMessage('test-field_123');
    expect(result).toBe('child "test-field_123" fails because ["test-field_123" is invalid]');
  });

  it('should handle empty string', () => {
    const result = invalidErrorMessage('');
    expect(result).toBe('child "" fails because ["" is invalid]');
  });
});

describe('cannotReachErrorMessage', () => {
  it('should return correct error message format for unreachable field', () => {
    const result = cannotReachErrorMessage('serviceField');
    expect(result).toBe('child "serviceField" fails because ["serviceField" cannot be checked if valid]');
  });

  it('should handle field names with spaces', () => {
    const result = cannotReachErrorMessage('field with spaces');
    expect(result).toBe('child "field with spaces" fails because ["field with spaces" cannot be checked if valid]');
  });

  it('should handle empty string', () => {
    const result = cannotReachErrorMessage('');
    expect(result).toBe('child "" fails because ["" cannot be checked if valid]');
  });
});

describe('buildErrorDetails', () => {
  it('should build error details with correct structure', () => {
    const result = buildErrorDetails('username', 'Username is required');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: ['username'],
      type: 'any.invalid',
      context: {
        key: 'username'
      },
      message: 'Username is required'
    });
  });

  it('should handle complex error messages', () => {
    const complexMessage = 'error.field.validation.failed.complex';
    const result = buildErrorDetails('complexField', complexMessage);

    expect(result[0].message).toBe(complexMessage);
    expect(result[0].path).toEqual(['complexField']);
    expect(result[0].context.key).toBe('complexField');
  });

  it('should handle empty field name', () => {
    const result = buildErrorDetails('', 'Some error');

    expect(result[0].path).toEqual(['']);
    expect(result[0].context.key).toBe('');
  });

  it('should handle empty error message', () => {
    const result = buildErrorDetails('field', '');

    expect(result[0].message).toBe('');
  });
});

describe('buildErrorForClient', () => {
  it('should build error object with correct structure', () => {
    const errorMessage = 'Service unavailable';
    const propertyName = 'apiEndpoint';

    const result = buildErrorForClient(errorMessage, propertyName) as CannotReachError;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(errorMessage);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveLength(1);
    expect(result.details[0]).toEqual({
      path: ['apiEndpoint'],
      type: 'any.invalid',
      context: {
        key: 'apiEndpoint'
      },
      message: errorMessage
    });
  });

  it('should create error with validation failure message', () => {
    const result = buildErrorForClient('Validation failed', 'email') as CannotReachError;

    expect(result.message).toBe('Validation failed');
    expect(result.details[0].context.key).toBe('email');
    expect(result.details[0].path).toEqual(['email']);
  });

  it('should handle empty strings', () => {
    const result = buildErrorForClient('', '') as CannotReachError;

    expect(result.message).toBe('');
    expect(result.details[0].context.key).toBe('');
    expect(result.details[0].path).toEqual(['']);
  });

  it('should create error with long error message', () => {
    const longMessage = 'This is a very long error message that describes in detail what went wrong with the validation process';
    const result = buildErrorForClient(longMessage, 'field') as CannotReachError;

    expect(result.message).toBe(longMessage);
    expect(result.details[0].message).toBe(longMessage);
  });
});

describe('combineValidationErrors', () => {
  it('should return null for empty array', () => {
    const result = combineValidationErrors([]);
    expect(result).toBeNull();
  });

  it('should return single error unchanged', () => {
    const error = {
      message: 'Single error',
      details: [{
        path: ['field1'],
        type: 'any.invalid',
        context: { key: 'field1' },
        message: 'Error 1'
      }]
    };

    const result = combineValidationErrors([error]);

    expect(result).toBe(error);
    expect(result.details).toHaveLength(1);
  });

  it('should combine multiple errors into one', () => {
    const error1 = {
      message: 'Error 1',
      details: [{
        path: ['field1'],
        type: 'any.invalid',
        context: { key: 'field1' },
        message: 'Error 1'
      }]
    };

    const error2 = {
      message: 'Error 2',
      details: [{
        path: ['field2'],
        type: 'any.required',
        context: { key: 'field2' },
        message: 'Error 2'
      }]
    };

    const result = combineValidationErrors([error1, error2]);

    expect(result).toBe(error1); // First error is used as base
    expect(result.details).toHaveLength(2);
    expect(result.details[0].path).toEqual(['field1']);
    expect(result.details[1].path).toEqual(['field2']);
  });

  it('should combine three errors', () => {
    const error1 = {
      message: 'Error 1',
      details: [{
        path: ['field1'],
        type: 'any.invalid',
        context: { key: 'field1' },
        message: 'Error 1'
      }]
    };

    const error2 = {
      message: 'Error 2',
      details: [{
        path: ['field2'],
        type: 'any.required',
        context: { key: 'field2' },
        message: 'Error 2'
      }]
    };

    const error3 = {
      message: 'Error 3',
      details: [{
        path: ['field3'],
        type: 'string.empty',
        context: { key: 'field3' },
        message: 'Error 3'
      }]
    };

    const result = combineValidationErrors([error1, error2, error3]);

    expect(result.details).toHaveLength(3);
    expect(result.details[0].path).toEqual(['field1']);
    expect(result.details[1].path).toEqual(['field2']);
    expect(result.details[2].path).toEqual(['field3']);
  });

  it('should handle errors with multiple details each', () => {
    const error1 = {
      message: 'Multiple errors 1',
      details: [
        {
          path: ['field1'],
          type: 'any.invalid',
          context: { key: 'field1' },
          message: 'Error 1a'
        },
        {
          path: ['field1'],
          type: 'any.required',
          context: { key: 'field1' },
          message: 'Error 1b'
        }
      ]
    };

    const error2 = {
      message: 'Multiple errors 2',
      details: [
        {
          path: ['field2'],
          type: 'string.min',
          context: { key: 'field2' },
          message: 'Error 2a'
        },
        {
          path: ['field2'],
          type: 'string.max',
          context: { key: 'field2' },
          message: 'Error 2b'
        }
      ]
    };

    const result = combineValidationErrors([error1, error2]);

    expect(result.details).toHaveLength(4);
  });
});

describe('mergeSchemaAndValidationErrors', () => {
  it('should return null when no errors', () => {
    const result = mergeSchemaAndValidationErrors(null, []);
    expect(result).toBeNull();
  });

  it('should return null when schema error is undefined and validation errors is empty', () => {
    const result = mergeSchemaAndValidationErrors(undefined, []);
    expect(result).toBeNull();
  });

  it('should return schema error when no validation errors', () => {
    const schemaError = {
      message: 'Schema error',
      details: [{
        path: ['schemaField'],
        type: 'any.required',
        context: { key: 'schemaField' },
        message: 'Schema error'
      }]
    };

    const result = mergeSchemaAndValidationErrors(schemaError, []);

    expect(result).toBe(schemaError);
    expect(result.details).toHaveLength(1);
  });

  it('should return combined validation errors when no schema error', () => {
    const validationError1 = {
      message: 'Validation error 1',
      details: [{
        path: ['field1'],
        type: 'any.invalid',
        context: { key: 'field1' },
        message: 'Validation error 1'
      }]
    };

    const validationError2 = {
      message: 'Validation error 2',
      details: [{
        path: ['field2'],
        type: 'any.invalid',
        context: { key: 'field2' },
        message: 'Validation error 2'
      }]
    };

    const result = mergeSchemaAndValidationErrors(null, [validationError1, validationError2]);

    expect(result).toBe(validationError1); // First validation error is base
    expect(result.details).toHaveLength(2);
  });

  it('should merge schema error and validation errors', () => {
    const schemaError = {
      message: 'Schema error',
      details: [{
        path: ['schemaField'],
        type: 'any.required',
        context: { key: 'schemaField' },
        message: 'Schema error'
      }]
    };

    const validationError1 = {
      message: 'Validation error 1',
      details: [{
        path: ['field1'],
        type: 'any.invalid',
        context: { key: 'field1' },
        message: 'Validation error 1'
      }]
    };

    const validationError2 = {
      message: 'Validation error 2',
      details: [{
        path: ['field2'],
        type: 'any.invalid',
        context: { key: 'field2' },
        message: 'Validation error 2'
      }]
    };

    const result = mergeSchemaAndValidationErrors(schemaError, [validationError1, validationError2]);

    expect(result).toBe(schemaError);
    expect(result.details).toHaveLength(3);
    expect(result.details[0].path).toEqual(['schemaField']);
    expect(result.details[1].path).toEqual(['field1']);
    expect(result.details[2].path).toEqual(['field2']);
  });

  it('should handle single validation error without schema error', () => {
    const validationError = {
      message: 'Single validation error',
      details: [{
        path: ['field1'],
        type: 'any.invalid',
        context: { key: 'field1' },
        message: 'Single validation error'
      }]
    };

    const result = mergeSchemaAndValidationErrors(null, [validationError]);

    expect(result).toBe(validationError);
    expect(result.details).toHaveLength(1);
  });

  it('should handle multiple details in validation errors', () => {
    const schemaError = {
      message: 'Schema error',
      details: [{
        path: ['schemaField'],
        type: 'any.required',
        context: { key: 'schemaField' },
        message: 'Schema error'
      }]
    };

    const validationError1 = {
      message: 'Validation error 1',
      details: [
        {
          path: ['field1'],
          type: 'any.invalid',
          context: { key: 'field1' },
          message: 'Validation error 1a'
        },
        {
          path: ['field1'],
          type: 'string.min',
          context: { key: 'field1' },
          message: 'Validation error 1b'
        }
      ]
    };

    const result = mergeSchemaAndValidationErrors(schemaError, [validationError1]);

    expect(result.details).toHaveLength(3);
    expect(result.details[0].message).toBe('Schema error');
    expect(result.details[1].message).toBe('Validation error 1a');
    expect(result.details[2].message).toBe('Validation error 1b');
  });

  it('should handle empty validation errors array with schema error', () => {
    const schemaError = {
      message: 'Schema error',
      details: [{
        path: ['schemaField'],
        type: 'any.required',
        context: { key: 'schemaField' },
        message: 'Schema error'
      }]
    };

    const result = mergeSchemaAndValidationErrors(schemaError, []);

    expect(result).toBe(schemaError);
    expect(result.details).toHaveLength(1);
  });

  it('should maintain reference to original schema error object', () => {
    const schemaError = {
      message: 'Original schema error',
      details: [{
        path: ['field'],
        type: 'any.required',
        context: { key: 'field' },
        message: 'Original'
      }],
      customProperty: 'test'
    };

    const validationError = {
      message: 'Validation error',
      details: [{
        path: ['field2'],
        type: 'any.invalid',
        context: { key: 'field2' },
        message: 'Validation'
      }]
    };

    const result = mergeSchemaAndValidationErrors(schemaError, [validationError]);

    expect(result).toBe(schemaError);
    expect((result as any).customProperty).toBe('test');
  });
});
