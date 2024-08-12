export interface ParsedItem {
  name: string,
  code: string
}

export const breakDownNameAndCode = (nameWithCode: string): ParsedItem | null => {
  const regex = /(.*) \((.*)\)/g;
  const matches = regex.exec(nameWithCode);
  if (matches && matches.length >= 3) {
    return {
      name: matches[1],
      code: matches[2]
    }
  }
  return null;
}