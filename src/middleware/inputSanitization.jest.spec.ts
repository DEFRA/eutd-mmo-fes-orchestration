import {
  containsInjectionPattern,
  detectInjectionInObject,
  inputSanitizationPlugin
} from './inputSanitization';
import * as Hapi from '@hapi/hapi';
import logger from '../logger';

describe('Input Sanitization Middleware', () => {
  describe('containsInjectionPattern', () => {
    it('should detect SQL injection patterns', () => {
      expect(containsInjectionPattern("' OR '1'='1")).toBe(true);
      expect(containsInjectionPattern("SELECT * FROM users")).toBe(true);
      expect(containsInjectionPattern("DROP TABLE products")).toBe(true);
      expect(containsInjectionPattern("UNION SELECT")).toBe(true);
      expect(containsInjectionPattern("'; DELETE FROM --")).toBe(true);
    });

    it('should detect NoSQL injection patterns', () => {
      expect(containsInjectionPattern('{"$where": "this.password == \'secret\'"}}')).toBe(true);
      expect(containsInjectionPattern('{"$ne": null}')).toBe(true);
      expect(containsInjectionPattern('{"$gt": ""}')).toBe(true);
      expect(containsInjectionPattern('{"$regex": ".*"}')).toBe(true);
    });

    it('should detect XSS patterns', () => {
      expect(containsInjectionPattern('<script>alert("XSS")</script>')).toBe(true);
      expect(containsInjectionPattern('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(containsInjectionPattern('javascript:alert(1)')).toBe(true);
      expect(containsInjectionPattern('onerror=alert(1)')).toBe(true);
    });

    it('should allow legitimate input', () => {
      expect(containsInjectionPattern('John Doe')).toBe(false);
      expect(containsInjectionPattern('123 Main Street')).toBe(false);
      expect(containsInjectionPattern('user@example.com')).toBe(false);
      expect(containsInjectionPattern('GBR-2020-CC-123456')).toBe(false);
      expect(containsInjectionPattern('Product description with normal text')).toBe(false);
    });

    it('should allow legitimate hyphenated values and vessel names', () => {
      expect(containsInjectionPattern('Mary-Anne')).toBe(false);
      expect(containsInjectionPattern('Product-123')).toBe(false);
      expect(containsInjectionPattern('Well-Known Ltd')).toBe(false);
      expect(containsInjectionPattern('F/V Mary-Jane')).toBe(false);
      expect(containsInjectionPattern('Re-processed')).toBe(false);
    });

    it('should allow text containing SELECT or FROM as normal words', () => {
      expect(containsInjectionPattern('Please select from the options')).toBe(false);
      expect(containsInjectionPattern('Selection from our catalog')).toBe(false);
      expect(containsInjectionPattern('Update your selection')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(containsInjectionPattern(123)).toBe(false);
      expect(containsInjectionPattern(null)).toBe(false);
      expect(containsInjectionPattern(undefined)).toBe(false);
      expect(containsInjectionPattern({})).toBe(false);
    });
  });

  describe('detectInjectionInObject', () => {
    it('should detect injection in nested objects', () => {
      const obj = {
        name: 'John',
        address: {
          street: "' OR '1'='1",
          city: 'London'
        }
      };

      const patterns = detectInjectionInObject(obj);
      expect(patterns).toContain('address.street');
      expect(patterns.length).toBe(1);
    });

    it('should detect injection in arrays', () => {
      const obj = {
        items: [
          { name: 'Product 1' },
          { name: "SELECT * FROM products" },
          { name: 'Product 3' }
        ]
      };

      const patterns = detectInjectionInObject(obj);
      expect(patterns).toContain('items[1].name');
      expect(patterns.length).toBe(1);
    });

    it('should detect multiple injection attempts', () => {
      const obj = {
        username: "admin' OR '1'='1",
        password: "$ne: null",
        email: '<script>alert(1)</script>'
      };

      const patterns = detectInjectionInObject(obj);
      expect(patterns.length).toBe(3);
      expect(patterns).toContain('username');
      expect(patterns).toContain('password');
      expect(patterns).toContain('email');
    });

    it('should return empty array for clean objects', () => {
      const obj = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const patterns = detectInjectionInObject(obj);
      expect(patterns).toEqual([]);
    });

    it('should handle null and undefined', () => {
      expect(detectInjectionInObject(null)).toEqual([]);
      expect(detectInjectionInObject(undefined)).toEqual([]);
    });
  });

  describe('inputSanitizationPlugin', () => {
    let server: Hapi.Server;
    let loggerWarnSpy: jest.SpyInstance;

    beforeEach(async () => {
      server = Hapi.server({
        port: 3000,
        host: 'localhost'
      });

      await server.register(inputSanitizationPlugin);

      server.route({
        method: 'GET',
        path: '/test',
        handler: () => ({ success: true })
      });

      server.route({
        method: 'POST',
        path: '/test',
        handler: () => ({ success: true })
      });

      loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation();
    });

    afterEach(async () => {
      await server.stop();
      loggerWarnSpy.mockRestore();
    });

    it('should block requests with SQL injection in query params', async () => {
      const response = await server.inject({
        method: 'GET',
        url: "/test?search=' OR '1'='1"
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid input detected. Please check your input and try again.'
      });
    });

    it('should block requests with injection in payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/test',
        payload: {
          username: "admin' OR '1'='1"
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should block requests with SELECT statements', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/test',
        payload: {
          data: "SELECT * FROM products WHERE id=2"
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow clean requests', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/test?search=legitimate search term'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toMatchObject({ success: true });
    });

    it('should allow clean POST requests', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/test',
        payload: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
    });

    it('should log security warnings for injection attempts', async () => {
      await server.inject({
        method: 'GET',
        url: "/test?malicious=' OR '1'='1"
      });

      expect(loggerWarnSpy).toHaveBeenCalled();
      expect(loggerWarnSpy.mock.calls[0][0]).toContain('[SECURITY][INJECTION-ATTEMPT]');
    });

    it('should handle deeply nested arrays', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/test',
        payload: {
          data: {
            level1: [
              {
                level2: [
                  { level3: 'clean value' }
                ]
              }
            ]
          }
        }
      });

      expect(response.statusCode).toBe(200);
    });

    it('should block SQL injection in deeply nested structures', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/test',
        payload: {
          data: {
            items: [
              {
                nested: [
                  { value: "' OR '1'='1" }
                ]
              }
            ]
          }
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
