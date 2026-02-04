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

export default function buildErrorObject(data)  {
  const { details,_original } = data;
  const transportType = _original?.vehicle;
  const errorObject = {};
  details.forEach((detail) => {
    if (detail.path.length > 0) {
      const errorKey = detail.path.join().replace(/,/gi,'.');
      if(detail.path[0] === 'containerNumbers' && detail.type === 'array.min'){
        errorObject['containerNumbers.0'] = `error.${errorKey}.${detail.type}`
        return;
      }
      if(detail.path[0] === 'containerNumbers' && detail.type === 'string.pattern.base'){
        // Use different error messages for plane vs containerVessel
        if(transportType === 'plane'){
          errorObject[errorKey] = 'ccAddTransportationDetailsContainerIdentificationNumberOnlyNumLettersError'
        } else if(transportType === 'containerVessel'){
          errorObject[errorKey] = 'ccShippingContainerNumberPatternError'
        } else {
          errorObject[errorKey] = `error.${errorKey}.${detail.type}`
        }
        return;
      }
      if(detail.path[0] === 'exportDate' && detail.type === 'date.min'){
        errorObject[errorKey] = `error.${transportType}.exportDate.any.min`
        return
      }
      errorObject[errorKey] = `error.${errorKey}.${detail.type}`
    } else if (detail.context.label) {
      errorObject[detail.context.label] = `error.${detail.context.label}.${detail.type}`
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
