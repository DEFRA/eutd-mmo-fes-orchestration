export interface ParsedItem {
  name: string,
  code: string
}

export const breakDownNameAndCode = (nameWithCode: string): ParsedItem | null => {
  if (typeof nameWithCode !== 'string' || !nameWithCode.endsWith(')')) {
    return null;
  }

  // The code is the text in the last pair of brackets and must follow a space and a non-empty name
  const openIndex = nameWithCode.lastIndexOf('(');
  if (openIndex < 2 || nameWithCode[openIndex - 1] !== ' ') {
    return null;
  }

  const code = nameWithCode.slice(openIndex + 1, -1);
  const name = nameWithCode.slice(0, openIndex - 1);
  if (code.includes(')') || /[\n\r\u2028\u2029]/.test(name)) {
    return null;
  }

  return { name, code };
}