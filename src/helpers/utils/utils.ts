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


export const transformContainerNumbers = (containerNumber: string | undefined): string[] | undefined => {
  if (!containerNumber) return undefined;

  const result = containerNumber.split(' ').filter((c: string) => c?.trim());
  return result;
};

// Utility function to join containerNumbers array to string 
export const joinContainerNumbers = (containerNumber: string[] | undefined): string | undefined => {
  const delimiter: string = ' ';
  if (!containerNumber || containerNumber.length === 0) return undefined;
  const filtered = containerNumber.filter((c: string) => c?.trim());
  
  const result = filtered.length > 0 ? filtered.join(delimiter) : undefined;
  return result;
};

/**
 * Migrates containerIdentificationNumber to containerNumber for truck and train models if containerNumber is empty.
 * Converts comma-separated values to space-separated format.
 * Preserves containerIdentificationNumber for legacy data.
 */
export function migrateContainerIdentificationNumber(model: any) {
  if (model.containerIdentificationNumber && (!model.containerNumber || model.containerNumber.trim() === '')) {
    // Check if comma-separated, convert to space-separated
    const containerValue = model.containerIdentificationNumber.includes(',')
      ? model.containerIdentificationNumber
          .split(',')
          .map((c: string) => c.trim())
          .filter((c: string) => c)
          .join(' ')
      : model.containerIdentificationNumber;
    
    model.containerNumber = containerValue || undefined;
  }
  
  return model;
}

/**
 * Migrates containerNumbers to containerNumber for truck and train models if containerNumber is empty.
 * Converts comma-separated values to space-separated format.
 * Preserves containerNumbers for legacy data.
 */
export function migrateContainerNumbers(model: any) {
  
  if (model.containerNumbers && (!model.containerNumber || model.containerNumber.trim() === '')) {
    // Check if comma-separated, convert to space-separated
    const containerValue = model.containerNumbers.includes(',')
      ? model.containerNumbers
          .split(',')
          .map((c: string) => c.trim())
          .filter((c: string) => c)
          .join(' ')
      : model.containerNumbers;
    
    model.containerNumber = containerValue || undefined;
  }
  return model;
}