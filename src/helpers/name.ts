export interface ParsedItem {
  name: string,
  code: string
}

export const breakDownNameAndCode = (nameWithCode: string): ParsedItem | null => {
  const regex = /^(.+?) \(([^()]*)\)$/;
  const matches = regex.exec(nameWithCode);
  if (matches?.length >= 3) {
    return {
      name: matches[1],
      code: matches[2]
    }
  }
  return null;
}