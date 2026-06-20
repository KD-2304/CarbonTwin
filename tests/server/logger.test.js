const logger = require('../../server/utils/logger');

describe('Winston Logger Configuration', () => {
  it('should be successfully initialized as a Winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should log messages without throwing exceptions', () => {
    expect(() => logger.info('Test informational message')).not.toThrow();
    expect(() => logger.warn('Test warning message')).not.toThrow();
    expect(() => logger.error('Test error message', new Error('Logged stack trace test'))).not.toThrow();
  });
});
