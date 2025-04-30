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
