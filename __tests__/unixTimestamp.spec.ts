import {unixTimestamp} from '../src/unixTimestamp';

describe('test unixTimestamp function', () => {
  test('should generate proper dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T12:00:00+00:00'));
    expect(unixTimestamp()).toBe(1577880000);

    vi.setSystemTime(new Date('2021-01-01T12:00:00+00:00'));
    expect(unixTimestamp()).toBe(1609502400);
  });
});
