import * as Hapi from '@hapi/hapi';
import logger from '../logger';

const INJECTION_PATTERNS = [
  /(\$where)/i,
  /(\$ne)/i,
  /(\$gt)/i,
  /(\$lt)/i,
  /(\$gte)/i,
  /(\$lte)/i,
  /(\$in)/i,
  /(\$nin)/i,
  /(\$exists)/i,
  /(\$regex)/i,
  /('.*OR.*'.*=.*')/i,
  /\b(SELECT\s+[\w,*]+\s+FROM)\b/i,
  /\b(INSERT\s+INTO)\b/i,
  /\b(UPDATE\s+[\w]+\s+SET)\b/i,
  /\b(DELETE\s+FROM)\b/i,
  /\b(DROP\s+TABLE)\b/i,
  /\b(UNION\s+SELECT)\b/i,
  /(\s--\s)/,
  /(;\s*--)/,
  /(\bOR\b.*=)/i,
  /(\bAND\b.*=)/i,
  /(exec\s*\()/i,
  /(execute\s*\()/i,
  /(<script)/i,
  /(<iframe)/i,
  /(javascript:)/i,
  /(onerror\s*=)/i,
  /(onload\s*=)/i,
];

export function containsInjectionPattern(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return INJECTION_PATTERNS.some(pattern => pattern.test(value));
}
export function detectInjectionInObject(obj: any, path: string = ''): string[] {
  const detectedPatterns: string[] = [];

  if (obj === null || obj === undefined) {
    return detectedPatterns;
  }

  if (typeof obj === 'string') {
    if (containsInjectionPattern(obj)) {
      detectedPatterns.push(path || 'root');
    }
    return detectedPatterns;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      detectedPatterns.push(...detectInjectionInObject(item, itemPath));
    });
    return detectedPatterns;
  }

  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const keyPath = path ? `${path}.${key}` : key;

      // Check if the key itself contains injection patterns (e.g., MongoDB operators like $ne, $where)
      if (containsInjectionPattern(key)) {
        detectedPatterns.push(keyPath);
      }

      detectedPatterns.push(...detectInjectionInObject(obj[key], keyPath));
    });
    return detectedPatterns;
  }

  return detectedPatterns;
}

export const inputSanitizationPlugin: Hapi.Plugin<any> = {
  name: 'input-sanitization',
  version: '1.0.0',
  register: async (server: Hapi.Server) => {
    server.ext('onPreHandler', (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      const detectedPatterns: string[] = [];

      // Check query parameters
      if (request.query && Object.keys(request.query).length > 0) {
        const queryPatterns = detectInjectionInObject(request.query, 'query');
        detectedPatterns.push(...queryPatterns);
      }

      // Check payload
      if (request.payload) {
        const payloadPatterns = detectInjectionInObject(request.payload, 'payload');
        detectedPatterns.push(...payloadPatterns);
      }

      // Check path parameters
      if (request.params && Object.keys(request.params).length > 0) {
        const paramsPatterns = detectInjectionInObject(request.params, 'params');
        detectedPatterns.push(...paramsPatterns);
      }

      if (detectedPatterns.length > 0) {
        logger.warn(
          `[SECURITY][INJECTION-ATTEMPT][PATH: ${request.path}][IP: ${request.info.remoteAddress}][DETECTED-IN: ${detectedPatterns.join(', ')}]`
        );

        return h
          .response({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Invalid input detected. Please check your input and try again.',
          })
          .code(403)
          .takeover();
      }

      return h.continue;
    });
  },
};

