import {AccessTokenError, ConfigurationError, WellKnownURIError} from '../src/index';

describe('Test Errors', () => {
  test('Test AccessTokenError', () => {
    const t = () => {
      throw new AccessTokenError('UNKNOWN ERROR');
    };
    expect(t).toThrow(AccessTokenError);
    expect(t).toThrow('UNKNOWN ERROR');
  });

  test('Test ConfigurationError', () => {
    const t = () => {
      throw new ConfigurationError('UNKNOWN ERROR');
    };
    expect(t).toThrow(ConfigurationError);
    expect(t).toThrow('UNKNOWN ERROR');
  });

  test('Test WellKnownURIError', () => {
    const t = () => {
      throw new WellKnownURIError('UNKNOWN ERROR');
    };
    expect(t).toThrow(WellKnownURIError);
    expect(t).toThrow('UNKNOWN ERROR');
  });
});
