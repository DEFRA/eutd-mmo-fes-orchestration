export const invalidErrorMessage = (name: string) => `child "${name}" fails because ["${name}" is invalid]`;
export const cannotReachErrorMessage = (name: string) => `child "${name}" fails because ["${name}" cannot be checked if valid]`;

export interface ErrorDetail {
  path: string[],
  type: string,
  context: {
    key: string
  },
  message: string
}

export interface CannotReachError extends Error {
  details: ErrorDetail[]
}

export interface InvalidError extends Error {
  details: ErrorDetail[]
}

export interface BusinessError {
  isError: boolean,
  error: InvalidError | CannotReachError
}

export interface SpeciesSuggestionError extends BusinessError {
  resultList: string[]
}

export const buildErrorDetails = (name: string, message: string) : ErrorDetail[] => {
  return [
    {
      path: [name],
      type: 'any.invalid',
      context: {
        key: name
      },
      message
    }
  ];
}

export const buildErrorForClient = (errorMessage: string, propertyName: string) => {
  const error = new Error(errorMessage) as CannotReachError;
  error.details = buildErrorDetails(propertyName, errorMessage);
  return error;
}

export const combineValidationErrors = (errors: any[]) => {
  if (errors.length === 0) return null;

  const combinedError = errors[0];
  for (let i = 1; i < errors.length; i++) {
    combinedError.details.push(...errors[i].details);
  }
  return combinedError;
}

export const mergeSchemaAndValidationErrors = (schemaError: any, validationErrors: any[]) => {
  if (!schemaError && validationErrors.length === 0) return null;

  if (schemaError && validationErrors.length > 0) {
    validationErrors.forEach(validationError => {
      schemaError.details.push(...validationError.details);
    });
    return schemaError;
  }

  if (validationErrors.length > 0) {
    return combineValidationErrors(validationErrors);
  }

  return schemaError;
}
