import { FACTSET_WELL_KNOWN_URI } from '../src';

describe('Check constants', () => {
  test('check well known uri', () => {
    expect(FACTSET_WELL_KNOWN_URI).toBe('https://auth.factset.com/.well-known/openid-configuration');
  });
});
