import * as qs from 'qs';

export const buildRedirectUrlWithErrorStringInQueryParam = (errorDetailsObj, redirectTo: string) => {
    const errQueryString = `${JSON.stringify(errorDetailsObj)}`;

    // already has open/close id in query string
    if (redirectTo.indexOf('?') >= 0) {
      const [pageName, fullQueryString] = redirectTo.split('?');
      const existingQueryString = qs.parse(fullQueryString);
      existingQueryString.error = errQueryString;
      // overwrite any error
      existingQueryString.error = errQueryString;
      return pageName + '?' + qs.stringify(existingQueryString);
    }

    return `${redirectTo}?error=${errQueryString}`;
}

const handleContainerNumbersError = (detail, errorKey, transportType, errorObject) => {
  if (detail.path[0] !== 'containerNumbers') return false;
  
  if (detail.type === 'array.min') {
    errorObject['containerNumbers.0'] = `error.${errorKey}.${detail.type}`;
    return true;
  }
  
  if (detail.type === 'string.pattern.base') {
    const errorMessages = {
      plane: 'ccAddTransportationDetailsContainerIdentificationNumberOnlyNumLettersError',
      containerVessel: 'ccShippingContainerNumberPatternError'
    };
    errorObject[errorKey] = errorMessages[transportType] || `error.${errorKey}.${detail.type}`;
    return true;
  }
  
  return false;
};

export default function buildErrorObject(data)  {
  const { details,_original } = data;
  const transportType = _original?.vehicle;
  const errorObject = {};
  details.forEach((detail) => {
    if (detail.path.length > 0) {
      const errorKey = detail.path.join().replace(/,/gi,'.');
      
      if (handleContainerNumbersError(detail, errorKey, transportType, errorObject)) return;
      
      if(detail.path[0] === 'exportDate' && detail.type === 'date.min'){
        errorObject[errorKey] = `error.${transportType}.exportDate.any.min`
        return
      }

      // If a custom message token is provided (e.g. from business validation), use it as-is
      if (detail.message && /^[A-Za-z0-9_-]+$/.test(detail.message)) {
        errorObject[errorKey] = detail.message;
        return;
      }

      errorObject[errorKey] = `error.${errorKey}.${detail.type}`
    } else if (detail.context.label) {
      // Prefer a custom message token when available
      if (detail.message && /^[A-Za-z0-9_-]+$/.test(detail.message)) {
        errorObject[detail.context.label] = detail.message;
      } else {
        errorObject[detail.context.label] = `error.${detail.context.label}.${detail.type}`
      }
    }
  });
  return errorObject;
}

export function buildNonJsErrorObject(standardError, njError)  {
  const errorObject = {};

    if (standardError) {
      const { details } = standardError;
      details.map((detail) => {
        const errorKey = detail.path.join().replace(/,/gi,'.');
        errorObject[errorKey] = `error.${errorKey}.${detail.type}`
      });
   }

    if (njError) {
      const { transportDetails } = njError;
      if (transportDetails) {
        transportDetails.map((transport) => {
          errorObject[transport.field] = `${transport.value}`;
        });
        errorObject['njEdit'] = 'true';
      }
    }

  return errorObject;
}
