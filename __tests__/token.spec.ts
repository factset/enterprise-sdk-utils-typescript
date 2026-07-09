import {Token} from '../src';

describe('test Token Class', () => {
  test('should return expected values', () => {
    const expiresAt = Math.floor(new Date('2020-01-02').getTime() / 1000);
    const token = new Token('testtoken', expiresAt);

    expect(token.token).toBe('testtoken');
    expect(token.expiresAt).toBe(1577923200);
  });

  test('checks the token whether it is expired or not', () => {
    vi.useFakeTimers();
    const expiresAt = Math.floor(new Date('2020-01-02').getTime() / 1000);
    const token = new Token('testtoken', expiresAt);

    vi.setSystemTime(new Date('2020-01-01'));
    expect(token.isExpired()).toBe(false);

    vi.setSystemTime(new Date('2020-01-03'));
    expect(token.isExpired()).toBe(true);
  });
});
