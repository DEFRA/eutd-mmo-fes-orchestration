import { randomInt } from 'node:crypto';

// 10 digits
export const getRandomNumber = (): number => {
  return randomInt(1000000000, 10000000000);
};

export const getFAOAreaList = () : string[] => {
  return [
    'FAO18',
    'FAO21',
    'FAO27',
    'FAO31',
    'FAO34',
    'FAO37',
    'FAO41',
    'FAO47',
    'FAO48',
    'FAO51',
    'FAO57',
    'FAO58',
    'FAO61',
    'FAO67',
    'FAO71',
    'FAO77',
    'FAO81',
    'FAO87',
    'FAO88',
  ];
}

export const valueOrDefault = <T>(value: T, condition: boolean, defaultValue?: any) => condition ? value : defaultValue;

export const hasValue = <T>(value: T) => value !== undefined && value !== null;

export function nonJSInputHistory(fieldParam: any, dataObject: any, arrayOfInputFields: any) {
  const keys = Object.keys(fieldParam)
  for (const key of keys) {
    if (arrayOfInputFields.includes(key)) {
      const fieldChar = "temp" + key.charAt(0).toUpperCase() + key.substring(1, key.length);

      if (fieldParam[key].length !== 0)
        dataObject.transportDetails.push({ field: fieldChar, value: fieldParam[key] });
    }
  }
  return dataObject;
}