// 10 digits
export const getRandomNumber = (): number => {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
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


// Utility function to transform containerNumbers string to array
export const transformContainerNumbers = (containerNumbers: string | undefined): string[] | undefined => {
  if (!containerNumbers) return undefined;
  
  // Handle if string (split by space)
  return containerNumbers.split(' ').filter((c: string) => c?.trim());
};

// Utility function to join containerNumbers array to string
export const joinContainerNumbers = (containerNumbers: string[] | undefined): string | undefined => {
  const delimiter: string = ' ';
  if (!containerNumbers || containerNumbers.length === 0) return undefined;
  const filtered = containerNumbers.filter((c: string) => c?.trim());
  return filtered.length > 0 ? filtered.join(delimiter) : undefined;
};
     